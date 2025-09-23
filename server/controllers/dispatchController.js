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
      JSON_ARRAYAGG(c.id) AS crew_id,
      t.id AS truck_id,
      CONCAT_WS(
          ' ', 
          u.first_name, 
          IF(u.middle_name IS NOT NULL AND u.middle_name != '', CONCAT(SUBSTRING(u.middle_name, 1, 1), '.'), ''), 
          u.last_name
      ) AS full_name,
      GROUP_CONCAT(
          CONCAT_WS(
              ' ', 
              c.first_name, 
              IF(c.middle_name IS NOT NULL AND c.middle_name != '', CONCAT(SUBSTRING(c.middle_name, 1, 1), '.'), ''), 
              c.last_name
          )
          SEPARATOR ', '
      ) AS crew_name,
      t.plate_number, 
      t.truck_type,
      DATE_FORMAT(d.loaded_date, '%Y-%m-%d') AS loaded_date,
      DATE_FORMAT(d.empty_date, '%Y-%m-%d') AS empty_date,
      d.status,
      DATE_FORMAT(d.created_at, '%Y-%m-%d') AS created_at
  FROM dispatches d
  LEFT JOIN users u ON d.user_id = u.id
  LEFT JOIN dispatch_crew dc ON d.id = dc.dispatch_id
  LEFT JOIN users c ON dc.crew_id = c.id
  LEFT JOIN trucks t ON d.truck_id = t.id
  GROUP BY d.id
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
  const { user_id, truck_id, loaded_date, crew_id } = req.body;

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
    const dispatchId = result.insertId;

    if (Array.isArray(crew_id) && crew_id.length > 0) {
      const crewValues = crew_id.map((crewId) => [dispatchId, crewId]);
      const crewSql = `
        INSERT INTO dispatch_crew (dispatch_id, crew_id)
        VALUES ?
      `;
      await runQuery(crewSql, [crewValues]);
    }

    res.json({
      success: true,
      message: "Dispatch added successfully.",
      id: dispatchId,
    });
  } catch (error) {
    console.error("Error inserting dispatch:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const updateDispatch = async (req, res) => {
  const { id } = req.params;
  const { user_id, truck_id, loaded_date, crew_id } = req.body;

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

    if (Array.isArray(crew_id)) {
      await runQuery("DELETE FROM dispatch_crew WHERE dispatch_id = ?", [id]);

      for (const crewId of crew_id) {
        await runQuery(
          "INSERT INTO dispatch_crew (dispatch_id, crew_id) VALUES (?, ?)",
          [id, crewId]
        );
      }
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

    res.json({
      success: true,
      message: "Dispatch and related crews deleted successfully.",
    });
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
