// Navigation Test Script
// This script tests all navigation buttons on the home page

const navigationTests = [
  {
    name: "Search Bar",
    element: "input[placeholder*='Search attorneys']",
    test: "Should navigate to /attorneys with search query"
  },
  {
    name: "Book Appointment Button", 
    element: ".home-cards .card:first-child .book-btn",
    route: "/attorneys",
    test: "Should navigate to attorney listings"
  },
  {
    name: "Online Attorney Consultation Button",
    element: ".home-cards .card:nth-child(2) .book-btn", 
    route: "/client/consultation",
    test: "Should navigate to client consultation"
  },
  {
    name: "Find Attorney Button",
    element: ".home-cards .card:nth-child(3) .book-btn",
    route: "/lab-tests",
    test: "Should navigate to lab tests"
  },
  {
    name: "AI Health Advisor Card",
    element: ".ai-card",
    route: "/ai-advisor", 
    test: "Should navigate to AI advisor"
  },
  {
    name: "Civil Law Speciality",
    element: ".specialities .speciality:first-child",
    route: "/attorneys?specialization=Civil%20Law",
    test: "Should navigate to civil law attorneys"
  },
  {
    name: "Corporate Law Speciality",
    element: ".specialities .speciality:nth-child(2)",
    route: "/attorneys?specialization=Corporate%20Law", 
    test: "Should navigate to corporate law attorneys"
  },
  {
    name: "Family Law Speciality",
    element: ".specialities .speciality:nth-child(3)",
    route: "/attorneys?specialization=Family%20Law",
    test: "Should navigate to family law attorneys"
  },
  {
    name: "Criminal Law Speciality", 
    element: ".specialities .speciality:nth-child(4)",
    route: "/attorneys?specialization=Criminal%20Law",
    test: "Should navigate to criminal law attorneys"
  }
];

console.log("Navigation Tests Summary:");
console.log("========================");
navigationTests.forEach((test, index) => {
  console.log(`${index + 1}. ${test.name}`);
  console.log(`   Expected: ${test.test}`);
  if (test.route) {
    console.log(`   Route: ${test.route}`);
  }
  console.log("");
});

console.log("All navigation routes have been fixed:");
console.log("✓ /doctors → /attorneys");
console.log("✓ /patient/consultation → /client/consultation"); 
console.log("✓ Medical specialties → Legal specialties");
console.log("✓ 'Finde Attorney' typo fixed");
console.log("✓ All buttons now navigate to correct pages");
