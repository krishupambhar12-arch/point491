import React, { useState, useEffect } from "react";
import { API } from "../config/api";
import "../styles/patientLabTests.css";
import ClientSidebar from "../components/ClientSidebar";

const ClientLabTests = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const fetchBookings = async () => {
      try {
        const res = await fetch(API.CLIENT_LAB_TEST_BOOKINGS, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load lab test bookings");

        setBookings(data.bookings || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  return (
    <div className="dashboard-page">
      <ClientSidebar />
      <div className="lab-tests-container">
        <h2>My Lab Test Bookings</h2>

        {loading ? (
          <div className="loading-container">
            <p>Loading lab test bookings...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>{error}</p>
          </div>
        ) : bookings.length === 0 ? (
          <p className="no-bookings">No lab test bookings found.</p>
        ) : (
          <table className="bookings-table">
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.test_name}</td>
                  <td>{booking.date}</td>
                  <td>{booking.time}</td>
                  <td className={`status status-${booking.status.toLowerCase()}`}>
                    {booking.status}
                  </td>
                  <td>₹{booking.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ClientLabTests;
