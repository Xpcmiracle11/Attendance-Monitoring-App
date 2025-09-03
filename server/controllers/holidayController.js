const db = require("../config/db");

const runQuery = async (sql, params = []) => {
  const conn = await db.getDB();
  const [rows] = await conn.query(sql, params);
  return rows;
};

const getHolidays = async (req, res) => {
  try {
    const sql = `
      SELECT 
        id, 
        holiday_name, 
        holiday_month, 
        holiday_date,
        DATE_FORMAT(
          STR_TO_DATE(CONCAT('2000-', holiday_month, '-', holiday_date), '%Y-%m-%d'),
          '%M %e'
        ) AS exact_date,
        holiday_type,
        DATE_FORMAT(created_at, '%Y-%m-%d') as created_at
      FROM holidays
    `;
    const holidays = await runQuery(sql);
    res.json({ success: true, data: holidays });
  } catch (error) {
    console.error("Error fetching holidays:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const insertHoliday = async (req, res) => {
  const { holiday_name, holiday_month, holiday_date, holiday_type } = req.body;

  try {
    const existing = await runQuery(
      "SELECT id FROM holidays WHERE holiday_month = ? AND holiday_date = ?",
      [holiday_month, holiday_date]
    );
    if (existing.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Holiday already exists." });
    }

    const sql = `
      INSERT INTO holidays (holiday_name, holiday_month, holiday_date, holiday_type)
      VALUES (?, ?, ?, ?)
    `;
    await runQuery(sql, [
      holiday_name,
      holiday_month,
      holiday_date,
      holiday_type,
    ]);

    res.json({ success: true, message: "Holiday added successfully." });
  } catch (error) {
    console.error("Error inserting holiday:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const updateHoliday = async (req, res) => {
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

  try {
    const holiday = await runQuery("SELECT id FROM holidays WHERE id = ?", [
      id,
    ]);
    if (holiday.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Holiday not found" });
    }

    const duplicate = await runQuery(
      "SELECT id FROM holidays WHERE holiday_month = ? AND holiday_date = ? AND id != ?",
      [holiday_month, holiday_date, id]
    );
    if (duplicate.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Holiday already exists." });
    }

    const sql = `
      UPDATE holidays 
      SET holiday_name = ?, holiday_month = ?, holiday_date = ?, holiday_type = ?
      WHERE id = ?
    `;
    const result = await runQuery(sql, [
      holiday_name,
      holiday_month,
      holiday_date,
      holiday_type,
      id,
    ]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Holiday not found" });
    }

    res.json({ success: true, message: "Holiday updated successfully" });
  } catch (error) {
    console.error("Error updating holiday:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const deleteHoliday = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid holiday ID" });
  }

  try {
    const sql = "DELETE FROM holidays WHERE id = ?";
    const result = await runQuery(sql, [id]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Holiday not found" });
    }

    res.json({ success: true, message: "Holiday deleted successfully" });
  } catch (error) {
    console.error("Error deleting holiday:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

module.exports = {
  getHolidays,
  insertHoliday,
  updateHoliday,
  deleteHoliday,
};
