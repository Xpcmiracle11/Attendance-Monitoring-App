const express = require("express");
const {
  getNpiDmrs,
  insertNpiDmr,
  updateNpiDmr,
  deleteNpiDmr,
} = require("../controllers/dmrController");

const router = express.Router();

router.get("/dmrs/", getNpiDmrs);
router.post("/insert-dmr/", insertNpiDmr);
router.put("/update-dmr/:id", updateNpiDmr);
router.delete("/delete-dmr/:id", deleteNpiDmr);
module.exports = router;
