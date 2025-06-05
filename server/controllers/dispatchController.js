const db = require("../config/db");

const getDispatches = (req, res) => {
  const sql = `
    SELECT 
      d.id, 
      d.trucker, 
      d.driver_id, 
      CONCAT_WS(' ', u.first_name, 
            IF(u.middle_name IS NOT NULL AND u.middle_name != '', CONCAT(SUBSTRING(u.middle_name, 1, 1), '.'), ''), 
            u.last_name
        ) AS driver_name, 
      d.plate_number_id, 
      t.plate_number, 
      d.cargo_type,
      d.bound_from,
      d.bound_to,
      d.status,
      DATE_FORMAT(d.created_at, '%Y-%m-%d') AS created_at
    FROM dispatches d
    LEFT JOIN users u ON d.driver_id = u.id
    LEFT JOIN trucks t ON d.plate_number_id = t.id
    ORDER BY 
        CASE 
          WHEN d.status = 'Pending' THEN 1 
        ELSE 2 
        END,
        d.created_at DESC; 
    `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching dispatches:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error." });
    }
    res.json({ success: true, data: results });
  });
};

const insertDispatch = (req, res) => {
  const {
    trucker,
    driver_id,
    plate_number_id,
    cargo_type,
    bound_from,
    bound_to,
  } = req.body;

  const sqlInsert = `
    INSERT INTO dispatches (trucker, driver_id, plate_number_id, cargo_type, bound_from, bound_to, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, "Pending", NOW())
  `;
  db.query(
    sqlInsert,
    [trucker, driver_id, plate_number_id, cargo_type, bound_from, bound_to],
    (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error." });
      }
      res.json({ success: true, message: "Dispatch added successfully." });
    }
  );
};

const updateDispatch = (req, res) => {
  const { id } = req.params;
  const {
    trucker,
    driver_id,
    plate_number_id,
    cargo_type,
    bound_from,
    bound_to,
  } = req.body;

  if (
    !id ||
    !trucker ||
    !driver_id ||
    !plate_number_id ||
    !cargo_type ||
    !bound_from ||
    !bound_to
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid dispatch data.",
    });
  }

  const sqlCheckID = "SELECT * FROM dispatches WHERE id = ?";
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
        .json({ success: false, message: "Dispatch not found." });
    }

    const sqlUpdate = `
      UPDATE dispatches
      SET trucker = ?, driver_id = ?, plate_number_id = ?, cargo_type = ?, bound_from = ?, bound_to = ?
      WHERE id = ?
    `;
    db.query(
      sqlUpdate,
      [
        trucker,
        driver_id,
        plate_number_id,
        cargo_type,
        bound_from,
        bound_to,
        id,
      ],
      (err, updateResult) => {
        if (err) {
          console.error("Error updating dispatch:", err);
          return res
            .status(500)
            .json({ success: false, message: "Database error." });
        }

        if (updateResult.affectedRows === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Dispatch not found." });
        }

        res.json({ success: true, message: "Dispatch updated successfully." });
      }
    );
  });
};

const deleteDispatch = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid dispatch ID." });
  }

  const sqlDelete = "DELETE FROM dispatches WHERE id = ?";
  db.query(sqlDelete, [id], (err, result) => {
    if (err) {
      console.error("Error deleting dispatch:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error while deleting." });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Dispatch not found." });
    }

    res.json({ success: true, message: "Dispatch deleted successfully." });
  });
};

module.exports = {
  getDispatches,
  insertDispatch,
  updateDispatch,
  deleteDispatch,
};
