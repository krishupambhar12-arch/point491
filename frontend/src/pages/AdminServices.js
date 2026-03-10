import React, { useState, useEffect, useCallback } from 'react';
import { API } from '../config/api';
import AdminSidebar from '../components/AdminSidebar';
import ServiceIcon from '../components/ServiceIcon';
import '../styles/adminServices.css';

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [refreshIcons, setRefreshIcons] = useState(false);
  const [actionLoading, setActionLoading] = useState({
    creating: false,
    updating: false,
    deleting: null
  });
  const [formData, setFormData] = useState({
    service_name: '',
    description: '',
    category: 'Legal Service',
    iconFile: null
  });
  const [formErrors, setFormErrors] = useState({});

  const categories = ['Legal Service', 'Consultation', 'Document Review', 'Court Representation', 'Legal Advice'];
  const icons = ['⚖️', '📋', '🏛️', '💼', '🔍', '📝', '⭐'];

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(API.ADMIN_SERVICES, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok) {
        console.log('Services data received:', data.services);
        // Debug: Check if services have icon_file
        data.services.forEach((service, index) => {
          console.log(`Service ${index}:`, {
            id: service.id,
            name: service.service_name,
            icon: service.icon,
            icon_file: service.icon_file
          });
        });
        setServices(data.services || []);
      } else {
        setMessage(data.message || 'Error fetching services');
      }
    } catch (error) {
      setMessage('Error connecting to server');
    }
    setLoading(false);
  }, [token]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.service_name.trim()) {
      errors.service_name = 'Service name is required';
    } else if (formData.service_name.length < 3) {
      errors.service_name = 'Service name must be at least 3 characters';
    } else if (formData.service_name.length > 100) {
      errors.service_name = 'Service name cannot exceed 100 characters';
    }
    
    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description cannot exceed 500 characters';
    }
    
    if (!formData.iconFile) {
      errors.iconFile = 'Service icon file is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setFormErrors({ ...formErrors, iconFile: 'Only image files are allowed' });
        return;
      }
      // Validate file size (500MB)
      if (file.size > 500 * 1024 * 1024) {
        setFormErrors({ ...formErrors, iconFile: 'File size must be less than 500MB' });
        return;
      }
      setFormData({ ...formData, iconFile: file });
      setFormErrors({ ...formErrors, iconFile: null });
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setMessage('Please fix the errors in the form');
      return;
    }

    setActionLoading(prev => ({ ...prev, creating: true }));
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('service_name', formData.service_name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('icon', 'Custom'); // Default icon name for uploaded files
      
      if (formData.iconFile) {
        formDataToSend.append('iconFile', formData.iconFile);
      }

      const response = await fetch(API.ADMIN_CREATE_SERVICE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });
      
      const data = await response.json();
      if (response.ok) {
        setMessage('Service created successfully');
        setShowAddModal(false);
        setFormData({
          service_name: '',
          description: '',
          category: 'Legal Service',
          iconFile: null
        });
        fetchServices();
      } else {
        setMessage(data.message || 'Error creating service');
      }
    } catch (error) {
      setMessage('Error connecting to server');
    } finally {
      setActionLoading(prev => ({ ...prev, creating: false }));
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setFormData({
      service_name: service.service_name,
      description: service.description || '',
      category: service.category || 'Legal Service',
      iconFile: null
    });
    setShowAddModal(true);
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setMessage('Please fix the errors in the form');
      return;
    }

    setActionLoading(prev => ({ ...prev, updating: true }));
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('service_name', formData.service_name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('icon', 'Custom'); // Default icon name for uploaded files
      
      if (formData.iconFile) {
        formDataToSend.append('iconFile', formData.iconFile);
      }

      const response = await fetch(`${API.ADMIN_UPDATE_SERVICE}/${editingService.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });
      
      const data = await response.json();
      if (response.ok) {
        console.log('Service updated successfully:', data);
        setMessage('Service updated successfully');
        setShowAddModal(false);
        setEditingService(null);
        setFormData({
          service_name: '',
          description: '',
          category: 'Legal Service',
          iconFile: null
        });
        // Refresh services to show updated icon
        setRefreshIcons(true);
        await fetchServices();
        setTimeout(() => setRefreshIcons(false), 1000);
      } else {
        setMessage(data.message || 'Error updating service');
      }
    } catch (error) {
      setMessage('Error connecting to server');
    } finally {
      setActionLoading(prev => ({ ...prev, updating: false }));
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      setActionLoading(prev => ({ ...prev, deleting: serviceId }));
      try {
        const response = await fetch(`${API.ADMIN_DELETE_SERVICE}/${serviceId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        if (response.ok) {
          setMessage('Service deleted successfully');
          fetchServices();
        } else {
          setMessage(data.message || 'Error deleting service');
        }
      } catch (error) {
        setMessage('Error connecting to server');
      } finally {
        setActionLoading(prev => ({ ...prev, deleting: null }));
      }
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingService(null);
    setFormErrors({});
    setFormData({
      service_name: '',
      description: '',
      category: 'Legal Service',
      iconFile: null
    });
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

        {loading && <div className="loading">Please wait, loading services...</div>}

        <div className="admin-services">
          <div className="services-header">
            <h2>Services Management</h2>
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              + Add Service
            </button>
          </div>

          {services && services.length > 0 ? (
            <div className="services-table">
              <table>
                <thead>
                  <tr>
                    <th>Icon</th>
                    <th>Service Name</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map(service => (
                    <tr key={service.id}>
                      <td>
                        <ServiceIcon 
                          iconName={service.icon || 'Gavel'} 
                          iconFile={service.icon_file}
                          size={20} 
                          className="table-icon"
                          forceRefresh={refreshIcons}
                        />
                      </td>
                      <td>{service.service_name}</td>
                      <td>{service.description || '-'}</td>
                      <td>{service.category || 'Legal Service'}</td>
                      <td>
                        <button
                          onClick={() => handleEditService(service)}
                          className="btn btn-edit"
                          disabled={actionLoading.deleting === service.id}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteService(service.id)}
                          className="btn btn-delete"
                          disabled={actionLoading.deleting === service.id}
                        >
                          {actionLoading.deleting === service.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            !loading && (
              <div className="no-data">
                <p>No services found. Click "Add Service" to create one.</p>
              </div>
            )
          )}
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingService ? 'Edit Service' : 'Add New Service'}</h3>
                <button className="modal-close" onClick={handleCloseModal}>×</button>
              </div>
              <form onSubmit={editingService ? handleUpdateService : handleAddService}>
                <div className="form-group">
                  <label htmlFor="service_name">Service Name *</label>
                  <input
                    type="text"
                    id="service_name"
                    name="service_name"
                    value={formData.service_name}
                    onChange={handleInputChange}
                    placeholder="e.g., Legal Consultation, Document Review"
                    className={formErrors.service_name ? 'error' : ''}
                  />
                  {formErrors.service_name && (
                    <span className="error-message">{formErrors.service_name}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Service description (optional)"
                    className={formErrors.description ? 'error' : ''}
                  />
                  {formErrors.description && (
                    <span className="error-message">{formErrors.description}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="iconFile">Service Icon (Upload Custom Icon) *</label>
                  <input
                    type="file"
                    id="iconFile"
                    name="iconFile"
                    onChange={handleFileChange}
                    accept="image/*"
                    className={formErrors.iconFile ? 'error' : ''}
                    required
                  />
                  <small>Supported formats: JPG, PNG, GIF. Max size: 500MB</small>
                  {formErrors.iconFile && (
                    <span className="error-message">{formErrors.iconFile}</span>
                  )}
                  {formData.iconFile && (
                    <div style={{ marginTop: '10px' }}>
                      <strong>Preview:</strong><br />
                      <img 
                        src={URL.createObjectURL(formData.iconFile)} 
                        alt="Icon preview" 
                        style={{ 
                          width: '50px', 
                          height: '50px', 
                          objectFit: 'cover',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="btn btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={actionLoading.creating || actionLoading.updating}
                  >
                    {actionLoading.creating || actionLoading.updating
                      ? 'Saving...'
                      : editingService
                      ? 'Update'
                      : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminServices;
