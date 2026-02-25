import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import fs from "fs"; // Import FS to create folders
import { fileURLToPath } from "url";
import { errorHandler } from "./middleware/errorMiddleware.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import businessRoutes from "./routes/businessRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";




dotenv.config();

const app = express();

// Fix for __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Auto-create uploads folder if it doesn't exist
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log("📂 Created 'uploads' folder");
}

// 1. Security & Config
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// 2. Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use("/api", limiter);

// 3. Static folder for uploads
//app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// 4. Routes
app.use("/api/auth", authRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/reports", reportRoutes);

// 5. Error Handler
app.use(errorHandler);

// 6. Database Connection & Server Start
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err);
    process.exit(1);
  });