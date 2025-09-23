const express = require("express");
const {
  getPayrolls,
  insertPayrolls,
  updatePayroll,
  confirmPayroll,
  deletePayroll,
  getArchivePayrolls,
} = require("../controllers/payrollController.js");
const router = express.Router();

router.get("/payrolls", getPayrolls);
router.post("/insert-payroll", insertPayrolls);
router.put("/update-payroll/:id", updatePayroll);
router.put("/confirm-payroll/:id", confirmPayroll);
router.delete("/delete-payroll/:id", deletePayroll);
router.get("/archive-payrolls", getArchivePayrolls);

module.exports = router;
