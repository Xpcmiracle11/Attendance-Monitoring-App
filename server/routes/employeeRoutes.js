const express = require("express");
const {
  getEmployeeDetails,
  getEmployeePayroll,
  getEmployeeAttendance,
} = require("../controllers/employeeController");

const router = express.Router();

router.get("/employee/:id", getEmployeeDetails);
router.get("/employee-payroll/:id", getEmployeePayroll);
router.get("/employee-attendance/:id", getEmployeeAttendance);

module.exports = router;
