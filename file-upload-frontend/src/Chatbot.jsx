import React, { useState } from "react";
import axios from "axios";

const ImageUploadForm = () => {
    const [file, setFile] = useState(null);
    const [text, setText] = useState("");
    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleTextChange = (e) => {
        setText(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !text) {
            alert("Please provide both an image and text");
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("text", text);

        try {
            const res = await axios.post("http://localhost:5000/chatbot", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            setResponse(res.data.analysisResult);
        } catch (error) {
            console.error("Error uploading file or analyzing:", error);
            setResponse("Failed to process the request");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Upload Image and Text</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Image:</label>
                    <input type="file" onChange={handleFileChange} accept="image/*" />
                </div>
                <div>
                    <label>Text:</label>
                    <input type="text" value={text} onChange={handleTextChange} />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? "Processing..." : "Submit"}
                </button>
            </form>
            {response && (
                <div>
                    <h2>Analysis Result:</h2>
                    <p>{response}</p>
                </div>
            )}
        </div>
    );
};

export default ImageUploadForm;