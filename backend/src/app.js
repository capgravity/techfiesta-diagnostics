const express = require('express');
const cookieParser = require('cookie-parser'); 
const doctorRoutes = require('./routes/doctorRoutes');
const indexRoute = require('./routes/index');
const patientRoutes= require('./routes/patientRoutes');
// const uploadRouteGRADCAM= require('./routes/uploadRouteGRADCAM')
const testUpload= require('./routes/testUpload');
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/', indexRoute); // Root route for landing page
app.use('/upload', testUpload);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
// app.use("/api/upload", uploadRouteGRADCAM );



module.exports = app;