const db = require("../config/db");

const runQuery = async (sql, params = []) => {
  const conn = await db.getDB();
  const [rows] = await conn.query(sql, params);
  return rows;
};

const getCustomers = async (req, res) => {
  try {
    const sql = `
      SELECT 
        id,
        principal,
        customer_number,
        customer_name,
        DATE_FORMAT(created_at, '%Y-%m-%d') AS created_at
      FROM customers
      ORDER BY created_at ASC
    `;
    const customers = await runQuery(sql);
    res.json({ success: true, data: customers });
  } catch (error) {
    console.error("Error fetching customers:", error.message);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const insertCustomer = async (req, res) => {
  const { principal, customer_number, customer_name } = req.body;

  if (!principal || !customer_number || !customer_name) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid customer data." });
  }

  try {
    const existing = await runQuery(
      "SELECT id FROM customers WHERE customer_number = ? AND customer_name = ?",
      [customer_number, customer_name]
    );
    if (existing.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Customer already exists." });
    }

    const sql = `
      INSERT INTO customers (principal, customer_number, customer_name)
      VALUES (?, ?, ?)
    `;
    await runQuery(sql, [principal, customer_number, customer_name]);

    res.json({ success: true, message: "Customer added successfully." });
  } catch (error) {
    console.error("Error inserting customer:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { principal, customer_number, customer_name } = req.body;

  if (!id || !principal || !customer_number || !customer_name) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid device data." });
  }

  try {
    const device = await runQuery("SELECT id FROM customers WHERE id = ?", [
      id,
    ]);
    if (device.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found." });
    }

    const duplicate = await runQuery(
      "SELECT id FROM customers WHERE customer_number = ? AND customer_name = ? AND id != ?",
      [customer_name, customer_number, id]
    );
    if (duplicate.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Customer already exists." });
    }

    const sql = `
      UPDATE customers 
      SET principal = ?, customer_name = ?, customer_number = ?
      WHERE id = ?
    `;
    const result = await runQuery(sql, [
      principal,
      customer_name,
      customer_number,
      id,
    ]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found." });
    }

    res.json({ success: true, message: "Customer updated successfully." });
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const deleteCustomer = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid customer ID." });
  }

  try {
    const sql = "DELETE FROM customers WHERE id = ?";
    const result = await runQuery(sql, [id]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found." });
    }

    res.json({ success: true, message: "Customer deleted successfully." });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

module.exports = {
  getCustomers,
  insertCustomer,
  updateCustomer,
  deleteCustomer,
};
