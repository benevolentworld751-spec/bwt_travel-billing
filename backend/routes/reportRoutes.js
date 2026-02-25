import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getDashboardStats } from "../controllers/reportController.js";

const router = express.Router();

router.get("/dashboard", protect, getDashboardStats);

export default router;