const express = require('express');
const router = express.Router();
const protect= require('../middleware/protectRoute');
const doctorController = require('../controllers/doctorController'); // Import the controller

// Signup a new doctor
router.post('/signup', doctorController.signup);

// Fetch doctor profile
router.get('/profile', protect, doctorController.profile);

// Login a doctor
router.post('/login', doctorController.login);

//Logout a doctor
router.post('/logout', doctorController.logout);

module.exports = router;