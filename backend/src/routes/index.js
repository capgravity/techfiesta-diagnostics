const express = require('express');
const router = express.Router();

// Root route
router.get('/', (req, res) => {
  res.send('Welcome to the AI-Based Diagnostics Assistance API!');
});

module.exports = router;

