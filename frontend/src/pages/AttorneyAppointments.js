// src/pages/AttorneyAppointments.js
import React, { useEffect, useState } from "react";
import Sidebar from "../components/AttorneySidebar";
import "../styles/doctorAppointments.css";
import { API } from "../config/api";

const AttorneyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState({
    updating: null
  });

  const fetchAppointments = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(API.ATTORNEY_APPOINTMENTS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load appointments");

      setAppointments(data.appointments || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    setActionLoading(prev => ({ ...prev, updating: appointmentId }));
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API.ATTORNEY_UPDATE_APPOINTMENT_STATUS}/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (response.ok) {
        // Refresh the appointments list
        fetchAppointments();
      } else {
        console.error('Error updating appointment status:', data.message);
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, updating: null }));
    }
  };

  return (
    <div className="appointments-page">
      <Sidebar />
      <div className="appointments-content">
        <h1>Appointments</h1>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>Loading appointments...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
            <p>{error}</p>
          </div>
        ) : appointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>No appointments found.</p>
          </div>
        ) : (
          <table className="appointments-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Client Details</th>
                <th>Date & Time</th>
                <th>Subject</th>
                <th>Purpose</th>
                <th>Case Summary</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => (
                <tr key={appt.id}>
                  <td>{appt.id}</td>
                  <td>
                    <div style={{ maxWidth: '200px' }}>
                      <strong>{appt.patient?.name || appt.client || 'Unknown Client'}</strong>
                      <br />
                      <small>{appt.patient?.email || appt.clientEmail || ''}</small>
                      <br />
                      <small>{appt.patient?.phone || appt.clientPhone || ''}</small>
                    </div>
                  </td>
                  <td>
                    <div>
                      <strong>{appt.date}</strong>
                      <br />
                      <small>{appt.time}</small>
                    </div>
                  </td>
                  <td>
                    <div style={{ maxWidth: '150px' }}>
                      <small>{appt.subject || 'N/A'}</small>
                    </div>
                  </td>
                  <td>
                    <div style={{ maxWidth: '120px' }}>
                      <small>{appt.purpose || 'N/A'}</small>
                    </div>
                  </td>
                  <td>
                    <div style={{ maxWidth: '200px' }}>
                      <small>{appt.caseSummary ? `${appt.caseSummary.substring(0, 50)}...` : 'N/A'}</small>
                    </div>
                  </td>
                  <td className={`status ${appt.status.toLowerCase()}`}>
                    {appt.status}
                  </td>
                  <td>
                    <select 
                      value={appt.status}
                      onChange={(e) => updateAppointmentStatus(appt.id, e.target.value)}
                      className="status-select"
                      disabled={actionLoading.updating === appt.id}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AttorneyAppointments;
