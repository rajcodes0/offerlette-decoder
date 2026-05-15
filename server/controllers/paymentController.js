import Razorpay from "razorpay";
import crypto from "crypto";
import User from "../models/user.js";

// ─── Lazy Razorpay init (avoids crash if keys missing at startup) ────
let razorpayInstance = null;

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return null;
  }
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
}

// ─── Amount validation helper ────────────────────────────────────────
function validateAmount(raw) {
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) {
    return { valid: false, error: "Amount must be a positive number" };
  }
  // Cap at a sane maximum (₹1,00,000)
  if (num > 100000) {
    return { valid: false, error: "Amount exceeds maximum allowed (₹1,00,000)" };
  }
  return { valid: true, value: num };
}

export const createOrder = async (req, res) => {
  try {
    const razorpay = getRazorpay();
    if (!razorpay) {
      return res.status(500).json({ error: "Payment not configured" });
    }

    const { amount = 100 } = req.body;
    const amountCheck = validateAmount(amount);
    if (!amountCheck.valid) {
      return res.status(400).json({ error: amountCheck.error });
    }

    const amountInPaise = Math.round(amountCheck.value * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        email: req.user.email,
      },
    });

    res.json({
      success: true,
      order: { id: order.id, amount: order.amount, currency: order.currency },
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Order creation error:", error.message);
    res.status(500).json({ error: "Failed to create order" });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const razorpay = getRazorpay();
    if (!razorpay) {
      return res.status(500).json({ error: "Payment not configured" });
    }

    const { orderId, paymentId, signature } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: "orderId, paymentId, and signature are required" });
    }

    if (
      typeof orderId !== "string" ||
      typeof paymentId !== "string" ||
      typeof signature !== "string"
    ) {
      return res.status(400).json({ error: "Invalid parameter types" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    const payment = await razorpay.payments.fetch(paymentId);
    if (payment.status !== "captured") {
      return res.status(400).json({ error: "Payment not captured" });
    }

    // Update user to premium
    await User.findByIdAndUpdate(req.user._id, { isPremium: true });

    res.json({
      success: true,
      message: "Premium activated",
      payment: { id: paymentId, status: payment.status },
    });
  } catch (error) {
    console.error("Verify error:", error.message);
    res.status(500).json({ error: "Verification failed" });
  }
};

export const getPaymentStatus = async (req, res) => {
  try {
    const razorpay = getRazorpay();
    if (!razorpay) {
      return res.status(500).json({ error: "Payment not configured" });
    }

    const { paymentId } = req.params;
    if (!paymentId || typeof paymentId !== "string") {
      return res.status(400).json({ error: "Valid paymentId is required" });
    }

    const payment = await razorpay.payments.fetch(paymentId);
    res.json({ success: true, payment });
  } catch (error) {
    console.error("Payment status error:", error.message);
    res.status(500).json({ error: "Failed to fetch status" });
  }
};