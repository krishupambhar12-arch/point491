const express = require("express")
const dbConnect = require("./config/dbConnect")
const app = express()
const port = process.env.PORT || 5000;
const cors = require("cors");
const Path = require("path");

// Load environment variables
require('dotenv').config();


const userRoute = require("./routes/userRoutes");
const attorneyRoute = require("./routes/doctor"); // attorney routes
const adminRoute = require("./routes/admin");
const aiAdvisorRoute = require("./routes/aiAdvisor");
const servicesRoute = require("./routes/services");

app.use(express.json())
app.use(cors());

// Log only API route path for backend calls
app.use((req, res, next) => {
    const url = req.originalUrl || req.url
    if (url.startsWith('/user') || url.startsWith('/attorney') || url.startsWith('/admin') || url.startsWith('/services')) {
        console.log(url)
    }
    next()
})

// app.use("/", (req, res) => {
//      res.send("Welcome to the Justice App API");
// })

app.use('/uploads', express.static('uploads'));
app.use('/images', express.static(Path.join(__dirname, 'public/images')));

app.use('/user', userRoute);

// Attorney routes
app.use('/attorney', attorneyRoute);

app.use('/admin', adminRoute);
app.use('/services', servicesRoute);
app.use('/ai', aiAdvisorRoute);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Don't send JSON if response has already been sent
  if (res.headersSent) {
    return next(err);
  }
  
  // Always send JSON response for API routes
  if (req.path.startsWith('/user') || req.path.startsWith('/admin') || req.path.startsWith('/attorney') || req.path.startsWith('/services')) {
    res.status(err.status || 500).json({
      message: err.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  } else {
    next(err);
  }
});

// 404 handler for API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/user') || req.path.startsWith('/admin') || req.path.startsWith('/attorney') || req.path.startsWith('/services')) {
    res.status(404).json({
      message: 'API endpoint not found'
    });
  } else {
    next();
  }
});

dbConnect();

app.listen(port);
