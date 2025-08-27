const db = require("../config/db");

const getOrders = (req, res) => {
  const sql = `SELECT id, principal, transport_number, 
    shipper, origin_name, origin_region, origin_province, origin_city, origin_zip, 
    destination_name, destination_region, destination_province, destination_city, destination_zip, status,
    CONCAT_WS(', ', origin_region, origin_city, COALESCE(origin_zip, NULL)) AS origin_address,
    CONCAT_WS(', ', destination_region, destination_city, COALESCE(destination_zip, NULL)) AS destination_address,
    DATE_FORMAT(acceptance_date, '%M %d, %Y %h:%i %p') AS acceptance_date_words, 
    DATE_FORMAT(acceptance_date, '%Y-%m-%dT%H:%i') AS acceptance_date,
    DATE_FORMAT(created_at, '%Y-%m-%d') as created_at 
    FROM accepted_transports ORDER BY created_at ASC
    `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching orders:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }
    res.json({ success: true, data: results });
  });
};

const insertOrder = (req, res) => {
  const {
    principal,
    transport_number,
    shipper,
    origin_name,
    origin_region,
    origin_province,
    origin_city,
    origin_zip,
    destination_name,
    destination_region,
    destination_province,
    destination_city,
    destination_zip,
    acceptance_date,
  } = req.body;

  const sqlCheck =
    "SELECT * FROM accepted_transports WHERE transport_number = ?";
  db.query(sqlCheck, [transport_number], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }
    if (result.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Transport number already exist." });
    }

    const sqlInsert = `INSERT INTO accepted_transports (
    principal,
    transport_number,
    shipper,
    origin_name,
    origin_region,
    origin_province,
    origin_city,
    origin_zip,
    destination_name,
    destination_region,
    destination_province,
    destination_city,
    destination_zip,
    acceptance_date,
    status
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const values = [
      principal,
      transport_number,
      shipper,
      origin_name,
      origin_region,
      origin_province,
      origin_city,
      origin_zip,
      destination_name,
      destination_region,
      destination_province,
      destination_city,
      destination_zip,
      acceptance_date,
      "Pending",
    ];

    db.query(sqlInsert, values, (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      }
      res.json({ success: true, message: "Order added successfully" });
    });
  });
};

const updateOrder = (req, res) => {
  const { id } = req.params;
  const {
    transport_number,
    shipper,
    origin_name,
    origin_region,
    origin_province,
    origin_city,
    origin_zip,
    destination_name,
    destination_region,
    destination_province,
    destination_city,
    destination_zip,
    acceptance_date,
  } = req.body;

  if (
    !id ||
    !transport_number ||
    !shipper ||
    !origin_name ||
    !origin_region ||
    !origin_province ||
    !origin_city ||
    !origin_zip ||
    !destination_name ||
    !destination_region ||
    !destination_province ||
    !destination_city ||
    !destination_zip ||
    !acceptance_date
  ) {
    return res.status(400).json({
      success: false,
      message: "Missing required order fields.",
    });
  }

  const sqlCHeckID = "SELECT * FROM accepted_transports WHERE id = ?";
  db.query(sqlCHeckID, [id], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error." });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const sqlCheckTransportNumber =
      "SELECT * FROM accepted_transports WHERE transport_number = ? AND id != ?";
    db.query(sqlCheckTransportNumber, [transport_number, id], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error." });
      }

      if (result.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Transport number already exists",
        });
      }

      const sqlUpdate = `
      UPDATE accepted_transports SET
        transport_number = ?,
        shipper = ?,
        origin_name = ?,
        origin_region = ?,
        origin_province = ?,
        origin_city = ?,
        origin_zip = ?,
        destination_name = ?,
        destination_region = ?,
        destination_province = ?,
        destination_city = ?,
        destination_zip = ?,
        acceptance_date = ?
        WHERE id = ?
      `;
      const values = [
        transport_number,
        shipper,
        origin_name,
        origin_region,
        origin_province,
        origin_city,
        origin_zip,
        destination_name,
        destination_region,
        destination_province,
        destination_city,
        destination_zip,
        acceptance_date,
        id,
      ];

      db.query(sqlUpdate, values, (err, result) => {
        if (err) {
          console.error("Error updating truck:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to update order",
          });
        }
        if (result.affectedRows === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Order not found." });
        }
        res.json({ success: true, message: "Order updated successfully." });
      });
    });
  });
};

const deleteOrder = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid order ID." });
  }

  const sqlDelete = "DELETE FROM accepted_transports WHERE id = ?";

  db.query(sqlDelete, [id], (err, result) => {
    if (err) {
      console.error("Error deleting order:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error while deleting." });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, message: "Order deleted successfully." });
  });
};

module.exports = {
  getOrders,
  insertOrder,
  updateOrder,
  deleteOrder,
};
