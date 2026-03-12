import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/AttorneySidebar";
import "../styles/attorneyProfile.css";
import { API } from "../config/api";

const AttorneyProfile = () => {
  const navigate = useNavigate();
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [originalData, setOriginalData] = useState({});
  const [showDropdown, setShowDropdown] = useState(false);
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

  const [formData, setFormData] = useState({
    attorneyName: "",
    attorneyEmail: "",
    attorneyPhone: "",
    attorneyGender: "",
    attorneyAddress: "",
    attorneyDOB: "",
    specialization: "",
    qualification: "",
    experience: "",
    fees: ""
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
        console.log("🔍 All attorney fields:", Object.keys(data?.attorney || {}));
        console.log("🔍 Profile picture URL:", data?.attorney?.profilePicture);
        console.log("🔍 Profile picture type:", typeof data?.attorney?.profilePicture);
        console.log("🔍 Checking alternative fields:");
        console.log("  - profile_pic:", data?.attorney?.profile_pic);
        console.log("  - profilePic:", data?.attorney?.profilePic);
        console.log("  - profile_image:", data?.attorney?.profile_image);
        console.log("  - photo:", data?.attorney?.photo);
        console.log("  - image:", data?.attorney?.image);
        
        if (!res.ok) {
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
          profilePicture: data?.attorney?.profilePicture || data?.attorney?.profile_pic || data?.attorney?.profile_image || data?.attorney?.photo || ""
        };

        setAttorney(updatedAttorney);
        setOriginalData(updatedAttorney);
        setFormData({
          attorneyName: updatedAttorney.attorneyName || "",
          attorneyEmail: updatedAttorney.attorneyEmail || "",
          attorneyPhone: updatedAttorney.attorneyPhone || "",
          attorneyGender: updatedAttorney.attorneyGender || "",
          attorneyAddress: updatedAttorney.attorneyAddress || "",
          attorneyDOB: updatedAttorney.attorneyDOB || "",
          specialization: updatedAttorney.specialization || "",
          qualification: updatedAttorney.qualification || "",
          experience: updatedAttorney.experience || "",
          fees: updatedAttorney.fees || ""
        });
        
        console.log("🔍 Updated attorney state:", updatedAttorney);
      } catch (e) {
        console.error("Profile load error:", e);
      }
    };
    load();
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.menu-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRemoveProfileImage = async () => {
    try {
      setMessage("🗑️ Removing profile image...");
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("removeProfilePic", "true");
      
      const res = await fetch(API.ATTORNEY_PROFILE_UPDATE, {
        method: "PUT",
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: formData,
      });
      
      const result = await res.json();
      console.log("🔍 Remove response:", result);
      
      if (res.ok) {
        setMessage("✅ Profile image removed successfully!");
        setShowDropdown(false);
        
        // Update the local state immediately
        setAttorney(prev => ({
          ...prev,
          profilePicture: null
        }));
        
        setOriginalData(prev => ({
          ...prev,
          profilePicture: null
        }));
        
        // Clear message after 2 seconds
        setTimeout(() => {
          setMessage("");
        }, 2000);
      } else {
        setMessage(`❌ Failed to remove image: ${result.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("🔍 Remove error:", err);
      setMessage(`❌ Error: ${err.message}`);
    }
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    console.log("🔍 File selected:", selectedFile);
    console.log("🔍 File name:", selectedFile?.name);
    console.log("🔍 File type:", selectedFile?.type);
    console.log("🔍 File size:", selectedFile?.size);
    
    if (selectedFile) {
      // Check if it's an image
      if (!selectedFile.type.startsWith('image/')) {
        setMessage("❌ Please select an image file");
        return;
      }
      
      // Check file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setMessage("❌ Image size should be less than 5MB");
        return;
      }
      
      // Upload immediately
      try {
        setMessage("📤 Uploading image...");
        const token = localStorage.getItem("token");
        const formData = new FormData();
        formData.append("profile_pic", selectedFile);
        
        const res = await fetch(API.ATTORNEY_PROFILE_UPDATE, {
          method: "PUT",
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          body: formData,
        });
        
        const result = await res.json();
        console.log("🔍 Upload response:", result);
        
        if (res.ok) {
          setMessage("✅ Profile picture updated successfully!");
          setShowDropdown(false);
          
          // Update the local state immediately with the new filename
          if (result.attorney && result.attorney.profilePicture) {
            setAttorney(prev => ({
              ...prev,
              profilePicture: result.attorney.profilePicture
            }));
            
            setOriginalData(prev => ({
              ...prev,
              profilePicture: result.attorney.profilePicture
            }));
          }
          
          // Clear message after 2 seconds
          setTimeout(() => {
            setMessage("");
          }, 2000);
        } else {
          setMessage(`❌ Upload failed: ${result.message || "Unknown error"}`);
        }
      } catch (err) {
        console.error("🔍 Upload error:", err);
        setMessage(`❌ Upload error: ${err.message}`);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    // Check if token exists and is valid
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("❌ No token found. Please login again.");
      navigate("/login");
      return;
    }

    console.log("🔍 Token exists:", !!token);
    console.log("🔍 Token length:", token.length);
    console.log("🔍 Token starts with Bearer:", token.startsWith("Bearer"));

    try {
      const submitData = new FormData();
      // Personal Information fields
      submitData.append("attorneyName", formData.attorneyName);
      submitData.append("attorneyEmail", formData.attorneyEmail);
      submitData.append("attorneyPhone", formData.attorneyPhone);
      submitData.append("attorneyGender", formData.attorneyGender);
      submitData.append("attorneyAddress", formData.attorneyAddress);
      submitData.append("attorneyDOB", formData.attorneyDOB);
      
      // Professional Information fields
      submitData.append("specialization", formData.specialization);
      submitData.append("qualification", formData.qualification);
      submitData.append("experience", formData.experience);
      submitData.append("fees", formData.fees);
      
      if (file) {
        submitData.append("profile_pic", file);
      }

      console.log("🔍 Sending request to:", API.ATTORNEY_PROFILE_UPDATE);
      
      const res = await fetch(API.ATTORNEY_PROFILE_UPDATE, {
        method: "PUT",
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: submitData,
      });

      console.log("🔍 Response status:", res.status);
      console.log("🔍 Response ok:", res.ok);

      const result = await res.json();
      console.log("🔍 Response data:", result);

      if (res.ok) {
        setMessage("✅ Profile updated successfully!");
        setEdit(false);
        // Reload data to get updated profile
        window.location.reload();
      } else {
        if (result.message === "Invalid token" || result.message?.includes("token")) {
          setMessage("❌ Session expired. Please login again.");
          setTimeout(() => {
            localStorage.clear();
            navigate("/login");
          }, 2000);
        } else {
          setMessage(`❌ ${result.message || "Update failed"}`);
        }
      }
    } catch (err) {
      console.error("🔍 Save error:", err);
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setAttorney(originalData);
    setFormData({
      attorneyName: originalData.attorneyName || "",
      attorneyEmail: originalData.attorneyEmail || "",
      attorneyPhone: originalData.attorneyPhone || "",
      attorneyGender: originalData.attorneyGender || "",
      attorneyAddress: originalData.attorneyAddress || "",
      attorneyDOB: originalData.attorneyDOB || "",
      specialization: originalData.specialization || "",
      qualification: originalData.qualification || "",
      experience: originalData.experience || "",
      fees: originalData.fees || ""
    });
    setEdit(false);
    setFile(null);
  };

  return (
    <div className="attorney-profile-container">
      <Sidebar />
      <div className="attorney-profile-content">
        <div className="content-header">
          <h1>Profile</h1>
        </div>

        <div className="profile-content-wrapper">
          {/* Profile Header Section */}
          <div className="profile-header-section">
            <div className="profile-header-top">
              <div className="menu-container" onClick={() => setShowDropdown(!showDropdown)}>
                <button className="menu-button">
                  ⋯
                </button>
                {showDropdown && (
                  <div className="dropdown-menu">
                    <button className="dropdown-item" onClick={(e) => { e.stopPropagation(); setEdit(true); setShowDropdown(false); }}>
                      Edit Profile
                    </button>
                    <button className="dropdown-item" onClick={(e) => { e.stopPropagation(); navigate("/attorney-forgot-password"); setShowDropdown(false); }}>
                      Forgot Password
                    </button>
                    <label htmlFor="profileImageInput" className="dropdown-item label-as-button" onClick={(e) => e.stopPropagation()}>
                      Change Profile Image
                      <input 
                        id="profileImageInput"
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        className="file-input-hidden" 
                      />
                    </label>
                    {attorney.profilePicture && attorney.profilePicture !== "" && attorney.profilePicture !== "null" && attorney.profilePicture !== null && (
                      <button className="dropdown-item" onClick={(e) => { e.stopPropagation(); handleRemoveProfileImage(); }}>
                        Remove Profile Image
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="profile-picture-and-info">
              <div className="profile-picture-container">
                <div className="profile-picture-circle">
                  {(() => {
                    const profilePic = attorney.profilePicture;
                    console.log("🔍 Rendering profile picture:", profilePic);
                    
                    if (!profilePic || profilePic === "" || profilePic === "null" || profilePic === null) {
                      return <div className="no-photo-text">No Photo</div>;
                    }
                    
                    // Try different URL patterns
                    let imageUrl = profilePic;
                    if (!profilePic.startsWith('http')) {
                      // If URL already has uploads/, don't add it again
                      if (profilePic.startsWith('uploads/')) {
                        imageUrl = `http://localhost:5000/${profilePic}`;
                      } else {
                        // Try different base URLs
                        const possibleUrls = [
                          `http://localhost:5000/${profilePic}`,
                          `http://localhost:5000/uploads/${profilePic}`,
                          `http://localhost:5000/public/${profilePic}`,
                          `http://localhost:5000/images/${profilePic}`
                        ];
                        imageUrl = possibleUrls[0]; // Try first one
                      }
                      console.log("🔍 Trying image URL:", imageUrl);
                    }
                    
                    return (
                      <>
                        <img 
                          src={imageUrl} 
                          alt="Profile" 
                          className="profile-img"
                          onLoad={() => console.log("🔍 Image loaded successfully:", imageUrl)}
                          onError={(e) => {
                            console.log("🔍 Image load failed for:", imageUrl);
                            // Try next URL if available
                            if (!profilePic.startsWith('http')) {
                              const fallbackUrls = [];
                              
                              // If original had uploads/, try without it
                              if (profilePic.startsWith('uploads/')) {
                                fallbackUrls.push(`http://localhost:5000/${profilePic.replace('uploads/', '')}`);
                              } else {
                                fallbackUrls.push(`http://localhost:5000/uploads/${profilePic}`);
                                fallbackUrls.push(`http://localhost:5000/public/${profilePic}`);
                                fallbackUrls.push(`http://localhost:5000/images/${profilePic}`);
                              }
                              
                              let currentUrl = imageUrl;
                              let nextUrlIndex = fallbackUrls.findIndex(url => url === currentUrl) + 1;
                              
                              if (nextUrlIndex < fallbackUrls.length) {
                                e.target.src = fallbackUrls[nextUrlIndex];
                                console.log("🔍 Trying fallback URL:", fallbackUrls[nextUrlIndex]);
                              } else {
                                console.log("🔍 All URLs failed, showing No Photo");
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                              }
                            } else {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }
                          }}
                        />
                        <div className="no-photo-text" style={{display: 'none'}}>
                          No Photo
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
              
              <div className="profile-info-container">
                <h2 className="profile-name">{attorney.attorneyName || "Not provided"}</h2>
                <p className="profile-specialization">{attorney.specialization}</p>
                
                {edit && (
                  <div className="edit-actions">
                    <button className="btn-primary" onClick={handleSave} disabled={saving}>
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button className="btn-secondary" onClick={handleCancel}>
                      Cancel
                    </button>
                  </div>
                )}
                
                {message && <p className="message-text">{message}</p>}
              </div>
            </div>
          </div>

          {/* Information Cards */}
          <div className="info-cards-wrapper">
            {/* Personal Information Card */}
            <div className="info-card-custom">
              <div className="card-header-custom">
                <h3>Personal Information</h3>
              </div>
              <div className="card-body-custom">
                <div className="info-row-custom">
                  <span className="label-custom">Full Name:</span>
                  {edit ? (
                    <input
                      type="text"
                      name="attorneyName"
                      value={formData.attorneyName}
                      onChange={handleChange}
                      className="input-custom"
                    />
                  ) : (
                    <span className="value-custom">{attorney.attorneyName || "Not provided"}</span>
                  )}
                </div>
                <div className="info-row-custom">
                  <span className="label-custom">Email:</span>
                  {edit ? (
                    <input
                      type="email"
                      name="attorneyEmail"
                      value={formData.attorneyEmail}
                      onChange={handleChange}
                      className="input-custom"
                    />
                  ) : (
                    <span className="value-custom">{attorney.attorneyEmail || "Not provided"}</span>
                  )}
                </div>
                <div className="info-row-custom">
                  <span className="label-custom">Phone:</span>
                  {edit ? (
                    <input
                      type="tel"
                      name="attorneyPhone"
                      value={formData.attorneyPhone}
                      onChange={handleChange}
                      className="input-custom"
                    />
                  ) : (
                    <span className="value-custom">{attorney.attorneyPhone || "Not provided"}</span>
                  )}
                </div>
                <div className="info-row-custom">
                  <span className="label-custom">Gender:</span>
                  {edit ? (
                    <select
                      name="attorneyGender"
                      value={formData.attorneyGender}
                      onChange={handleChange}
                      className="input-custom"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <span className="value-custom">{attorney.attorneyGender || "Not provided"}</span>
                  )}
                </div>
                <div className="info-row-custom">
                  <span className="label-custom">Date of Birth:</span>
                  {edit ? (
                    <input
                      type="date"
                      name="attorneyDOB"
                      value={formData.attorneyDOB}
                      onChange={handleChange}
                      className="input-custom"
                    />
                  ) : (
                    <span className="value-custom">{attorney.attorneyDOB || "Not provided"}</span>
                  )}
                </div>
                <div className="info-row-custom">
                  <span className="label-custom">Address:</span>
                  {edit ? (
                    <input
                      type="text"
                      name="attorneyAddress"
                      value={formData.attorneyAddress}
                      onChange={handleChange}
                      className="input-custom"
                    />
                  ) : (
                    <span className="value-custom">{attorney.attorneyAddress || "Not provided"}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Professional Information Card */}
            <div className="info-card-custom">
              <div className="card-header-custom">
                <h3>Professional Information</h3>
              </div>
              <div className="card-body-custom">
                <div className="info-row-custom">
                  <span className="label-custom">Specialization:</span>
                  {edit ? (
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className="input-custom"
                    />
                  ) : (
                    <span className="value-custom">{attorney.specialization || "Not provided"}</span>
                  )}
                </div>
                <div className="info-row-custom">
                  <span className="label-custom">Qualification:</span>
                  {edit ? (
                    <input
                      type="text"
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleChange}
                      className="input-custom"
                    />
                  ) : (
                    <span className="value-custom">{attorney.qualification || "Not provided"}</span>
                  )}
                </div>
                <div className="info-row-custom">
                  <span className="label-custom">Experience (years):</span>
                  {edit ? (
                    <input
                      type="number"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      min="0"
                      className="input-custom"
                    />
                  ) : (
                    <span className="value-custom">{attorney.experience ? `${attorney.experience} years` : "Not provided"}</span>
                  )}
                </div>
                <div className="info-row-custom">
                  <span className="label-custom">Consultation Fees:</span>
                  {edit ? (
                    <input
                      type="number"
                      name="fees"
                      value={formData.fees}
                      onChange={handleChange}
                      min="0"
                      className="input-custom"
                    />
                  ) : (
                    <span className="value-custom">{attorney.fees ? `$${attorney.fees}` : "Not provided"}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttorneyProfile;
