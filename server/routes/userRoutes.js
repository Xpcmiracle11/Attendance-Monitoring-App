const express = require("express");
const upload = require("../config/multerConfig");
const {
  getUsers,
  insertUser,
  updateUser,
  deleteUser,
  updateSchedule,
} = require("../controllers/userController");

const router = express.Router();

router.get("/users", getUsers);
router.post("/insert-user", upload.single("image"), insertUser);
router.put("/update-user/:id", upload.single("imageFileName"), updateUser);
router.delete("/delete-user/:id", deleteUser);
router.post("/update-schedule/:userId", updateSchedule);

module.exports = router;
