import express from "express";
import {
  loginUser,
  refreshToken,
  registerUser,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshToken);

export default router;