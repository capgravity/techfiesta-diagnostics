const prisma = require('../utils/prisma');

// Add a new patient
const addPatient = async (req, res) => {
  const { name, email, age, gender, brainScan, alzheimerBiomarkers, cognitiveTests } = req.body;
  //tocheck for unique email
  const existingPatient = await prisma.Patient.findUnique({
    where: { email: email },
  });

  if (existingPatient) {
    return res.status(400).json({ message: 'Patient with this email already exists.' });
  }
  try {
    const patient = await prisma.Patient.create({
      data: {
        name,
        email,
        age,
        gender,
        alzheimerBiomarkers: { set: alzheimerBiomarkers }, // Set the Alzheimer's biomarkers
        cognitiveTests: {
          create: cognitiveTests, // Nested create for cognitive tests
        },
        doctor: { connect: { id: req.doctor.id } }, // Connect to doctor
      },
    });

    // Handle brain scan if provided
    if (brainScan) {
      await prisma.BrainScan.create({
        data: {
          scanType: brainScan.scanType,
          scanDate: brainScan.scanDate,
          scanImage: brainScan.scanImage,
          tumorDetected: brainScan.tumorDetected,
          tumorType: brainScan.tumorType,
          patient: { connect: { id: patient.id } },
        },
      });
    }

    // Update doctor’s patient list
    await prisma.Doctor.update({
      where: { id: req.doctor.id },
      data: {
        patients: {
          connect: { id: patient.id },
        },
      },
    });

    res.status(201).json({ message: 'Patient added successfully', patient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while adding patient' });
  }
};

// Update patient details
const updatePatient = async (req, res) => {
  const { name, email, age, gender, brainScan, alzheimerBiomarkers, cognitiveTests } = req.body;

  try {
    const patient = await prisma.Patient.findFirst({
      where: {
        id: parseInt(req.params.id),
        doctorId: req.doctor.id,
      },
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const updatedPatient = await prisma.Patient.update({
      where: { id: patient.id },
      data: {
        name: name || patient.name,
        email: email || patient.email,
        age: age || patient.age,
        gender: gender || patient.gender,
        alzheimerBiomarkers: { set: alzheimerBiomarkers || patient.alzheimerBiomarkers },
        cognitiveTests: {
          create: cognitiveTests || patient.cognitiveTests, // Create new cognitive tests if provided
        },
      },
    });
        // Handle brain scan update if provided
if (brainScan) {
  await prisma.BrainScan.upsert({
    where: {
      patientId: 1 // Replace with the actual patient ID
    },
    update: {
      scanType: "MRI",
      scanDate: new Date("2025-01-01T00:00:00Z").toISOString(), // Ensure the date is in ISO-8601 format
      scanImage: "image_url",
      tumorDetected: false,
      tumorType: null
    },
    create: {
      scanType: "MRI",
      scanDate: new Date("2025-01-01T00:00:00Z").toISOString(), // Ensure the date is in ISO-8601 format
      scanImage: "image_url",
      tumorDetected: false,
      tumorType: null,
      patient: {
        connect: {
          id: 1 // Replace with the actual patient ID
        }
      }
    }
  });
}
    res.json({ message: 'Patient details updated successfully', updatedPatient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating patient' });
  }
};

const deletePatient = async (req, res) => {
  try {
    const patientId = parseInt(req.params.id, 10);

    // Step 1: Validate patient ID
    if (isNaN(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }

    // Step 2: Find the patient along with related data
    const patient = await prisma.Patient.findUnique({
      where: { id: patientId },
      include: { brainScan: true, cognitiveTests: true, doctor: true },
    });

    // Step 3: Check if the patient exists
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    

    // Step 4: Delete related brain scan if it exists
    if (patient.brainScan) {
      await prisma.BrainScan.delete({
        where: { id: patient.brainScan.id },
      });
    }

    // Step 5: Delete related cognitive tests if they exist
    if (patient.cognitiveTests.length > 0) {
      await prisma.CognitiveTest.deleteMany({
        where: { patientId: patientId },
      });
    }

    // Step 6: Remove the patient from the doctor's list of patients (disconnect the relationship)
    if (patient.doctor) {
      await prisma.Doctor.update({
        where: { id: patient.doctorId },
        data: {
          patients: {
            disconnect: { id: patientId },
          },
        },
      });
    }

    // Step 7: Delete the patient record
    await prisma.Patient.delete({
      where: { id: patientId },
    });

    // Step 8: Respond with success message
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error(error);

    // Step 9: Handle Prisma errors specifically
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Step 10: General error handling
    res.status(500).json({ message: 'Server error while deleting patient' });
  }
};


// Brain tumor and Alzheimer’s detection
const detection = async (req, res) => {
  const { brainTumorModelData, alzheimerModelData } = req.body;

  try {
    const patient = await prisma.Patient.findFirst({
      where: {
        id: parseInt(req.params.id),
        doctorId: req.doctor.id,
      },
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const brainTumorResult = brainTumorModelData ? 'Tumor Detected' : 'No Tumor Detected';
    const alzheimerResult = alzheimerModelData ? 'Alzheimer’s Risk Detected' : 'No Alzheimer’s Risk';

    res.json({
      message: 'Detection complete',
      brainTumorResult,
      alzheimerResult,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during detection' });
  }
};

// Get all patients for the logged-in doctor
const getAllPatients = async (req, res) => {
    try {
      const patients = await prisma.Patient.findMany({
        where: {
          doctorId: req.doctor.id, // Assuming doctor information is in req.doctor
        },
      });
  
      if (!patients.length) {
        return res.status(404).json({ message: 'No patients found' });
      }
  
      res.json({ message: 'Patients retrieved successfully', patients });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error while fetching patients' });
    }
  };

// Get a single patient by ID
const getPatientById = async (req, res) => {
  try {
    const patientId = parseInt(req.params.id, 10); // Ensure the ID is parsed as an integer

    if (isNaN(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }

    const patient = await prisma.Patient.findUnique({
      where: {
        id: patientId, // Fetch patient by ID
      },
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Optional: Check if the logged-in doctor is the owner of the patient record
    if (patient.doctorId !== req.doctor.id) {
      return res.status(403).json({ message: 'You are not authorized to access this patient' });
    }

    res.json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching patient' });
  }
};

module.exports = {
  addPatient,
  updatePatient,
  deletePatient,
  detection,
  getAllPatients,
  getPatientById,
};
