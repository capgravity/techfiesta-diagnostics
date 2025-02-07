const express = require("express");
const router = express.Router();
const upload = require("../middleware/multerHanding");
const { uploadOnCloudinary } = require("../utils/cloudinary");
const axios = require('axios');
const fs = require("fs");

// Define the upload endpoint
router.post("/", upload.single("file"), async (req, res) => {
    try {
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

        // Send the Cloudinary URL to the ML server for prediction
        const mlServerResponse = await axios.post('http://localhost:8080/predict', {
            imageUrl: uploadResponse.url,
        });
        console.log("data is");
        console.log(mlServerResponse.data);
        console.log("cloudinary url is :");
        console.log(uploadResponse.url);
        // Send the ML server's response back to the frontend
        return res.status(200).json({
            message: "File uploaded and processed successfully",
            cloudinaryUrl: uploadResponse.url,
            prediction: mlServerResponse.data,
        });
    } catch (error) {
        console.error("Error handling file upload:", error);
        return res.status(500).json({ error: "Failed to upload and process file" });
    }
});

module.exports = router;