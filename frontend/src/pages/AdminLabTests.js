import React, { useState, useEffect, useCallback } from 'react';
import { API } from '../config/api';
import AdminSidebar from '../components/AdminSidebar';
import '../styles/adminLabTests.css';

const AdminLabTests = () => {
  const [labTests, setLabTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [actionLoading, setActionLoading] = useState({
    creating: false,
    updating: false,
    deleting: null
  });
  const [formData, setFormData] = useState({
    test_name: '',
    description: '',
    price: ''
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchLabTests();
  }, []);

  const fetchLabTests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(API.ADMIN_LAB_TESTS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok) {
        setLabTests(data.labTests || []);
      } else {
        setMessage(data.message || 'Error fetching lab tests');
      }
    } catch (error) {
      setMessage('Error connecting to server');
    }
    setLoading(false);
  }, [token]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddTest = async (e) => {
    e.preventDefault();
    
    if (!formData.test_name || !formData.price) {
      setMessage('Test name and price are required');
      return;
    }

    setActionLoading(prev => ({ ...prev, creating: true }));
    try {
      const response = await fetch(API.ADMIN_CREATE_LAB_TEST, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      if (response.ok) {
        setMessage('Lab test created successfully');
        setShowAddModal(false);
        setFormData({
          test_name: '',
          description: '',
          price: ''
        });
        fetchLabTests();
      } else {
        setMessage(data.message || 'Error creating lab test');
      }
    } catch (error) {
      setMessage('Error connecting to server');
    } finally {
      setActionLoading(prev => ({ ...prev, creating: false }));
    }
  };

  const handleEditTest = (test) => {
    setEditingTest(test);
    setFormData({
      test_name: test.test_name,
      description: test.description || '',
      price: test.price.toString()
    });
    setShowAddModal(true);
  };

  const handleUpdateTest = async (e) => {
    e.preventDefault();
    
    if (!formData.test_name || !formData.price) {
      setMessage('Test name and price are required');
      return;
    }

    setActionLoading(prev => ({ ...prev, updating: true }));
    try {
      const response = await fetch(`${API.ADMIN_UPDATE_LAB_TEST}/${editingTest.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      if (response.ok) {
        setMessage('Lab test updated successfully');
        setShowAddModal(false);
        setEditingTest(null);
        setFormData({
          test_name: '',
          description: '',
          price: ''
        });
        fetchLabTests();
      } else {
        setMessage(data.message || 'Error updating lab test');
      }
    } catch (error) {
      setMessage('Error connecting to server');
    } finally {
      setActionLoading(prev => ({ ...prev, updating: false }));
    }
  };

  const handleDeleteTest = async (testId) => {
    if (window.confirm('Are you sure you want to delete this lab test? This action cannot be undone if there are no bookings.')) {
      setActionLoading(prev => ({ ...prev, deleting: testId }));
      try {
        const response = await fetch(`${API.ADMIN_DELETE_LAB_TEST}/${testId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        if (response.ok) {
          setMessage('Lab test deleted successfully');
          fetchLabTests();
        } else {
          setMessage(data.message || 'Error deleting lab test');
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
    setEditingTest(null);
    setFormData({
      test_name: '',
      description: '',
      price: ''
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

        {loading && <div className="loading">Please wait, loading lab tests...</div>}

        <div className="admin-lab-tests">
          <div className="lab-tests-header">
            <h2>Lab Tests Management</h2>
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              + Add Lab Test
            </button>
          </div>

          {labTests && labTests.length > 0 ? (
            <div className="lab-tests-table">
              <table>
                <thead>
                  <tr>
                    <th>Test Name</th>
                    <th>Description</th>
                    <th>Price (₹)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {labTests.map(test => (
                    <tr key={test.id}>
                      <td>{test.test_name}</td>
                      <td>{test.description || '-'}</td>
                      <td>₹{test.price}</td>
                      <td>
                        <button
                          onClick={() => handleEditTest(test)}
                          className="btn btn-edit"
                          disabled={actionLoading.deleting === test.id}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTest(test.id)}
                          className="btn btn-delete"
                          disabled={actionLoading.deleting === test.id}
                        >
                          {actionLoading.deleting === test.id ? 'Deleting...' : 'Delete'}
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
                <p>No lab tests found. Click "Add Lab Test" to create one.</p>
              </div>
            )
          )}
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingTest ? 'Edit Lab Test' : 'Add New Lab Test'}</h3>
                <button className="modal-close" onClick={handleCloseModal}>×</button>
              </div>
              <form onSubmit={editingTest ? handleUpdateTest : handleAddTest}>
                <div className="form-group">
                  <label htmlFor="test_name">Test Name *</label>
                  <input
                    type="text"
                    id="test_name"
                    name="test_name"
                    value={formData.test_name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Blood Test, X-Ray"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Test description (optional)"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="price">Price (₹) *</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
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
                      : editingTest
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

export default AdminLabTests;
