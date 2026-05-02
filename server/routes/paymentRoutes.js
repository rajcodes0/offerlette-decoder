import express from "express";
import {
  createOrder,
  verifyPayment,
  getPaymentStatus,
} from "../controllers/paymentController.js";
import { authProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create payment order
router.post("/create-order", authProtect, createOrder);

// Verify payment signature
router.post("/verify-payment", authProtect, verifyPayment);

// Get payment status
router.get("/payment-status/:paymentId", authProtect, getPaymentStatus);

export default router;
