// src/pages/AttorneyListing.js
import React, { useState, useEffect, useCallback } from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import { API } from "../config/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../styles/doctorListing.css";

const AttorneyListing = () => {
  const [attorneys, setAttorneys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [filteredAttorneys, setFilteredAttorneys] = useState([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const specialities = [
    "all", "Family Law", "Corporate Law", "Criminal Law",
    "Civil Litigation", "General Practice"
  ];

  const fetchAttorneys = useCallback(async () => {
    try {
      const res = await fetch(API.ALL_ATTORNEYS);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load attorneys");

      setAttorneys(data.attorneys || []);
    } catch (error) {
      console.error("Error fetching attorneys:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttorneys();

    // Handle URL parameters
    const urlSearch = searchParams.get('search');
    const urlSpecialization = searchParams.get('specialization');

    if (urlSearch) setSearchTerm(urlSearch);
    if (urlSpecialization) setSelectedSpecialty(urlSpecialization);
  }, [searchParams, fetchAttorneys]);

  useEffect(() => {
    // Filter attorneys based on search and specialty
    let filtered = attorneys;

    if (selectedSpecialty !== "all") {
      filtered = filtered.filter(doctor =>
        doctor.specialization?.toLowerCase().includes(selectedSpecialty.toLowerCase())
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(doctor =>
        doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.qualification?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAttorneys(filtered);
  }, [attorneys, searchTerm, selectedSpecialty]);

  const handleBookAppointment = (attorneyId) => {
    // Check if user is logged in and is a client
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      alert("Please login to book an appointment");
      navigate("/login");
      return;
    }

    const isClient = role === "Client";
    if (!isClient) {
      alert("Only clients can book appointments");
      return;
    }

    // Navigate to appointment booking page with attorney ID
    navigate(`/book-appointment/${attorneyId}`);
  };

  const handleViewProfile = (attorneyId) => {
    // Navigate to attorney profile page with ID
    navigate(`/attorney-profile/${attorneyId}`);
  };

  const BACKEND_URL = "http://localhost:5000";

  return (
    <>
      <Header />

      <div className="doctor-listing-container">
        {/* Search and Filter Section */}
        <div className="search-filter-section">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search attorneys by name, specialization, or qualification..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="search-btn">Search</button>
          </div>

          <div className="filter-section">
            <label>Filter by Speciality:</label>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
            >
              {specialities.map(specialty => (
                <option key={specialty} value={specialty}>
                  {specialty === "all" ? "All Specialities" : specialty}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="results-info">
          <h2>Available Attorneys</h2>
          <p>{filteredAttorneys.length} attorney{filteredAttorneys.length !== 1 ? 's' : ''} found</p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="loading">
            <p>Loading attorneys...</p>
          </div>
        ) : (
          /* Attorneys Grid */
          <div className="doctors-grid">
                {filteredAttorneys.length === 0 ? (
              <div className="no-results">
                <p>No attorneys found matching your criteria.</p>
                <button onClick={() => {
                  setSearchTerm("");
                  setSelectedSpecialty("all");
                }}>Clear Filters</button>
              </div>
            ) : (
              filteredAttorneys.map((attorney) => (
                <div key={attorney.id} className="doctor-card">
                  <div className="doctor-image">
                    <img
                      src={
                        attorney.profile_pic 
                          ? `${BACKEND_URL}/${attorney.profile_pic}`
                          : `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='60' fill='%23e0e0e0'/%3E%3Ctext x='60' y='60' text-anchor='middle' dy='.3em' font-family='Arial' font-size='40' fill='%23999'%3E${attorney.name ? attorney.name.charAt(0).toUpperCase() : 'A'}%3C/text%3E%3C/svg%3E`
                      }
                      alt={attorney.name}
                      onError={(e) => {
                        // Fallback to initial avatar if image fails to load
                        e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='60' fill='%23e0e0e0'/%3E%3Ctext x='60' y='60' text-anchor='middle' dy='.3em' font-family='Arial' font-size='40' fill='%23999'%3E${attorney.name ? attorney.name.charAt(0).toUpperCase() : 'A'}%3C/text%3E%3C/svg%3E`;
                      }}
                    />
                  </div>

                  <div className="doctor-info">
                    <h3>{attorney.name}</h3>
                    <p className="specialization">{attorney.specialization}</p>
                    <p className="qualification">{attorney.qualification}</p>
                    <p className="experience">{attorney.experience} years experience</p>
                    <p className="fees">₹{attorney.fees} consultation fee</p>
                    {attorney.phone && <p className="phone">📞 {attorney.phone}</p>}

                    <div className="rating">
                      <span>⭐ {attorney.rating}</span>
                      <span className="available">Available</span>
                    </div>
                  </div>

                  <div className="doctor-actions">
                    <button
                      className="book-appointment-btn"
                      onClick={() => handleBookAppointment(attorney.id)}
                    >
                      Book Appointment
                    </button>
                    <button
                      className="view-profile-btn"
                      onClick={() => handleViewProfile(attorney.id)}
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
};

export default AttorneyListing;
