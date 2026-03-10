import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ProfileRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('role');
    
    // Redirect based on user role
    if (role === 'Attorney') {
      navigate('/attorney/profile');
    } else if (role === 'Client') {
      navigate('/client/profile');
    } else if (role === 'Admin') {
      navigate('/admin/dashboard');
    } else {
      // If no role, redirect to login
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: '#f8f9fa',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        padding: '40px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '90%'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          margin: '0 auto 20px',
          borderRadius: '50%',
          backgroundColor: '#f8f9fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px'
        }}>
          ⏳
        </div>
        <h2 style={{ 
          margin: '0 0 10px 0', 
          color: '#333',
          fontSize: '24px'
        }}>
          Redirecting...
        </h2>
        <p style={{ 
          margin: '0', 
          color: '#666',
          fontSize: '16px',
          lineHeight: '1.5'
        }}>
          Taking you to your profile page...
        </p>
      </div>
    </div>
  );
};

export default ProfileRedirect;
