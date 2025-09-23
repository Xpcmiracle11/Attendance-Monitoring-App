const express = require("express");
const {
  getUserCount,
  geyPayrollGross,
} = require("../controllers/chartController");
const router = express.Router();

router.get("/user-count", getUserCount);
router.get("/payroll-count", geyPayrollGross);
module.exports = router;
