const express = require("express");
const {
  getNpiDmrs,
  insertNpiDmr,
  updateNpiDmr,
  deleteNpiDmr,
  getUlDmrs,
  insertUlDmr,
  updateUlDmr,
  deleteUlDmr,
  getPanaDmrs,
  insertPanaDmr,
  updatePanaDmr,
  deletePanaDmr,
  getTdiDmrs,
  insertTdiDmr,
} = require("../controllers/dmrController");

const router = express.Router();

//NPI
router.get("/npi-dmrs/", getNpiDmrs);
router.post("/insert-npi-dmr/", insertNpiDmr);
router.put("/update-npi-dmr/:id", updateNpiDmr);
router.delete("/delete-npi-dmr/:id", deleteNpiDmr);
//UL
router.get("/ul-dmrs/", getUlDmrs);
router.post("/insert-ul-dmr/", insertUlDmr);
router.put("/update-ul-dmr/:id", updateUlDmr);
router.delete("/delete-ul-dmr/:id", deleteUlDmr);
//PANA
router.get("/pana-dmrs/", getPanaDmrs);
router.post("/insert-pana-dmr/", insertPanaDmr);
router.put("/update-pana-dmr/:id", updatePanaDmr);
router.delete("/delete-pana-dmr/:id", deletePanaDmr);
//TDI
router.get("/tdi-dmrs/", getTdiDmrs);
router.post("/insert-tdi-dmr/", insertTdiDmr);
module.exports = router;
