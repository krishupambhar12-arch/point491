import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";
import { API } from "../config/api";
import "../styles/bookLabTest.css";

const BookLabTest = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    notes: ""
  });
  const [message, setMessage] = useState("");

  const fetchTestDetails = useCallback(async () => {
    try {
      const res = await fetch(API.ALL_LAB_TESTS);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load test details");

      const testData = data.labTests?.find(t => t.id === testId || t._id === testId);
      if (testData) {
        setTest(testData);
      } else {
        setMessage("Lab test not found");
      }
    } catch (error) {
      console.error("Error fetching test details:", error);
      setMessage("Failed to load test details");
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      setMessage("Please login to book a lab test");
      setLoading(false);
      return;
    }

    // Check if user is a client (Patient/Client)
    const isClient = role === "Patient" || role === "Client";
    if (!isClient) {
      setMessage("Only clients can book lab tests");
      setLoading(false);
      return;
    }

    fetchTestDetails();
  }, [fetchTestDetails]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.date || !formData.time) {
      setMessage("Please select date and time");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Please login to book lab test");
        return;
      }

      const bookingData = {
        test_id: testId,
        date: formData.date,
        time: formData.time,
        notes: formData.notes
      };

      const res = await fetch(API.BOOK_LAB_TEST, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Lab test booked successfully!");
        setTimeout(() => {
          navigate("/patient/lab-tests");
        }, 2000);
      } else {
        setMessage(data.message || "Failed to book lab test");
      }
    } catch (error) {
      console.error("Error booking lab test:", error);
      setMessage("Failed to book lab test");
    }
  };

  // Generate time slots
  const timeSlots = [];
  for (let hour = 9; hour <= 17; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 17) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="loading-container">
          <p>Loading test details...</p>
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
          <p>Please login to book a lab test</p>
          <button onClick={() => navigate("/login")}>Go to Login</button>
          <button onClick={() => navigate("/lab-tests")}>Back to Lab Tests</button>
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
          <p>Only clients can book lab tests</p>
          <button onClick={() => navigate("/lab-tests")}>Back to Lab Tests</button>
        </div>
        <Footer />
      </>
    );
  }

  if (!test) {
    return (
      <>
        <Header />
        <div className="error-container">
          <p>{message || "Lab test not found"}</p>
          <button onClick={() => navigate("/lab-tests")}>Back to Lab Tests</button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="book-lab-test-container">
        <div className="book-lab-test-header">
          <h1>Book Lab Test</h1>
        </div>

        <div className="test-details-card">
          <h2>{test.test_name}</h2>
          {test.description && <p className="test-description">{test.description}</p>}
          <div className="test-price">
            <span>Price: ₹{test.price}</span>
          </div>
        </div>

        <form className="booking-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="date">Select Date *</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="time">Select Time *</label>
            <select
              id="time"
              name="time"
              value={formData.time}
              onChange={handleInputChange}
              required
            >
              <option value="">Select time</option>
              {timeSlots.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Additional Notes (Optional)</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="4"
              placeholder="Any special instructions or notes..."
            />
          </div>

          {message && (
            <div className={`message ${message.includes("successfully") ? "success" : "error"}`}>
              {message}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="submit-btn">
              Book Lab Test
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate("/lab-tests")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </>
  );
};

export default BookLabTest;
