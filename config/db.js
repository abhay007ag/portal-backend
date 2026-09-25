const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected → database "${mongoose.connection.name}"`);
    console.log("Open MongoDB Compass and connect to the same URI to browse this data.");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    console.error("Check that MongoDB is running and MONGODB_URI in .env is correct.");
    process.exit(1);
  }
}

module.exports = connectDB;
