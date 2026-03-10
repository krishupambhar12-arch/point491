import React, { useEffect, useState } from "react";
import ClientSidebar from "../components/ClientSidebar";
import { API } from "../config/api";
import "../styles/patientDashboard.css";

const ClientDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clientName, setClientName] = useState("Client");
  const [totalVisits, setTotalVisits] = useState(0);
  const [upcomingAppointments, setUpcomingAppointments] = useState(0);
  const [totalBills, setTotalBills] = useState(0);
  const [recentAppointments, setRecentAppointments] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const userEmail = localStorage.getItem("email");
    
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    // Set user name from localStorage if available
    const savedName = localStorage.getItem("name");
    if (savedName) {
      setClientName(savedName);
    } else if (userEmail) {
      // Extract name from email or use a default
      const nameFromEmail = userEmail.split('@')[0];
      setClientName(nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1));
    }

    const fetchDashboard = async () => {
      try {
        const res = await fetch(API.CLIENT_DASHBOARD, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Check if response is JSON
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await res.text();
          console.error('Received non-JSON response:', text);
          throw new Error('Server error. Please try again later.');
        }
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load");

        console.log("Dashboard data received:", data); // Debug log

        // Update user name if available from API
        if (data?.user?.name) {
          setClientName(data.user.name);
        }
        
        setTotalVisits(data?.stats?.totalVisits || 0);
        setUpcomingAppointments(data?.stats?.upcomingAppointments || 0);
        setTotalBills(data?.stats?.totalBills || 0);
        setRecentAppointments(data?.recentAppointments || []);
      } catch (e) {
        console.error("Dashboard error:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return (
    <div className="patient-dashboard-page">
      <ClientSidebar />
      <div className="patient-dashboard-content">
        <div className="patient-dashboard-header">
          {loading ? (
            <>
              <h1>Loading dashboard…</h1>
              <p>Please wait</p>
            </>
          ) : error ? (
            <>
              <h1>Welcome</h1>
              <p style={{ opacity: 0.9 }}>{error}</p>
            </>
          ) : (
            <>
              <h1>Welcome {clientName} 👋</h1>
              <p>
                You have {upcomingAppointments} upcoming appointment
                {upcomingAppointments !== 1 ? "s" : ""}.
              </p>
            </>
          )}
        </div>

        <div className="patient-stats-cards">
          <div className="patient-card">
            <h2>Total Visits</h2>
            <p>{totalVisits}</p>
          </div>
          <div className="patient-card">
            <h2>Upcoming Appointments</h2>
            <p>{upcomingAppointments}</p>
          </div>
          <div className="patient-card">
            <h2>Total Bills</h2>
            <p>₹{totalBills.toLocaleString()}</p>
          </div>
        </div>

        {/* Recent Appointments Section */}
        {recentAppointments.length > 0 && (
          <div className="recent-appointments-section">
            <h2>Recent Appointments</h2>
            <div className="appointments-list">
              {recentAppointments.map((appointment) => (
                <div key={appointment.id} className="appointment-item">
                  <div className="appointment-date">
                    <span className="date">{appointment.date}</span>
                    <span className="time">{appointment.time}</span>
                  </div>
                  <div className="appointment-details">
                    <span className="specialization">{appointment.specialization}</span>
                    <span className={`status status-${appointment.status.toLowerCase()}`}>
                      {appointment.status}
                    </span>
                  </div>
                  <div className="appointment-fees">
                    ₹{appointment.fees}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;
