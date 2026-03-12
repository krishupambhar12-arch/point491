import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";
import { API } from "../config/api";
import "../styles/publicDoctorProfile.css";

const PublicAttorneyProfile = () => {
  const { attorneyId } = useParams();
  const navigate = useNavigate();
  const [attorney, setAttorney] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const BACKEND_URL = "http://localhost:5000";

  const fetchAttorneyDetails = useCallback(async () => {
    try {
      const res = await fetch(API.ALL_ATTORNEYS);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load attorney details");

      const attorneyData = data.attorneys?.find(d => d.id === attorneyId || d._id === attorneyId);
      if (attorneyData) {
        setAttorney(attorneyData);
      } else {
        setMessage("Attorney not found");
      }
    } catch (error) {
    console.error("Error fetching attorney details:", error);
      setMessage("Failed to load attorney details");
    } finally {
      setLoading(false);
    }
  }, [attorneyId]);

  useEffect(() => {
    fetchAttorneyDetails();
  }, [fetchAttorneyDetails]);

  const handleBookAppointment = () => {
    // Check if user is logged in and is a client (Patient/Client)
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      alert("Please login to book a consultation");
      navigate("/login");
      return;
    }

    const isClient = role === "Patient" || role === "Client";
    if (!isClient) {
      alert("Only clients can book consultations");
      return;
    }

    navigate(`/book-appointment/${attorneyId}`);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="loading-container">
          <p>Loading attorney profile...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!attorney) {
    return (
      <>
        <Header />
        <div className="error-container">
          <p>{message}</p>
          <button onClick={() => navigate("/attorneys")}>Back to Attorneys</button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <div className="doctor-profile-container">
        <div className="profile-header">
          <div className="profile-image">
            <img
              src={attorney.profile_pic ? `${BACKEND_URL}/${attorney.profile_pic}` : ""}
              alt={attorney.name}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>

          <div className="profile-info">
            <h1>Attorney {attorney.name}</h1>
            <p className="specialization">{attorney.specialization}</p>
            <p className="qualification">{attorney.qualification}</p>
            <div className="rating">
              <span>⭐ {attorney.rating}</span>
              <span className="experience">{attorney.experience} years experience</span>
            </div>
            <p className="fees">₹{attorney.fees} consultation fee</p>

            <div className="profile-actions">
              <button onClick={handleBookAppointment} className="book-appointment-btn">
                Book Consultation
              </button>
              <button onClick={() => navigate("/attorneys")} className="back-btn">
                Back to Attorneys
              </button>
            </div>
          </div>
        </div>

        <div className="profile-content">
          <div className="profile-section">
            <h2>About Attorney {attorney.name}</h2>
            <p className="about-text">
              Attorney {attorney.name} is a highly qualified {attorney.specialization} specialist with {attorney.experience} years of experience in providing exceptional legal services.
              With a strong educational background and extensive practice experience, Attorney {attorney.name} is committed to delivering personalized representation and guidance to clients.
            </p>
          </div>

          <div className="profile-section">
            <h2>Specialization</h2>
            <div className="specialization-card">
              <h3>{attorney.specialization}</h3>
              <p>Expert in handling {attorney.specialization.toLowerCase()} related legal matters.</p>
            </div>
          </div>

          <div className="profile-section">
            <h2>Contact Information</h2>
            <div className="contact-card">
              <div className="contact-item">
                <h3>Email</h3>
                <p>{attorney.email}</p>
              </div>
              {attorney.phone && (
                <div className="contact-item">
                  <h3>Phone</h3>
                  <p>{attorney.phone}</p>
                </div>
              )}
            </div>
          </div>

          <div className="profile-section">
            <h2>Education & Qualifications</h2>
            <div className="qualification-card">
              <h3>Professional Qualifications</h3>
              <p>{attorney.qualification}</p>
            </div>
          </div>

          <div className="profile-section">
            <h2>Experience</h2>
            <div className="experience-card">
              <h3>Clinical Experience</h3>
              <p>{attorney.experience} years of dedicated service in the field of {attorney.specialization.toLowerCase()}.</p>
              <ul>
                <li>Specialized in {attorney.specialization}</li>
                <li>Experienced in complex legal matters</li>
                <li>Client-centered approach to legal services</li>
                <li>Continuous professional development</li>
              </ul>
            </div>
          </div>

          <div className="profile-section">
            <h2>Services Offered</h2>
            <div className="services-grid">
              <div className="service-card">
                <h3>Consultation</h3>
                <p>Comprehensive legal consultation and case review</p>
              </div>
              <div className="service-card">
                <h3>Case Assessment</h3>
                <p>Accurate assessment of legal issues and options</p>
              </div>
              <div className="service-card">
                <h3>Representation</h3>
                <p>Effective representation in negotiations and proceedings</p>
              </div>
              <div className="service-card">
                <h3>Follow-up</h3>
                <p>Regular follow-up and ongoing legal support</p>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h2>Client Reviews</h2>
            <div className="reviews-section">
              <div className="overall-rating">
                <span className="rating-number">{attorney.rating}</span>
                <span className="rating-stars">⭐⭐⭐⭐⭐</span>
                <p>Overall Rating</p>
              </div>
              <p className="reviews-note">
                Based on client feedback and satisfaction scores. Attorney {attorney.name} maintains high standards of professionalism and client satisfaction.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default PublicAttorneyProfile;
