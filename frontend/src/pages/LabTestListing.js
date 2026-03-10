import React, { useState, useEffect, useCallback } from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import { API } from "../config/api";
import { useNavigate } from "react-router-dom";
import "../styles/labTestListing.css";

const LabTestListing = () => {
  const [labTests, setLabTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTests, setFilteredTests] = useState([]);
  const navigate = useNavigate();

  const fetchLabTests = useCallback(async () => {
    try {
      const res = await fetch(API.ALL_LAB_TESTS);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load lab tests");

      setLabTests(data.labTests || []);
    } catch (error) {
      console.error("Error fetching lab tests:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLabTests();
  }, [fetchLabTests]);

  useEffect(() => {
    // Filter tests based on search
    let filtered = labTests;

    if (searchTerm) {
      filtered = filtered.filter(test =>
        test.test_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTests(filtered);
  }, [labTests, searchTerm]);

  const handleBookTest = (testId) => {
    // Check if user is logged in and is a client (Patient/Client)
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      alert("Please login to book a lab test");
      navigate("/login");
      return;
    }

    const isClient = role === "Patient" || role === "Client";
    if (!isClient) {
      alert("Only clients can book lab tests");
      return;
    }

    // Navigate to lab test booking page with test ID
    navigate(`/book-lab-test/${testId}`);
  };

  return (
    <>
      <Header />

      <div className="lab-test-listing-container">
        <div className="lab-test-header">
          <h1>Available Lab Tests</h1>
          <p>Book your lab tests online with ease</p>
        </div>

        {/* Search Bar */}
        <div className="search-section">
          <input
            type="text"
            placeholder="Search lab tests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {loading ? (
          <div className="loading-container">
            <p>Loading lab tests...</p>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="no-results">
            <p>No lab tests found</p>
          </div>
        ) : (
          <div className="lab-tests-grid">
            {filteredTests.map((test) => (
              <div key={test.id || test._id} className="lab-test-card">
                <div className="test-info">
                  <h3>{test.test_name}</h3>
                  {test.description && (
                    <p className="test-description">{test.description}</p>
                  )}
                  <div className="test-price">
                    <span className="price-label">Price:</span>
                    <span className="price-value">₹{test.price}</span>
                  </div>
                </div>
                <button
                  className="book-test-btn"
                  onClick={() => handleBookTest(test.id || test._id)}
                >
                  Book Test
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
};

export default LabTestListing;
