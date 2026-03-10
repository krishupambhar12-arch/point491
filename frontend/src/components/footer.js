import React from "react";
import { Link } from "react-router-dom";
import "./footer.css";

const Footer = () => {
  return (
    <footer className="site-footer">
      <p>© 2025 Justice Point. All rights reserved.</p>
      <div className="footer-links">
        <span className="footer-text">Privacy Policy</span>
        <span className="footer-text">Terms & Conditions</span>
        <Link
          to="/patient/feedback"
          state={{ openFormOnly: true }}
          className="footer-text footer-link"
        >
          Feedback
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
