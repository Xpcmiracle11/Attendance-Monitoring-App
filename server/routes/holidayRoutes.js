const express = require("express");
const {
  getHolidays,
  insertHoliday,
  updateHoliday,
  deleteHoliday,
} = require("../controllers/holidayController");

const router = express.Router();

router.get("/holidays", getHolidays);
router.post("/insert-holiday", insertHoliday);
router.put("/update-holiday/:id", updateHoliday);
router.delete("/delete-holiday/:id", deleteHoliday);
module.exports = router;
