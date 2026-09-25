const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const { decorateStudent } = require("../services/scoring");

// POST /api/auth/signup
// Creates a real Student document in MongoDB. This is what "Create Account"
// on the frontend calls — open MongoDB Compass afterwards, connect to the
// same URI as MONGODB_URI, and you'll see it under db "talentx" → collection
// "students".
router.post("/signup", async (req, res) => {
  try {
    const { name, email, dob, branch, gradYear } = req.body;
    if (!name || !email || !dob) {
      return res.status(400).json({ message: "Name, college email, and date of birth are required." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await Student.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "An account with that college email already exists." });
    }

    // The password IS the date of birth per the product spec — we still
    // never store it in plain text, only its bcrypt hash.
    const passwordHash = await bcrypt.hash(dob, 10);

    const student = await Student.create({
      name: String(name).trim(),
      email: normalizedEmail,
      dob,
      passwordHash,
      branch: branch || "Computer Science",
      gradYear: Number(gradYear) || new Date().getFullYear() + 4,
      cgpa: 7.0,
    });

    const token = jwt.sign({ id: student._id, role: "student" }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, student: decorateStudent(student) });
  } catch (err) {
    res.status(500).json({ message: "Signup failed.", error: err.message });
  }
});

// POST /api/auth/login
// Checks the single admin account from .env first, then falls back to
// looking up a Student by email + comparing the DOB against the stored hash.
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (
      process.env.ADMIN_EMAIL &&
      normalizedEmail === process.env.ADMIN_EMAIL.toLowerCase() &&
      password === process.env.ADMIN_DOB
    ) {
      const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, { expiresIn: "7d" });
      return res.json({ token, admin: true });
    }

    const student = await Student.findOne({ email: normalizedEmail });
    if (!student) {
      return res.status(401).json({ message: "We couldn't find an account matching that email and date of birth." });
    }
    const ok = await bcrypt.compare(String(password || ""), student.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "We couldn't find an account matching that email and date of birth." });
    }

    const token = jwt.sign({ id: student._id, role: "student" }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, student: decorateStudent(student) });
  } catch (err) {
    res.status(500).json({ message: "Login failed.", error: err.message });
  }
});

module.exports = router;
