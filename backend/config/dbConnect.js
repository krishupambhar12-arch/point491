// config/dbConnect.js
const mongoose = require("mongoose");

function dbConnect() {
  mongoose.connect("mongodb+srv://asha:asha123@legal.u5evgbq.mongodb.net/point25")
    .then(() => console.log("✅ MongoDB connected successfully"))
    .catch((err) => {
      console.error("❌ MongoDB connection error:", err);
    });
}

module.exports = dbConnect;