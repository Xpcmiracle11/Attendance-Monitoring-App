const express = require("express");
const {
  loginUser,
  getUserDetails,
  getUserPayroll,
  logoutUser,
} = require("../controllers/authController");
const { authenticateUser } = require("../middleware/authMiddleware");

const router = express.Router();
console.log("🔧 Route hit: GET /user");
router.get("/user", authenticateUser, getUserDetails);
router.get("/user-payroll", authenticateUser, getUserPayroll);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

module.exports = router;
