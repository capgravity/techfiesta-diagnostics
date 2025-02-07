const express = require("express");
const router = express.Router();
const upload = require("../middleware/multerHanding");
const { uploadOnCloudinary } = require("../utils/cloudinary");
const axios = require("axios");
const fs = require("fs");
const session = require("express-session"); // For session management

// Initialize session middleware
router.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Endpoint for initial file upload and text query
router.post("/upload", upload.single("file"), async (req, res) => {
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

        // Store the Cloudinary URL in the session
        req.session.imageUrl = uploadResponse.url;

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

// Endpoint for subsequent text queries (no file upload required)
router.post("/query", async (req, res) => {
    try {
        const userText = req.body.text; // Text input from the user

        // Check if the image URL is stored in the session
        if (!req.session.imageUrl) {
            return res.status(400).json({ error: "No image associated with this session. Please upload an image first." });
        }

        const imageUrl = req.session.imageUrl;

        // Forward the Cloudinary URL and text to the /analyze endpoint
        const analyzeResponse = await axios.post("http://localhost:8080/analyze", {
            prompt: userText,
            image_url: imageUrl,
        });

        // Send the response from the /analyze endpoint to the frontend
        return res.status(200).json({
            message: "Text query analyzed successfully",
            analysisResult: analyzeResponse.data.response,
        });
    } catch (error) {
        console.error("Error handling text query:", error);
        return res.status(500).json({ error: "Failed to process the text query" });
    }
});

module.exports = router;