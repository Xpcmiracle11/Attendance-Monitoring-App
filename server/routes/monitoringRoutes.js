const express = require("express");
const { getMonitorings } = require("../controllers/monitoringController");

const router = express.Router();

router.get("/monitorings", getMonitorings);

module.exports = router;
