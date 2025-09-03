const db = require("../config/db");

const runQuery = async (sql, params = []) => {
  const conn = await db.getDB();
  const [rows] = await conn.query(sql, params);
  return rows;
};

const getDispatches = async (req, res) => {
  try {
    const sql = `
      SELECT 
      d.id, 
      u.id AS user_id, 
      t.id AS truck_id,
      CONCAT_WS(
          ' ', 
          u.first_name, 
          IF(u.middle_name IS NOT NULL AND u.middle_name != '', CONCAT(SUBSTRING(u.middle_name, 1, 1), '.'), ''), 
          u.last_name
      ) AS full_name,
      t.plate_number, 
      t.truck_type,
      DATE_FORMAT(d.loaded_date, '%Y-%m-%d') AS loaded_date,
      DATE_FORMAT(d.empty_date, '%Y-%m-%d') AS empty_date,
      d.status,
      DATE_FORMAT(d.created_at, '%Y-%m-%d') AS created_at
  FROM dispatches d
  LEFT JOIN users u ON d.user_id = u.id
  LEFT JOIN trucks t ON d.truck_id = t.id
  ORDER BY d.created_at ASC;
  `;

    const dispatches = await runQuery(sql);
    res.json({ success: true, data: dispatches });
  } catch (error) {
    console.error("Error fetching dispatches:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const insertDispatch = async (req, res) => {
  const { user_id, truck_id, loaded_date } = req.body;

  if (!user_id || !truck_id || !loaded_date) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid dispatch data." });
  }

  try {
    const existing = await runQuery(
      "SELECT id FROM dispatches WHERE user_id = ? AND truck_id = ?",
      [user_id, truck_id]
    );
    if (existing.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Dispatch already exists." });
    }

    const sql = `
      INSERT INTO dispatches (user_id, truck_id, loaded_date)
      VALUES (?, ?, ?)
    `;
    const result = await runQuery(sql, [user_id, truck_id, loaded_date]);

    res.json({
      success: true,
      message: "Dispatch added successfully.",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Error inserting dispatch:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const updateDispatch = async (req, res) => {
  const { id } = req.params;
  const { user_id, truck_id, loaded_date } = req.body;

  if (!id || !user_id || !truck_id || !loaded_date) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid dispatch data." });
  }

  try {
    const dispatch = await runQuery("SELECT id FROM dispatches WHERE id = ?", [
      id,
    ]);
    if (dispatch.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Dispatch not found." });
    }

    const duplicate = await runQuery(
      "SELECT id FROM dispatches WHERE user_id = ? AND truck_id != ? AND id != ?",
      [user_id, truck_id, id]
    );
    if (duplicate.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Dispatch already exists." });
    }

    const sql = `
      UPDATE dispatches 
      SET user_id = ?, truck_id = ?, loaded_date = ?
      WHERE id = ?
    `;
    const result = await runQuery(sql, [user_id, truck_id, loaded_date, id]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Dispatch not found." });
    }

    res.json({ success: true, message: "Dispatch updated successfully." });
  } catch (error) {
    console.error("Error updating dispatch:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const deleteDispatch = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid dispatch ID." });
  }

  try {
    const sql = "DELETE FROM dispatches WHERE id = ?";
    const result = await runQuery(sql, [id]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Dispatch not found." });
    }

    res.json({ success: true, message: "Dispatch deleted successfully." });
  } catch (error) {
    console.error("Error deleting dispatch:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

module.exports = {
  getDispatches,
  insertDispatch,
  updateDispatch,
  deleteDispatch,
};
