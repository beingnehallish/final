// backend/routes/leaderboardRoutes.js
import express from "express";
import Submission from "../models/Submission.js";
import MalpracticeLog from "../models/MalpracticeLog.js";

const router = express.Router();

/**
 * Helper function: compute efficiency dynamically
 */
function computeEfficiency(sub, maxTime, maxExec) {
  const t = parseFloat(sub.timeTaken) || 0.001;
  const e = parseFloat(sub.executionTime) || 0.001;

  // lower time and exec are better
  const timeEff = (maxTime - t) / maxTime;
  const execEff = (maxExec - e) / maxExec;

  const efficiency = 0.5 * timeEff + 0.5 * execEff;
  return Math.max(0, Math.min(efficiency * 100, 100)); // clamp 0–100
}

/**
 * Helper: build plagiarism map from logs
 * plagiarismMap[userId] => 0–100
 */
function buildPlagiarismMap(malpracticeLogs) {
  const plagiarismMap = {};

  malpracticeLogs.forEach((log) => {
    const uid = log.userId?.toString();
    if (!uid) return;

    // If your MalpracticeLog has its own score field, use it:
    const baseScore =
      typeof log.plagiarismScore === "number"
        ? log.plagiarismScore
        : 20; // fallback: +20 per event

    plagiarismMap[uid] = Math.min(
      (plagiarismMap[uid] || 0) + baseScore,
      100
    );
  });

  return plagiarismMap;
}

router.get("/latest", async (req, res) => {
  try {
    const submissions = await Submission.find().populate("userId", "fullName");
    const malpracticeLogs = await MalpracticeLog.find().lean();

    if (!submissions.length)
      return res.json({ leaderboard: [], message: "No submissions yet" });

    //build plagiarism score per user
    const plagiarismMap = buildPlagiarismMap(malpracticeLogs);

    // global max for normalization
    const maxTime = Math.max(...submissions.map((s) => s.timeTaken || 0.001));
    const maxExec = Math.max(
      ...submissions.map((s) => s.executionTime || 0.001)
    );

    const userStats = {};

    submissions.forEach((s) => {
      const userId = s.userId?._id?.toString();
      if (!userId) return;

      const effScore = computeEfficiency(s, maxTime, maxExec);

      const correctness = parseFloat(s.correctnessScore) || 0;

      if (!userStats[userId]) {
        userStats[userId] = {
          userId,
          userName: s.userId.fullName || "Unknown",
          totalCorrectness: 0,
          totalEfficiency: 0,
          count: 0,
        };
      }

      userStats[userId].totalCorrectness += correctness;
      userStats[userId].totalEfficiency += effScore;
      userStats[userId].count += 1;
    });

    const leaderboard = Object.values(userStats).map((u) => {
      const correctnessScore = u.totalCorrectness / u.count;
      const efficiencyPercentile = u.totalEfficiency / u.count;
      const plagiarismScore = plagiarismMap[u.userId] || 0;

      const rawScore =
        0.7 * correctnessScore +
        0.3 * efficiencyPercentile -
        0.1 * plagiarismScore;

      const totalScore = Math.max(rawScore, 0);

      return {
        ...u,
        correctnessScore,
        efficiencyPercentile,
        plagiarismScore,
        totalScore,
      };
    });

    leaderboard.sort((a, b) => b.totalScore - a.totalScore);
    leaderboard.forEach((user, idx) => (user.rank = idx + 1));

    res.json({ leaderboard });
  } catch (err) {
    console.error("Error in /latest leaderboard:", err);
    res.status(500).json({ message: "Failed to load leaderboard" });
  }
});

/**
 * GET /api/leaderboard/:challengeId
 * Leaderboard filtered by specific challenge
 */
router.get("/:challengeId", async (req, res) => {
  try {
    const { challengeId } = req.params;

    const submissions = await Submission.find({ challengeId }).populate(
      "userId",
      "fullName"
    );
    const malpracticeLogs = await MalpracticeLog.find({
      challengeId,
    }).lean();

    if (!submissions.length)
      return res.json({
        leaderboard: [],
        message: "No submissions for this challenge yet",
      });

    // Build plagiarism score per user (just this challenge)
    const plagiarismMap = buildPlagiarismMap(malpracticeLogs);

    // Find max values for normalization
    const maxTime = Math.max(...submissions.map((s) => s.timeTaken || 0.001));
    const maxExec = Math.max(
      ...submissions.map((s) => s.executionTime || 0.001)
    );

    const userStats = {};

    submissions.forEach((s) => {
      const userId = s.userId?._id?.toString();
      if (!userId) return;

      const effScore = computeEfficiency(s, maxTime, maxExec);
      const correctness = parseFloat(s.correctnessScore) || 0;

      if (!userStats[userId]) {
        userStats[userId] = {
          userId,
          userName: s.userId.fullName || "Unknown",
          totalCorrectness: 0,
          totalEfficiency: 0,
          count: 0,
        };
      }

      userStats[userId].totalCorrectness += correctness;
      userStats[userId].totalEfficiency += effScore;
      userStats[userId].count += 1;
    });

    const leaderboard = Object.values(userStats).map((u) => {
      const correctnessScore = u.totalCorrectness / u.count;
      const efficiencyPercentile = u.totalEfficiency / u.count;
      const plagiarismScore = plagiarismMap[u.userId] || 0;

      const rawScore =
        0.7 * correctnessScore +
        0.3 * efficiencyPercentile -
        0.1 * plagiarismScore;

      const totalScore = Math.max(rawScore, 0);

      return {
        ...u,
        correctnessScore,
        efficiencyPercentile,
        plagiarismScore,
        totalScore,
      };
    });

    leaderboard.sort((a, b) => b.totalScore - a.totalScore);
    leaderboard.forEach((user, idx) => (user.rank = idx + 1));

    res.json({ challengeId, leaderboard });
  } catch (err) {
    console.error("Error in challenge leaderboard:", err);
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
});

export default router;
