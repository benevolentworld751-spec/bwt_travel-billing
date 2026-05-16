import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
// controllers/authController.js
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

const generateTokens = (id) => {
  const accessToken = jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  const refreshToken = jwt.sign(
    { id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please provide all required fields");
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    role: "admin",
  });

  const { accessToken, refreshToken } = generateTokens(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: accessToken,
    refreshToken,
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }

  const user = await User.findOne({ email });

  if (!user) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  const { accessToken, refreshToken } = generateTokens(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: accessToken,
    refreshToken,
  });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: incomingRefreshToken } = req.body;

  if (!incomingRefreshToken) {
    res.status(401);
    throw new Error("No refresh token provided");
  }

  const user = await User.findOne({
    refreshToken: incomingRefreshToken,
  });

  if (!user) {
    res.status(403);
    throw new Error("Invalid refresh token");
  }

  try {
    jwt.verify(
      incomingRefreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    const { accessToken, refreshToken: newRefreshToken } =
      generateTokens(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      token: accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(403);
    throw new Error("Refresh token expired or invalid");
  }
});




export const forgotPassword = async (req, res) => {
   try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "No user found with this email" });
    }

    // 1. Generate Token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // 2. Save to DB
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // 3. Email Logic
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const message = `Reset your password here: ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset',
        message
      });
      res.status(200).json({ message: "Email sent" });
    } catch (emailErr) {
      console.error("EMAIL SENDING ERROR:", emailErr); // This shows the SMTP error
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      return res.status(500).json({ message: "Email could not be sent" });
    }

  } catch (error) {
    console.error("GENERAL ERROR:", error); // This shows if crypto or DB crashed
    res.status(500).json({ message: error.message });
  }
};