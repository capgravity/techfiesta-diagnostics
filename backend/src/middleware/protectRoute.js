const jwt = require("jsonwebtoken");
const prisma = require("../utils/prisma");

const protectRoute = async (req, res, next) => {
  try {
    const token =
      req.cookies?.jwt || req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Unauthorised: No token Provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ error: "Unauthorised: Invalid Token" });
    }

    // Fetch the doctor from the database using the decoded ID
    const doctor = await prisma.Doctor.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        specialty: true,
        // Add other fields you may want to include
      },
    });

    if (!doctor) {
      return res.status(404).json({ error: "User Not found!" });
    }
    req.doctor = doctor;
    next();
  } catch (error) {
    console.log("Error in protect Route middleware", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
module.exports = protectRoute;
