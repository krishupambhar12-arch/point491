// src/components/Header.js
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUserCircle, FaBalanceScale } from "react-icons/fa"; // dashboard icon and justice scale icon
import "./header.css";

const Header = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const goToDashboard = () => {
    const isClient = role === "Client";

    if (isClient) {
      navigate("/client/dashboard");
    } else {
      navigate("/"); // fallback to home
    }
  };

  return (
    <header className="site-header">
      <div className="logo">
        <Link to="/" className="logo-container">
          <FaBalanceScale className="logo-icon" />
          <div className="logo-text-container">
            <span className="logo-text-main">Justice</span>
            <span className="logo-text-sub">Point</span>
          </div>
        </Link>
      </div>
      <nav>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/services">Services</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/contact">Contact</Link></li>
      </nav>

      <div className="header-actions">
        <Link to="/login" className="login-btn">Login </Link>

        {role && (
          <FaUserCircle
            className="dashboard-icon"
            onClick={goToDashboard}
          />
        )}
      </div>
    </header>
  );
};

export default Header;
