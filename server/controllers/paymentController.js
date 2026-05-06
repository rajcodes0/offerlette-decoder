import Razorpay from "razorpay";
import crypto from "crypto";

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn("⚠️  Razorpay keys missing — payment features will not work");
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

// ─── Create Order ─────────────────────────────────────────────────────────────

export const createOrder = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: "Payment provider not configured on server" });
    }

    const {
      amount = 100,          // Amount in INR (frontend sends 100 = ₹100)
      description = "Premium Access - OfferLetter Decoder",
    } = req.body;

    // ✅ FIXED: amount from frontend is already in INR (e.g. 100 = ₹100)
    // Razorpay requires amount in paise (smallest unit), so multiply by 100
    const amountInPaise = Math.round(amount * 100); // 100 INR → 10000 paise

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: req.user?._id?.toString() || "guest",
        email: req.user?.email || "",
        description,
      },
    });

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,   // in paise — Razorpay checkout uses this directly
        currency: order.currency,
      },
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    res.status(500).json({ error: "Failed to create payment order" });
  }
};

// ─── Verify Payment ───────────────────────────────────────────────────────────

export const verifyPayment = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: "Payment provider not configured on server" });
    }

    const { orderId, paymentId, signature } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: "Missing payment verification fields" });
    }

    // ✅ Verify HMAC signature — this is what proves the payment is genuine
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.warn("Payment signature mismatch — possible tampering");
      return res.status(400).json({ error: "Payment signature verification failed" });
    }

    // Confirm payment status directly with Razorpay
    const payment = await razorpay.payments.fetch(paymentId);

    if (payment.status !== "captured") {
      return res.status(400).json({ error: `Payment not captured (status: ${payment.status})` });
    }

    // ✅ FIXED: Actually mark the user as premium in DB after successful payment
    // Add `isPremium: Boolean` field to your User model for this to work
    if (req.user) {
      try {
        const User = (await import("../models/user.js")).default;
        await User.findByIdAndUpdate(req.user._id, { isPremium: true });
        console.log("User upgraded to premium:", req.user._id);
      } catch (dbErr) {
        console.error("Failed to update premium status:", dbErr.message);
        // Don't fail the response — payment was real, log and handle separately
      }
    }

    res.json({
      success: true,
      message: "Payment verified. Welcome to Premium!",
      payment: {
        id: paymentId,
        amount: payment.amount,
        status: payment.status,
      },
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
};

// ─── Get Payment Status ───────────────────────────────────────────────────────

export const getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await razorpay.payments.fetch(paymentId);

    res.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        email: payment.email,
        created_at: payment.created_at,
      },
    });
  } catch (error) {
    console.error("Get payment status error:", error);
    res.status(500).json({ error: "Failed to fetch payment status" });
  }
};