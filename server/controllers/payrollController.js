const db = require("../config/db");

const runQuery = async (sql, params = []) => {
  const conn = await db.getDB();
  const [rows] = await conn.query(sql, params);
  return rows;
};

const getPayrolls = async (req, res) => {
  try {
    const sql = `
      SELECT 
        p.id, u.id AS user_id, p.date_attended,
        CONCAT_WS(' ', u.first_name, 
          IF(u.middle_name IS NOT NULL AND u.middle_name != '', CONCAT(SUBSTRING(u.middle_name, 1, 1), '.'), ''), 
          u.last_name
        ) AS full_name,
        d.id AS department_id, d.name AS department_name, u.role,
        p.payroll_period, p.period_start, p.period_end,
        p.basic_pay_days, p.basic_pay_rate, p.basic_pay_total,
        p.legal_holiday_days, p.legal_holiday_rate, p.legal_holiday_total,
        p.special_holiday_days, p.special_holiday_rate, p.special_holiday_total,
        p.adjustment_days, p.adjustment_rate, p.adjustment_total,
        p.leave_days, p.leave_rate, p.leave_total,
        p.management_bonus_total, p.thirteenth_month_total,
        p.regular_ot_hours, p.regular_ot_rate, p.regular_ot_total,
        p.regular_ot_nd_hours, p.regular_ot_nd_rate, p.regular_ot_nd_total,
        p.rest_day_ot_hours, p.rest_day_ot_rate, p.rest_day_ot_total,
        p.rest_day_ot_excess_hours, p.rest_day_ot_excess_rate, p.rest_day_ot_excess_total,
        p.rest_day_ot_nd_hours, p.rest_day_ot_nd_rate, p.rest_day_ot_nd_total,
        p.special_holiday_ot_hours, p.special_holiday_ot_rate, p.special_holiday_ot_total,
        p.legal_holiday_ot_hours, p.legal_holiday_ot_rate, p.legal_holiday_ot_total,
        p.legal_holiday_ot_excess_hours, p.legal_holiday_ot_excess_rate, p.legal_holiday_ot_excess_total,
        p.legal_holiday_ot_nd_hours, p.legal_holiday_ot_nd_rate, p.legal_holiday_ot_nd_total,
        p.night_diff_hours, p.night_diff_rate, p.night_diff_total,
        p.basic_allowance_total, p.temp_allowance_total,
        p.gross,
        p.sss_contribution, p.sss_loan, p.philhealth_contribution, 
        p.pagibig_contribution, p.pagibig_loan, p.donation, p.cash_advance, p.staff_shops,
        (
          COALESCE(p.sss_contribution, 0) +
          COALESCE(p.philhealth_contribution, 0) +
          COALESCE(p.pagibig_contribution, 0) +
          COALESCE(p.sss_loan, 0) +
          COALESCE(p.pagibig_loan, 0) +
          COALESCE(p.donation, 0) +
          COALESCE(p.cash_advance, 0) +
          COALESCE(p.staff_shops, 0)
        ) AS total_deductions,
        p.net_pay,
        DATE_FORMAT(p.created_at, '%Y-%m-%d') AS created_at
      FROM payrolls p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE p.status = 'Unpaid' AND u.role NOT IN ('Manager', 'Corporate')
      ORDER BY p.created_at DESC;
    `;
    const payrolls = await runQuery(sql);
    res.json({ success: true, data: payrolls });
  } catch (error) {
    console.error("Error fetching payrolls:", error);
    res.status(500).json({ success: false, message: "Database error." });
  }
};

const insertPayrolls = async (req, res) => {
  const { payroll_period, role, period_start, period_end } = req.body;

  try {
    const sql = `...`;

    const queryParams =
      role === "Admin"
        ? [period_start, period_end, period_start, period_end]
        : [period_start, period_end, period_start, period_end, role];

    const results = await runQuery(sql, queryParams);

    const values = results.map((user) => {
      const basicTotal = parseFloat(user.gross_pay || 0);
      const legalHolidayTotal = parseFloat(user.legal_holiday_total || 0);
      const specialHolidayTotal = parseFloat(user.special_holiday_total || 0);
      const totalEarnings =
        basicTotal + legalHolidayTotal + specialHolidayTotal;

      return [
        user.user_id,
        user.date_attended || "",
        payroll_period,
        period_start,
        period_end,
        parseFloat(user.hours_worked || 0),
        parseFloat(user.daily_rate || 0),
        basicTotal,
        parseFloat(user.legal_holiday_days || 0),
        parseFloat(user.legal_holiday_rate || 0),
        legalHolidayTotal,
        parseFloat(user.special_holiday_days || 0),
        parseFloat(user.special_holiday_rate || 0),
        specialHolidayTotal,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        totalEarnings,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        totalEarnings,
      ];
    });

    const insertSql = `INSERT INTO payrolls (...) VALUES ?`;
    await runQuery(insertSql, [values]);

    res.json({ success: true, message: "Payrolls inserted successfully" });
  } catch (error) {
    console.error("Error inserting payrolls:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to insert payrolls" });
  }
};

const updatePayroll = async (req, res) => {
  const { id } = req.params;
  const payrollData = req.body;

  if (!id || !payrollData.gross || !payrollData.net_pay) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid payroll data." });
  }

  try {
    const checkSql = "SELECT id FROM payrolls WHERE id = ?";
    const result = await runQuery(checkSql, [id]);
    if (!result.length) {
      return res
        .status(404)
        .json({ success: false, message: "Payroll not found." });
    }

    const fields = Object.keys(payrollData)
      .map((field) => `${field} = ?`)
      .join(", ");
    const values = [...Object.values(payrollData), id];

    const updateSql = `UPDATE payrolls SET ${fields} WHERE id = ?`;
    await runQuery(updateSql, values);

    res.json({ success: true, message: "Payroll updated successfully." });
  } catch (error) {
    console.error("Error updating payroll:", error);
    res.status(500).json({ success: false, message: "Database error." });
  }
};

const confirmPayroll = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await runQuery(
      "UPDATE payrolls SET status = 'Paid' WHERE id = ?",
      [id]
    );
    if (!result.affectedRows) {
      return res
        .status(404)
        .json({ success: false, message: "Payroll not found." });
    }
    res.json({ success: true, message: "Payroll marked as Paid." });
  } catch (error) {
    console.error("Error confirming payroll:", error);
    res.status(500).json({ success: false, message: "Database error." });
  }
};

const deletePayroll = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await runQuery("DELETE FROM payrolls WHERE id = ?", [id]);
    if (!result.affectedRows) {
      return res
        .status(404)
        .json({ success: false, message: "Payroll not found." });
    }
    res.json({ success: true, message: "Payroll deleted successfully." });
  } catch (error) {
    console.error("Error deleting payroll:", error);
    res.status(500).json({ success: false, message: "Database error." });
  }
};

module.exports = {
  getPayrolls,
  insertPayrolls,
  updatePayroll,
  confirmPayroll,
  deletePayroll,
};
