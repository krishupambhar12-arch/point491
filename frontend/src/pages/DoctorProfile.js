// src/pages/AttorneyProfile.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/AttorneySidebar";
import "../styles/doctorProfile.css";
import { API } from "../config/api";
const BACKEND_URL = "http://localhost:5000";

const AttorneyProfile = () => {
  const navigate = useNavigate();
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [originalData, setOriginalData] = useState({});
  const [attorney, setAttorney] = useState({
    attorneyName: "",
    attorneyEmail: "",
    attorneyPhone: "",
    attorneyGender: "",
    attorneyAddress: "",
    attorneyDOB: "",
    specialization: "",
    qualification: "",
    experience: "",
    fees: "",
    profilePicture: ""
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const load = async () => {
      try {
        const res = await fetch(API.ATTORNEY_DASHBOARD, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        console.log("🔍 Raw response data:", data);
        console.log("🔍 Attorney object:", data.attorney);
        console.log("🔍 Attorney name from response:", data?.attorney?.name);
        console.log("🔍 Attorney email from response:", data?.attorney?.email);
        
        if (!res.ok) {
          // Check if force logout is required
          if (data.forceLogout || data.deactivated) {
            console.log("🔍 Force logout required from profile - clearing session");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("role");
            alert("Your account has been deactivated by admin. You have been logged out.");
            navigate("/login");
            return;
          }
          throw new Error(data.message || "Failed to load profile");
        }

        const updatedAttorney = {
          attorneyName: data?.attorney?.attorneyName || data?.attorney?.name || "",
          attorneyEmail: data?.attorney?.attorneyEmail || data?.attorney?.email || "",
          attorneyPhone: data?.attorney?.attorneyPhone || data?.attorney?.phone || "",
          attorneyGender: data?.attorney?.attorneyGender || data?.attorney?.gender || "",
          attorneyAddress: data?.attorney?.attorneyAddress || data?.attorney?.address || "",
          attorneyDOB: data?.attorney?.attorneyDOB || data?.attorney?.dateOfBirth || "",
          specialization: data?.attorney?.specialization || "",
          qualification: data?.attorney?.qualification || "",
          experience: String(data?.attorney?.experience ?? ""),
          fees: String(data?.attorney?.fees ?? ""),
          profilePicture: data?.attorney?.profile_pic
            ? `${BACKEND_URL}/${data.attorney.profile_pic}`
            : "",
        };

        setAttorney(updatedAttorney);
        setOriginalData(updatedAttorney); // Store original values
        
        console.log("🔍 Updated attorney state:", updatedAttorney);
        console.log("🔍 Attorney name after setting:", updatedAttorney.attorneyName);
        console.log("🔍 Attorney email after setting:", updatedAttorney.attorneyEmail);
      } catch (e) {
        console.error("Profile load error:", e);
        // show minimal error, keep defaults
      }
    };
    load();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAttorney({ ...attorney, [name]: value });
    
    // If user is entering the name field, clear the error message
    if (name === "attorneyName" && value && value.trim()) {
      setMessage("");
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    console.log("🔍 File selected:", f);
    console.log("🔍 File details:", f ? {
      name: f.name,
      size: f.size,
      type: f.type,
      lastModified: f.lastModified
    } : "No file selected");
    
    setFile(f || null);
    if (f) {
      const url = URL.createObjectURL(f);
      console.log("🔍 Created object URL:", url);
      setAttorney((d) => ({ ...d, profilePicture: url }));
    } else {
      console.log("🔍 No file selected, clearing profile picture preview");
      setAttorney((d) => ({ ...d, profilePicture: "" }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      
      console.log("🔍 Starting profile save...");
      console.log("🔍 File to upload:", file);
      console.log("🔍 File details:", file ? {
        name: file.name,
        size: file.size,
        type: file.type
      } : "No file");
      
      console.log("🔍 Current attorney data:", attorney);
      console.log("🔍 Original data:", originalData);
      console.log("🔍 Attorney name exists:", !!attorney.attorneyName);
      console.log("🔍 Attorney email exists:", !!attorney.attorneyEmail);
      
      const form = new FormData();
      
      // Always send essential fields to prevent validation errors, especially when uploading photo
      // Use fallback data if attorney data is not properly loaded
      const name = attorney.attorneyName || originalData.attorneyName || "";
      const email = attorney.attorneyEmail || originalData.attorneyEmail || "";
      const phone = attorney.attorneyPhone || originalData.attorneyPhone || "";
      const gender = attorney.attorneyGender || originalData.attorneyGender || "Male";
      
      console.log("🔍 Using fallback data:", { name, email, phone, gender });
      
      // Validate that we have minimum required data
      if (!name || !name.trim()) {
        // Try to get name from user info as last resort
        const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
        const fallbackName = userInfo.name || "";
        
        if (fallbackName && fallbackName.trim()) {
          console.log("🔍 Using fallback name from user info:", fallbackName);
          form.append("attorneyName", fallbackName.trim());
        } else {
          setMessage("Name is required. Please refresh the page and try again.");
          setSaving(false);
          return;
        }
      } else {
        if (name && name.trim()) {
          form.append("attorneyName", name.trim());
        }
      }
      
      if (!email || !email.trim()) {
        setMessage("Email is required. Please refresh the page and try again.");
        setSaving(false);
        return;
      }
      
      if (email && email.trim()) {
        form.append("attorneyEmail", email.trim());
      }
      if (phone && phone.trim()) {
        form.append("attorneyPhone", phone.trim());
      }
      if (gender && gender.trim()) {
        form.append("attorneyGender", gender.trim());
      }
      
      // Send other fields only if they have changed or if uploading photo (to ensure complete data)
      const isUploadingPhoto = !!file;
      
      if (isUploadingPhoto || (attorney.attorneyAddress && attorney.attorneyAddress.trim() && attorney.attorneyAddress !== originalData.attorneyAddress)) {
        form.append("attorneyAddress", attorney.attorneyAddress.trim());
      }
      if (isUploadingPhoto || (attorney.attorneyDOB && attorney.attorneyDOB.trim() && attorney.attorneyDOB !== originalData.attorneyDOB)) {
        form.append("attorneyDOB", attorney.attorneyDOB.trim());
      }
      
      // Professional details - send if changed or if uploading photo
      if (isUploadingPhoto || (attorney.specialization && attorney.specialization.trim() && attorney.specialization !== originalData.specialization)) {
        form.append("specialization", attorney.specialization.trim());
      }
      if (isUploadingPhoto || (attorney.qualification && attorney.qualification.trim() && attorney.qualification !== originalData.qualification)) {
        form.append("qualification", attorney.qualification.trim());
      }
      if (isUploadingPhoto || (attorney.experience !== undefined && attorney.experience !== "" && attorney.experience !== null && attorney.experience !== originalData.experience)) {
        form.append("experience", String(parseInt(attorney.experience || 0, 10)));
      }
      if (isUploadingPhoto || (attorney.fees !== undefined && attorney.fees !== "" && attorney.fees !== null && attorney.fees !== originalData.fees)) {
        form.append("fees", String(parseInt(attorney.fees || 0, 10)));
      }
      
      // Profile picture - send if new file is selected
      if (file) {
        console.log("🔍 Adding file to FormData:", file.name);
        form.append("profile_pic", file);
      } else {
        console.log("🔍 No file to add to FormData");
      }

      console.log("🔍 FormData contents:");
      for (let [key, value] of form.entries()) {
        console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
      }

      const res = await fetch(API.ATTORNEY_PROFILE_UPDATE, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      
      console.log("🔍 Response status:", res.status);
      const data = await res.json();
      console.log("🔍 Response data:", data);
      
      if (!res.ok) throw new Error(data.message || "Failed to update profile");
      setMessage("Profile updated successfully. Only changed fields were saved.");
      setEdit(false);
      
      // Reload profile data after successful update
      if (data.attorney?.profilePicture) {
        const newProfileUrl = `${BACKEND_URL}/${data.attorney.profilePicture}`;
        console.log("🔍 Setting new profile picture URL:", newProfileUrl);
        setAttorney(prev => ({
          ...prev,
          profilePicture: newProfileUrl
        }));
      }
    } catch (e) {
      console.error("Profile update error:", e);
      setMessage(e.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <Sidebar />
      <div className="profile-container">
        {/* Left profile card */}
        <div className="profile-card">
          {attorney.profilePicture ? (
            <img src={attorney.profilePicture} alt="Attorney" className="profile-pic" 
              onError={(e) => {
                console.error("Image failed to load:", attorney.profilePicture);
                e.target.style.display = "none";
              }}
            />
          ) : (
            <div className="profile-pic-placeholder">
              <span>No Photo</span>
            </div>
          )}
          {edit ? (
            <>
              <input
                type="text"
                name="attorneyName"
                value={attorney.attorneyName}
                onChange={handleChange}
                className="edit-input"
              />
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </>
          ) : (
            <h2>{attorney.attorneyName || "Attorney"}</h2>
          )}
          <p>{attorney.specialization}</p>
          {edit ? (
            <button className="edit-btn" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          ) : (
            <button className="edit-btn" onClick={() => setEdit(true)}>Edit Profile</button>
          )}
          <button
            className="forgot-password-btn"
            onClick={() => navigate("/attorney-forgot-password")}
            style={{ marginTop: "10px" }}
          >
            Forgot Password
          </button>
          {message && <p style={{ marginTop: 8 }}>{message}</p>}
        </div>

        {/* Right details section */}
        <div className="details-card">
          <h3>Personal Information</h3>
          <div className="detail-row">
            <span>Full Name:</span>
            {edit ? (
              <input
                type="text"
                name="attorneyName"
                value={attorney.attorneyName}
                onChange={handleChange}
              />
            ) : (
              <span>{attorney.attorneyName || "Not provided"}</span>
            )}
          </div>
          <div className="detail-row">
            <span>Email:</span>
            {edit ? (
              <input
                type="email"
                name="attorneyEmail"
                value={attorney.attorneyEmail}
                onChange={handleChange}
              />
            ) : (
              <span>{attorney.attorneyEmail || "Not provided"}</span>
            )}
          </div>
          <div className="detail-row">
            <span>Phone:</span>
            {edit ? (
              <input
                type="tel"
                name="attorneyPhone"
                value={attorney.attorneyPhone}
                onChange={handleChange}
              />
            ) : (
              <span>{attorney.attorneyPhone || "Not provided"}</span>
            )}
          </div>
          <div className="detail-row">
            <span>Gender:</span>
            {edit ? (
              <select
                name="attorneyGender"
                value={attorney.attorneyGender}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            ) : (
              <span>{attorney.attorneyGender || "Not provided"}</span>
            )}
          </div>
          <div className="detail-row">
            <span>Date of Birth:</span>
            {edit ? (
              <input
                type="date"
                name="attorneyDOB"
                value={attorney.attorneyDOB}
                onChange={handleChange}
              />
            ) : (
              <span>{attorney.attorneyDOB || "Not provided"}</span>
            )}
          </div>
          <div className="detail-row">
            <span>Address:</span>
            {edit ? (
              <textarea
                name="attorneyAddress"
                value={attorney.attorneyAddress}
                onChange={handleChange}
                rows="3"
              />
            ) : (
              <span>{attorney.attorneyAddress || "Not provided"}</span>
            )}
          </div>

          <h3 style={{ marginTop: "30px" }}>Professional Information</h3>
          <div className="detail-row">
            <span>Specialization:</span>
            {edit ? (
              <input
                type="text"
                name="specialization"
                value={attorney.specialization}
                onChange={handleChange}
              />
            ) : (
              <span>{attorney.specialization || "Not provided"}</span>
            )}
          </div>
          <div className="detail-row">
            <span>Qualification:</span>
            {edit ? (
              <input
                type="text"
                name="qualification"
                value={attorney.qualification}
                onChange={handleChange}
              />
            ) : (
              <span>{attorney.qualification || "Not provided"}</span>
            )}
          </div>
          <div className="detail-row">
            <span>Experience (years):</span>
            {edit ? (
              <input
                type="number"
                name="experience"
                value={attorney.experience}
                onChange={handleChange}
                min="0"
              />
            ) : (
              <span>{attorney.experience || "0"} years</span>
            )}
          </div>
          <div className="detail-row">
            <span>Consultation Fees:</span>
            {edit ? (
              <input
                type="number"
                name="fees"
                value={attorney.fees}
                onChange={handleChange}
                min="0"
              />
            ) : (
              <span>${attorney.fees || "0"}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttorneyProfile;
