import express from "express";
import User from "../models/User.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import * as faceapi from "face-api.js";
import canvas from "canvas";

const router = express.Router();
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// ---------- Load FaceAPI models on server start ----------
const MODELS_DIR = path.join(process.cwd(), "face-models-tiny");

let modelsLoaded = false;
(async () => {
  try {
    await faceapi.nets.tinyFaceDetector.loadFromDisk(MODELS_DIR);
    await faceapi.nets.faceLandmark68TinyNet.loadFromDisk(MODELS_DIR);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(MODELS_DIR);
    modelsLoaded = true;
    console.log("✅ FaceAPI models loaded (Admin Register Route)");
  } catch (err) {
    console.error("❌ Failed to load face models:", err);
  }
})();

// ---------- Multer setup ----------
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG or PNG images allowed"));
  },
});

// ---------- REGISTER STUDENT + FACE DESCRIPTOR ----------
router.post("/register-student", upload.single("image"), async (req, res) => {
  try {
    if (!modelsLoaded)
      return res.status(500).json({ message: "Face models not loaded." });

    const { seatNumber, fullName, email, password } = req.body;

    if (!seatNumber || !fullName || !email || !password)
      return res.status(400).json({ message: "All fields are required." });

    if (!req.file)
      return res.status(400).json({ message: "Image is required." });

    // Check if user already exists
    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Email already registered." });

    // Load uploaded image
    const imgPath = req.file.path;
    const img = await canvas.loadImage(imgPath);

    // Detect face
    const detection = await faceapi
      .detectSingleFace(
        img,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.5,
        })
      )
      .withFaceLandmarks(true)
      .withFaceDescriptor();

    if (!detection) {
      return res.status(400).json({
        message: "No face detected in the uploaded image.",
        verified: false,
      });
    }

    // Get descriptor (128 numbers)
    const descriptorArray = Array.from(detection.descriptor);

    // Save new student
    const newUser = new User({
      seatNumber,
      fullName,
      email,
      password,
      role: "student", // forced
      image: `/uploads/${req.file.filename}`,
      faceDescriptor: descriptorArray,
    });

    await newUser.save();

    res.json({
      message: "Student registered successfully with face descriptor!",
      user: {
        id: newUser._id,
        fullName,
        email,
        seatNumber,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("Register student error:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

export default router;
