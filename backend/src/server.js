require('dotenv').config(); // Load environment variables from .env file

const app = require('./app'); // Import the Express app from app.js
const prisma = require('./utils/prisma'); // Import Prisma Client (optional, for graceful shutdown)
const PORT = process.env.PORT || 5000; // Set the port for the server

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Gracefully shut down the server and Prisma Client on process termination ie ctrl+c
process.on('SIGINT', async () => {
  await prisma.$disconnect(); // Disconnect Prisma Client
  server.close(() => {
    console.log('Server and Prisma Client disconnected');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect(); // Disconnect Prisma Client when app is terminated
  server.close(() => {
    console.log('Server and Prisma Client disconnected');
    process.exit(0);
  });
});