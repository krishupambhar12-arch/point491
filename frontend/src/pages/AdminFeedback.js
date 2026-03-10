import React, { useState, useEffect, useCallback } from 'react';
import { API } from '../config/api';
import AdminSidebar from '../components/AdminSidebar';
import '../styles/adminFeedback.css';

const AdminFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseData, setResponseData] = useState({
    admin_response: '',
    status: 'Reviewed'
  });
  const [actionLoading, setActionLoading] = useState({
    updating: null,
    responding: null,
    deleting: null
  });      

  const token = localStorage.getItem('token');           


  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const url = statusFilter 
        ? `${API.ADMIN_FEEDBACK}?status=${statusFilter}`
        : API.ADMIN_FEEDBACK;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok) {
        setFeedbacks(data.feedbacks || []);
      } else {
        setMessage(data.message || 'Error fetching feedback');
      }
    } catch (error) {
      setMessage('Error connecting to server');
    }
    setLoading(false);
  }, [token, statusFilter]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const updateFeedbackStatus = async (feedbackId, newStatus) => {
    setActionLoading(prev => ({ ...prev, updating: feedbackId }));
    try {
      const response = await fetch(`${API.ADMIN_UPDATE_FEEDBACK_STATUS}/${feedbackId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Feedback status updated successfully');
        fetchFeedbacks();
      } else {
        setMessage(data.message || 'Error updating feedback status');
      }
    } catch (error) {
      setMessage('Error connecting to server');
    } finally {
      setActionLoading(prev => ({ ...prev, updating: null }));
    }
  };

  const handleOpenResponseModal = (feedback) => {
    setSelectedFeedback(feedback);
    setResponseData({
      admin_response: feedback.admin_response || '',
      status: feedback.status === 'Pending' ? 'Reviewed' : feedback.status
    });
    setShowResponseModal(true);
  };

  const handleCloseResponseModal = () => {
    setShowResponseModal(false);
    setSelectedFeedback(null);
    setResponseData({ admin_response: '', status: 'Reviewed' });
    setMessage('');
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    
    if (!responseData.admin_response.trim()) {
      setMessage('Please enter a response');
      return;
    }

    setActionLoading(prev => ({ ...prev, responding: selectedFeedback.id }));
    try {
      const response = await fetch(`${API.ADMIN_RESPOND_FEEDBACK}/${selectedFeedback.id}/respond`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(responseData)
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Response added successfully');
        handleCloseResponseModal();
        fetchFeedbacks();
      } else {
        setMessage(data.message || 'Error submitting response');
      }
    } catch (error) {
      setMessage('Error connecting to server');
    } finally {
      setActionLoading(prev => ({ ...prev, responding: null }));
    }
  };

  const deleteFeedback = async (feedbackId) => {
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      setActionLoading(prev => ({ ...prev, deleting: feedbackId }));
      try {
        const response = await fetch(`${API.ADMIN_DELETE_FEEDBACK}/${feedbackId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        if (response.ok) {
          setMessage('Feedback deleted successfully');
          fetchFeedbacks();
        } else {
          setMessage(data.message || 'Error deleting feedback');
        }
      } catch (error) {
        setMessage('Error connecting to server');
      } finally {
        setActionLoading(prev => ({ ...prev, deleting: null }));
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#ffc107';
      case 'Reviewed': return '#17a2b8';
      case 'Resolved': return '#28a745';
      case 'Archived': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dashboard-page">
      <AdminSidebar />
      <div className="dashboard-content">
        {message && (
          <div className={`message ${message.includes('successfully') ? 'success' : message.includes('Error') ? 'error' : 'info'}`}>
            {message}
            <button onClick={() => setMessage('')}>×</button>
          </div>
        )}

        {loading && <div className="loading">Please wait, loading feedback...</div>}

        <div className="admin-feedback">
          <div className="feedback-header">
            <h2>Manage Feedback</h2>
            <div className="filter-container">
              <label htmlFor="statusFilter">Filter by Status:</label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="status-filter"
              >
                <option value="">All</option>
                <option value="Pending">Pending</option>
                <option value="Reviewed">Reviewed</option>
                <option value="Resolved">Resolved</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="feedbacks-list">
            {feedbacks.length > 0 ? (
              feedbacks.map(feedback => (
                <div key={feedback.id} className="feedback-card">
                  <div className="feedback-card-header">
                    <div className="feedback-user-info">
                      <h3>{feedback.subject}</h3>
                      <div className="user-details">
                        <span><strong>From:</strong> {feedback.user?.name || 'Unknown'}</span>
                        <span>{feedback.user?.email || ''}</span>
                      </div>
                    </div>
                    <div className="feedback-meta">
                      <div className="rating-display">
                        {'⭐'.repeat(feedback.rating || 5)}
                      </div>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(feedback.status) }}
                      >
                        {feedback.status}
                      </span>
                      <span className="feedback-date">
                        {formatDate(feedback.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="feedback-message">
                    <p>{feedback.message}</p>
                  </div>

                  {feedback.admin_response && (
                    <div className="admin-response-display">
                      <h4>Admin Response:</h4>
                      <p>{feedback.admin_response}</p>
                      {feedback.responded_by && (
                        <small>
                          Responded by: {feedback.responded_by.name} on {formatDate(feedback.responded_at)}
                        </small>
                      )}
                    </div>
                  )}

                  <div className="feedback-actions">
                    <select
                      value={feedback.status}
                      onChange={(e) => updateFeedbackStatus(feedback.id, e.target.value)}
                      className="status-select"
                      disabled={actionLoading.updating === feedback.id}
                      style={{ backgroundColor: getStatusColor(feedback.status), color: '#fff' }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Reviewed">Reviewed</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Archived">Archived</option>
                    </select>
                    <button
                      onClick={() => handleOpenResponseModal(feedback)}
                      className="respond-btn"
                    >
                      {feedback.admin_response ? 'Update Response' : 'Respond'}
                    </button>
                    <button
                      onClick={() => deleteFeedback(feedback.id)}
                      className="delete-btn"
                      disabled={actionLoading.deleting === feedback.id}
                    >
                      {actionLoading.deleting === feedback.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-feedback">
                <p>No feedback found{statusFilter ? ` with status "${statusFilter}"` : ''}.</p>
              </div>
            )}
          </div>
        </div>

        {/* Response Modal */}
        {showResponseModal && selectedFeedback && (
          <div className="modal-overlay" onClick={handleCloseResponseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Respond to Feedback</h3>
                <button className="modal-close-btn" onClick={handleCloseResponseModal}>×</button>
              </div>
              
              <div className="modal-feedback-preview">
                <h4>{selectedFeedback.subject}</h4>
                <p><strong>From:</strong> {selectedFeedback.user?.name || 'Unknown'}</p>
                <p>{selectedFeedback.message}</p>
              </div>

              <form onSubmit={handleSubmitResponse} className="response-form">
                <div className="form-group">
                  <label htmlFor="admin_response">Your Response *</label>
                  <textarea
                    id="admin_response"
                    name="admin_response"
                    value={responseData.admin_response}
                    onChange={(e) => setResponseData({ ...responseData, admin_response: e.target.value })}
                    placeholder="Enter your response to the user..."
                    rows="5"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="status">Update Status</label>
                  <select
                    id="status"
                    name="status"
                    value={responseData.status}
                    onChange={(e) => setResponseData({ ...responseData, status: e.target.value })}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Reviewed">Reviewed</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={handleCloseResponseModal}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={actionLoading.responding === selectedFeedback.id}
                  >
                    {actionLoading.responding === selectedFeedback.id ? 'Submitting...' : 'Submit Response'}
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

export default AdminFeedback;

