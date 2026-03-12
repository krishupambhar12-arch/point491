// src/pages/AttorneyAppointments.js
import React, { useEffect, useState } from "react";
import Sidebar from "../components/AttorneySidebar";
import "../styles/doctorAppointments.css";
import { API } from "../config/api";

const AttorneyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [actionLoading, setActionLoading] = useState({
    updating: null,
    deleting: null
  });
  const [viewAppointment, setViewAppointment] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

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
    setSuccessMessage("");
    setError("");
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
        setSuccessMessage(`Appointment status updated to ${newStatus}`);
        fetchAppointments();
      } else {
        setError(data.message || 'Error updating appointment status');
      }
    } catch (error) {
      setError('Error updating appointment status: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, updating: null }));
    }
  };

  const deleteAppointment = async (appointmentId) => {
    setActionLoading(prev => ({ ...prev, deleting: appointmentId }));
    setSuccessMessage("");
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API.ATTORNEY_UPDATE_APPOINTMENT_STATUS}/${appointmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMessage("Appointment deleted successfully");
        setShowDeleteConfirm(null);
        fetchAppointments();
      } else {
        setError(data.message || 'Error deleting appointment');
      }
    } catch (error) {
      setError('Error deleting appointment: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, deleting: null }));
    }
  };

  const getStatusClass = (status) => {
    const statusLower = status?.toLowerCase() || 'pending';
    return `status ${statusLower}`;
  };

  return (
    <div className="appointments-page">
      <Sidebar />
      <div className="appointments-content">
        <h1>Appointments</h1>

        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            <p>Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="empty-container">
            <p>No appointments found.</p>
          </div>
        ) : (
          <table className="appointments-table">
            <thead>
              <tr>
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
                  <td>
                    <div className="client-info">
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
                    <div className="truncate-cell">
                      <small>{appt.subject || 'N/A'}</small>
                    </div>
                  </td>
                  <td>
                    <div className="truncate-cell">
                      <small>{appt.purpose || 'N/A'}</small>
                    </div>
                  </td>
                  <td>
                    <div className="truncate-cell">
                      <small>{appt.caseSummary ? `${appt.caseSummary.substring(0, 50)}...` : 'N/A'}</small>
                    </div>
                  </td>
                  <td>
                    <select 
                      value={appt.status}
                      onChange={(e) => updateAppointmentStatus(appt.id, e.target.value)}
                      className={`status-select status-${appt.status?.toLowerCase()}`}
                      disabled={actionLoading.updating === appt.id}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Expired">Expired</option>
                    </select>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-view"
                        onClick={() => setViewAppointment(appt)}
                        title="View Details"
                      >
                        👁️ View
                      </button>
                      <button 
                        className="btn-delete"
                        onClick={() => setShowDeleteConfirm(appt.id)}
                        disabled={actionLoading.deleting === appt.id}
                        title="Delete Appointment"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* View Modal */}
        {viewAppointment && (
          <div className="modal-overlay" onClick={() => setViewAppointment(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Appointment Details</h2>
                <button className="modal-close" onClick={() => setViewAppointment(null)}>×</button>
              </div>
              <div className="modal-body">
                <div className="detail-row">
                  <label>Client Name:</label>
                  <span>{viewAppointment.patient?.name || viewAppointment.client || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <label>Email:</label>
                  <span>{viewAppointment.patient?.email || viewAppointment.clientEmail || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <label>Phone:</label>
                  <span>{viewAppointment.patient?.phone || viewAppointment.clientPhone || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <label>Date:</label>
                  <span>{viewAppointment.date}</span>
                </div>
                <div className="detail-row">
                  <label>Time:</label>
                  <span>{viewAppointment.time}</span>
                </div>
                <div className="detail-row">
                  <label>Status:</label>
                  <span className={`status ${viewAppointment.status?.toLowerCase()}`}>{viewAppointment.status}</span>
                </div>
                <div className="detail-row">
                  <label>Subject:</label>
                  <span>{viewAppointment.subject || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <label>Purpose:</label>
                  <span>{viewAppointment.purpose || 'N/A'}</span>
                </div>
                <div className="detail-row full-width">
                  <label>Case Summary:</label>
                  <span>{viewAppointment.caseSummary || 'N/A'}</span>
                </div>
                <div className="detail-row full-width">
                  <label>Documents:</label>
                  <span>{viewAppointment.documents || 'N/A'}</span>
                </div>
                <div className="detail-row full-width">
                  <label>Desired Outcome:</label>
                  <span>{viewAppointment.desiredOutcome || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <label>Attorney Fees:</label>
                  <span>₹{viewAppointment.attorneyFees || 'N/A'}</span>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-close" onClick={() => setViewAppointment(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
            <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Confirm Delete</h2>
                <button className="modal-close" onClick={() => setShowDeleteConfirm(null)}>×</button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this appointment?</p>
                <p className="warning-text">This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
                <button 
                  className="btn-confirm-delete"
                  onClick={() => deleteAppointment(showDeleteConfirm)}
                  disabled={actionLoading.deleting === showDeleteConfirm}
                >
                  {actionLoading.deleting === showDeleteConfirm ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttorneyAppointments;
