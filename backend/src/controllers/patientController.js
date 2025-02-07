const prisma = require('../utils/prisma');
const { uploadOnCloudinary } = require("../utils/cloudinary");
const axios = require('axios');
const fs = require("fs");


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
    const { id } = req.params; // Get patient ID from route params
    const doctorId = req.doctor.id; // Ensure the patient belongs to the logged-in doctor

    const patient = await prisma.patient.findUnique({
      where: {
        id: parseInt(id),
        doctorId: doctorId, // Ensure the patient belongs to the logged-in doctor
      },
      include: {
        mriScans: {
          orderBy: {
            createdAt: 'desc', // Sort MRI scans by creation date (newest first)
          },
        },
        gradCamScans: {
          orderBy: {
            createdAt: 'desc', // Sort Grad-CAM scans by creation date (newest first)
          },
        },
      },
    });



    // If patient is not found
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Return the patient data with MRI and Grad-CAM scans
    return res.status(200).json({
      patient: {
        id: patient.id,
        name: patient.name,
        gender: patient.gender,
        age: patient.age,
        smoker: patient.smoker,
        alcoholConsumption: patient.alcoholConsumption,
        neurologicalCondition: patient.neurologicalCondition,
        alzheimerPredictionScores: patient.alzheimerPredictionScores,
        mriScans: patient.mriScans, // Array of MRI scans
        gradCamScans: patient.gradCamScans, // Array of Grad-CAM scans
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching patient details:', error);
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
        age: parseInt(age,10) || patient.age,
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

const predictionPatient= async (req,res) => {
  try {
    const patientId = parseInt(req.params.id, 10);

    // Check if the file exists in the request
    if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
    }

    const localFilePath = req.file.path; // Temporary file path
    console.log("Temporary file path:", localFilePath);

    // Upload to Cloudinary
    const uploadResponse = await uploadOnCloudinary(localFilePath);

    // If the upload is successful, delete the local file
    try {
        fs.unlinkSync(localFilePath);
    } catch (err) {
        console.error("Error deleting temp file:", err);
    }

    // Store the MRI scan URL in the MriScan model
    await prisma.mriScan.create({
        data: {
            publicImageUrl: uploadResponse.url,
            patientId: patientId,
        },
    });

    // Send the Cloudinary URL to the ML server for prediction
    const mlServerResponse = await axios.post('http://localhost:8080/predict', {
        imageUrl: uploadResponse.url,
    });
    const alzheimerProbability = mlServerResponse.data.alzheimer_probability;
    // modified 2.0

    // // Get the current patient to retrieve existing scores
    // const currentPatient = await prisma.patient.findUnique({
    //   where: { id: patientId },
    // });

    // // Append the new score
    // const updatedScores = [...currentPatient.alzheimerPredictionScores, alzheimerProbability];

    // // Update the patient with the new scores array
    // await prisma.patient.update({
    //   where: { id: patientId },
    //   data: {
    //     alzheimerPredictionScores: updatedScores,
    //   },
    // });

    await prisma.$transaction(async (prisma) => {
      const currentPatient = await prisma.patient.findUnique({
        where: { id: patientId },
      });
    
      const updatedScores = [...currentPatient.alzheimerPredictionScores, alzheimerProbability];
    
      await prisma.patient.update({
        where: { id: patientId },
        data: {
          alzheimerPredictionScores: updatedScores,
        },
      });
    });

    // Send the response back to the frontend
    return res.status(200).json({
        message: "File uploaded and processed successfully",
        cloudinaryUrl: uploadResponse.url,
        prediction: mlServerResponse.data,
    });
} catch (error) {
    console.error("Error handling file upload:", error);
    return res.status(500).json({ error: "Failed to upload and process file" });
} finally {
  await prisma.$disconnect();
}

};

const gradcamPatient= async(req, res) =>{
  try {
    const patientId = parseInt(req.params.id,10);
    
    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No MRI file provided" });
    }

    const localFilePath = req.file.path;

    // Upload MRI to Cloudinary
    const mriCloudinaryResponse = await uploadOnCloudinary(localFilePath);
    
    // Cleanup temp file
    try {
      fs.unlinkSync(localFilePath);
    } catch (err) {
      console.error("Error deleting MRI temp file:", err);
    }

    if (!mriCloudinaryResponse?.url) {
      return res.status(500).json({ error: "Failed to upload MRI to Cloudinary" });
    }

    // Create MRI Scan record
    const mriScan = await prisma.mriScan.create({
      data: {
        publicImageUrl: mriCloudinaryResponse.url,
        patientId: patientId,
      },
    });

    // Process with Grad-CAM model
    const gradcamResponse = await axios.post('http://localhost:8080/process', {
      imageUrl: mriCloudinaryResponse.url,
    });

    if (!gradcamResponse.data?.heatmapPath) {
      return res.status(500).json({ error: "Grad-CAM processing failed" });
    }

    const heatmapLocalPath = gradcamResponse.data.heatmapPath;

    // Upload Heatmap to Cloudinary
    const heatmapCloudinaryResponse = await uploadOnCloudinary(heatmapLocalPath);
    
    // Cleanup heatmap temp file
    try {
      fs.unlinkSync(heatmapLocalPath);
    } catch (err) {
      console.error("Error deleting heatmap temp file:", err);
    }

    if (!heatmapCloudinaryResponse?.url) {
      return res.status(500).json({ error: "Failed to upload heatmap to Cloudinary" });
    }

    // Create Grad-CAM Scan record
    await prisma.gradCamScan.create({
      data: {
        publicImageUrl: heatmapCloudinaryResponse.url,
        mriScanId: mriScan.id,
        patientId: mriScan.patientId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "MRI and Grad-CAM scans processed successfully",
      heatmapUrl: heatmapCloudinaryResponse.url,
      mriUrl: mriCloudinaryResponse.url,
    });

  } catch (error) {
    console.error("Error in gradcamPatient:", error);
    
    // Cleanup any remaining temporary files
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error("Error cleaning up temp file:", err);
      }
    }

    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};


module.exports = {
  addPatient,
  updatePatient,
  deletePatient,
  getAllPatients,
  getPatientById,
  predictionPatient,
  gradcamPatient,
};
