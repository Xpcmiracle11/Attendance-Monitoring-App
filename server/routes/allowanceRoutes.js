const express = require("express");
const {
  getAllowances,
  updateAllowance,
  checkAllowance,
  approveAllowance,
  declineAllowance,
} = require("../controllers/allowanceController");

const router = express.Router();

router.get("/allowances", getAllowances);
router.put("/update-allowance/:waybill", updateAllowance);
router.post("/check-allowances/:waybill", checkAllowance);
router.post("/approve-allowances/:waybill", approveAllowance);
router.post("/decline-allowances/:waybill", declineAllowance);
module.exports = router;
