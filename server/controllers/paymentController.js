import Razorpay from "razorpay";
import crypto from "crypto";

// Ensure Razorpay keys are present before creating the client
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn(
    "Razorpay keys missing: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set",
  );
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export const createOrder = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res
        .status(500)
        .json({ error: "Payment provider not configured on server" });
    }
    const {
      amount = 100,
      currency = "USD",
      description = "Premium Access - Offerlette Decoder",
    } = req.body;

    // Convert USD to INR if needed (Razorpay works in INR)
    let amountInPaisa = amount * 100; // Convert to smallest unit (paise for INR)

    const options = {
      amount: amountInPaisa,
      currency: "INR", // Razorpay only supports INR
      description: description,
      customer_notify: 1,
      notes: {
        userId: req.user?._id || null,
        email: req.user?.email || null,
        planType: "premium",
      },
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    res.status(500).json({ error: "Failed to create payment order" });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res
        .status(500)
        .json({ error: "Payment provider not configured on server" });
    }
    const { orderId, paymentId, signature } = req.body;

    // Verify signature
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res
        .status(400)
        .json({ error: "Payment signature verification failed" });
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(paymentId);

    if (payment.status === "captured") {
      // Payment successful - update user subscription or grant access
      res.json({
        success: true,
        message: "Payment verified successfully",
        payment: {
          id: paymentId,
          amount: payment.amount,
          status: payment.status,
          email: payment.email,
        },
      });
    } else {
      res.status(400).json({ error: "Payment not captured" });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
};

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
