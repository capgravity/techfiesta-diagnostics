const express = require("express");
const router = express.Router();
const upload = require("../middleware/multerHanding");
const { uploadOnCloudinary } = require("../utils/cloudinary");
const axios = require("axios"); // For making HTTP requests
const fs = require("fs");

// Define the upload endpoint
router.post("/", upload.single("file"), async (req, res) => {
    try {
        // Check if the file and text are provided
        if (!req.file || !req.body.text) {
            return res.status(400).json({ error: "Please provide both a file and text" });
        }

        const localFilePath = req.file.path; // Temporary file path
        const userText = req.body.text; // Text input from the user

        console.log("Temporary file path:", localFilePath);
        console.log("User text:", userText);

        // Upload to Cloudinary
        const uploadResponse = await uploadOnCloudinary(localFilePath);

        // If the upload is successful, delete the local file
        try {
            fs.unlinkSync(localFilePath);
        } catch (err) {
            console.error("Error deleting temp file:", err);
        }

        // Forward the Cloudinary URL and text to the /analyze endpoint
        const analyzeResponse = await axios.post("http://localhost:8080/analyze", {
            prompt: userText,
            image_url: uploadResponse.url,
        });

        // Send the response from the /analyze endpoint to the frontend
        return res.status(200).json({
            message: "File uploaded and analyzed successfully",
            analysisResult: analyzeResponse.data.response,
        });
    } catch (error) {
        console.error("Error handling file upload or analysis:", error);
        return res.status(500).json({ error: "Failed to process the request" });
    }
});

module.exports = router;