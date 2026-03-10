import React, { useState } from "react";
import "../styles/login.css"; // your existing CSS
import "../styles/variables.css";
import { API } from "../config/api";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSocialLogin = async (provider) => {
    try {
      let authUrl;
      const popupWidth = 500;
      const popupHeight = 600;
      const left = (window.innerWidth - popupWidth) / 2;
      const top = (window.innerHeight - popupHeight) / 2;

      switch (provider) {
        case 'google':
          authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=714671509629-2ue74rqbh90ngtjtfi8aspa740tlid27.apps.googleusercontent.com&` +
            `redirect_uri=${encodeURIComponent('http://localhost:3000/user')}&` +
            `response_type=code&` +
            `scope=${encodeURIComponent('https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid')}&` +
            `access_type=offline&` +
            `prompt=consent&` +
            `include_granted_scopes=true`;
          break;
        case 'facebook':
          authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
            `client_id=1714010942910521&` +
            `redirect_uri=${encodeURIComponent(window.location.origin + '/auth/facebook/callback')}&` +
            `scope=email,public_profile`;
          break;
        case 'linkedin':
          authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
            `client_id=865holnprw1p7h&` +
            `redirect_uri=${encodeURIComponent(window.location.origin + '/auth/linkedin/callback')}&` +
            `response_type=code&` +
            `scope=openid profile email`;
          break;
        default:
          return;
      }

      // Open popup for OAuth
      const popup = window.open(
        authUrl,
        'socialLogin',
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      // Listen for messages from popup
      const messageHandler = async (event) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'social-auth-success') {
          popup.close();
          window.removeEventListener('message', messageHandler);

          // Check if user is a Client - only allow Client users
          const userRole = event.data.user.role;
          if (userRole !== "Client") {
            alert('❌ Access denied. This login is for clients only. Attorneys should use the attorney login page.');
            return;
          }

          // Save token and role
          localStorage.setItem('token', event.data.token);
          localStorage.setItem('role', event.data.user.role);

          // Show success alert with user name
          const userName = event.data.user.name || event.data.user.email;
          alert(`🎉 Welcome, ${userName}! Login successful.`);

          // Navigate to client dashboard only
          navigate('/client/dashboard');
        } else if (event.data.type === 'social-auth-error') {
          popup.close();
          window.removeEventListener('message', messageHandler);
          console.error('Social auth error:', event.data.error);
          alert('Social login failed: ' + event.data.error);
        }
      };

      window.addEventListener('message', messageHandler);

      // Check if popup was blocked
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
        }
      }, 1000);

    } catch (error) {
      console.error('Social login error:', error);
      alert('Social login failed. Please try again.');
    }
  };

  const setPasswordForGoogleUser = async (email, newPassword) => {
    try {
      setMessage("🔐 Setting up your password...");
      
      const res = await fetch('http://localhost:5000/user/set-password', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setMessage("✅ Password set successfully! You can now login with your email and password.");
        
        // Auto-login after password setup
        setTimeout(() => {
          setForm({ ...form, password: newPassword });
          handleSubmit(new Event('submit'));
        }, 1500);
      } else {
        setMessage("❌ " + data.message);
      }
    } catch (error) {
      console.error("Set password error:", error);
      setMessage("❌ Failed to set password. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    console.log('Login attempt with:', { email: form.email, password: '***' });

    try {
      const res = await fetch(API.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      console.log('Login response status:', res.status);
      console.log('Login response headers:', res.headers.get('content-type'));

      // Check if response is JSON, otherwise handle as HTML error
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Received non-JSON response:', text);
        throw new Error('Server returned an error. Please try again later.');
      }

      const data = await res.json();
      console.log('Login response data:', data);

      if (!res.ok) {
        // Handle Google user who needs to set password
        if (data.requiresPasswordSetup && data.isGoogleUser) {
          setMessage(`🔑 This account was created with Google. Please set a password to login with email.`);
          
          // Show password setup dialog
          setTimeout(() => {
            const newPassword = prompt(`Set a password for ${data.email}:`);
            if (newPassword && newPassword.length >= 6) {
              setPasswordForGoogleUser(data.email, newPassword);
            } else if (newPassword) {
              setMessage("❌ Password must be at least 6 characters long.");
            } else {
              setMessage("💡 You can also use Google login to continue.");
            }
          }, 1000);
          return;
        }
        
        // Handle Gmail-specific errors
        if (data.isGmailAddress && data.suggestGoogleLogin) {
          setMessage(`📧 ${data.message}`);
          return;
        }
        
        if (data.requiresGoogleLogin && data.isGoogleUser) {
          setMessage(`🔐 ${data.message}`);
          return;
        }
        
        setMessage(data.message || "Login failed");
        return;
      }

      // Check if user is a Client - only allow Client users to login
      const userRole = data.user ? data.user.role : data.attorney.role;
      if (userRole !== "Client") {
        setMessage("❌ This login is for clients only. Attorneys should use the attorney login page.");
        setLoading(false);
        return;
      }

      // Show success message
      setMessage("✅ Login Successful! Redirecting...");
      
      // token & role save
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user ? data.user.role : data.attorney.role);
      
      // Save user name and email for dashboard use
      const userName = data.user ? data.user.name : data.attorney.name;
      const userEmail = data.user ? data.user.email : data.attorney.email;
      
      if (userName) {
        localStorage.setItem("name", userName);
      }
      if (userEmail) {
        localStorage.setItem("email", userEmail);
      }
      
      console.log('Saved to localStorage:', { 
        token: data.token, 
        role: data.user ? data.user.role : data.attorney.role,
        name: userName,
        email: userEmail
      });

      // Delay navigation to show success message
      setTimeout(() => {
        // Only allow Client users - role wise navigation
        const userRole = data.user ? data.user.role : data.attorney.role;
        
        if (userRole === "Client") {
          console.log('Navigating to client dashboard');
          navigate("/client/dashboard");
        } else {
          console.log('Invalid role for user login:', userRole);
          setMessage("❌ Access denied. This login is for clients only.");
          localStorage.removeItem("token");
          localStorage.removeItem("role");
        }
      }, 1500);

    } catch (err) {
      console.error("Login error:", err);
      if (err.message.includes('Server returned an error')) {
        setMessage("❌ Server is experiencing issues. Please try again later.");
      } else if (err.message.includes('Failed to fetch')) {
        setMessage("❌ Cannot connect to server. Please check your internet connection.");
      } else {
        setMessage("❌ " + (err.message || "Something went wrong. Please try again."));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Login Form */}
      <form className="login-form" onSubmit={handleSubmit}>
        {/* Back Button */}
        <Link to="/" className="back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          
        </Link>
        
        <h1 className="get">Get Started</h1>
        <h4 className="ac">Login to your account or create a new one</h4>
        <h2>Login</h2>

        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="form-group">
          <label>Email</label>
          <input type="email" name="email" onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Password</label>
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              onChange={handleChange}
              required
              className="password-input"
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="form-links">
          <button
            type="button"
            className="forgot-password"
            onClick={() => navigate("/forgot-password")}
          >
            Forgot password?
          </button>
        </div>

        <button 
          type="submit" 
          className="login-button" 
          disabled={loading}
          style={{ backgroundColor: '#5c4750' }}
        >
          {loading ? 'Please wait...' : 'Login'}
        </button>

        <div className="register-link">
          Don't have an account? <a href="/register">Register</a>
        </div>
      </form>
    </div>
  );
};

export default Login;