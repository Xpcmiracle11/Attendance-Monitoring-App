const express = require("express");
const {
  getDevices,
  insertDevice,
  updateDevice,
  deleteDevice,
} = require("../controllers/deviceController");

const router = express.Router();

router.get("/devices", getDevices);
router.post("/insert-device", insertDevice);
router.put("/update-device/:id", updateDevice);
router.delete("/delete-device/:id", deleteDevice);
module.exports = router;
