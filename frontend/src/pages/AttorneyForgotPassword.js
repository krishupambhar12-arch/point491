import React, { useState } from "react";
import "../styles/adminLogin.css";
import { API } from "../config/api";
import { useNavigate } from "react-router-dom";

const AttorneyForgotPassword = () => {
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

    if (!form.email || !form.newPassword || !form.confirmPassword) {
      setMessage("Please fill all fields");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setMessage("New password and confirm password do not match");
      return;
    }

    if (form.newPassword.length < 6) {
      setMessage("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      console.log("🔍 Sending attorney forgot password request:", {
        email: form.email,
        newPasswordLength: form.newPassword.length
      });

      const res = await fetch(API.ATTORNEY_FORGOT_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: form.email, 
          newPassword: form.newPassword 
        }),
      });

      console.log("🔍 Response status:", res.status);
      const data = await res.json();
      console.log("🔍 Response data:", data);

      if (!res.ok) {
        console.log("❌ Error response:", data);
        setMessage(data.message || "Failed to update password");
        setLoading(false);
        return;
      }

      console.log("✅ Password reset successful");
      setMessage(data.message || "Attorney password updated successfully");
      setTimeout(() => {
        navigate("/attorney-login");
      }, 2000);
    } catch (error) {
      console.error("❌ Attorney forgot password error:", error);
      setMessage("Something went wrong, please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <h2>Attorney Forgot Password</h2>
          <p>Justice Point - Attorney Portal</p>
        </div>

        {message && (
          <div
            style={{
              marginBottom: "20px",
              padding: "12px",
              borderRadius: "6px",
              fontSize: "14px",
              backgroundColor: message.toLowerCase().includes("success") 
                ? "#d4edda" 
                : "#f8d7da",
              color: message.toLowerCase().includes("success") 
                ? "#155724" 
                : "#721c24",
              border: `1px solid ${message.toLowerCase().includes("success") 
                ? "#c3e6cb" 
                : "#f5c6cb"}`
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your attorney email"
              required
            />
          </div>

          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              placeholder="Enter new password"
              required
            />
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              required
            />
          </div>

          <button 
            type="submit" 
            className="admin-login-btn"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        <div className="admin-login-footer">
          <p>
            Remember your password?{" "}
            <a href="/attorney-login" style={{ color: "#007bff", textDecoration: "none" }}>
              Login Here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AttorneyForgotPassword;
