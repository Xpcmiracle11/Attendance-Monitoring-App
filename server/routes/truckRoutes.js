const express = require("express");
const {
  getTrucks,
  insertTruck,
  updateTruck,
  deleteTruck,
  insertTruckRegistration,
} = require("../controllers/truckController");

const router = express.Router();

router.get("/trucks", getTrucks);
router.post("/insert-truck", insertTruck);
router.put("/update-truck/:id", updateTruck);
router.delete("/delete-truck/:id", deleteTruck);
router.post("/insert-truck-registration/:id", insertTruckRegistration);

module.exports = router;
