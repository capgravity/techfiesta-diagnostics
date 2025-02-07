import React, { useState } from 'react';

const AlzheimerP = () => {
  const [file, setFile] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const fileType = selectedFile.type;
      const validImageTypes = ['image/jpeg', 'image/png'];

      if (!validImageTypes.includes(fileType)) {
        setError('Invalid file type. Please upload a JPEG or PNG image.');
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select an image file.');
      return;
    }

    setLoading(true);
    setError(null);
    setPrediction(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/prediction', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image.');
      }

      const data = await response.json();
      // Access the nested prediction data from the backend response
      setPrediction(data.prediction); // Key change here
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Alzheimer's Prediction</h1>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Processing...' : 'Upload and Predict'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {prediction && (
        <div>
          <h2>Prediction Result:</h2>
          {/* Check if the prediction is an MRI result */}
          {prediction.prediction && (
            <p>MRI: {prediction.prediction}</p>
          )}
          {/* Check if Alzheimer's probability exists */}
          {prediction.alzheimer_probability !== undefined && (
            <p>Alzheimer Probability: {prediction.alzheimer_probability.toFixed(2)}%</p>
          )}
          {/* Check if there's a message (e.g., non-MRI) */}
          {prediction.message && (
            <p>{prediction.message}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AlzheimerP;