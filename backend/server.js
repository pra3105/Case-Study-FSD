require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const connectDB = require('./config/db');

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
const authRoutes        = require('./routes/auth');
const courseRoutes      = require('./routes/courses');
const enrollmentRoutes  = require('./routes/enrollments');

app.use('/api/auth',        authRoutes);
app.use('/api/courses',     courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);

// Health Check API
app.get('/api/health', function(req, res) {
  res.json({ success: true, message: 'API is running', time: new Date().toISOString() });
});

// Catch-all route for Single Page Application (SPA)
// Using a native RegExp (/.*/) to bypass Express 5's strict string parser
app.get(/.*/, function(req, res) {
  // If the request is for an API route that wasn't found, return a 404 JSON response
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found' });
  }
  // Otherwise, serve the frontend index.html for client-side routing
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error Handling Middleware
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, function() {
  console.log('Server running on http://localhost:' + PORT);
});