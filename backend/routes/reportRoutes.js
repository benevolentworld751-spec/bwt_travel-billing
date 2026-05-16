import express from "express";
import { getDashboardStats, exportReport } from "../controllers/reportController.js";

const router = express.Router();

router.get("/dashboard", getDashboardStats);
router.get("/export",    exportReport);

export default router;