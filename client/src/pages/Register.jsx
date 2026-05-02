import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { authAPI } from "../services/api";
import Navbar from "../components/Layout/Navbar";
import Footer from "../components/Layout/Footer";

export default function Register() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authAPI.register({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      toast.success("Account created successfully! Please sign in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
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
              Create Account
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "var(--text-secondary)",
                marginTop: 10,
              }}
            >
              Sign up to get started analyzing offer letters
            </p>
          </div>

          <div className="card" style={{ padding: 36 }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Full Name</label>
                <input
                  className="input-field"
                  placeholder="John Doe"
                  {...register("name", { required: "Name is required" })}
                />
                {errors.name && (
                  <div className="form-error">{errors.name.message}</div>
                )}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Email</label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="your@email.com"
                  {...register("email", { required: "Email is required" })}
                />
                {errors.email && (
                  <div className="form-error">{errors.email.message}</div>
                )}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Password</label>
                <input
                  className="input-field"
                  type="password"
                  placeholder="Min. 6 characters"
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 6, message: "Min 6 characters" },
                  })}
                />
                {errors.password && (
                  <div className="form-error">{errors.password.message}</div>
                )}
              </div>

              <div style={{ marginBottom: 28 }}>
                <label className="form-label">Confirm Password</label>
                <input
                  className="input-field"
                  type="password"
                  placeholder="Repeat password"
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (val) =>
                      val === watch("password") || "Passwords do not match",
                  })}
                />
                {errors.confirmPassword && (
                  <div className="form-error">
                    {errors.confirmPassword.message}
                  </div>
                )}
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
                    Creating account...
                  </>
                ) : (
                  "Create Account"
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
                Already have an account?{" "}
                <Link
                  to="/login"
                  style={{ color: "var(--accent-light)", fontWeight: 600 }}
                >
                  Sign In
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
