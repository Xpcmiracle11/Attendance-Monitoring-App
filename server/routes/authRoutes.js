const express = require("express");
const {
  loginUser,
  getUserDetails,
  getUserPayroll,
  getUserAttendance,
  logoutUser,
} = require("../controllers/authController");
const { authenticateUser } = require("../middleware/authMiddleware");

const router = express.Router();
router.get("/user", authenticateUser, getUserDetails);
router.get("/user-payroll", authenticateUser, getUserPayroll);
router.get("/user-attendance", authenticateUser, getUserAttendance);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

module.exports = router;
