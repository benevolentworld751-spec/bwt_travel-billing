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

// @desc    Update a business
// @route   PUT /api/businesses/:id
// @access  Private
export const updateBusiness = asyncHandler(async (req, res) => {
  const business = await Business.findById(req.params.id);

  if (!business) {
    res.status(404);
    throw new Error("Business not found");
  }

  // Check ownership
  if (business.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("User not authorized to update this business");
  }

  const { name, address, gstNumber, phone, email, bankDetails, upiId } = req.body;

  business.name = name || business.name;
  business.address = address || business.address;
  business.gstNumber = gstNumber || business.gstNumber;
  business.phone = phone || business.phone;
  business.email = email || business.email;
  business.upiId = upiId || business.upiId;

  if (bankDetails) {
    business.bankDetails = JSON.parse(bankDetails);
  }

  if (req.file) {
    business.logoUrl = `uploads/${req.file.filename}`;
  }

  const updatedBusiness = await business.save();
  res.json(updatedBusiness);
});

// @desc    Delete a business
// @route   DELETE /api/businesses/:id
// @access  Private
export const deleteBusiness = asyncHandler(async (req, res) => {
  const business = await Business.findById(req.params.id);

  if (!business) {
    res.status(404);
    throw new Error("Business not found");
  }

  // Check ownership
  if (business.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("User not authorized to delete this business");
  }

  await business.deleteOne();
  res.json({ message: "Business removed" });
});

// @desc    Set business as default
// @route   PATCH /api/businesses/:id/default
// @access  Private
export const setDefaultBusiness = asyncHandler(async (req, res) => {
  // 1. Set all other businesses for this user to isDefault: false
  await Business.updateMany(
    { user: req.user._id },
    { isDefault: false }
  );

  // 2. Set the target business to isDefault: true
  const business = await Business.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isDefault: true },
    { new: true }
  );

  if (!business) {
    res.status(404);
    throw new Error("Business not found");
  }

  res.json(business);
});