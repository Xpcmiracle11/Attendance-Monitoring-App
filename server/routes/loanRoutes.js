const express = require("express");
const {
  getLoans,
  insertLoan,
  updateLoan,
  deleteLoan,
} = require("../controllers/loanController");
const router = express.Router();

router.get("/loans", getLoans);
router.post("/insert-loan", insertLoan);
router.put("/update-loan/:id", updateLoan);
router.delete("/delete-loan/:id", deleteLoan);

module.exports = router;
