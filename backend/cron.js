// cron.js
import cron from "node-cron";
import nodemailer from "nodemailer";
import Challenge from "./models/Challenge.js";
import User from "./models/User.js";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Verify transporter once on load
transporter.verify().then(() => {
  console.log("✅ SMTP transporter verified (ready to send).");
}).catch((err) => {
  console.error("❌ SMTP transporter verification failed:", err);
});

// Cron job runs every 30 seconds (same as your original schedule)
cron.schedule("*/30 * * * * *", async () => {
  const now = new Date();
  console.log("⏰ Cron running at:", now.toISOString());

  try {
    // reminder offset: 2 minutes from now (120000 ms). Add tolerance of +/- 30s.
    const reminderOffsetMs = 2 * 60 * 1000; // 2 minutes
    const toleranceMs = 40 * 1000; // 40 seconds tolerance
    const windowStart = new Date(now.getTime() + reminderOffsetMs - toleranceMs);
    const windowEnd = new Date(now.getTime() + reminderOffsetMs + toleranceMs);

    console.log(`Looking for challenges starting between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`);

    const challenges = await Challenge.find({
      startTime: { $gte: windowStart, $lte: windowEnd },
      reminderSent: false,
    });

    console.log("Matching challenges found:", challenges.length);

    for (const challenge of challenges) {
      // Fetch participants
      const users = await User.find({ _id: { $in: challenge.participants } });

      if (!users || users.length === 0) {
        console.log(`No participants found for challenge ${challenge._id}`);
        // optionally mark reminderSent true to avoid repeated checks if you want
        challenge.reminderSent = true;
        await challenge.save();
        continue;
      }

      // prepare send promises
      const sendPromises = users.map(async (user) => {
        if (!user.email) {
          console.warn(`User ${user._id} has no email field or it's empty. Full user object:`, user);
          return { status: "skipped", userId: user._id };
        }

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: `Reminder: "${challenge.title}" starts soon`,
          text: `Hi ${user.name || ""},\n\nYour challenge "${challenge.title}" starts at ${challenge.startTime.toISOString()}.\nGood luck!`,
          // html: `<p>Hi ${user.name || ""},</p><p>Your challenge <b>${challenge.title}</b> starts at <b>${challenge.startTime.toISOString()}</b>.</p>`
        };

        try {
          const info = await transporter.sendMail(mailOptions);
          console.log(`✅ Email sent to ${user.email}: ${info.response}`);
          return { status: "sent", userId: user._id, info };
        } catch (err) {
          console.error(`❌ Failed to send email to ${user.email}:`, err);
          return { status: "error", userId: user._id, error: err };
        }
      });

      // Wait for all to finish
      const results = await Promise.allSettled(sendPromises);

      // Log summary
      const summary = results.map(r => r.status === "fulfilled" ? r.value : r.reason);
      console.log("Send results summary for challenge", challenge._id, summary);

      // Mark reminderSent true so we don't send again (you may want more sophisticated state handling)
      challenge.reminderSent = true;
      await challenge.save();
      console.log(`Marked reminderSent=true for challenge ${challenge._id}`);
    }
  } catch (err) {
    console.error("❌ Cron error:", err);
  }
});
