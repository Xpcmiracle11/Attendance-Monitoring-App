const jwt = require("jsonwebtoken");
const db = require("../config/db");

const tokenBlacklist = new Set();

const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized!" });
  }

  if (tokenBlacklist.has(token)) {
    return res
      .status(403)
      .json({ success: false, message: "Token is blacklisted!" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return res.status(401).json({ success: false, message: "Invalid token!" });
  }
};

module.exports = { authenticateUser };
