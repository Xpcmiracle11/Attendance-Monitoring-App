const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const tokenBlacklist = new Set();

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  try {
    const sql = "SELECT * FROM users WHERE email = ?";
    const [results] = await db.promise().query(sql, [email]);

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

const getUserDetails = (req, res) => {
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
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    const sql = `
    SELECT 
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
    WHERE users.id = ?
  `;

    db.query(sql, [decoded.id], (err, results) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Database error." });
      }
      if (results.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }

      let user = results[0];
      user.image_file_path = user.image_file_name
        ? `http://localhost:8080/uploads/${user.image_file_name}`
        : null;

      return res.json({ success: true, user });
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log-in again.",
      });
    }
    return res.status(401).json({ success: false, message: "Invalid token." });
  }
};

const getUserPayroll = (req, res) => {
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

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    const payrollSql = `
      SELECT 
          id, user_id, payroll_period, 
          DATE_FORMAT(period_start, '%Y-%m-%d') as period_start,
          DATE_FORMAT(period_end, '%Y-%m-%d') as period_end,
          basic_pay_days, basic_pay_rate, basic_pay_total,
          holiday_days, holiday_rate, holiday_total,
          adjustment_days, adjustment_rate, adjustment_total,
          leave_days, leave_rate, leave_total,
          management_bonus_total, thirteenth_month_total,
          regular_ot_hours, regular_ot_rate, regular_ot_total,
          regular_ot_nd_hours, regular_ot_nd_rate, regular_ot_nd_total,
          rest_day_ot_hours, rest_day_ot_rate, rest_day_ot_total,
          rest_day_ot_excess_hours, rest_day_ot_excess_rate, rest_day_ot_excess_total,
          rest_day_ot_nd_hours, rest_day_ot_nd_rate, rest_day_ot_nd_total,
          special_holiday_ot_hours, special_holiday_ot_rate, special_holiday_ot_total,
          legal_holiday_ot_hours, legal_holiday_ot_rate, legal_holiday_ot_total,
          legal_holiday_ot_excess_hours, legal_holiday_ot_excess_rate, legal_holiday_ot_excess_total,
          legal_holiday_ot_nd_hours, legal_holiday_ot_nd_rate, legal_holiday_ot_nd_total,
          night_diff_hours, night_diff_rate, night_diff_total,
          basic_allowance_total, temp_allowance_total, gross,
          sss_contribution, sss_loan, philhealth_contribution,
          pagibig_contribution, pagibig_loan, donation, cash_advance,
          staff_shops,
          (sss_contribution + sss_loan + philhealth_contribution + pagibig_contribution + pagibig_loan + donation + cash_advance + staff_shops) AS total_deduction,
          net_pay, status
      FROM payrolls
      WHERE user_id = ? AND status = 'Paid'
      ORDER BY created_at DESC;
    `;

    db.query(payrollSql, [decoded.id], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error." });
      }

      if (results.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Payroll not found." });
      }
      return res.json({ success: true, payroll: results });
    });
  } catch (error) {
    console.error("Token verification error:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log-in again.",
      });
    }

    return res.status(401).json({ success: false, message: "Invalid token." });
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

module.exports = { getUserDetails, getUserPayroll, loginUser, logoutUser };
