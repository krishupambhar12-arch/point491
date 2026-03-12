import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/register.css";
import "../styles/variables.css";
import { API } from "../config/api";

const AttorneyRegister = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    // Personal Information
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
    phone: "",
    dateOfBirth: "",
    
    // Professional Information
    specialization: "",
    qualification: "",
    experience: "",
    consultationFees: "",
    barNumber: "",
    licenseNumber: "",
    education: "",
    university: "",
    bio: "",
    
    // Contact Information
    officeAddress: "",
    city: "",
    state: "",
    zipCode: "",
    website: "",
    linkedin: "",
    
    // Practice Information
    languages: "",
    practiceAreas: "",
    availableDays: "",
    availableTimeStart: "09:00",
    availableTimeEnd: "17:00",
    
    // Attorney Code
    attorneyCode: "",
    
    // Profile Picture
    profilePicture: null
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      profilePicture: e.target.files[0]
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Personal validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }
    
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }
    
    // Professional validation
    if (!formData.specialization) {
      newErrors.specialization = 'Specialization is required';
    }
    
    if (!formData.qualification) {
      newErrors.qualification = 'Qualification is required';
    }
    
    if (!formData.experience) {
      newErrors.experience = 'Experience is required';
    }
    
    if (!formData.consultationFees) {
      newErrors.consultationFees = 'Consultation fees are required';
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
      // Create FormData for file upload
      const data = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'profilePicture') {
          if (formData[key]) {
            data.append(key, formData[key]);
          }
        } else {
          data.append(key, formData[key]);
        }
      });
      
      // Set role as Attorney
      data.append('role', 'Attorney');

      const res = await fetch(API.REGISTER, {
        method: "POST",
        body: data
      });
      
      const result = await res.json();
      
      if (res.ok) {
        // Store token and user data
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.attorney));
        localStorage.setItem('role', 'Attorney');
        
        setMessage("✅ Attorney Registration Successful!");
        setTimeout(() => {
          navigate("/attorney/dashboard");
        }, 1500);
      } else {
        setMessage(result.message || "❌ Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setMessage("❌ Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const specializations = [
    "Civil Law", "Criminal Law", "Family Law", "Corporate Law",
    "Real Estate Law", "Tax Law", "Immigration Law",
    "Intellectual Property Law", "Labor Law", "Environmental Law"
  ];

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2>Attorney Registration</h2>
        
        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
        
        {/* Personal Information Section */}
        <div className="form-section">
          <h3>👤 Personal Information</h3>
          
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
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
            <label htmlFor="email">Email *</label>
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
            <label htmlFor="password">Password *</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                className="password-input"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁'}
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                className="password-input"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? '👁️' : '👁'}
              </button>
            </div>
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">Phone Number *</label>
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
            <label htmlFor="attorneyCode">Attorney Code *</label>
            <input
              type="text"
              id="attorneyCode"
              name="attorneyCode"
              value={formData.attorneyCode}
              onChange={handleChange}
              placeholder="Enter your attorney code"
              required
            />
            {errors.attorneyCode && <span className="error-message">{errors.attorneyCode}</span>}
          </div>
          
          <div className="form-group">
            <label>Gender *</label>
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
            <label htmlFor="phone">Phone *</label>
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
            <label htmlFor="dateOfBirth">Date of Birth *</label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
            />
            {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
          </div>
        </div>

        {/* Professional Information Section */}
        <div className="form-section">
          <h3>⚖️ Professional Information</h3>
          
          <div className="form-group">
            <label htmlFor="specialization">Specialization *</label>
            <select
              id="specialization"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              required
            >
              <option value="">Select Specialization</option>
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
            {errors.specialization && <span className="error-message">{errors.specialization}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="qualification">Qualification *</label>
            <input
              type="text"
              id="qualification"
              name="qualification"
              value={formData.qualification}
              onChange={handleChange}
              placeholder="e.g., LLB, LLM, PhD in Law"
              required
            />
            {errors.qualification && <span className="error-message">{errors.qualification}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="experience">Experience (years) *</label>
            <input
              type="number"
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              placeholder="Years of professional experience"
              min="0"
              required
            />
            {errors.experience && <span className="error-message">{errors.experience}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="consultationFees">Consultation Fees (₹) *</label>
            <input
              type="number"
              id="consultationFees"
              name="consultationFees"
              value={formData.consultationFees}
              onChange={handleChange}
              placeholder="Consultation fees per session"
              min="0"
              required
            />
            {errors.consultationFees && <span className="error-message">{errors.consultationFees}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="barNumber">Bar Registration Number</label>
            <input
              type="text"
              id="barNumber"
              name="barNumber"
              value={formData.barNumber}
              onChange={handleChange}
              placeholder="Official bar registration number"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="licenseNumber">Professional License Number</label>
            <input
              type="text"
              id="licenseNumber"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleChange}
              placeholder="Professional license number"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="education">Education</label>
            <input
              type="text"
              id="education"
              name="education"
              value={formData.education}
              onChange={handleChange}
              placeholder="Educational background and degrees"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="university">University</label>
            <input
              type="text"
              id="university"
              name="university"
              value={formData.university}
              onChange={handleChange}
              placeholder="University/Institution attended"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="bio">Professional Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="4"
              placeholder="Tell us about your experience, expertise, and approach to client representation..."
            />
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="form-section">
          <h3>📍 Contact Information</h3>
          
          <div className="form-group">
            <label htmlFor="officeAddress">Office Address</label>
            <input
              type="text"
              id="officeAddress"
              name="officeAddress"
              value={formData.officeAddress}
              onChange={handleChange}
              placeholder="Complete office address"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="city">City</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="City of practice"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="state">State</label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="State/Province"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="zipCode">ZIP Code</label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              placeholder="Postal/ZIP code"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="website">Professional Website</label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://yourwebsite.com"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="linkedin">LinkedIn Profile</label>
            <input
              type="url"
              id="linkedin"
              name="linkedin"
              value={formData.linkedin}
              onChange={handleChange}
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>
        </div>

        {/* Practice Information Section */}
        <div className="form-section">
          <h3>⚡ Practice Information</h3>
          
          <div className="form-group">
            <label htmlFor="languages">Languages Spoken</label>
            <input
              type="text"
              id="languages"
              name="languages"
              value={formData.languages}
              onChange={handleChange}
              placeholder="English, Hindi, Gujarati, Spanish"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="practiceAreas">Practice Areas</label>
            <input
              type="text"
              id="practiceAreas"
              name="practiceAreas"
              value={formData.practiceAreas}
              onChange={handleChange}
              placeholder="Civil Law, Criminal Law, Family Law, Corporate Law"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="availableDays">Available Days</label>
            <input
              type="text"
              id="availableDays"
              name="availableDays"
              value={formData.availableDays}
              onChange={handleChange}
              placeholder="Monday, Tuesday, Wednesday, Thursday, Friday"
            />
          </div>
          
          <div className="form-group">
            <label>Available Time</label>
            <div className="time-inputs">
              <input
                type="time"
                name="availableTimeStart"
                value={formData.availableTimeStart}
                onChange={handleChange}
              />
              <span>to</span>
              <input
                type="time"
                name="availableTimeEnd"
                value={formData.availableTimeEnd}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Profile Picture Section */}
        <div className="form-section">
          <h3>📸 Profile Picture</h3>
          
          <div className="form-group">
            <label htmlFor="profilePicture">Professional Profile Picture</label>
            <input
              type="file"
              id="profilePicture"
              name="profilePicture"
              accept="image/*"
              onChange={handleFileChange}
            />
            {formData.profilePicture && (
              <div className="file-preview">
                <img src={URL.createObjectURL(formData.profilePicture)} alt="Profile Preview" />
                <p>Profile picture selected</p>
              </div>
            )}
          </div>
        </div>
        
        <button type="submit" className="register-button" disabled={loading}>
          {loading ? 'Please wait...' : 'Register as Attorney'}
        </button>
        
        <div className="login-link">
          Already have an account? <Link to="/login">Login here</Link>
        </div>
      </form>
    </div>
  );
};

export default AttorneyRegister;
