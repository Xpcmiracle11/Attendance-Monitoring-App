const db = require("../config/db");

const getDepartments = async (req, res) => {
  try {
    const sql = `
      SELECT id, name, description, 
      DATE_FORMAT(created_at, '%Y-%m-%d') AS created_at  
      FROM departments 
      ORDER BY created_at ASC
    `;
    const [results] = await db.query(sql);
    res.json({ success: true, data: results });
  } catch (err) {
    console.error("Error fetching departments:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const insertDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;

    const [check] = await db.query("SELECT * FROM departments WHERE name = ?", [
      name,
    ]);
    if (check.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Department already exists." });
    }

    await db.query(
      `INSERT INTO departments (name, description, created_at)
       VALUES (?, ?, NOW())`,
      [name, description]
    );

    res.json({ success: true, message: "Department added successfully" });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!id || !name || !description) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid department data." });
    }

    const [existing] = await db.query(
      "SELECT * FROM departments WHERE id = ?",
      [id]
    );
    if (existing.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Department not found." });
    }

    const [dup] = await db.query(
      "SELECT * FROM departments WHERE name = ? AND id != ?",
      [name, id]
    );
    if (dup.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Department already exists." });
    }

    const [result] = await db.query(
      "UPDATE departments SET name = ?, description = ? WHERE id = ?",
      [name, description, id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Department not found." });
    }

    res.json({ success: true, message: "Department updated successfully." });
  } catch (err) {
    console.error("Error updating department:", err);
    res.status(500).json({ success: false, message: "Database error." });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid department ID." });
    }

    const [result] = await db.query("DELETE FROM departments WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Department not found." });
    }

    res.json({ success: true, message: "Department deleted successfully." });
  } catch (err) {
    console.error("Error deleting department:", err);
    res
      .status(500)
      .json({ success: false, message: "Database error while deleting." });
  }
};

module.exports = {
  getDepartments,
  insertDepartment,
  updateDepartment,
  deleteDepartment,
};
