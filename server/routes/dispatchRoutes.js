const express = require("express");
const {
  getDispatches,
  insertDispatch,
  updateDispatch,
  deleteDispatch,
} = require("../controllers/dispatchController");

const router = express.Router();

router.get("/dispatches", getDispatches);
router.post("/insert-dispatch", insertDispatch);
router.put("/update-dispatch/:id", updateDispatch);
router.delete("/delete-dispatch/:id", deleteDispatch);
module.exports = router;
