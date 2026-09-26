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
    console.log("SIGNUP REQUEST RECEIVED");
    console.log("BODY:", req.body);

    const { name, email, dob, branch, gradYear } = req.body;

    if (!name || !email || !dob) {
      return res.status(400).json({
        message: "Name, college email, and date of birth are required."
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existing = await Student.findOne({
      email: normalizedEmail
    });

    if (existing) {
      return res.status(409).json({
        message: "An account with that college email already exists."
      });
    }

    const passwordHash = await bcrypt.hash(dob, 10);

    console.log("CREATING STUDENT...");

    const student = await Student.create({
      name: String(name).trim(),
      email: normalizedEmail,
      dob,
      passwordHash,
      branch: branch || "Computer Science",
      gradYear: Number(gradYear) || new Date().getFullYear() + 4,
      cgpa: 7.0,
    });

    console.log("STUDENT CREATED:", student._id);

    const token = jwt.sign(
      { id: student._id, role: "student" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      student: decorateStudent(student)
    });

  } catch (err) {
    console.error("SIGNUP ERROR:", err);

    res.status(500).json({
      message: "Signup failed.",
      error: err.message
    });
  }
});

module.exports = router;