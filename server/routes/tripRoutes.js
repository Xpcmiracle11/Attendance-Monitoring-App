const express = require("express");
const { authenticateUser } = require("../middleware/authMiddleware");
const {
  getTrip,
  startTrip,
  getRouteHistory,
  insertRouteHistory,
  endTrip,
} = require("../controllers/tripController");

const router = express.Router();

router.get("/trip", getTrip);
router.put("/start-trip", startTrip);
router.get("/route-history/:dispatchId", getRouteHistory);
router.post("/insert-route-history", insertRouteHistory);
router.put("/end-trip", endTrip);

module.exports = router;
