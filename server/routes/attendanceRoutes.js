const express = require("express");
const {
  getAttendance,
  updateAttendance,
} = require("../controllers/attendanceController");

const router = express.Router();

router.get("/attendances", getAttendance);
router.put("/update-attendance/:id", updateAttendance);

module.exports = router;
