import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { validateCustomer } from "../middleware/validationMiddleware.js";
import {
  getCustomers,
  createCustomer,
  deleteCustomer,
  updateCustomer
} from "../controllers/customerController.js";

const router = express.Router();

// Route: /api/customers
router
  .route("/")
  .get(protect, getCustomers)
  .post(protect, validateCustomer, createCustomer);

// Route: /api/customers/:id
router
  .route("/:id")
  .put(protect, validateCustomer, updateCustomer) // Handle Update
  .delete(protect, deleteCustomer);             // Handle Delete

export default router;