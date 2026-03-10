import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Processing Google login...");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        const error_description = urlParams.get('error_description');

        if (error) {
          console.error('Google OAuth error:', error, error_description);
          
          // Handle specific Google OAuth errors
          let errorMessage = "❌ Google login failed. Redirecting to login...";
          
          if (error === 'access_denied') {
            errorMessage = "❌ Access denied. You must grant permission to continue.";
          } else if (error === 'popup_closed_by_user') {
            errorMessage = "❌ Login window was closed. Please try again.";
          } else if (error_description) {
            errorMessage = `❌ ${error_description}`;
          }
          
          setMessage(errorMessage);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (code) {
          console.log('🔑 Received Google authorization code, exchanging for token...');
          setMessage("🔐 Authenticating with Google...");
          
          try {
            // Send the code to the backend
            const response = await axios.post('http://localhost:5000/user/auth/google', {
              code
            });

            console.log('✅ Google auth response:', response.data);

            if (response.data.token) {
              // Save token and role
              localStorage.setItem('token', response.data.token);
              localStorage.setItem('role', response.data.user.role);
              localStorage.setItem('user', JSON.stringify(response.data.user));

              setMessage(`🎉 Welcome, ${response.data.user.name}! Login successful.`);
              setIsSuccess(true);

              // Check if this is running in a popup window
              if (window.opener && !window.opener.closed) {
                console.log('🪟 Detected popup window, transferring auth data and closing...');
                
                // Send success message to parent window
                window.opener.postMessage({
                  type: 'social-auth-success',
                  token: response.data.token,
                  user: response.data.user
                }, window.location.origin);
                
                // Close the popup after a short delay to show success message
                setTimeout(() => {
                  window.close();
                }, 1000);
              } else {
                // Normal flow for non-popup
                setTimeout(() => {
                  console.log('🔄 Navigating to profile page');
                  navigate('/profile');
                }, 2000);
              }
            } else {
              console.error('❌ No token received from backend:', response.data);
              setMessage("❌ Authentication failed. No token received. Redirecting to login...");
              setTimeout(() => navigate('/login'), 2000);
            }
          } catch (axiosError) {
            console.error('🚨 Axios error during Google auth:', axiosError);
            console.error('🚨 Error response:', axiosError.response?.data);
            console.error('🚨 Error status:', axiosError.response?.status);
            
            let errorMessage = "❌ Google login failed. Please try again.";
            
            if (axiosError.response?.data?.error === 'EMAIL_NOT_VERIFIED') {
              errorMessage = "❌ Please verify your Google account email first.";
            } else if (axiosError.response?.data?.error === 'TOKEN_EXCHANGE_FAILED') {
              errorMessage = "❌ Failed to authenticate with Google. Please try again.";
            } else if (axiosError.response?.data?.message) {
              errorMessage = `❌ ${axiosError.response.data.message}`;
            }
            
            setMessage(errorMessage);
            setTimeout(() => navigate('/login'), 3000);
          }
        } else {
          console.error('❌ No authorization code received');
          setMessage("❌ No authorization code received. Redirecting to login...");
          setTimeout(() => navigate('/login'), 2000);
        }
      } catch (error) {
        console.error('🚨 Google callback error:', error);
        setMessage("❌ An error occurred during Google login. Redirecting to login...");
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleGoogleCallback();
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
          backgroundColor: isSuccess ? '#d4edda' : '#f8f9fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px'
        }}>
          {isSuccess ? '✓' : '⏳'}
        </div>
        <h2 style={{ 
          margin: '0 0 10px 0', 
          color: '#333',
          fontSize: '24px'
        }}>
          Google Authentication
        </h2>
        <p style={{ 
          margin: '0', 
          color: isSuccess ? '#155724' : '#666',
          fontSize: '16px',
          lineHeight: '1.5'
        }}>
          {message}
        </p>
      </div>
    </div>
  );
};

export default GoogleCallback;
