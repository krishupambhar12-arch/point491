import React, { useState, useEffect, useCallback } from 'react';
import { API } from '../config/api';
import AdminSidebar from '../components/AdminSidebar';
import '../styles/adminAppointments.css';




const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showBookModal, setShowBookModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [actionLoading, setActionLoading] = useState({
    updating: null,
    deleting: null,
    creating: false,
    markingExpired: false
  });
  const [formData, setFormData] = useState({
    user_id: '',
    doctor_id: '',
    date: '',
    time: '',
    symptoms: '',
    notes: '',
    status: 'Confirmed'
  });
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [selectedPatientName, setSelectedPatientName] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchAppointments();
    fetchUsers();
    fetchDoctors();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPatientDropdown && !event.target.closest('.patient-search-container')) {
        setShowPatientDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPatientDropdown]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(API.ADMIN_USERS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users || []);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await fetch(API.ALL_DOCTORS);
      const data = await response.json();
      if (response.ok) {
        setDoctors(data.doctors || []);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(API.ADMIN_APPOINTMENTS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok) {
        console.log('Fetched appointments data:', data); // Debug log
        setAppointments(data.appointments || []);
      } else {
        setMessage(data.message || 'Error fetching appointments');
      }
    } catch (error) {
      setMessage('Error connecting to server');
    }
    setLoading(false);
  }, [token]);

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    setActionLoading(prev => ({ ...prev, updating: appointmentId }));
    try {
      const response = await fetch(`${API.ADMIN_UPDATE_APPOINTMENT_STATUS}/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Appointment status updated successfully');
        fetchAppointments(); // Refresh the list
      } else {
        setMessage(data.message || 'Error updating appointment status');
      }
    } catch (error) {
      setMessage('Error connecting to server');
    } finally {
      setActionLoading(prev => ({ ...prev, updating: null }));
    }
  };

  const deleteAppointment = async (appointmentId) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      setActionLoading(prev => ({ ...prev, deleting: appointmentId }));
      try {
        const response = await fetch(`${API.ADMIN_DELETE_APPOINTMENT}/${appointmentId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        if (response.ok) {
          setMessage('Appointment deleted successfully');
          fetchAppointments(); // Refresh the list
        } else {
          setMessage(data.message || 'Error deleting appointment');
        }
      } catch (error) {
        setMessage('Error connecting to server');
      } finally {
        setActionLoading(prev => ({ ...prev, deleting: null }));
      }
    }
  };

  const markExpiredAppointments = async () => {
    setActionLoading(prev => ({ ...prev, markingExpired: true }));
    try {
      const response = await fetch(API.ADMIN_MARK_EXPIRED, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        fetchAppointments(); // Refresh the list
      } else {
        setMessage(data.message || 'Error marking expired appointments');
      }
    } catch (error) {
      setMessage('Error connecting to server');
    } finally {
      setActionLoading(prev => ({ ...prev, markingExpired: false }));
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePatientSearch = (e) => {
    const value = e.target.value;
    setPatientSearch(value);
    setShowPatientDropdown(true);
    
    // If user is typing manually, allow custom name
    if (value && !users.find(u => u.name.toLowerCase() === value.toLowerCase())) {
      setSelectedPatientName(value);
      setFormData(prev => ({ ...prev, user_id: '' }));
    }
  };

  const handlePatientSelect = (user) => {
    setFormData(prev => ({ ...prev, user_id: user.id }));
    setSelectedPatientName(user.name);
    setPatientSearch(user.name);
    setShowPatientDropdown(false);
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    
    if ((!formData.user_id && !patientSearch) || !formData.doctor_id || !formData.date || !formData.time) {
      setMessage('Please fill all required fields');
      return;
    }

    // If custom name is used without user_id, we need to handle it differently
    // For now, we'll require a user_id. If you want to allow custom names,
    // you'll need backend support for that.
    if (!formData.user_id) {
      setMessage('Please select a patient from the list');
      return;
    }

    setActionLoading(prev => ({ ...prev, creating: true }));
    try {
      const response = await fetch(API.ADMIN_BOOK_APPOINTMENT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      if (response.ok) {
        setMessage('Appointment booked successfully');
        setShowBookModal(false);
        setFormData({
          user_id: '',
          doctor_id: '',
          date: '',
          time: '',
          symptoms: '',
          notes: '',
          status: 'Confirmed'
        });
        setPatientSearch('');
        setSelectedPatientName('');
        setShowPatientDropdown(false);
        fetchAppointments(); // Refresh the list
      } else {
        setMessage(data.message || 'Error booking appointment');
      }
    } catch (error) {
      setMessage('Error connecting to server');
    } finally {
      setActionLoading(prev => ({ ...prev, creating: false }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#ffc107';
      case 'Confirmed': return '#28a745';
      case 'Completed': return '#007bff';
      case 'Cancelled': return '#dc3545';
      case 'Rejected': return '#6c757d';
      case 'Expired': return '#6c757d';
      default: return '#6c757d';
    }
  };

  return (
    <div className="dashboard-page">
      <AdminSidebar />
      <div className="dashboard-content">
        {message && (
          <div className={`message ${message.includes('successfully') ? 'success' : message.includes('Error') ? 'error' : 'info'}`}>
            {message}
            <button onClick={() => setMessage('')}>×</button>
          </div>
        )}

        {loading && <div className="loading">Please wait, loading appointments...</div>}

        <div className="admin-appointments">
          <div className="appointments-header">
            <h2>Manage Appointments</h2>
            <div className="header-buttons">
              {/* <button 
                onClick={() => setShowBookModal(true)}
                className="add-appointment-btn"
              >
                + Add Appointment
              </button> */}
            <button 
              onClick={markExpiredAppointments}
              className="mark-expired-btn"
              disabled={actionLoading.markingExpired}
            >
              {actionLoading.markingExpired ? 'Please wait...' : 'Mark Expired Appointments'}
            </button>
            </div>
          </div>
          <div className="appointments-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Client</th>
                  <th>Attorney</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments && appointments.length > 0 ? appointments.map(appointment => (
                  <tr key={appointment.id}>
                    <td>{appointment.date}</td>
                    <td>{appointment.time}</td>
                    <td>
                      <div>
                        <strong>{appointment.patient.name}</strong>
                        <br />
                        <small>{appointment.patient.email}</small>
                        <br />
                        <small>{appointment.patient.phone}</small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{appointment.doctor?.name || 'Unknown Attorney'}</strong>
                        <br />
                        <small>{appointment.doctor?.specialization || 'No specialization'}</small>
                        {appointment.doctor?.email && (
                          <>
                            <br />
                            <small>{appointment.doctor.email}</small>
                          </>
                        )}
                        {appointment.doctor?.phone && (
                          <>
                            <br />
                            <small>{appointment.doctor.phone}</small>
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      <select 
                        value={appointment.status}
                        onChange={(e) => updateAppointmentStatus(appointment.id, e.target.value)}
                        className="status-select"
                        disabled={actionLoading.updating === appointment.id}
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
                      <button 
                        onClick={() => deleteAppointment(appointment.id)}
                        className="delete-btn"
                        disabled={actionLoading.deleting === appointment.id}
                      >
                        {actionLoading.deleting === appointment.id ? 'Please wait...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="no-appointments">No appointments found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Appointment Modal */}
        {showBookModal && (
          <div className="modal-overlay" onClick={() => setShowBookModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add New Appointment</h3>
                <button 
                  className="modal-close-btn"
                  onClick={() => {
                    setShowBookModal(false);
                    setFormData({
                      user_id: '',
                      doctor_id: '',
                      date: '',
                      time: '',
                      symptoms: '',
                      notes: '',
                      status: 'Confirmed'
                    });
                    setPatientSearch('');
                    setSelectedPatientName('');
                    setShowPatientDropdown(false);
                    setMessage('');
                  }}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleBookAppointment} className="appointment-form-modal">
                <div className="form-group">
                  <label htmlFor="patient_search">Client *</label>
                  <div className="patient-search-container">
                    <input
                      type="text"
                      id="patient_search"
                      name="patient_search"
                      value={patientSearch}
                      onChange={handlePatientSearch}
                      onFocus={() => setShowPatientDropdown(true)}
                      placeholder="Search client or type name..."
                      className="patient-search-input"
                      required
                    />
                    {showPatientDropdown && patientSearch && filteredUsers.length > 0 && (
                      <div className="patient-dropdown">
                        {filteredUsers.map(user => (
                          <div
                            key={user.id}
                            className="patient-option"
                            onClick={() => handlePatientSelect(user)}
                          >
                            <div className="patient-option-name">{user.name}</div>
                            <div className="patient-option-email">{user.email}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {showPatientDropdown && patientSearch && filteredUsers.length === 0 && (
                      <div className="patient-dropdown">
                        <div className="patient-option no-results">
                          No client found. You can use "{patientSearch}" as client name.
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedPatientName && !formData.user_id && (
                    <small className="custom-patient-note">
                      Using custom client name: <strong>{selectedPatientName}</strong>
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="doctor_id">Attorney *</label>
                  <select
                    id="doctor_id"
                    name="doctor_id"
                    value={formData.doctor_id}
                    onChange={handleInputChange}
                    required
                    >
                    <option value="">Select Attorney</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.name} - {doctor.specialization}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="date">Date *</label>
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
                  <label htmlFor="time">Time *</label>
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

                <div className="form-group">
                  <label htmlFor="status">Status *</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="symptoms">Symptoms (Optional)</label>
                  <textarea
                    id="symptoms"
                    name="symptoms"
                    value={formData.symptoms}
                    onChange={handleInputChange}
                    placeholder="Describe symptoms..."
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Notes (Optional)</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Additional notes..."
                    rows="3"
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowBookModal(false);
                      setFormData({
                        user_id: '',
                        doctor_id: '',
                        date: '',
                        time: '',
                        symptoms: '',
                        notes: '',
                        status: 'Confirmed'
                      });
                      setPatientSearch('');
                      setSelectedPatientName('');
                      setShowPatientDropdown(false);
                      setMessage('');
                    }}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={actionLoading.creating}
                  >
                    {actionLoading.creating ? 'Please wait, creating...' : 'Create Appointment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAppointments;
