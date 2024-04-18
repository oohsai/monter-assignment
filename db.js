require("dotenv").config();
const mongoose = require("mongoose");

try {
  mongoose.connect(process.env.MONGODB_URI);

  mongoose.connection.on("connected", () => {
    console.log("MongoDB connected");
  });
} catch (error) {
  console.error("Failed to connect to MongoDB:", error.message);
}

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  otp: String,
  validated: { type: Boolean, default: false },
  location: String,
  age: Number,
  workDetails: String,
});

const User = mongoose.model("User", userSchema);
module.exports = User;
