const db = require("../config/db");

const getDepartments = (req, res) => {
  const sql = `
    SELECT id, name, description, 
    DATE_FORMAT(created_at, '%Y-%m-%d') AS created_at  
    FROM departments 
    ORDER BY created_at ASC`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching departments:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }
    res.json({ success: true, data: results });
  });
};

const insertDepartment = (req, res) => {
  const { name, description } = req.body;

  const sqlCheck = "SELECT * FROM departments WHERE name = ?";
  db.query(sqlCheck, [name], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    if (result.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Department already exists." });
    }

    const sqlInsert = `
      INSERT INTO departments (name, description, created_at)
      VALUES (?, ?, NOW())
    `;

    db.query(sqlInsert, [name, description], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      }

      res.json({ success: true, message: "Department added successfully" });
    });
  });
};

const updateDepartment = (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!id || !name || !description) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid department data." });
  }

  const sqlCheckID = "SELECT * FROM departments WHERE id = ?";
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
        .json({ success: false, message: "Department not found." });
    }

    const sqlCheckName = "SELECT * FROM departments WHERE name = ? AND id != ?";
    db.query(sqlCheckName, [name, id], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error." });
      }
      if (result.length > 0) {
        return res
          .status(400)
          .json({ success: false, message: "Department already exists." });
      }

      const sqlUpdate =
        "UPDATE departments SET name = ?, description = ? WHERE id = ?";
      db.query(sqlUpdate, [name, description, id], (err, result) => {
        if (err) {
          console.error("Error updating department:", err);
          return res
            .status(500)
            .json({ success: false, message: "Database error." });
        }

        if (result.affectedRows === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Department not found." });
        }

        res.json({
          success: true,
          message: "Department updated successfully.",
        });
      });
    });
  });
};

const deleteDepartment = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid department ID." });
  }

  const sqlDelete = "DELETE FROM departments WHERE id = ?";

  db.query(sqlDelete, [id], (err, result) => {
    if (err) {
      console.error("Error deleting department:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error while deleting." });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Department not found." });
    }

    res.json({ success: true, message: "Department deleted successfully." });
  });
};

module.exports = {
  getDepartments,
  insertDepartment,
  updateDepartment,
  deleteDepartment,
};
