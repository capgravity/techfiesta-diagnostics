import React, { useState } from "react";
import axios from "axios";

const FileUpload = () => {
    const [file, setFile] = useState(null);
    const [uploadedUrl, setUploadedUrl] = useState("");

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) {
            alert("Please select a file to upload!");
            return;
        }

        const formData = new FormData();
        formData.append("mri", file);

        try {
            const response = await axios.post("http://localhost:5000/upload/gradcam", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data.cloudinaryUrl) {
                setUploadedUrl(response.data.cloudinaryUrl);
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            alert("Failed to upload file.");
        }
    };

    return (
        <div>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleUpload}>Upload</button>

            {uploadedUrl && (
                <div>
                    <h3>Uploaded File:</h3>
                    <img src={uploadedUrl} alt="Uploaded" style={{ width: "300px", height: "auto" }} />
                </div>
            )}
        </div>
    );
};

export default FileUpload;
