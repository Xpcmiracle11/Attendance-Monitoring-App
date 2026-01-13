const express = require("express");
const {
  getFuels,
  insertFuel,
  updateFuel,
  deleteFuel,
} = require("../controllers/fuelController");

const router = express.Router();

router.get("/fuels", getFuels);
router.post("/insert-fuel", insertFuel);
router.put("/update-fuel/:id", updateFuel);
router.delete("/delete-fuel/:id", deleteFuel);
module.exports = router;
