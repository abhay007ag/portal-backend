require("dotenv").config();
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/students");

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

app.get("/api/health", (req, res) => {
    res.json({
        ok: true,
        service: "talentx-backend"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);

// Error handler
app.use((err, req, res, next) => {
    console.error(err);

    res.status(500).json({
        message: "Something went wrong on the server."
    });
});

// IMPORTANT: Don't use app.listen() on Vercel
module.exports = app;