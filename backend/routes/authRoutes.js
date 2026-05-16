import express from "express";
import {
  loginUser,
  refreshToken,
  registerUser,
  forgotPassword,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshToken);
router.post('/forgot-password', forgotPassword);

export default router;