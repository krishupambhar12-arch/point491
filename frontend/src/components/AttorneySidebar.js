import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBalanceScale } from "react-icons/fa";
import "./doctorSidebar.css";
import "../utils/apiInterceptor"; // Import global API interceptor

const AttorneySidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
    }
  };

  return (
    <div className="doctor-sidebar">
      <div className="logo">
        <div className="logo-container" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
          <FaBalanceScale className="logo-icon" />
          <div className="logo-text-container">
            <span className="logo-text-main">Justice</span>
            <span className="logo-text-sub">Point</span>
          </div>
        </div>
        <h3 className="panel-text">Attorney Panel</h3>
      </div>
      <ul className="menu">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/attorney/dashboard">Dashboard</Link></li>
        <li><Link to="/attorney/profile">Profile</Link></li>
        <li><Link to="/attorney/appointments">Appointments</Link></li>
        <li className="hidden-item"><Link to="/attorney/consultation">Consultations</Link></li>
        <li><button onClick={handleLogout} className="logout-btn">Logout</button></li>
      </ul>
    </div>
  );
};

export default AttorneySidebar;


