import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";
import { API } from "../config/api";
import "../styles/bookAppointment.css";

const BookAppointment = () => {
  const { attorneyId } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    subject: "",
    personalInfo: {
      name: "",
      email: "",
      phone: ""
    },
    purpose: "",
    caseSummary: "",
    documents: "",
    desiredOutcome: "",
    date: "",
    time: ""
  });
  const [message, setMessage] = useState("");

  const BACKEND_URL = "http://localhost:5000";

  const fetchDoctorDetails = useCallback(async () => {
    try {
      const res = await fetch(API.ALL_ATTORNEYS);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load attorney details");

      const doctorData = data.attorneys?.find(d => d.id === attorneyId || d._id === attorneyId);
      if (doctorData) {
        setDoctor(doctorData);
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
    // Check if user is logged in
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      setMessage("Please login to book a consultation");
      setLoading(false);
      return;
    }

    // Check if user is a client (Patient/Client)
    const isClient = role === "Patient" || role === "Client";
    if (!isClient) {
      setMessage("Only clients can book consultations");
      setLoading(false);
      return;
    }

    fetchDoctorDetails();
  }, [fetchDoctorDetails]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested fields like personalInfo.name
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.subject || !formData.purpose || !formData.caseSummary || !formData.desiredOutcome) {
      setMessage("Please fill in all required fields");
      return;
    }

    if (!formData.personalInfo.name || !formData.personalInfo.email || !formData.personalInfo.phone) {
      setMessage("Please complete your personal information");
      return;
    }

    if (!formData.date || !formData.time) {
      setMessage("Please select preferred date and time");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Please login to book a consultation");
        return;
      }

      const appointmentData = {
        doctor_id: attorneyId,
        date: formData.date,
        time: formData.time,
        subject: formData.subject,
        personalInfo: formData.personalInfo,
        purpose: formData.purpose,
        caseSummary: formData.caseSummary,
        documents: formData.documents,
        desiredOutcome: formData.desiredOutcome,
        attorneyName: doctor.name,
        attorneySpecialization: doctor.specialization,
        attorneyFees: doctor.fees,
        status: "pending"
      };

      const res = await fetch(API.BOOK_APPOINTMENT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(appointmentData)
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Consultation booked successfully!");
        setTimeout(() => {
          navigate("/client/appointments");
        }, 2000);
      } else {
        setMessage(data.message || "Failed to book consultation");
      }
    } catch (error) {
      console.error("Error booking consultation:", error);
      setMessage("Failed to book consultation");
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="loading-container">
          <p>Loading attorney details...</p>
        </div>
        <Footer />
      </>
    );
  }

  // Check authentication and role
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    return (
      <>
        <Header />
        <div className="error-container">
          <p>Please login to book a consultation</p>
          <button onClick={() => navigate("/login")}>Go to Login</button>
          <button onClick={() => navigate("/doctors")}>Back to Attorneys</button>
        </div>
        <Footer />
      </>
    );
  }

  const isClient = role === "Patient" || role === "Client";
  if (!isClient) {
    return (
      <>
        <Header />
        <div className="error-container">
          <p>Only clients can book consultations</p>
          <button onClick={() => navigate("/doctors")}>Back to Attorneys</button>
        </div>
        <Footer />
      </>
    );
  }

  if (!doctor) {
    return (
      <>
        <Header />
        <div className="error-container">
          <p>{message}</p>
          <button onClick={() => navigate("/doctors")}>Back to Attorneys</button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <div className="book-appointment-container">
        <div className="appointment-header">
          <h1>Book Consultation</h1>
          <p>Schedule your consultation with Attorney {doctor.name}</p>
        </div>

        <div className="appointment-content">
          {/* Attorney Info Card */}
          <div className="doctor-info-card">
            <div className="doctor-image">
              <img
                src={doctor.profile_pic ? `${BACKEND_URL}/${doctor.profile_pic}` : ""}
                alt={doctor.name}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
            <div className="doctor-details">
              <h3>Attorney {doctor.name}</h3>
              <p className="specialization">{doctor.specialization}</p>
              <p className="qualification">{doctor.qualification}</p>
              <p className="experience">{doctor.experience} years experience</p>
              <p className="fees">₹{doctor.fees} consultation fee</p>
              {doctor.phone && <p className="phone">📞 {doctor.phone}</p>}
              <div className="rating">
                <span>⭐ {doctor.rating}</span>
              </div>
            </div>
          </div>

          {/* Appointment Form */}
          <div className="appointment-form">
            <h2>Consultation Details</h2>

            {message && (
              <div className={`message ${message.includes("successfully") ? "success" : "error"}`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* 1. Subject Line */}
              <div className="form-group">
                <label htmlFor="subject">Subject Line *</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Brief subject of consultation"
                  required
                />
              </div>

              {/* 2. Personal Information */}
              <div className="form-group">
                <label>Personal Information *</label>
                <div className="personal-info-grid">
                  <input
                    type="text"
                    name="personalInfo.name"
                    value={formData.personalInfo.name}
                    onChange={handleInputChange}
                    placeholder="Full Name"
                    required
                  />
                  <input
                    type="email"
                    name="personalInfo.email"
                    value={formData.personalInfo.email}
                    onChange={handleInputChange}
                    placeholder="Email Address"
                    required
                  />
                  <input
                    type="tel"
                    name="personalInfo.phone"
                    value={formData.personalInfo.phone}
                    onChange={handleInputChange}
                    placeholder="Phone Number"
                    required
                  />
                </div>
              </div>

              {/* 3. Purpose of Meeting */}
              <div className="form-group">
                <label htmlFor="purpose">Purpose of Meeting *</label>
                <select
                  id="purpose"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select purpose</option>
                  <option value="consultation">Legal Consultation</option>
                  <option value="case_review">Case Review</option>
                  <option value="documentation">Documentation</option>
                  <option value="representation">Legal Representation</option>
                  <option value="mediation">Mediation</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* 4. Brief Case Summary */}
              <div className="form-group">
                <label htmlFor="caseSummary">Brief Case Summary *</label>
                <textarea
                  id="caseSummary"
                  name="caseSummary"
                  value={formData.caseSummary}
                  onChange={handleInputChange}
                  placeholder="Provide a brief summary of your legal matter..."
                  rows="4"
                  required
                />
              </div>

              {/* 5. Relevant Documents */}
              <div className="form-group">
                <label htmlFor="documents">Relevant Documents</label>
                <textarea
                  id="documents"
                  name="documents"
                  value={formData.documents}
                  onChange={handleInputChange}
                  placeholder="List any relevant documents you have (e.g., contracts, court papers, evidence)..."
                  rows="3"
                />
              </div>

              {/* 6. Desired Outcome */}
              <div className="form-group">
                <label htmlFor="desiredOutcome">Desired Outcome *</label>
                <textarea
                  id="desiredOutcome"
                  name="desiredOutcome"
                  value={formData.desiredOutcome}
                  onChange={handleInputChange}
                  placeholder="What outcome are you seeking from this consultation?"
                  rows="3"
                  required
                />
              </div>

              {/* 7. Preferred Date & Time */}
              <div className="form-group">
                <label>Preferred Date & Time *</label>
                <div className="datetime-grid">
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                  <select
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select time</option>
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="17:00">05:00 PM</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="submit-btn">
                {loading ? "Booking..." : "Book Consultation"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default BookAppointment;
