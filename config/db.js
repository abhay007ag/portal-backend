const mongoose = require("mongoose");

let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);

    isConnected = true;

    console.log(
      `MongoDB connected → database "${mongoose.connection.name}"`
    );
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    throw err;
  }
}

module.exports = connectDB;