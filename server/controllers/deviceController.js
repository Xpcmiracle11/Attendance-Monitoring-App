const db = require("../config/db");

const runQuery = async (sql, params = []) => {
  const conn = await db.getDB();
  const [rows] = await conn.query(sql, params);
  return rows;
};

const getDevices = async (req, res) => {
  try {
    const sql = `
      SELECT 
        id, name, ip_address, port, 
        DATE_FORMAT(created_at, '%Y-%m-%d') AS created_at 
      FROM biometric_devices 
      ORDER BY created_at ASC
    `;
    const devices = await runQuery(sql);
    res.json({ success: true, data: devices });
  } catch (error) {
    console.error("Error fetching devices:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const insertDevice = async (req, res) => {
  const { name, ip_address, port } = req.body;

  if (!name || !ip_address || !port) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid device data." });
  }

  try {
    const existing = await runQuery(
      "SELECT id FROM biometric_devices WHERE ip_address = ?",
      [ip_address]
    );
    if (existing.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "IP Address already exists." });
    }

    const sql = `
      INSERT INTO biometric_devices (name, ip_address, port)
      VALUES (?, ?, ?)
    `;
    await runQuery(sql, [name, ip_address, port]);

    res.json({ success: true, message: "Device added successfully." });
  } catch (error) {
    console.error("Error inserting device:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const updateDevice = async (req, res) => {
  const { id } = req.params;
  const { name, ip_address, port } = req.body;

  if (!id || !name || !ip_address || !port) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid device data." });
  }

  try {
    const device = await runQuery(
      "SELECT id FROM biometric_devices WHERE id = ?",
      [id]
    );
    if (device.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Device not found." });
    }

    const duplicate = await runQuery(
      "SELECT id FROM biometric_devices WHERE ip_address = ? AND id != ?",
      [ip_address, id]
    );
    if (duplicate.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Device IP already exists." });
    }

    const sql = `
      UPDATE biometric_devices 
      SET name = ?, ip_address = ?, port = ?
      WHERE id = ?
    `;
    const result = await runQuery(sql, [name, ip_address, port, id]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Device not found." });
    }

    res.json({ success: true, message: "Device updated successfully." });
  } catch (error) {
    console.error("Error updating device:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const deleteDevice = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid device ID." });
  }

  try {
    const sql = "DELETE FROM biometric_devices WHERE id = ?";
    const result = await runQuery(sql, [id]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Device not found." });
    }

    res.json({ success: true, message: "Device deleted successfully." });
  } catch (error) {
    console.error("Error deleting device:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

module.exports = {
  getDevices,
  insertDevice,
  updateDevice,
  deleteDevice,
};
