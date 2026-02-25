// controllers/businessController.js
import asyncHandler from "express-async-handler";
import Business from "../models/Business.js";

// @desc    Create a new business
// @route   POST /api/businesses
// @access  Private
export const createBusiness = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error("Unauthorized: User not authenticated");
  }

  const {
    name,
    address,
    gstNumber,
    phone,
    email,
    bankDetails,
    upiId,
    signatureUrl
  } = req.body;

  if (!name || !address || !phone || !email) {
    res.status(400);
    throw new Error("Missing required fields: name, address, phone, email");
  }

  const logoUrl = req.file ? `uploads/${req.file.filename}` : "";

  try {
    const business = await Business.create({
      user: req.user._id,
      name,
      address,
      gstNumber,
      phone,
      email,
      logoUrl,
      bankDetails: bankDetails ? JSON.parse(bankDetails) : {},
      upiId: upiId || "",
      signatureUrl: signatureUrl || "",
    });

    res.status(201).json(business);
  } catch (error) {
    // Handle validation errors from schema
    res.status(400).json({ message: error.message });
  }
});

// @desc    Get authenticated user's businesses
// @route   GET /api/businesses
// @access  Private
export const getBusinesses = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error("Unauthorized: User not authenticated");
  }

  try {
    const businesses = await Business.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.status(200).json(businesses);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch businesses" });
  }
});