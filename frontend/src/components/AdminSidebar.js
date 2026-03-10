import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBalanceScale } from 'react-icons/fa';
import './adminSidebar.css';

const AdminSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Show confirmation dialog
    if (window.confirm("Are you sure you want to logout?")) {
      // Clear local storage
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
      
      // Redirect to home page
      navigate("/");
    }
  };

  return (
    <div className="admin-sidebar">
      <div className="logo">
        <div className="logo-container" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
          <FaBalanceScale className="logo-icon" />
          <div className="logo-text-container">
            <span className="logo-text-main">Justice</span>
            <span className="logo-text-sub">Point</span>
          </div>
        </div>
        <h3 className="panel-text">Admin Panel</h3>
      </div>
      <ul className="menu">
        <li><Link to="/admin/dashboard">Dashboard</Link></li>
        <li><Link to="/admin/appointments">Appointments</Link></li>
        <li><Link to="/admin/users">Clients</Link></li>
        <li><Link to="/admin/doctors">Attorneys</Link></li>
        <li><Link to="/admin/services">Services</Link></li>
        <li className="hidden-item"><Link to="/admin/lab-test-bookings">Lab Test Bookings</Link></li>
        <li className="hidden-item"><Link to="/admin/consultations">Consultations</Link></li>
        <li><Link to="/admin/feedback">Feedback</Link></li>
        <li><button onClick={handleLogout} className="logout-btn">Logout</button></li>
      </ul>
    </div>
  );
};

export default AdminSidebar;
