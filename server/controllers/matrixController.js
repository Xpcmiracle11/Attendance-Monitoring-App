const db = require("../config/db");

const runQuery = async (sql, params = []) => {
  const conn = await db.getDB();
  const [rows] = await conn.query(sql, params);
  return rows;
};

const getMatrixes = async (req, res) => {
  try {
    const sql = `
      SELECT * 
      FROM allowance_matrix 
      ORDER BY id ASC
    `;
    const matrixes = await runQuery(sql);
    res.json({ success: true, data: matrixes });
  } catch (error) {
    console.error("Error fetching matrixes:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const insertMatrix = async (req, res) => {
  const {
    principal,
    code,
    trip_type,
    source,
    first_destination,
    second_destination,
    shipping_line,
    truck_type,
    days_for_meals,
    fuel,
    allowance,
    shipping,
  } = req.body;

  if (!principal || !code) {
    return res
      .status(400)
      .json({ success: false, message: "Principal and Code are required." });
  }

  try {
    const existing = await runQuery(
      "SELECT id FROM allowance_matrix WHERE principal = ? AND code = ? AND truck_type = ?",
      [principal, code, truck_type]
    );

    if (existing.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Matrix already exists." });
    }

    const sql = `
      INSERT INTO allowance_matrix
        (principal, code, trip_type, source, first_destination, second_destination, shipping_line, truck_type,
         days_for_meals, fuel, allowance, shipping)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await runQuery(sql, [
      principal,
      code,
      trip_type || null,
      source || null,
      first_destination || null,
      second_destination || null,
      shipping_line || null,
      truck_type || null,
      days_for_meals || 0,
      fuel || 0,
      allowance || 0,
      shipping || 0,
    ]);

    res.json({ success: true, message: "Matrix added successfully." });
  } catch (error) {
    console.error("Error inserting matrix:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const updateMatrix = async (req, res) => {
  const { id } = req.params;

  const {
    principal,
    code,
    trip_type,
    source,
    first_destination,
    second_destination,
    shipping_line,
    truck_type,
    days_for_meals,
    fuel,
    allowance,
    shipping,
  } = req.body;

  if (!id || !principal || !code) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid matrix data." });
  }

  try {
    const matrix = await runQuery(
      "SELECT id FROM allowance_matrix WHERE id = ?",
      [id]
    );

    if (matrix.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Matrix not found." });
    }

    const duplicate = await runQuery(
      "SELECT id FROM allowance_matrix WHERE principal = ? AND code = ? AND truck_type = ? AND id != ?",
      [principal, code, truck_type, id]
    );

    if (duplicate.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Matrix with same Principal, Code and Truck Type already exists.",
      });
    }
    const sql = `
      UPDATE allowance_matrix
      SET principal = ?, code = ?, trip_type = ?, source = ?, first_destination = ?, second_destination = ?,
          shipping_line = ?, truck_type = ?, days_for_meals = ?, fuel = ?, allowance = ?, shipping = ?
      WHERE id = ?
    `;

    await runQuery(sql, [
      principal,
      code,
      trip_type || null,
      source || null,
      first_destination || null,
      second_destination || null,
      shipping_line || null,
      truck_type || null,
      days_for_meals || 0,
      fuel || 0,
      allowance || 0,
      shipping || 0,
      id,
    ]);

    res.json({ success: true, message: "Matrix updated successfully." });
  } catch (error) {
    console.error("Error updating matrix:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const deleteMatrix = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid matrix ID." });
  }

  try {
    const sql = "DELETE FROM allowance_matrix WHERE id = ?";
    const result = await runQuery(sql, [id]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Matrix not found." });
    }

    res.json({ success: true, message: "Matrix deleted successfully." });
  } catch (error) {
    console.error("Error deleting matrix:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

module.exports = {
  getMatrixes,
  insertMatrix,
  updateMatrix,
  deleteMatrix,
};
