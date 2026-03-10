// Global API interceptor for handling force logout
import { API } from '../config/api';

// Store original fetch
const originalFetch = window.fetch;

// Override fetch to add force logout handling
window.fetch = async function(url, options = {}) {
  try {
    const response = await originalFetch(url, options);
    
    // Clone response to read body without consuming it
    const clonedResponse = response.clone();
    
    try {
      const data = await clonedResponse.json();
      
      // Check if force logout is required
      if (data.forceLogout || data.deactivated) {
        console.log("🔍 Force logout detected - clearing session");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        
        // Show alert and redirect
        alert("Your account has been deactivated by admin. You have been logged out.");
        window.location.href = "/login";
        return;
      }
    } catch (jsonError) {
      // If response is not JSON, continue normally
      console.log("Response is not JSON, continuing normally");
    }
    
    return response;
  } catch (error) {
    // If there's a network error, check if it's a 401 (unauthorized)
    if (error.message && error.message.includes('401')) {
      console.log("🔍 401 Unauthorized - checking session");
      const token = localStorage.getItem("token");
      if (token) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        alert("Your session has expired. Please login again.");
        window.location.href = "/login";
        return;
      }
    }
    throw error;
  }
};

export default {};
