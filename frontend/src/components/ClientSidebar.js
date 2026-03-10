import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaBalanceScale } from "react-icons/fa";
import "./patientSidebar.css";

const ClientSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
    }
  };

  return (
    <div className="patient-sidebar">
      <div className="sidebar-menu">
        <div className="logo">
          <div className="logo-container" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
            <FaBalanceScale className="logo-icon" />
            <div className="logo-text-container">
              <span className="logo-text-main">Justice</span>
              <span className="logo-text-sub">Point</span>
            </div>
          </div>
          <h3 className="panel-text">Client Panel</h3>
        </div>
        <ul>
          <li>
            <NavLink 
              to="/" 
              className={({ isActive }) => isActive ? "active" : ""}
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/client/dashboard" 
              className={({ isActive }) => isActive ? "active" : ""}
            >
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/client/profile" 
              className={({ isActive }) => isActive ? "active" : ""}
            >
              Profile
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/client/appointments" 
              className={({ isActive }) => isActive ? "active" : ""}
            >
              Appointments
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/client/lab-tests" 
              className={({ isActive }) => isActive ? "active" : ""}
            >
              Lab Tests
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/client/consultation" 
              className={({ isActive }) => isActive ? "active" : ""}
            >
              Online Consultation
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/client/feedback" 
              className={({ isActive }) => isActive ? "active" : ""}
            >
              Feedback
            </NavLink>
          </li>
        </ul>

        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};

export default ClientSidebar;

