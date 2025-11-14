const express = require("express");
const {
  getSites,
  insertSite,
  updateSite,
  deleteSite,
} = require("../controllers/siteController");

const router = express.Router();

router.get("/sites", getSites);
router.post("/insert-site", insertSite);
router.put("/update-site/:id", updateSite);
router.delete("/delete-site/:id", deleteSite);
module.exports = router;
