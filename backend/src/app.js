const express = require('express');
const cookieParser = require('cookie-parser'); 
const doctorRoutes = require('./routes/doctorRoutes');
const indexRoute = require('./routes/index');
const patientRoutes= require('./routes/patientRoutes');
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/', indexRoute); // Root route for landing page
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);

module.exports = app;