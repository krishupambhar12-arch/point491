import React, { useState, useEffect, useCallback } from 'react';
import { API } from '../config/api';
import AdminSidebar from '../components/AdminSidebar';
import '../styles/adminUsers.css';

const AdminPatients = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [actionLoading, setActionLoading] = useState({
    creating: false,
    deleting: null,
    restoring: null
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(API.ADMIN_USERS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users || []);
      } else {
        setMessage(data.message || 'Error fetching clients');
      }
    } catch (error) {
      setMessage('Error connecting to server');
    }
    setLoading(false);
  }, [token]);

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to mark this user as inactive? Their data will be preserved in the database.')) {
      return;
    }

    setActionLoading(prev => ({ ...prev, deleting: userId }));
    try {
      const response = await fetch(`${API.ADMIN_DELETE_USER}/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message || 'User marked as inactive successfully');
        fetchUsers(); // Refresh the list
      } else {
        setMessage(data.message || 'Error marking user as inactive');
      }
    } catch (error) {
      setMessage('Error connecting to server');
    } finally {
      setActionLoading(prev => ({ ...prev, deleting: null }));
    }
  };

  const restoreUser = async (userId) => {
    if (!window.confirm('Are you sure you want to restore this user?')) {
      return;
    }

    setActionLoading(prev => ({ ...prev, restoring: userId }));
    try {
      const response = await fetch(`${API.ADMIN_RESTORE_USER}/${userId}/restore`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message || 'User restored successfully');
        fetchUsers(); // Refresh the list
      } else {
        setMessage(data.message || 'Error restoring user');
      }
    } catch (error) {
      setMessage('Error connecting to server');
    } finally {
      setActionLoading(prev => ({ ...prev, restoring: null }));
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      setMessage('Name, email, and password are required');
      return;
    }

    setActionLoading(prev => ({ ...prev, creating: true }));
    try {
      const response = await fetch(API.ADMIN_CREATE_USER, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      if (response.ok) {
        setMessage('Client created successfully');
        setShowAddUserModal(false);
        setFormData({
          name: '',
          email: '',
          password: ''
        });
        fetchUsers(); // Refresh the list
      } else {
        setMessage(data.message || 'Error creating client');
      }
    } catch (error) {
      setMessage('Error connecting to server');
    } finally {
      setActionLoading(prev => ({ ...prev, creating: false }));
    }
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

        {loading && <div className="loading">Please wait, loading clients...</div>}

        <div className="admin-users">
          <div className="users-header">
            <h2>All Clients</h2>
            <button 
              onClick={() => setShowAddUserModal(true)}
              className="btn btn-primary"
            >
              + Add Client
            </button>
          </div>

          {/* Add Client Modal */}
          {showAddUserModal && (
            <div className="modal-overlay" onClick={() => setShowAddUserModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Add New Client</h3>
                  <button 
                    className="close-btn"
                    onClick={() => setShowAddUserModal(false)}
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleAddUser} className="add-user-form">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={() => setShowAddUserModal(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={actionLoading.creating}
                    >
                      {actionLoading.creating ? 'Please wait, creating...' : 'Create Client'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th> Date</th>
                  {/* <th>Signup Time</th> */}
                  {/* <th>Last Login Date</th> */}
                  <th>Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users && users.length > 0 ? users.map(user => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.signupDate}</td>
                    {/* <td>{user.signupTime}</td> */}
                    {/* <td>{user.lastLoginDate}</td> */}
                    <td>{user.lastLoginTime}</td>
                    <td>
                      <span className={`status-badge ${user.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                        {user.status || 'active'}
                      </span>
                    </td>
                    <td>
                      <div className="user-actions">
                        {user.status === 'inactive' ? (
                          <button
                            onClick={() => restoreUser(user.id)}
                            className="btn btn-success"
                            disabled={actionLoading.restoring === user.id}
                          >
                            {actionLoading.restoring === user.id ? 'Please wait...' : 'Restore'}
                          </button>
                        ) : (
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="btn btn-danger"
                            disabled={actionLoading.deleting === user.id}
                          >
                            {actionLoading.deleting === user.id ? 'Please wait...' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="8" className="no-users">No clients found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPatients;

