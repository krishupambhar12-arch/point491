import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/doctorDetailsForm.css";
import "../styles/variables.css";
import { API } from "../config/api";

const AttorneyDetailsForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const attorneyId = location.state?.attorneyId || "";  // Get attorneyId from registration
  const attorneyName = location.state?.attorneyName || "";  // Get attorneyName from registration

  const [formData, setFormData] = useState({
    attorneyId,
    attorneyName: attorneyName, // Attorney name from registration
    specialization: "",
    qualification: "",
    experience: "",
    fees: "",
    profile_pic: ""
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    for (let key in formData) {
      data.append(key, formData[key]);
    }

    try {
      const res = await fetch(API.ATTORNEY_DETAILS, {
        method: "POST",
        body: data
      });

      const result = await res.json();
      if (res.ok) {
        alert("✅ Attorney details submitted successfully!");
        console.log(result);
        navigate("/attorney/dashboard");
      } else {
        alert(result.message || "❌ Failed to submit details");
      }
    } catch (error) {
      console.error("❌ Error:", error);
      alert("⚠️ Proceeding to dashboard...");
      navigate("/attorney/dashboard");
    }
  };

  return (
    <div className="doctor-form-container">
      <form className="doctor-form" onSubmit={handleSubmit}>
        <h2> Attorney Profile Details</h2>

        <div className="form-group">
          <label>Specialization</label>
          <input type="text" name="specialization" onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Qualification</label>
          <input type="text" name="qualification" onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Experience (years)</label>
          <input type="number" name="experience" onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Consultation Fees (₹)</label>
          <input type="number" name="fees" onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Profile Picture</label>
          <input type="file" name="profile_pic" accept="image/*" onChange={handleChange} />
        </div>

        <button type="submit" className="submit-button">Submit</button>
      </form>
    </div>
  );
};

export default AttorneyDetailsForm;