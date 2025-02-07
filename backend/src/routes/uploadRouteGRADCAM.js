const express = require("express");
const upload = require("../middleware/multerHanding");
const { uploadOnCloudinary } = require("../utils/cloudinary");
const axios = require("axios");
const fs = require("fs");

const router = express.Router();

router.post("/", upload.single("mri"), async (req, res) => {
  try {
    // Check if the file exists in the request
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }
    
    const localFilePath = req.file.path;
    console.log("Temporary file path:", localFilePath);

    // Step 1: Upload MRI to Cloudinary
    const cloudinaryResponse = await uploadOnCloudinary(localFilePath);
    // If the upload is successful, delete the local file
    try {
      fs.unlinkSync(localFilePath);
    } catch (err) {
      console.error("Error deleting temp file:", err);
    }

    if (!cloudinaryResponse) {
      return res.status(500).json({ error: "Failed to upload image to Cloudinary" });
    }

    const mriImageUrl = cloudinaryResponse.url;

    // Step 2: Send MRI URL to Grad-CAM model
    const gradcamResponse = await axios.post("http://localhost:8080/process", {
      imageUrl: mriImageUrl,
    });

    if (!gradcamResponse.data || !gradcamResponse.data.heatmapPath) {
      return res.status(500).json({ error: "Failed to process Grad-CAM" });
    }

    const gradcamHeatmapPath = gradcamResponse.data.heatmapPath;

    console.log("Received heatmap path:", gradcamHeatmapPath);


    // Step 3: Upload Grad-CAM Heatmap to Cloudinary
    const heatmapCloudinaryResponse = await uploadOnCloudinary(gradcamHeatmapPath);
    fs.unlinkSync(gradcamHeatmapPath); // Remove local Grad-CAM image after uploading

    if (!heatmapCloudinaryResponse) {
      return res.status(500).json({ error: "Failed to upload heatmap to Cloudinary" });
    }

    const heatmapUrl = heatmapCloudinaryResponse.url;

    // Step 4: Send Heatmap URL to Frontend
    return res.status(200).json({
        message: "File uploaded successfully",
        cloudinaryUrl: heatmapUrl,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
