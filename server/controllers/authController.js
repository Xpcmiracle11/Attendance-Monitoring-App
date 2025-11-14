const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const tokenBlacklist = new Set();
require("dotenv").config();

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  try {
    const sql = "SELECT * FROM users WHERE email = ?";
    const [results] = await db.query(sql, [email]);

    if (results.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Email does not exist." });
    }

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || "1d" }
    );

    res.json({ success: true, token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getUserDetails = async (req, res) => {
  console.log("📥 /api/user hit, user from token:", req.user);

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
      [req.user.id]
    );

    console.log("📤 DB query returned:", results);

    if (!results.length) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    let user = results[0];
    user.image_file_path = user.image_file_name
      ? `${process.env.API_BASE_URL}/uploads/${user.image_file_name}`
      : null;

    res.json({ success: true, user });
  } catch (error) {
    console.error("❌ Error in getUserDetails:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getUserPayroll = async (req, res) => {
  console.log("📥 /api/user-payroll hit, user from token:", req.user);

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
      [req.user.id]
    );

    console.log("📤 DB query returned:", results);

    if (!results.length) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    res.json({ success: true, payroll: results });
  } catch (error) {
    console.error("❌ Error in getUserPayroll:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getUserAttendance = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "No token provided." });
    }

    if (tokenBlacklist.has(token)) {
      return res
        .status(400)
        .json({ success: false, message: "Token has been invalidated." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

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

    const [attendance] = await db.query(attendanceSql, [decoded.id]);

    if (attendance.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No attendance records found for this user.",
      });
    }

    res.json({ success: true, attendance });
  } catch (error) {
    console.error("❌ Error in getUserAttendance:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log-in again.",
      });
    }

    return res.status(500).json({ success: false, message: "Server error." });
  }
};

const logoutUser = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(400)
      .json({ success: false, message: "No token provided." });
  }

  tokenBlacklist.add(token);

  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.id;
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token." });
  }
  res.json({ success: true, message: "Logged out successfully." });
};

module.exports = {
  getUserDetails,
  getUserPayroll,
  getUserAttendance,
  loginUser,
  logoutUser,
};
