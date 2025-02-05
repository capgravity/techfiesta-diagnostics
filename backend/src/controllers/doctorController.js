const prisma = require("../utils/prisma");
const bcrypt = require("bcryptjs");
const generateTokenAndSetCookie = require("../utils/generateToken");

// Signup a new doctor
const signup = async (req, res) => {
  const { name, email, password, specialty } = req.body;

  try {
    if (!name || !email || !password || !specialty) {
      return res.status(400).json({ message: "All fields are required" });
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the doctor in the database
    const doctor = await prisma.Doctor.create({
      data: {
        name,
        email,
        password: hashedPassword, // Store the hashed password
        specialty,
      },
    });

    res.status(201).json({ message: "Doctor created successfully", doctor });
  } catch (error) {
    // Handle unique constraint error for email
    if (error.code === "P2002" && error.meta.target.includes("email")) {
      return res.status(400).json({ message: "Email already exists" });
    }

    res.status(500).json({ message: "Error creating doctor", error });
  }
};


const profile = async (req, res) => {
  try {
    const doctorId = req.doctor.id;

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        patients: {
          include: {
            mriScans: true, // Fetch related MRI scans
            gradCamScans: true, // Fetch related GradCam scans
          },
        },
      },
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: "Error fetching doctor profile", error });
  }
};

// Login a doctor
const login = async (req, res) => {
  const { email, password } = req.body;
  console.log("email", email, "password", password);

  try {
    // Find the doctor by email
    const doctor = await prisma.Doctor.findUnique({ where: { email } });
    console.log("doctor", doctor);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Compare the provided password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, doctor.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }
    // Generate a JWT token
    const token = generateTokenAndSetCookie(doctor.id, res);

    res.json({
      message: "Login successful",
      token,
      user: { id: doctor.id, name: doctor.name, email: doctor.email },
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error });
  }
};

const logout = (req, res) => {
  //or
  // Invalidate the token by simply telling the client to delete it
  // This is done on the frontend (e.g., by removing the token from localStorage or cookies)
  try {
    res.cookie("jwt", "", {
      maxAge: 0,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV !== "development",
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  signup,
  profile,
  login,
  logout,
};
