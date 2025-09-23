const db = require("../config/db");
require("dotenv").config();

const getEmployeeDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const [results] = await db.query(
      `SELECT 
        users.id,
        users.department_id, 
        departments.name AS department_name, 
        users.first_name, 
        users.middle_name,
        CONCAT(LEFT(users.middle_name, 1), '.') as middle_initial, 
        users.last_name, 
        users.email, 
        users.phone_number, 
        users.role, 
        users.gender,
        users.region,
        users.province,
        users.municipality,
        users.barangay,
        users.street,
        users.image_file_name,
        DATE_FORMAT(users.birth_date, '%Y-%m-%d') AS birth_date,
        CONCAT_WS(' ', 
          users.first_name, 
          IF(users.middle_name IS NOT NULL AND users.middle_name != '', CONCAT(LEFT(users.middle_name, 1), '.'), ''), 
          users.last_name
        ) AS full_name
      FROM users 
      LEFT JOIN departments ON users.department_id = departments.id 
      WHERE users.id = ?`,
      [id]
    );

    if (!results.length) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    let employee = results[0];
    employee.image_file_path = employee.image_file_name
      ? `${process.env.API_BASE_URL}/uploads/${employee.image_file_name}`
      : null;

    res.json({ success: true, user: employee });
  } catch (error) {
    console.error("❌ Error in getEmployeeDetails:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getEmployeePayroll = async (req, res) => {
  const { id } = req.params;

  try {
    const [results] = await db.query(
      `SELECT 
        p.id,
        u.id AS user_id,
        CONCAT_WS(' ', u.first_name, 
          IF(u.middle_name IS NOT NULL AND u.middle_name != '', CONCAT(SUBSTRING(u.middle_name, 1, 1), '.'), ''), 
          u.last_name
        ) AS full_name,
        d.id AS department_id,
        d.name AS department_name,
        u.role,
        p.payroll_period,
        DATE_FORMAT(p.period_start, '%Y-%m-%d') AS period_start,
        DATE_FORMAT(p.period_end, '%Y-%m-%d') AS period_end,
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
        p.status,
        DATE_FORMAT(p.created_at, '%Y-%m-%d') AS created_at
      FROM payrolls p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE p.user_id = ? AND p.status = 'Paid'
      ORDER BY p.created_at DESC`,
      [id]
    );

    if (!results.length) {
      return res
        .status(404)
        .json({ success: false, message: "Payroll not found" });
    }

    res.json({ success: true, payroll: results });
  } catch (error) {
    console.error("❌ Error in getEmployeePayroll:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getEmployeeAttendance = async (req, res) => {
  const { id } = req.params;

  try {
    const attendanceSql = `
      SELECT 
        id, user_id, 
        DATE_FORMAT(clock_in, '%Y-%m-%d %H:%i:%s') AS clock_in, 
        DATE_FORMAT(clock_out, '%Y-%m-%d %H:%i:%s') AS clock_out, 
        status, log_hash, 
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at, 
        DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
      FROM attendance_details
      WHERE user_id = ?
      ORDER BY clock_in DESC
    `;

    const [attendance] = await db.query(attendanceSql, [id]);

    if (attendance.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No attendance records found for this employee.",
      });
    }

    res.json({ success: true, attendance });
  } catch (error) {
    console.error("❌ Error in getEmployeeAttendance:", error.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  getEmployeeDetails,
  getEmployeePayroll,
  getEmployeeAttendance,
};
