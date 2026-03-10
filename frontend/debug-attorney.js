// This is a simple debugging script to check what's happening
// Open browser console and run this when trying to create attorney

console.log("=== DEBUGGING ATTORNEY CREATION ===");

// Check if token exists
const token = localStorage.getItem('token');
const role = localStorage.getItem('role');

console.log("Token exists:", !!token);
console.log("Role:", role);

if (token) {
  console.log("Token (first 50 chars):", token.substring(0, 50));
}

// Test API call manually
fetch('http://localhost:5000/admin/codes', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Debug Test',
    email: 'debug@test.com',
    phone: '1234567890',
    gender: 'Male',
    qualification: 'LLB',
    joiningDate: '2026-03-10',
    attorneyCode: 'DEBUG1'
  })
})
.then(response => {
  console.log("Manual test response status:", response.status);
  return response.json();
})
.then(data => {
  console.log("Manual test response data:", data);
})
.catch(error => {
  console.error("Manual test error:", error);
});

console.log("=== END DEBUGGING ===");
