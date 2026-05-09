import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { paymentAPI } from "../services/api";
import "../styles/Checkout.css";

export default function Checkout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const scriptLoaded = useRef(false);

  // Load Razorpay script on mount
  useEffect(() => {
    if (scriptLoaded.current) return;

    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      scriptLoaded.current = true;
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      scriptLoaded.current = true;
    };
    script.onerror = () => {
      console.error("Failed to load Razorpay script");
    };
    document.body.appendChild(script);
  }, []);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await paymentAPI.createOrder(
        100,
        "Premium Access — Offer Letter Decoder"
      );
      const { order, keyId } = response.data;

      if (!window.Razorpay) {
        throw new Error(
          "Razorpay script failed to load. Please refresh the page and try again."
        );
      }

      const userRaw = localStorage.getItem("lex_user");
      const userEmail = userRaw ? JSON.parse(userRaw).email : "";

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "OfferLetter Decoder",
        description: "Premium Access — Unlimited Analysis",
        order_id: order.id,
        handler: async (rzpResponse) => {
          await handlePaymentSuccess(rzpResponse, order.id);
        },
        prefill: {
          email: userEmail || "",
        },
        theme: {
          color: "#6c63ff",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.message || "Payment initiation failed. Please try again.");
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (rzpResponse, orderId) => {
    try {
      const verifyResponse = await paymentAPI.verifyPayment(
        orderId,
        rzpResponse.razorpay_payment_id,
        rzpResponse.razorpay_signature
      );

      if (verifyResponse.data.success) {
        setSuccess(true);
        setLoading(false);
        localStorage.setItem("lex_premium", "true");

        // Use React Router navigate instead of window.location.href
        // so routing works correctly in both dev and production
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 2000);
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError("Payment verification failed. Please contact support.");
      setLoading(false);
    }
  };

  return (
    <div className="checkout-container">
      <div className="checkout-card">
        <h1>Upgrade to Premium</h1>
        <p className="subtitle">Get unlimited offer letter analysis</p>

        <div className="pricing-box">
          <div className="price">
            <span className="currency">₹</span>
            <span className="amount">100</span>
            <span className="period">one-time</span>
          </div>
          <p className="price-note">(~1 USD)</p>
        </div>

        <ul className="features">
          <li>✓ Unlimited offer letter analysis</li>
          <li>✓ Advanced risk assessment</li>
          <li>✓ Negotiation scripts</li>
          <li>✓ Salary benchmarking</li>
          <li>✓ Priority support</li>
        </ul>

        {error && <div className="error-message">{error}</div>}
        {success && (
          <div className="success-message">
            Payment successful! Redirecting to dashboard...
          </div>
        )}

        <button
          className="pay-button"
          onClick={handlePayment}
          disabled={loading || success}
        >
          {loading ? "Processing..." : success ? "Payment Complete!" : "Pay Now"}
        </button>

        <p className="secure-note">💳 Secure payment powered by Razorpay</p>
      </div>
    </div>
  );
}