const express = require('express');
const router = express.Router();
const protect = require('../middleware/protectRoute');
const patientController = require('../controllers/patientController'); // Import the controller
const protectRoute = require('../middleware/protectRoute');

// Add a new patient
router.post('/', protect, patientController.addPatient);

// Get all patients for the logged-in doctor
router.get('/', protect, patientController.getAllPatients);

// Get a single patient by ID
router.get('/:id', protect, patientController.getPatientById);

// Update patient details
router.put('/:id', protect, patientController.updatePatient);

// Delete a patient
router.delete('/:id', protect, patientController.deletePatient);








module.exports = router;
