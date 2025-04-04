const express = require("express");
const { loginUser, getUserDetails } = require("../controllers/authController");
const { authenticateUser } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/user", authenticateUser, getUserDetails);
router.post("/login", loginUser);

module.exports = router;
