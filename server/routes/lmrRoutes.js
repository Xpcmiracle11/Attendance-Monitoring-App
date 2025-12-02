const express = require("express");
const {
  getNpiLmrs,
  approveNpiLmr,
  updateNpiLmr,
  deleteNpiLmr,
} = require("../controllers/lmrController");

const router = express.Router();

router.get("/lmrs", getNpiLmrs);
router.post("/approve-lmr/:waybill", approveNpiLmr);
router.put("/update-lmr/:waybill", updateNpiLmr);
router.delete("/delete-lmr/:waybill", deleteNpiLmr);

module.exports = router;
