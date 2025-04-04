const express = require("express");
const {
  getDepartments,
  insertDepartment,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/departmentController");

const router = express.Router();

router.get("/departments", getDepartments);
router.post("/insert-department", insertDepartment);
router.put("/update-department/:id", updateDepartment);
router.delete("/delete-department/:id", deleteDepartment);

module.exports = router;
