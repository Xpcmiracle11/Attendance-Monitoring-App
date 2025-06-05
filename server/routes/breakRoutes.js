const express = require("express");
const {
  startBreak,
  checkBreakLimits,
  endBreak,
} = require("../controllers/breakController");

const router = express.Router();
router.get("/break-limits", checkBreakLimits);
router.post("/break-start", startBreak);
router.put("/break-end", endBreak);

module.exports = router;
