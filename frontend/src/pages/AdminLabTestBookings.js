import React, { useState, useEffect, useCallback } from 'react';
import { API } from '../config/api';
import AdminSidebar from '../components/AdminSidebar';
import '../styles/adminLabTestBookings.css';

const AdminLabTestBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [actionLoading, setActionLoading] = useState({
    updating: null,
    deleting: null
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(API.ADMIN_LAB_TEST_BOOKINGS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok) {
        setBookings(data.bookings || []);
      } else {
        setMessage(data.message || 'Error fetching lab test bookings');
      }
    } catch (error) {
      setMessage('Error connecting to server');
    }
    setLoading(false);
  }, [token]);

  const updateBookingStatus = async (bookingId, newStatus) => {
    setActionLoading(prev => ({ ...prev, updating: bookingId }));
    try {
      const response = await fetch(`${API.ADMIN_UPDATE_LAB_TEST_BOOKING_STATUS}/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Lab test booking status updated successfully');
        fetchBookings(); // Refresh the list
      } else {
        setMessage(data.message || 'Error updating lab test booking status');
      }
    } catch (error) {
      setMessage('Error connecting to server');
    } finally {
      setActionLoading(prev => ({ ...prev, updating: null }));
    }
  };

  const deleteBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to delete this lab test booking?')) {
      setActionLoading(prev => ({ ...prev, deleting: bookingId }));
      try {
        const response = await fetch(`${API.ADMIN_DELETE_LAB_TEST_BOOKING}/${bookingId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        if (response.ok) {
          setMessage('Lab test booking deleted successfully');
          fetchBookings(); // Refresh the list
        } else {
          setMessage(data.message || 'Error deleting lab test booking');
        }
      } catch (error) {
        setMessage('Error connecting to server');
      } finally {
        setActionLoading(prev => ({ ...prev, deleting: null }));
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#ffc107';
      case 'Confirmed': return '#28a745';
      case 'Completed': return '#007bff';
      case 'Cancelled': return '#dc3545';
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

        {loading && <div className="loading">Please wait, loading lab test bookings...</div>}

        <div className="admin-lab-test-bookings">
          <div className="bookings-header">
            <h2>Lab Test Bookings</h2>
          </div>
          <div className="bookings-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Patient</th>
                  <th>Test Name</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings && bookings.length > 0 ? bookings.map(booking => (
                  <tr key={booking.id}>
                    <td>{booking.date}</td>
                    <td>{booking.time}</td>
                    <td>
                      <div>
                        <strong>{booking.patient.name}</strong>
                        <br />
                        <small>{booking.patient.email}</small>
                        <br />
                        <small>{booking.patient.phone}</small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{booking.test.test_name}</strong>
                        {booking.test.description && (
                          <>
                            <br />
                            <small>{booking.test.description}</small>
                          </>
                        )}
                      </div>
                    </td>
                    <td>₹{booking.test.price}</td>
                    <td>
                      <select 
                        value={booking.status}
                        onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                        className="status-select"
                        style={{ 
                          backgroundColor: getStatusColor(booking.status),
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                        disabled={actionLoading.updating === booking.id}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Expired">Expired</option>
                      </select>
                    </td>
                    <td>
                      <button 
                        onClick={() => deleteBooking(booking.id)}
                        className="delete-btn"
                        disabled={actionLoading.deleting === booking.id}
                      >
                        {actionLoading.deleting === booking.id ? 'Please wait...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="no-bookings">No lab test bookings found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLabTestBookings;
