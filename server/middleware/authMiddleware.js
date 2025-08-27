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

    const today = new Date().toISOString().split("T")[0];

    const [results] = await db.promise().query(
      `
      SELECT id from attendance_details WHERE user_id = ? AND DATE(clock_in) = ?
      `,
      [decoded.id, today]
    );

    if (results.length === 0) {
      return res.status(401).json({
        success: false,
        message: "No clock-in for today.",
      });
    }

    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return res.status(401).json({ success: false, message: "Invalid token!" });
  }
};

module.exports = { authenticateUser };
