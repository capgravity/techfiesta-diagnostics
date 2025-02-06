const prisma = require('../utils/prisma');

const addPatient = async (req, res) => {
  // Getting the logged-in doctor id from the request (e.g., from the authentication token or session)
  const doctorId = req.doctor.id;  // Using req.doctor.id instead of req.user.id

  // Extracting patient data from the request body
  const { name, gender, age, smoker, alcoholConsumption, neurologicalCondition } = req.body;

  try {
    // Validate input
    if (!name || !gender || !age || !smoker || !alcoholConsumption || !neurologicalCondition) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    // Create the patient record in the database
    const patient = await prisma.patient.create({
      data: {
        name,
        gender,
        age: parseInt(age,10),
        smoker,
        alcoholConsumption,
        neurologicalCondition,
        doctorId,  // Associate with the logged-in doctor
      },
    });

    // Respond with the newly created patient
    return res.status(201).json(patient);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error creating patient' });
  }
};

const getAllPatients = async (req, res) => {
  try {
    // Assuming you have the doctorId stored in the JWT token after login
    const doctorId = req.doctor.id;  // This comes from the protect middleware (from JWT)

    // Querying the patients associated with the logged-in doctor
    const patients = await prisma.patient.findMany({
      where: {
        doctorId: doctorId,  // Only fetch patients linked to the logged-in doctor
      },
      select: {
        id: true,
        name: true,
        gender: true,
        age: true,
        smoker: true,
        alcoholConsumption: true,
        neurologicalCondition: true,
        
        doctorId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({ patients });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getPatientById = async (req, res) => {
  try {
    // Get patient ID from route params
    const { id } = req.params;

    // Assuming you have the doctorId stored in the JWT token after login
    const doctorId = req.doctor.id;  // This comes from the protect middleware (from JWT)

    // Querying the patient associated with the logged-in doctor
    const patient = await prisma.patient.findUnique({
      where: {
        id: parseInt(id),  // Ensure id is a number
        doctorId: doctorId,  // Ensure patient belongs to the logged-in doctor
      },
      select: {
        id: true,
        name: true,
        gender: true,
        age: true,
        smoker: true,
        alcoholConsumption: true,
        neurologicalCondition: true,
        doctorId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // If patient is not found
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    return res.status(200).json({ patient });
  } catch (error) {
    console.error('Error fetching patient by ID:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


const updatePatient = async (req, res) => {
  try {
    // Get the patient ID from route parameters
    const { id } = req.params;

    // Get the updated patient details from the request body
    const { name, gender, age, smoker, alcoholConsumption, neurologicalCondition } = req.body;

    // Assuming you have the doctorId stored in the JWT token after login
    const doctorId = req.doctor.id; // This comes from the protect middleware (from JWT)

    // Find the patient by ID and ensure it belongs to the logged-in doctor
    const patient = await prisma.patient.findUnique({
      where: {
        id: parseInt(id),
        doctorId: doctorId, // Only allow updates if patient belongs to the logged-in doctor
      },
    });

    // If patient is not found, return 404
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Update patient details
    const updatedPatient = await prisma.patient.update({
      where: {
        id: parseInt(id),
      },
      data: {
        name: name || patient.name,
        gender: gender || patient.gender,
        age: age || patient.age,
        smoker: smoker || patient.smoker,
        alcoholConsumption: alcoholConsumption || patient.alcoholConsumption,
        neurologicalCondition: neurologicalCondition || patient.neurologicalCondition,
      },
    });

    // Return the updated patient details
    return res.status(200).json({ patient: updatedPatient });
  } catch (error) {
    console.error('Error updating patient:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;  // Get patient ID from URL parameters

    // Check if the patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(id) },  // Find patient by ID
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Delete the patient
    await prisma.patient.delete({
      where: { id: parseInt(id) },  // Delete patient by ID
    });

    return res.status(200).json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Error deleting patient:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};





module.exports = {
  addPatient,
  updatePatient,
  deletePatient,
  getAllPatients,
  getPatientById,
};
