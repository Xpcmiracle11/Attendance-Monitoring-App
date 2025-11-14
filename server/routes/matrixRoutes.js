const express = require("express");
const {
  getMatrixes,
  insertMatrix,
  updateMatrix,
  deleteMatrix,
} = require("../controllers/matrixController");

const router = express.Router();

router.get("/matrixes", getMatrixes);
router.post("/insert-matrix", insertMatrix);
router.put("/update-matrix/:id", updateMatrix);
router.delete("/delete-matrix/:id", deleteMatrix);
module.exports = router;
