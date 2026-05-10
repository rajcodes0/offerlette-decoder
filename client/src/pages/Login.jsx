import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { authAPI } from "../services/api";
import Navbar from "../components/Layout/Navbar";
import Footer from "../components/Layout/Footer";

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already logged in, redirect to dashboard (or the page they came from)
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authAPI.login(data);
      const { token, user: userData } = res.data;

      if (!token || !userData) {
        throw new Error("Invalid response from server — missing token or user");
      }

      // Persist to localStorage and update context state
      login(token, userData);

      toast.success(`Welcome back, ${userData.name}! 🎉`);

      // Navigate AFTER login() has updated state
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Invalid credentials";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <Navbar />
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 24px",
          background:
            "radial-gradient(circle at 50% 30%, rgba(108,99,255,0.06) 0%, transparent 70%)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 460,
            animation: "fadeInUp 0.5s ease",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 30,
                fontWeight: 700,
              }}
            >
              Sign In
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "var(--text-secondary)",
                marginTop: 10,
              }}
            >
              Enter your email and password to access your account
            </p>
          </div>

          <div className="card" style={{ padding: 36 }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Email</label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="your@email.com"
                  autoComplete="email"
                  {...register("email", { required: "Email is required" })}
                />
                {errors.email && (
                  <div className="form-error">{errors.email.message}</div>
                )}
              </div>

              <div style={{ marginBottom: 28 }}>
                <label className="form-label">Password</label>
                <input
                  className="input-field"
                  type="password"
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  {...register("password", {
                    required: "Password is required",
                  })}
                />
                {errors.password && (
                  <div className="form-error">{errors.password.message}</div>
                )}
                <div style={{ textAlign: "right", marginTop: 8 }}>
                  <Link
                    to="/forgot-password"
                    style={{ fontSize: 12, color: "var(--accent-light)" }}
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "13px",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner"
                      style={{ width: 16, height: 16 }}
                    />{" "}
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>

              <div
                style={{
                  textAlign: "center",
                  marginTop: 20,
                  fontSize: 13,
                  color: "var(--text-muted)",
                }}
              >
                Don't have an account?{" "}
                <Link
                  to="/register"
                  style={{ color: "var(--accent-light)", fontWeight: 600 }}
                >
                  Create one
                </Link>
              </div>
            </form>
          </div>

          <div
            style={{
              textAlign: "center",
              marginTop: 24,
              fontSize: 11,
              color: "var(--text-muted)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            🔒 Secure Connection
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}