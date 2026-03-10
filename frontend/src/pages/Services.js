import React, { useState, useEffect } from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import { useNavigate } from "react-router-dom";
import { API } from "../config/api";
import ServiceIcon from "../components/ServiceIcon";
import "../styles/services.css";

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const navigate = useNavigate();

  const categories = ["all", "Legal Service", "Consultation", "Document Review", "Court Representation", "Legal Advice"];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch(API.ALL_SERVICES);
      const data = await response.json();
      console.log('Services data received:', data);
      if (response.ok) {
        setServices(data.services || []);
        console.log('Services set:', data.services);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleBookService = (service) => {
    // Navigate to attorneys page with service context
    navigate('/attorneys', { state: { service: service.service_name } });
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="loading">Loading services...</div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="services-page">
        <div className="services-header">
          <h1>Our Legal Services</h1>
          <p>Professional legal services tailored to your needs</p>
        </div>

        {/* Search and Filter */}
        <div className="services-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="category-filter">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Services Grid */}
        <div className="services">
          {filteredServices.length > 0 ? (
            filteredServices.map((service) => {
              console.log('Rendering service:', service);
              return (
                <div key={service.id} className="service-card">
                  <div className="service-icon">
                    {/* <ServiceIcon 
                    iconName={service.icon || 'Gavel'} 
                    iconFile={service.icon_file}
                    size={48} 
                  /> */}
                    <ServiceIcon
                      iconName={service.icon || 'Gavel'}
                      iconFile={service.icon_file}
                      size={48}
                    />
                  </div>
                  <h3>{service.service_name}</h3>
                  <p>{service.description || 'Professional legal service'}</p>
                  <div className="service-category">{service.category}</div>
                  <button
                    className="book-btn"
                    onClick={() => handleBookService(service)}
                  >
                    Book Service
                  </button>
                </div>
              )
            })
          ) : (
            <div className="no-services">
              <p>No services found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Services;
