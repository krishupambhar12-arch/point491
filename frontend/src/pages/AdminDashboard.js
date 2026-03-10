import React, { useState, useEffect, useCallback } from 'react';
import { API } from '../config/api';
import AdminSidebar from '../components/AdminSidebar';
import '../styles/adminDashboard.css';

const AdminDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAttorneys: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    completedAppointments: 0,
    expiredAppointments: 0,
    totalFeedback: 0
  });
  const [adminInfo, setAdminInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const handlePromoteToAdmin = async () => {
    setLoading(true);
    try {
      const response = await fetch(API.PROMOTE_TO_ADMIN, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: localStorage.getItem('email'),
          password: prompt('Enter your password to promote to admin:')
        })
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('role', 'Admin');
        localStorage.setItem('token', data.token);
        setMessage('Successfully promoted to admin! Refreshing...');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setMessage(data.message || 'Failed to promote to admin');
      }
    } catch (error) {
      setMessage('Error promoting to admin');
    }
    setLoading(false);
  };

  const fetchDashboardStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(API.ADMIN_DASHBOARD, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok) {
        console.log('Dashboard data received:', data); // Debug log        
        // Handle both formats: direct stats or wrapped in stats object
        if (data.totalUsers !== undefined) {
          // Backend returns stats directly
          setStats(data);
        } else if (data.stats) {
          // Backend returns stats wrapped in stats object
          setStats(data.stats);
        } else {
          // Set default empty stats if no data
          setStats({
            totalUsers: 0,
            totalAttorneys: 0,
            totalAppointments: 0,
            pendingAppointments: 0,
            confirmedAppointments: 0,
            completedAppointments: 0,
            expiredAppointments: 0,
            totalFeedback: 0
          });
        }
        setAdminInfo(data.admin || {});
        setAppointments(data.recentAppointments || []);
      } else {
        setMessage(data.message || 'Error fetching dashboard data');
        // Set default stats on error
        setStats({
          totalUsers: 0,
          totalAttorneys: 0,
          totalAppointments: 0,
          pendingAppointments: 0,
          confirmedAppointments: 0,
          completedAppointments: 0,
          expiredAppointments: 0,
          totalFeedback: 0
        });
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setMessage('Error connecting to server');
      // Set default stats on error
      setStats({
        totalUsers: 0,
        totalAttorneys: 0,
        totalAppointments: 0,
        pendingAppointments: 0,
        confirmedAppointments: 0,
        completedAppointments: 0,
        expiredAppointments: 0,
        totalFeedback: 0
      });
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) {
      setMessage('Please login to access admin dashboard');
      setLoading(false);
      return;
    }

    // If user is not admin, show promote option
    if (role !== 'Admin') {
      setMessage('Access denied. Admin privileges required. Click "Promote to Admin" if you want to upgrade your account.');
      setLoading(false);
      return;
    }

    fetchDashboardStats();
  }, [fetchDashboardStats]);

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
          <div className="message">
            {message}
            <button onClick={() => setMessage('')}>×</button>
          </div>
        )}

        {/* Show promote button if user is not admin */}
        {role !== 'Admin' && (
          <div className="promote-section">
            <p>You are logged in as a regular user. Promote your account to admin to access dashboard features.</p>
            <button 
              className="promote-btn" 
              onClick={handlePromoteToAdmin}
              disabled={loading}
            >
              {loading ? 'Promoting...' : 'Promote to Admin'}
            </button>
          </div>
        )}

        {loading && <div className="loading">Please wait, loading dashboard...</div>}

        <div className="admin-dashboard">
          <div className="dashboard-header">
            <h2>Admin Dashboard</h2>
            {adminInfo?.name && (
              <div className="admin-info">
                <p>Welcome, <strong>{adminInfo.name}</strong></p>
              </div>
            )}
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Clients</h3>
              <p className="stat-number">{stats.totalUsers || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Total Attorneys</h3>
              <p className="stat-number">{stats.totalAttorneys || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Total Appointments</h3>
              <p className="stat-number">{stats.totalAppointments || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Pending Appointments</h3>
              <p className="stat-number">{stats.pendingAppointments || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Confirmed Appointments</h3>
              <p className="stat-number">{stats.confirmedAppointments || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Completed Appointments</h3>
              <p className="stat-number">{stats.completedAppointments || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Expired Appointments</h3>
              <p className="stat-number">{stats.expiredAppointments || 0}</p>
            </div>
          </div>

          <div className="recent-appointments">
            <h3>Recent Appointments</h3>
            <div className="appointments-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Client</th>
                    <th>Attorney</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length > 0 ? appointments.map(appointment => (
                    <tr key={appointment.id}>
                      <td>{appointment.date || "N/A"}</td>
                      <td>{appointment.time || "N/A"}</td>
                      <td>{appointment.patient || "Unknown"}</td>
                      <td>{appointment.doctor || "Unknown"}</td>
                      <td>
                        <span
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(appointment.status) }}
                        >
                          {appointment.status}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center' }}>No appointments found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
