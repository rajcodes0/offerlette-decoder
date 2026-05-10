import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { paymentAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import "../styles/Checkout.css";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    // Don't inject again if already loaded
    if (window.Razorpay) return resolve(true);

    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
    if (existing) {
      // Script tag exists but Razorpay object might not be ready yet — wait for it
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => reject(new Error("Razorpay script failed to load")));
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Failed to load Razorpay script. Check your internet connection."));
    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const scriptReady = useRef(false);

  // Pre-load Razorpay script on mount so the first click is instant
  useEffect(() => {
    loadRazorpayScript()
      .then(() => { scriptReady.current = true; })
      .catch((e) => console.warn("Razorpay preload failed:", e.message));
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login", { state: { from: { pathname: "/checkout" } } });
    }
  }, [user, navigate]);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError("");

      // Ensure script is loaded before opening modal
      if (!window.Razorpay) {
        await loadRazorpayScript();
      }

      // Create backend order
      const response = await paymentAPI.createOrder(
        100,
        "Premium Access — LexAnalytica"
      );
      const { order, keyId } = response.data;

      if (!order?.id || !keyId) {
        throw new Error("Invalid order response from server");
      }

      const options = {
        key: keyId,
        amount: order.amount,   // already in paise from backend
        currency: order.currency || "INR",
        name: "LexAnalytica",
        description: "Premium Access — Unlimited Analysis",
        order_id: order.id,
        handler: async (rzpResponse) => {
          await handlePaymentSuccess(rzpResponse, order.id);
        },
        prefill: {
          email: user?.email || "",
          name: user?.name || "",
        },
        theme: {
          color: "#6c63ff",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
          escape: true,
          backdropclose: false,
        },
      };

      const razorpay = new window.Razorpay(options);

      // Handle payment failures (e.g., card declined)
      razorpay.on("payment.failed", (response) => {
        console.error("Payment failed:", response.error);
        setError(`Payment failed: ${response.error.description || "Please try a different payment method."}`);
        setLoading(false);
      });

      razorpay.open();
    } catch (err) {
      console.error("Payment initiation error:", err);
      setError(err.response?.data?.error || err.message || "Payment initiation failed. Please try again.");
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
        // Update premium flag in localStorage AND in auth context
        localStorage.setItem("lex_premium", "true");
        updateUser({ isPremium: true });

        setSuccess(true);
        setLoading(false);

        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 2000);
      } else {
        throw new Error("Verification returned unsuccessful");
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError(
        "Payment was received but verification failed. Please contact support with your payment ID: " +
          rzpResponse.razorpay_payment_id
      );
      setLoading(false);
    }
  };

  // Don't render until auth is confirmed
  if (!user) return null;

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
          {loading ? "Processing..." : success ? "Payment Complete! ✓" : "Pay ₹100 Now"}
        </button>

        <p className="secure-note">💳 Secure payment powered by Razorpay</p>
      </div>
    </div>
  );
}