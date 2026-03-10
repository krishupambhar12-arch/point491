import React, { useState, useEffect } from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import { useNavigate } from "react-router-dom";
import { API } from "../config/api";
import ServiceIcon from "../components/ServiceIcon";
import "../styles/home.css";
import "../styles/services.css";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Home = () => {

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch(API.ALL_SERVICES);
      const data = await response.json();
      if (response.ok) {
        setServices(data.services || []);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setServicesLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/attorneys?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/attorneys');
    }
  };

  const handleSpecialtyClick = (specialty) => {
    navigate(`/attorneys?specialization=${encodeURIComponent(specialty)}`);
  };

  const handleSymptomClick = (symptom) => {
    navigate(`/attorneys?search=${encodeURIComponent(symptom)}`);
  };

  const handleBookService = (service) => {
    // Navigate to attorneys page with service context
    navigate('/attorneys', { state: { service: service.service_name } });
  };

  const handleBookNow = (service) => {
    // Check if user is logged in and is a client (Patient/Client)
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      alert("Please login to book appointments");
      navigate("/login");
      return;
    }

    const isClient = role === "Patient" || role === "Client";
    if (!isClient) {
      alert("Only clients can book appointments");
      return;
    }

    // Navigate to attorneys listing for the specific service
    if (service === "appointment") {
      navigate("/attorneys");
    } else if (service === "consultation") {
      navigate("/client/consultation");
    } else if (service === "labtest") {
      navigate("/lab-tests");
    }
  };

  return (
    <>
      <Header />
      {/* Search bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search attorneys by name, specialization, or case type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} className="search-btn">Search</button>
      </div>

      {/* Banner Slider */}
      <div className="banner-slider">
        <Slider {...sliderSettings}>
          <div><img src="/images/banner/1.avif" alt="Law 1" /></div>
          <div><img src="/images/banner/2.webp" alt="Law 2" /></div>
          <div><img src="/images/banner/3.jpg" alt="Law 3" /></div>
        </Slider>
      </div>
      <div className="home-cards">
        <div className="card">
          <p>Book Appointment</p>
          <button className="book-btn" onClick={() => handleBookNow("appointment")}>Book Now</button>
        </div>

        <div className="card">
          <p>Online Attorney Consultation</p>
          <button className="book-btn" onClick={() => handleBookNow("consultation")}>Book Now</button>
        </div>

        <div className="card">
          <p>Legal Services</p>
          <button className="book-btn" onClick={() => navigate("/services")}>View Services</button>
        </div>

        <div className="card ai-card" onClick={() => navigate("/ai-advisor")}>
          <div className="ai-icon">🤖</div>
          <p>AI Health Advisor</p>
          <button className="book-btn">Chat Now</button>
        </div>
      </div>
      {/* Dynamic Services */}
      <h2>Our Legal Services</h2>
      <div className="services">
        {servicesLoading ? (
          <div className="loading">Loading services...</div>
        ) : services.length > 0 ? (
          services.map((service) => (
            <div key={service.id} className="service-card" onClick={() => handleBookService(service)}>
              <div className="service-icon">
                <ServiceIcon 
                  iconName={service.icon || 'Gavel'} 
                  iconFile={service.icon_file}
                  size={48} 
                />
              </div>
              <h3>{service.service_name}</h3>
              <p>{service.description || 'Professional legal service'}</p>
              <button className="book-btn" onClick={(e) => {
                e.stopPropagation();
                handleBookService(service);
              }}>Book Now</button>
            </div>
          ))
        ) : (
          <div className="no-services">
            <p>No services available at the moment.</p>
          </div>
        )}
      </div>

      {/* Client Success Stories */}
      <h2>Client Success Stories</h2>
      <div className="symptoms">
        <div className="symptom" onClick={() => handleSymptomClick("General Practice")}>
          <img src="/images/client/c1" alt="Sarah Johnson" />
          <div className="symptom-content">
            <span>Sarah Johnson</span>
            <p>"Excellent contract review service. They identified critical clauses I missed and saved my business from potential disputes."</p>
            <button className="book-btn">Find Attorneys</button>
          </div>
        </div>
        <div className="symptom" onClick={() => handleSymptomClick("General Practice")}>
          <img src="/images/client/c2.avif" alt="Michael Chen" />
          <div className="symptom-content">
            <span>Michael Chen</span>
            <p>"Professional mediation services resolved our partnership dispute efficiently. Fair outcome for all parties involved."</p>
            <button className="book-btn">Find Attorneys</button>
          </div>
        </div>
        <div className="symptom" onClick={() => handleSymptomClick("General Practice")}>
          <img src="/images/client/c3" alt="Emily Rodriguez" />
          <div className="symptom-content">
            <span>Emily Rodriguez</span>
            <p>"Helped our startup navigate complex regulatory requirements. Now fully compliant and operational."</p>
            <button className="book-btn">Find Attorneys</button>
          </div>
        </div>
        <div className="symptom" onClick={() => handleSymptomClick("General Practice")}>
          <img src="/images/client/c4" alt="David Thompson" />
          <div className="symptom-content">
            <span>David Thompson</span>
            <p>"Expert criminal defense representation achieved the best possible outcome for my case. Highly recommend their services."</p>
            <button className="book-btn">Find Attorneys</button>
          </div>
        </div>
        <div className="symptom" onClick={() => handleSymptomClick("General Practice")}>
          <img src="/images/client/c5" alt="Lisa Anderson" />
          <div className="symptom-content">
            <span>Lisa Anderson</span>
            <p>"Family law matters handled with compassion and professionalism. Helped us through a difficult divorce process."</p>
            <button className="book-btn">Find Attorneys</button>
          </div>
        </div>
        <div className="symptom" onClick={() => handleSymptomClick("General Practice")}>
          <img src="/images/client/c6.jpg" alt="Robert Martinez" />
          <div className="symptom-content">
            <span>Robert Martinez</span>
            <p>"Corporate structuring and compliance services were invaluable for our business expansion. Worth every penny!"</p>
            <button className="book-btn">Find Attorneys</button>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Home;
