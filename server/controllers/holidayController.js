const db = require("../config/db");

const getHolidays = (req, res) => {
  const sql = `SELECT id, holiday_name, holiday_month, holiday_date,
  DATE_FORMAT(STR_TO_DATE(CONCAT('2000-', holiday_month, '-', holiday_date), '%Y-%m-%d'), '%M %e') AS exact_date,
  holiday_type,
  DATE_FORMAT(created_at, '%Y-%m-%d') as created_at FROM holidays`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching holidays:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }
    res.json({ success: true, data: results });
  });
};

const insertHoliday = (req, res) => {
  const { holiday_name, holiday_month, holiday_date, holiday_type } = req.body;

  const sqlCheck =
    "SELECT * FROM holidays WHERE holiday_month = ? AND holiday_date = ?";
  db.query(sqlCheck, [holiday_month, holiday_date], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }
    if (result.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Holiday already exists." });
    }
  });

  const sqlInsert = `INSERT INTO holidays (holiday_name, holiday_month, holiday_date, holiday_type) VALUES (?,?,?,?)`;

  db.query(
    sqlInsert,
    [holiday_name, holiday_month, holiday_date, holiday_type],
    (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      }
      res.json({ success: true, data: result });
    }
  );
};

const updateHoliday = (req, res) => {
  const { id } = req.params;
  const { holiday_name, holiday_month, holiday_date, holiday_type } = req.body;

  if (
    !id ||
    !holiday_name ||
    !holiday_month ||
    !holiday_date ||
    !holiday_type
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid holiday data" });
  }

  const sqlCheckID = "SELECT * FROM holidays where id = ?";
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
      "SELECT * FROM holidays WHERE holiday_month = ? AND holiday_date = ? AND id !=?";
    db.query(sqlCheckName, [holiday_month, holiday_date, id], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error." });
      }
      if (result.length > 0) {
        return res
          .status(400)
          .json({ success: false, message: "Holiday already exists." });
      }

      const sqlUpdate =
        "UPDATE holidays SET holiday_name = ?, holiday_month = ?, holiday_date = ?, holiday_type = ? WHERE id = ?";
      db.query(
        sqlUpdate,
        [holiday_name, holiday_month, holiday_date, holiday_type, id],
        (err, result) => {
          if (err) {
            console.error("Error updating holiday:", err);
            return res
              .status(500)
              .json({ success: false, message: "Database error." });
          }
          if (result.affectedRows === 0) {
            return res
              .status(404)
              .json({ success: false, message: "Holiday not found." });
          }
          res.json({ success: true, message: "Holiday updated successfully" });
        }
      );
    });
  });
};

const deleteHoliday = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid holiday ID," });
  }

  const sqlDelete = "DELETE FROM holidays WHERE id = ?";
  db.query(sqlDelete, [id], (err, result) => {
    if (err) {
      console.error("Error deleting holiday:", err);
      return res
        .statys(500)
        .json({ success: false, message: "Datanase error while deleting" });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Holiday not found." });
    }
    res.json({ success: true, message: "Holiday deleted successfully." });
  });
};
module.exports = { getHolidays, insertHoliday, updateHoliday, deleteHoliday };
