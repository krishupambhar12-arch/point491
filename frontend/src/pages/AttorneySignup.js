import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/AttorneySignup.css";
import { API } from "../config/api";

const AttorneySignup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    qualification: "",
    joiningDate: "",
    attorneyCode: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }
    
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }
    
    if (!formData.qualification.trim()) {
      newErrors.qualification = 'Qualification is required';
    }
    
    if (!formData.joiningDate.trim()) {
      newErrors.joiningDate = 'Joining date is required';
    }
    
    if (!formData.attorneyCode.trim()) {
      newErrors.attorneyCode = 'Attorney code is required';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // First check if attorney code exists in codes table
      const checkResponse = await fetch(API.ADMIN_CODES_CHECK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          attorneyCode: formData.attorneyCode
        })
      });

      const checkData = await checkResponse.json();

      if (checkResponse.ok && checkData.exists) {
        // Attorney code exists in codes table, proceed to registration
        const res = await fetch(API.REGISTER, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...formData,
            role: "Attorney"
          })
        });

        const data = await res.json();

        if (res.ok) {
          setMessage("✅ Registration successful! Redirecting to details form...");
          setTimeout(() => {
            // Navigate to AttorneyDetailsForm.js with attorney data
            navigate("/attorney/details", { 
              state: { 
                attorneyId: data.attorney?.id || data.user?.id,
                attorneyName: data.attorney?.name || data.user?.name
              } 
            });
          }, 1500);
        } else {
          setMessage(data.message || "❌ Registration failed");
        }
      } else {
        setMessage("❌ Invalid attorney code. Please contact admin for correct code.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setMessage("❌ Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <h2>Attorney Registration</h2>
          <p>Justice Point - Attorney Portal</p>
        </div>

        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
              required
            />
            {errors.phone && <span className="error-message">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label>Gender</label>
            <div className="gender-options">
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="Male"
                  checked={formData.gender === "Male"}
                  onChange={handleChange}
                  required
                /> Male
              </label>
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="Female"
                  checked={formData.gender === "Female"}
                  onChange={handleChange}
                  required
                /> Female
              </label>
            </div>
            {errors.gender && <span className="error-message">{errors.gender}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="qualification">Qualification</label>
            <input
              type="text"
              id="qualification"
              name="qualification"
              value={formData.qualification}
              onChange={handleChange}
              placeholder="Enter your qualification"
              required
            />
            {errors.qualification && <span className="error-message">{errors.qualification}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="joiningDate">Joining Date</label>
            <input
              type="date"
              id="joiningDate"
              name="joiningDate"
              value={formData.joiningDate}
              onChange={handleChange}
              required
            />
            {errors.joiningDate && <span className="error-message">{errors.joiningDate}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="attorneyCode">Attorney Code</label>
            <input
              type="text"
              id="attorneyCode"
              name="attorneyCode"
              value={formData.attorneyCode}
              onChange={handleChange}
              placeholder="Enter attorney code"
              required
            />
            {errors.attorneyCode && <span className="error-message">{errors.attorneyCode}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? 'Please wait...' : 'Submit'}
          </button>
        </form>

        <div className="register-link">
          Already have an account? <Link to="/attorney-login">Login here</Link>
        </div>
      </div>
    </div>
  );
};

export default AttorneySignup;
