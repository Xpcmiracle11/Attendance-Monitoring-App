const express = require("express");
const {
  getNpiLmrs,
  approveNpiLmr,
  updateNpiLmr,
} = require("../controllers/lmrController");

const router = express.Router();

router.get("/lmrs", getNpiLmrs);
router.post("/approve-lmr/:waybill", approveNpiLmr);
router.put("/update-lmr/:waybill", updateNpiLmr);

module.exports = router;
