import express from "express";
import User from "../models/User.js";

const router = express.Router();

// ==============================
//   GET ALL STUDENTS
// ==============================
router.get("/", async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .select("fullName seatNumber email image")
      .sort({ seatNumber: 1 });

    res.json(students);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ message: "Server error while fetching students" });
  }
});

export default router;
