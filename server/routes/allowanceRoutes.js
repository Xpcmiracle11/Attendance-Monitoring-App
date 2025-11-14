const express = require("express");
const {
  getAllowances,
  //   insertMatrix,
  //   updateMatrix,
  //   deleteMatrix,
} = require("../controllers/allowanceController");

const router = express.Router();

router.get("/allowances", getAllowances);
// router.post("/insert-matrix", insertMatrix);
// router.put("/update-matrix/:id", updateMatrix);
// router.delete("/delete-matrix/:id", deleteMatrix);
module.exports = router;
