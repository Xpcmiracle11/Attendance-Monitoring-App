const express = require("express");
const {
  getOrders,
  insertOrder,
  updateOrder,
  deleteOrder,
} = require("../controllers/orderController");

const router = express.Router();

router.get("/orders", getOrders);
router.post("/insert-order", insertOrder);
router.put("/update-order/:id", updateOrder);
router.delete("/delete-order/:id", deleteOrder);

module.exports = router;
