require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const User = require("./middleware/db");
const jwt = require("jsonwebtoken");
const authenticate = require("./middleware/auth");
const transporter = require("./middleware/mail");

const app = express();
app.use(express.json());

app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const user = new User({
      email,
      password: hashedPassword,
      otp,
    });

    await user.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Account Verification OTP",
      text: `Your OTP for account verification is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);
    res.status(201).json({ message: "User registered. OTP sent to email." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Registration failed.", error });
  }
});

app.post("/validate", async (req, res) => {
  try {
    const { email, otp, location, age, workDetails } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    user.validated = true;
    user.location = location;
    user.age = age;
    user.workDetails = workDetails;

    await user.save();

    res
      .status(200)
      .json({ message: "User validated and information updated." });
  } catch (error) {
    res.status(500).json({ message: "Validation failed.", error });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Invalid password." });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ message: "Login successful.", token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Login failed.", error });
  }
});

app.get("/user-info", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const { email, location, age, workDetails } = user;
    res.status(200).json({ email, location, age, workDetails });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to retrieve user information.", error });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
