const express = require("express");
const { getUserCount } = require("../controllers/chartController");
const router = express.Router();

router.get("/user-count", getUserCount);

module.exports = router;
