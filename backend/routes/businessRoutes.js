import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

import { protect } from "../middleware/authMiddleware.js";
import {
  createBusiness,
  getBusinesses,
} from "../controllers/businessController.js";

const router = express.Router();

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==============================
// MULTER CONFIG
// ==============================
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename(req, file, cb) {
    cb(
      null,
      `logo-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) return cb(null, true);

    cb(new Error("Images only (jpg, jpeg, png)!"));
  },
});

// ==============================
// ROUTES
// ==============================
router
  .route("/")
  .post(protect, upload.single("logo"), createBusiness)
  .get(protect, getBusinesses);

export default router;