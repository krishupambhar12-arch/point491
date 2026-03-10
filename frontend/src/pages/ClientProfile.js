import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../config/api";
import "../styles/patientProfile.css";
import ClientSidebar from "../components/ClientSidebar";

const ClientProfile = () => {
  const navigate = useNavigate();
  const [edit, setEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);

  // Helper function to calculate age
  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const [patient, setPatient] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    dob: "",
    gender: "",
    role: "Client",
    profilePicture: "",
    isSocialLogin: false,
    provider: ""
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(API.CLIENT_PROFILE, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load profile");

        // Format the date to show only date part (YYYY-MM-DD)
        const userData = { 
          name: data.user.name || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
          address: data.user.address || "",
          dob: data.user.dateOfBirth ? new Date(data.user.dateOfBirth).toISOString().split('T')[0] : "",
          gender: data.user.gender || "",
          role: data.user.role || "Client",
          profilePicture: data.user.profilePicture || "",
          isSocialLogin: data.user.isSocialLogin || false,
          provider: data.user.provider || ""
        };
        setPatient(userData);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Enhanced debugging for DoB field
    if (name === 'dob') {
      console.log('🔍 DoB field changed:', {
        name,
        value,
        oldValue: patient.dob,
        newValue: value,
        isValidDate: value && !isNaN(new Date(value))
      });
    }
    
    console.log('🔍 Field changed:', { name, value });
    setPatient({ ...patient, [name]: value });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('Image file selected:', file.name, file.size, file.type);
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("❌ File size must be less than 5MB");
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError("❌ Please select an image file");
        return;
      }
      
      setProfileImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      console.log('Image preview created:', previewUrl);
      
      // Auto-upload the image immediately
      await uploadProfileImage(file);
    }
  };

  const uploadProfileImage = async (file) => {
    try {
      setError("📸 Uploading photo...");
      
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      console.log('🔍 Auto-uploading image to server...');
      
      const res = await fetch(API.CLIENT_PROFILE_UPDATE, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      console.log('🔍 Upload response:', data);
      
      if (!res.ok) throw new Error(data.message || "Failed to upload photo");

      // Update local state with response data
      setPatient(data.user);
      setProfileImage(null); // Clear the selected file
      setImagePreview(null); // Clear the preview
      setError("✅ Photo uploaded successfully!");
      
      console.log('✅ Photo uploaded successfully:', data.user.profilePicture);
      
      // Clear success message after 3 seconds
      setTimeout(() => setError(""), 3000);
      
    } catch (e) {
      console.error('❌ Upload error:', e);
      setError(e.message);
    }
  };

  const handleContinue = () => {
    // Check if this is running in a popup window
    console.log('Window opener:', window.opener);
    console.log('Window opener closed:', window.opener?.closed);
    
    if (window.opener && !window.opener.closed) {
      console.log('Detected popup window, transferring auth data and closing...');
      
      // Copy authentication data to parent window if needed
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      const user = localStorage.getItem('user');
      
      if (token && window.opener.localStorage) {
        window.opener.localStorage.setItem('token', token);
        window.opener.localStorage.setItem('role', role);
        if (user) {
          window.opener.localStorage.setItem('user', user);
        }
        console.log('Auth data transferred to parent window');
      }
      
      // Redirect the main parent window and close the popup
      window.opener.location.href = "http://localhost:3000/client/dashboard";
      window.close();
    } else {
      console.log('Not a popup window or opener is closed, using normal navigation');
      // Fallback for cases where window.opener is not available (e.g., if not opened as a popup)
      navigate("/client/dashboard");
    }
  };

  const handleSave = async () => {
    console.log('🔍 Save button clicked');
    console.log('🔍 Current profileImage:', profileImage);
    console.log('🔍 Current patient data:', patient);
    console.log('🔍 DoB value being saved:', patient.dob);
    
    setSaving(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      console.log('🔍 Token:', token ? 'exists' : 'missing');
      
      // Create FormData for multipart/form-data (to handle file upload)
      const formData = new FormData();
      
      // Add text fields
      formData.append('name', patient.name);
      formData.append('phone', patient.phone);
      formData.append('address', patient.address);
      formData.append('dob', patient.dob || ''); // Ensure empty string if undefined
      formData.append('gender', patient.gender);
      
      console.log('🔍 FormData text fields added:', {
        name: patient.name,
        phone: patient.phone,
        address: patient.address,
        dob: patient.dob || '',
        gender: patient.gender
      });
      
      // Add image file if selected
      if (profileImage) {
        formData.append('profilePicture', profileImage);
        console.log('🔍 Profile image added to FormData:', profileImage.name);
      } else {
        console.log('🔍 No profile image to upload');
      }
      
      console.log('🔍 Sending request to:', API.CLIENT_PROFILE_UPDATE);
      
      const res = await fetch(API.CLIENT_PROFILE_UPDATE, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type header when using FormData
          // Browser will set it automatically with boundary
        },
        body: formData,
      });

      console.log('🔍 Response status:', res.status);
      const data = await res.json();
      console.log('🔍 Response data:', data);
      
      if (!res.ok) throw new Error(data.message || "Failed to update profile");

      console.log('✅ Profile update successful!');
      console.log('🔍 Response data:', data.user);

      // Ensure DoB is properly formatted in the response
      if (data.user.dateOfBirth) {
        // Convert dateOfBirth to YYYY-MM-DD format for consistency
        const dobDate = new Date(data.user.dateOfBirth);
        const formattedDob = dobDate.toISOString().split('T')[0];
        data.user.dob = formattedDob;
        console.log('🔍 DoB formatted:', data.user.dateOfBirth, '->', formattedDob);
      }

      // Update local state with response data immediately
      setPatient(data.user);
      setEdit(false); // Exit edit mode
      setProfileImage(null); // Clear the selected file
      setImagePreview(null); // Clear the preview
      
      // Show success message
      setError("✅ Profile updated successfully! Changes are now visible.");
      
      console.log('✅ Local state updated with new data:', data.user);
      console.log('✅ Edit mode disabled');
      console.log('✅ Profile picture updated:', data.user.profilePicture);
      console.log('✅ DoB updated:', data.user.dob);
      
      // Force a re-render to ensure UI updates immediately
      setTimeout(() => {
        console.log('🔄 Forced re-render completed');
        console.log('🔄 Final DoB in state:', patient.dob);
      }, 100);
      
      // Clear success message after 3 seconds
      setTimeout(() => setError(""), 3000);
      
    } catch (e) {
      console.error('❌ Save error:', e);
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="profile-container">
        <ClientSidebar />
        <div className="profile-card">
          {loading ? (
            <>
              <h2>Loading...</h2>
              <p className="role-text">Please wait</p>
            </>
          ) : error && !error.includes('✅') ? (
            <>
              <h2>Error</h2>
              <p className="role-text error-message">
                {error}
              </p>
            </>
          ) : (
            <>
              {/* Show success message if exists */}
              {error && error.includes('✅') && (
                <div style={{ 
                  marginBottom: '15px', 
                  padding: '15px 20px', 
                  backgroundColor: '#d4edda', 
                  borderRadius: '8px', 
                  border: '2px solid #c3e6cb',
                  animation: 'fadeIn 0.5s ease-in'
                }}>
                  <p style={{ 
                    margin: 0, 
                    color: '#155724', 
                    fontWeight: 'bold',
                    fontSize: '15px'
                  }}>
                    {error}
                  </p>
                  <p style={{ 
                    margin: '5px 0 0 0', 
                    color: '#155724', 
                    fontSize: '12px',
                    fontStyle: 'italic'
                  }}>
                    Your profile has been updated and changes are now visible.
                  </p>
                </div>
              )}
              
              {/* Profile Image Upload */}
              <div className="profile-image-section">
                {/* Debug info */}
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                  {/* Debug: profilePicture={patient.profilePicture}, imagePreview={imagePreview ? 'exists' : 'null'} */}
                </div>
                
                {/* Unsaved changes indicator */}
                {imagePreview && (
                  <div style={{ 
                    marginBottom: '10px', 
                    padding: '8px', 
                    backgroundColor: '#d1ecf1', 
                    borderRadius: '5px', 
                    border: '1px solid #bee5eb',
                    fontSize: '14px',
                    color: '#0c5460'
                  }}>
                    📸 Uploading photo automatically...
                  </div>
                )}
                
                <div className="profile-image-container">
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Profile Preview" 
                      className="profile-image"
                    />
                  ) : patient.profilePicture ? (
                    <img 
                      src={`http://localhost:5000/uploads/${patient.profilePicture}`} 
                      alt="Profile" 
                      className="profile-image"
                      onLoad={() => console.log('Profile image loaded successfully')}
                      onError={(e) => {
                        console.log('Failed to load profile image:', patient.profilePicture);
                        e.target.onerror = null; // Prevent infinite loop
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = 'flex';
                        }
                      }}
                    />
                  ) : (
                    <div className="profile-image-placeholder">
                      {patient.name ? patient.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  id="profileImage"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                  disabled={saving}
                />
                <label htmlFor="profileImage" className={`upload-image-btn ${saving ? 'uploading' : ''}`} style={{ cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? '⏳ Saving...' : 'Upload Photo'}
                </label>
              </div>

              {edit ? (
                <input
                  type="text"
                  name="name"
                  value={patient.name}
                  onChange={handleChange}
                  className="edit-input"
                  placeholder="Enter your name"
                />
              ) : (
                <>
                  <h2>{patient.name}</h2>
                  <p className="role-text">{patient.role}</p>
                </>
              )}
            </>
          )}

          <div className="profile-actions" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            flexWrap: 'nowrap',
            gap: '12px',
            marginBottom: '15px'
          }}>
            <button 
              className="edit-btn" 
              onClick={() => {
                console.log('🔘 Edit button clicked, current edit state:', edit);
                console.log('🔘 Setting edit to:', !edit);
                setEdit(!edit);
                
                // Force a re-render to ensure edit mode takes effect
                setTimeout(() => {
                  console.log('🔘 Edit state after timeout:', !edit);
                }, 100);
              }}
              style={{
                padding: '12px 24px',
                backgroundColor: edit ? '#dc3545' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                boxShadow: edit ? '0 4px 8px rgba(220, 53, 69, 0.3)' : '0 4px 8px rgba(0, 123, 255, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              {edit ? "Cancel Edit" : " Edit Profile"}
            </button>
            
            {/* Continue button - always visible and next to Edit Profile */}
            <button
              className="continue-btn"
              onClick={handleContinue}
              style={{
                padding: '12px 24px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                boxShadow: '0 4px 8px rgba(23, 162, 184, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              Continue
            </button>
            
            {/* Save button - appears in edit mode */}
            {edit && (
              <button 
                className="save-btn" 
                onClick={handleSave} 
                disabled={saving}
                style={{
                  padding: '12px 24px',
                  backgroundColor: saving ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 8px rgba(40, 167, 69, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                {saving ? " Saving..." : " Save Changes"}
              </button>
            )}
          </div>
          
          <button
            className="forgot-password-btn"
            onClick={() => navigate("/forgot-password")}
            style={{ marginTop: "10px" }}
          >
             Forgot Password
          </button>
        </div>

        {/* Right side details */}
        <div className="details-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: 'bold',
              color: edit ? '#007bff' : '#333',
              transition: 'color 0.3s ease'
            }}>
              Client Details {edit && '📝 (Edit Mode)'}
            </h3>
            {edit && (
              <div style={{
                backgroundColor: '#e3f2fd',
                color: '#004085',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 'bold',
                animation: 'pulse 2s infinite',
                border: '2px solid #004085'
              }}>
                ✏️ You are editing your profile - Make changes and click "Save Changes"
              </div>
            )}
          </div>

          <div className="detail-row">
            <span>Email:</span>
            <p style={{ color: '#666', fontStyle: 'italic' }}>{patient.email} </p>
          </div>

          <div className="detail-row">
            <span>Phone:</span>
            {edit ? (
              <input
                type="tel"
                name="phone"
                value={patient.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                style={{ 
                  border: '2px solid #007bff', 
                  padding: '8px', 
                  borderRadius: '5px',
                  width: '100%',
                  fontSize: '14px'
                }}
              />
            ) : (
              <p>{patient.phone || <span style={{ color: '#999' }}>Not set</span>}</p>
            )}
          </div>

          <div className="detail-row">
            <span>Address:</span>
            {edit ? (
              <input
                type="text"
                name="address"
                value={patient.address}
                onChange={handleChange}
                placeholder="Enter your address"
                style={{ 
                  border: '2px solid #007bff', 
                  padding: '8px', 
                  borderRadius: '5px',
                  width: '100%',
                  fontSize: '14px'
                }}
              />
            ) : (
              <p>{patient.address || <span style={{ color: '#999' }}>Not set</span>}</p>
            )}
          </div>

          <div className="detail-row">
            <span>Date of Birth:</span>
            {edit ? (
              <input
                type="date"
                name="dob"
                value={patient.dob || ''}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]} // Prevent future dates
                min="1900-01-01" // Prevent very old dates
                style={{ 
                  border: '2px solid #007bff', 
                  padding: '8px', 
                  borderRadius: '5px',
                  width: '100%',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  backgroundColor: '#f8f9fa',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  console.log('🔍 DoB input clicked, current value:', patient.dob);
                }}
                onBlur={(e) => {
                  console.log('🔍 DoB input blurred, final value:', e.target.value);
                }}
              />
            ) : (
              <p>
                {patient.dob ? (
                  <>
                    {(() => {
                      const dobDate = new Date(patient.dob);
                      console.log('🔍 Displaying DoB:', patient.dob, 'as date:', dobDate);
                      return dobDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long', 
                        day: 'numeric'
                      });
                    })()}
                    <span style={{ 
                      marginLeft: '10px', 
                      fontSize: '12px', 
                      color: '#666' 
                    }}>
                      (Age: {(() => {
                        const age = calculateAge(patient.dob);
                        console.log('🔍 Calculated age:', age);
                        return age;
                      })()} years)
                    </span>
                  </>
                ) : (
                  <span style={{ color: '#999' }}>Not set</span>
                )}
              </p>
            )}
          </div>

          <div className="detail-row">
            <span>Gender:</span>
            {edit ? (
              <select
                name="gender"
                value={patient.gender || ""}
                onChange={handleChange}
                style={{ 
                  border: '2px solid #007bff', 
                  padding: '8px', 
                  borderRadius: '5px',
                  width: '100%',
                  fontSize: '14px'
                }}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            ) : (
              <p>{patient.gender || <span style={{ color: '#999' }}>Not set</span>}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;
