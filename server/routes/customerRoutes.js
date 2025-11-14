const express = require("express");
const {
  getCustomers,
  insertCustomer,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customerController");

const router = express.Router();

router.get("/customers", getCustomers);
router.post("/insert-customer", insertCustomer);
router.put("/update-customer/:id", updateCustomer);
router.delete("/delete-customer/:id", deleteCustomer);

module.exports = router;
