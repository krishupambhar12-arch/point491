import React, { useState } from "react";
import "../styles/login.css";
import { API } from "../config/api";
import { useNavigate, Link } from "react-router-dom";

const ForgotPassword = () => {
  const [form, setForm] = useState({ email: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // Enhanced validation
    if (!form.email) {
      setMessage("❌ Please enter your email address");
      return;
    }

    if (!form.newPassword) {
      setMessage("❌ Please enter your new password");
      return;
    }

    if (!form.confirmPassword) {
      setMessage("❌ Please confirm your new password");
      return;
    }

    if (form.newPassword.length < 6) {
      setMessage("❌ Password must be at least 6 characters long");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setMessage("❌ New password and confirm password do not match");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setMessage("❌ Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Sending forgot password request:', { email: form.email });
      
      const res = await fetch(API.FORGOT_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, newPassword: form.newPassword }),
      });

      const data = await res.json();
      console.log('🔍 Forgot password response:', data);
      
      if (!res.ok) {
        setMessage(data.message || "❌ Failed to update password");
        setLoading(false);
        return;
      }

      setMessage("✅ Password updated successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("Forgot password error:", error);
      setMessage("❌ Something went wrong, please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      {/* Forgot Password Form */}
      <form className="register-form" onSubmit={handleSubmit}>
        {/* Back Button */}
        <Link to="/login" className="back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>

        </Link>
        
        <h1 className="get">Reset Password</h1>
        <h4 className="ac">Enter your email and new password</h4>
        <h2>Forgot Password</h2>

          {message && (
            <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your registered email address"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              placeholder="Enter your new password (min. 6 characters)"
              required
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your new password"
              required
              minLength="6"
            />
          </div>

          <button type="submit" className="register-button" disabled={loading}>
            {loading ? "Please wait..." : "Update Password"}
          </button>

          <div className="login-link">
            Remember your password? <a href="/login">Login</a>
          </div>
      </form>
    </div>
  );
};

export default ForgotPassword;

