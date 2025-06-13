const express = require("express");
const {
  getContributions,
  updateContribution,
} = require("../controllers/contributionController");
const router = express.Router();

router.get("/contributions", getContributions);
router.put("/update-contribution/:id", updateContribution);

module.exports = router;
