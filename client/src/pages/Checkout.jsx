import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { paymentAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const { user, updateUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  const handlePayment = async () => {
    setLoading(true);
    setError("");
    try {
      await loadRazorpayScript();
      const { data } = await paymentAPI.createOrder(100, "Premium Access");
      const { order, keyId } = data;

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "LexAnalytica",
        description: "Unlimited Analysis",
        order_id: order.id,
        handler: async (response) => {
          try {
            const verifyRes = await paymentAPI.verifyPayment(
              order.id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            if (verifyRes.data.success) {
              updateUser({ ...user, isPremium: true });
              localStorage.setItem("lex_premium", "true");
              setSuccess(true);
              setTimeout(() => navigate("/dashboard"), 2000);
            } else {
              throw new Error("Verification failed");
            }
          } catch (err) {
            setError("Payment verified but activation failed. Contact support.");
            setLoading(false);
          }
        },
        prefill: { email: user.email, name: user.name },
        theme: { color: "#6c63ff" },
        modal: { ondismiss: () => setLoading(false) },
      };
      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", (r) => {
        setError(r.error.description || "Payment failed");
        setLoading(false);
      });
      razorpay.open();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Unable to start payment. Try again.");
      setLoading(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="checkout-container">
      <div className="checkout-card">
        <h1>Upgrade to Premium</h1>
        <p className="subtitle">Get unlimited offer letter analysis</p>
        <div className="pricing-box">
          <div className="price">
            <span className="currency">₹</span>
            <span className="amount">100</span>
            <span className="period">one‑time</span>
          </div>
        </div>
        <ul className="features">
          <li>✓ Unlimited analysis</li>
          <li>✓ Advanced risk assessment</li>
          <li>✓ Negotiation scripts</li>
        </ul>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">Payment successful! Redirecting...</div>}
        <button className="pay-button" onClick={handlePayment} disabled={loading || success}>
          {loading ? "Processing..." : success ? "Complete ✓" : "Pay ₹100 Now"}
        </button>
      </div>
    </div>
  );
}