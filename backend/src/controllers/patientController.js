const prisma = require('../utils/prisma');

// Add a new patient
const addPatient = async (req, res) => {
  const { name, email, age, gender, brainScan, alzheimerBiomarkers, cognitiveTests } = req.body;

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
        where: { patientId: patient.id },
        update: {
          scanType: brainScan.scanType,
          scanDate: brainScan.scanDate,
          scanImage: brainScan.scanImage,
          tumorDetected: brainScan.tumorDetected,
          tumorType: brainScan.tumorType,
        },
        create: {
          scanType: brainScan.scanType,
          scanDate: brainScan.scanDate,
          scanImage: brainScan.scanImage,
          tumorDetected: brainScan.tumorDetected,
          tumorType: brainScan.tumorType,
          patient: { connect: { id: patient.id } },
        },
      });
    }

    res.json({ message: 'Patient details updated successfully', updatedPatient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating patient' });
  }
};

// Delete a patient
const deletePatient = async (req, res) => {
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

    // Remove brain scan and cognitive tests
    await prisma.BrainScan.deleteMany({
      where: { patientId: patient.id },
    });
    await prisma.CognitiveTest.deleteMany({
      where: { patientId: patient.id },
    });

    // Remove patient from doctor
    await prisma.Doctor.update({
      where: { id: req.doctor.id },
      data: {
        patients: {
          disconnect: { id: patient.id },
        },
      },
    });

    // Delete the patient from the database
    await prisma.Patient.delete({ where: { id: patient.id } });

    res.json({ message: 'Patient removed successfully' });
  } catch (error) {
    console.error(error);
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
      const patient = await prisma.Patient.findFirst({
        where: {
          id: parseInt(req.params.id),
          doctorId: req.doctor.id, // Ensure the logged-in doctor can only access their own patients
        },
      });
  
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }
  
      res.json({ message: 'Patient retrieved successfully', patient });
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
