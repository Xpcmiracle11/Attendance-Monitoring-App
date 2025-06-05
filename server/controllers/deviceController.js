const db = require("../config/db");

const getDevices = (req, res) => {
  const sql = `SELECT id, name, ip_address, port, DATE_FORMAT(created_at, '%Y-%m-%d') AS created_at FROM biometric_devices ORDER BY created_at ASC`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching devices:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }
    res.json({ success: true, data: results });
  });
};

const insertDevice = (req, res) => {
  const { name, ip_address, port } = req.body;

  const sqlCheck = "SELECT * FROM biometric_devices WHERE ip_address = ?";
  db.query(sqlCheck, [ip_address], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }
    if (result.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "IP Address already exists." });
    }
  });

  const sqlInsert = `INSERT INTO biometric_devices (name, ip_address, port) VALUES (?, ?, ?)`;

  db.query(sqlInsert, [name, ip_address, port], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }
    res.json({ success: true, data: result });
  });
};

const updateDevice = (req, res) => {
  const { id } = req.params;
  const { name, ip_address, port } = req.body;

  if (!id || !name || !ip_address || !port) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid device data." });
  }

  const sqlCheckID = "SELECT * FROM biometric_devices WHERE id = ?";
  db.query(sqlCheckID, [id], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error." });
    }
    if (result.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Device not found" });
    }

    const sqlCheckName =
      "SELECT * FROM biometric_devices WHERE ip_address = ? AND id !=?";
    db.query(sqlCheckName, [ip_address, id], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error." });
      }
      if (result.length > 0) {
        return res
          .status(400)
          .json({ success: false, message: "Device IP already exists." });
      }

      const sqlUpdate =
        "UPDATE biometric_devices SET name = ?, ip_address = ?, port = ? WHERE id = ?";
      db.query(sqlUpdate, [name, ip_address, port, id], (err, result) => {
        if (err) {
          console.error("Error updating device:", err);
          return res
            .status(500)
            .json({ success: false, message: "Database error." });
        }
        if (result.affectedRows === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Device not found." });
        }
        res.json({ success: true, message: "Device updated successfully" });
      });
    });
  });
};

const deleteDevice = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid device ID." });
  }

  const sqlDelete = "DELETE FROM biometric_devices WHERE id = ?";

  db.query(sqlDelete, [id], (err, result) => {
    if (err) {
      console.error("Error deleting device:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error while deleting." });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Device not found." });
    }

    res.json({ success: true, message: "Device deleted successfully." });
  });
};

module.exports = { getDevices, insertDevice, updateDevice, deleteDevice };
