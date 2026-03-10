import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { API } from "../config/api";
import "../styles/patientFeedback.css";
import ClientSidebar from "../components/ClientSidebar";

const PatientFeedback = () => {
  const location = useLocation();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [openFormOnly, setOpenFormOnly] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    rating: 5
  });

  useEffect(() => {
    // If user comes from home footer, open only the form
    if (location?.state?.openFormOnly) {
      setShowForm(true);
      setOpenFormOnly(true);
    }
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(API.GET_USER_FEEDBACK, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load feedback");

      setFeedbacks(data.feedbacks || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === "rating" ? parseInt(value) : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.message) {
      setError("Subject and message are required");
      return;
    }

    setSubmitting(true);
    setError("");

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(API.SUBMIT_FEEDBACK, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit feedback");

      // Reset form
      setFormData({ subject: "", message: "", rating: 5 });
      setShowForm(false);
      setError("");
      // Refresh feedback list
      fetchFeedbacks();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending": return "#ffc107";
      case "Reviewed": return "#17a2b8";
      case "Resolved": return "#28a745";
      case "Archived": return "#6c757d";
      default: return "#6c757d";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Simple form-only view when coming from home footer
  if (openFormOnly) {
    return (
      <div className="feedback-form-only-page">
        <div className="feedback-container form-only">
          {error && !submitting && (
            <div className="error-message">{error}</div>
          )}

          <div className="feedback-form-card">
            <h3>Submit Feedback</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="subject">Subject *</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Enter feedback subject"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Describe your feedback, suggestions, or concerns..."
                  rows="5"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="rating">Rating</label>
                <select
                  id="rating"
                  name="rating"
                  value={formData.rating}
                  onChange={handleChange}
                >
                  <option value={5}>5 - Excellent</option>
                  <option value={4}>4 - Very Good</option>
                  <option value={3}>3 - Good</option>
                  <option value={2}>2 - Fair</option>
                  <option value={1}>1 - Poor</option>
                </select>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Full dashboard-style view (with sidebar and feedback history)
  return (
    <div className="dashboard-page">
      <ClientSidebar />
      <div className="feedback-container">
        <div className="feedback-header">
          <h2>My Feedback</h2>
          <button 
            className="submit-feedback-btn" 
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "+ Submit Feedback"}
          </button>
        </div>

        {error && !submitting && (
          <div className="error-message">{error}</div>
        )}

        {/* Feedback Form */}
        {showForm && (
          <div className="feedback-form-card">
            <h3>Submit New Feedback</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="subject">Subject *</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Enter feedback subject"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Describe your feedback, suggestions, or concerns..."
                  rows="5"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="rating">Rating</label>
                <select
                  id="rating"
                  name="rating"
                  value={formData.rating}
                  onChange={handleChange}
                >
                  <option value={5}>5 - Excellent</option>
                  <option value={4}>4 - Very Good</option>
                  <option value={3}>3 - Good</option>
                  <option value={2}>2 - Fair</option>
                  <option value={1}>1 - Poor</option>
                </select>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ subject: "", message: "", rating: 5 });
                    setError("");
                  }}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Feedback"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Feedback List */}
        {loading ? (
          <div className="loading-container">
            <p>Loading feedback...</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="no-feedback">
            <p>No feedback submitted yet.</p>
            <p>Click "Submit Feedback" to share your thoughts with us.</p>
          </div>
        ) : (
          <div className="feedbacks-list">
            {feedbacks.map((feedback) => (
              <div key={feedback.id} className="feedback-card">
                <div className="feedback-card-header">
                  <div className="feedback-subject-rating">
                    <h3>{feedback.subject}</h3>
                    <div className="rating-display">
                      {"⭐".repeat(feedback.rating)}
                    </div>
                  </div>
                  <div className="feedback-meta">
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(feedback.status) }}
                    >
                      {feedback.status}
                    </span>
                    <span className="feedback-date">
                      {formatDate(feedback.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="feedback-message">
                  <p>{feedback.message}</p>
                </div>

                {feedback.admin_response && (
                  <div className="admin-response">
                    <h4>Admin Response:</h4>
                    <p>{feedback.admin_response}</p>
                    {feedback.responded_at && (
                      <small>
                        Responded on: {formatDate(feedback.responded_at)}
                      </small>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientFeedback;

