import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { validateCustomer } from "../middleware/validationMiddleware.js";
import {
  getCustomers,
  createCustomer,
  deleteCustomer,
} from "../controllers/customerController.js";

const router = express.Router();

router
  .route("/")
  .get(protect, getCustomers)
  .post(protect, validateCustomer, createCustomer);

router.route("/:id").delete(protect, deleteCustomer);

export default router;