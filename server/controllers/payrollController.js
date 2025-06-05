const { get } = require("ref-napi");
const db = require("../config/db");

const getPayrolls = (req, res) => {
  const sql = `
  SELECT 
    p.id AS id,
    u.id AS user_id,
    CONCAT_WS(' ', u.first_name, 
      IF(u.middle_name IS NOT NULL AND u.middle_name != '', CONCAT(SUBSTRING(u.middle_name, 1, 1), '.'), ''), 
      u.last_name
    ) AS full_name,
    d.id AS department_id,
    d.name AS department_name,
    u.role,
    p.payroll_period, 
    p.period_start, 
    p.period_end,
    p.basic_pay_days, 
    p.basic_pay_rate, 
    p.basic_pay_total,
    p.holiday_days, 
    p.holiday_rate, 
    p.holiday_total,
    p.adjustment_days,
    p.adjustment_rate,
    p.adjustment_total,
    p.leave_days,
    p.leave_rate,
    p.leave_total,
    p.management_bonus_total, 
    p.thirteenth_month_total,
    p.regular_ot_hours, 
    p.regular_ot_rate, 
    p.regular_ot_total,
    p.regular_ot_nd_hours, 
    p.regular_ot_nd_rate, 
    p.regular_ot_nd_total,
    p.rest_day_ot_hours, 
    p.rest_day_ot_rate, 
    p.rest_day_ot_total,
    p.rest_day_ot_excess_hours, 
    p.rest_day_ot_excess_rate, 
    p.rest_day_ot_excess_total,
    p.rest_day_ot_nd_hours, 
    p.rest_day_ot_nd_rate, 
    p.rest_day_ot_nd_total,
    p.special_holiday_ot_hours, 
    p.special_holiday_ot_rate, 
    p.special_holiday_ot_total,
    p.legal_holiday_ot_hours, 
    p.legal_holiday_ot_rate, 
    p.legal_holiday_ot_total,
    p.legal_holiday_ot_excess_hours, 
    p.legal_holiday_ot_excess_rate, 
    p.legal_holiday_ot_excess_total,
    p.legal_holiday_ot_nd_hours, 
    p.legal_holiday_ot_nd_rate, 
    p.legal_holiday_ot_nd_total,
    p.night_diff_hours, 
    p.night_diff_rate, 
    p.night_diff_total,
    p.basic_allowance_total, 
    p.temp_allowance_total,
    p.gross,
    p.sss_contribution, 
    p.sss_loan, 
    p.philhealth_contribution, 
    p.pagibig_contribution,
    p.pagibig_loan, 
    p.donation, 
    p.cash_advance, 
    p.staff_shops,
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
  WHERE p.status = "Unpaid"
  ORDER BY p.created_at DESC;
`;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching payrolls:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error." });
    }
    res.json({ success: true, data: results });
  });
};

const insertPayrolls = (req, res) => {
  const { payroll_period, role, period_start, period_end } = req.body;

  const roleCondition =
    role === "Admin" ? "u.role NOT IN ('Crew', 'Driver')" : "u.role = ?";

  const sql = `
    SELECT 
      u.id AS user_id,
      u.salary AS daily_rate,
      COUNT(ad.id) AS days_present,
      ROUND(u.salary * COUNT(ad.id), 2) AS gross_pay
    FROM users u
    LEFT JOIN attendance_details ad 
      ON u.id = ad.user_id 
      AND ad.clock_in IS NOT NULL 
      AND ad.clock_out IS NOT NULL
      AND ad.clock_in BETWEEN ? AND ?
    WHERE ${roleCondition}
    GROUP BY u.id
  `;

  const queryParams =
    role === "Admin"
      ? [period_start, period_end]
      : [period_start, period_end, role];

  db.query(sql, queryParams, (err, results) => {
    if (err) {
      console.error("Error fetching payroll data:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    const userIds = results.map((user) => user.user_id);

    if (userIds.length === 0) {
      return res.json({ success: true, message: "No eligible users found." });
    }

    const loanSql = `
      SELECT *
      FROM loans
      WHERE user_id IN (?) AND status = 'Approved'
    `;

    db.query(loanSql, [userIds], (loanErr, loans) => {
      if (loanErr) {
        console.error("Error fetching loans:", loanErr);
        return res.status(500).json({ error: "Failed to fetch loans" });
      }

      const userLoans = {};
      loans.forEach((loan) => {
        if (!userLoans[loan.user_id]) {
          userLoans[loan.user_id] = [];
        }
        userLoans[loan.user_id].push(loan);
      });

      const insertSql = `
        INSERT INTO payrolls (
          user_id, payroll_period, period_start, period_end,
          basic_pay_days, basic_pay_rate, basic_pay_total,
          holiday_days, holiday_rate, holiday_total, adjustment_days, adjustment_rate,
          adjustment_total, leave_days, leave_rate, leave_total,
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
          basic_allowance_total, temp_allowance_total,
          gross,
          sss_contribution, sss_loan, philhealth_contribution, pagibig_contribution,
          pagibig_loan, donation, cash_advance, staff_shops,
          net_pay
        ) VALUES ?
      `;

      const values = results.map((user) => {
        const attendance = user.days_present || 0;
        const rate = parseFloat(user.daily_rate || 0);
        const grossPay = parseFloat(user.gross_pay || 0);
        let netPay = grossPay;

        let sssLoan = 0;
        let pagibigLoan = 0;

        function getMonthlyPayment(amount, duration) {
          const durationMap = {
            "1 Year": 12,
            "2 Years": 24,
            "3 Years": 36,
          };
          const months = durationMap[duration] || 12;
          return amount / months;
        }

        if (userLoans[user.user_id]) {
          userLoans[user.user_id].forEach((loan) => {
            const isCurrentPeriod = loan.payment_every === payroll_period;

            if (isCurrentPeriod) {
              const monthlyPayment = getMonthlyPayment(
                loan.loan_amount,
                loan.payment_duration
              );

              if (loan.institution === "SSS") {
                sssLoan += monthlyPayment;
              } else if (loan.institution === "PAGIBIG") {
                pagibigLoan += monthlyPayment;
              }
            }
          });
        }

        netPay -= sssLoan + pagibigLoan;

        return [
          user.user_id,
          payroll_period,
          period_start,
          period_end,
          attendance,
          rate,
          grossPay,
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
          grossPay,
          0,
          sssLoan,
          0,
          0,
          pagibigLoan,
          0,
          0,
          0,
          netPay.toFixed(2),
        ];
      });
      db.query(insertSql, [values], (insertErr) => {
        if (insertErr) {
          console.error("Error inserting payrolls:", insertErr);
          return res.status(500).json({ error: "Failed to insert payrolls" });
        }

        res.json({ success: true, message: "Payrolls inserted successfully" });
      });
    });
  });
};

const updatePayroll = (req, res) => {
  const { id } = req.params;
  const {
    basic_pay_days,
    basic_pay_rate,
    basic_pay_total,
    holiday_days,
    holiday_rate,
    holiday_total,
    management_bonus_total,
    thirteenth_month_total,
    regular_ot_hours,
    regular_ot_rate,
    regular_ot_total,
    regular_ot_nd_hours,
    regular_ot_nd_rate,
    regular_ot_nd_total,
    rest_day_ot_hours,
    rest_day_ot_rate,
    rest_day_ot_total,
    rest_day_ot_excess_hours,
    rest_day_ot_excess_rate,
    rest_day_ot_excess_total,
    rest_day_ot_nd_hours,
    rest_day_ot_nd_rate,
    rest_day_ot_nd_total,
    special_holiday_ot_hours,
    special_holiday_ot_rate,
    special_holiday_ot_total,
    legal_holiday_ot_hours,
    legal_holiday_ot_rate,
    legal_holiday_ot_total,
    legal_holiday_ot_excess_hours,
    legal_holiday_ot_excess_rate,
    legal_holiday_ot_excess_total,
    legal_holiday_ot_nd_hours,
    legal_holiday_ot_nd_rate,
    legal_holiday_ot_nd_total,
    night_diff_hours,
    night_diff_rate,
    night_diff_total,
    basic_allowance_total,
    temp_allowance_total,
    gross,
    sss_contribution,
    sss_loan,
    philhealth_contribution,
    pagibig_contribution,
    pagibig_loan,
    donation,
    cash_advance,
    staff_shops,
    net_pay,
  } = req.body;

  if (!id || !gross || !net_pay) {
    return res.status(400).json({
      success: false,
      message: "Invalid payroll data.",
    });
  }

  const sqlCheckID = "SELECT * FROM payrolls WHERE id = ?";
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
        .json({ success: false, message: "Payroll not found." });
    }

    const sqlUpdate = `
      UPDATE payrolls SET
        basic_pay_days = ?, basic_pay_rate = ?, basic_pay_total = ?,
        holiday_days = ?, holiday_rate = ?, holiday_total = ?,
        management_bonus_total = ?, thirteenth_month_total = ?,
        regular_ot_hours = ?, regular_ot_rate = ?, regular_ot_total = ?,
        regular_ot_nd_hours = ?, regular_ot_nd_rate = ?, regular_ot_nd_total = ?,
        rest_day_ot_hours = ?, rest_day_ot_rate = ?, rest_day_ot_total = ?,
        rest_day_ot_excess_hours = ?, rest_day_ot_excess_rate = ?, rest_day_ot_excess_total = ?,
        rest_day_ot_nd_hours = ?, rest_day_ot_nd_rate = ?, rest_day_ot_nd_total = ?,
        special_holiday_ot_hours = ?, special_holiday_ot_rate = ?, special_holiday_ot_total = ?,
        legal_holiday_ot_hours = ?, legal_holiday_ot_rate = ?, legal_holiday_ot_total = ?,
        legal_holiday_ot_excess_hours = ?, legal_holiday_ot_excess_rate = ?, legal_holiday_ot_excess_total = ?,
        legal_holiday_ot_nd_hours = ?, legal_holiday_ot_nd_rate = ?, legal_holiday_ot_nd_total = ?,
        night_diff_hours = ?, night_diff_rate = ?, night_diff_total = ?,
        basic_allowance_total = ?, temp_allowance_total = ?, gross = ?,
        sss_contribution = ?, sss_loan = ?, philhealth_contribution = ?,
        pagibig_contribution = ?, pagibig_loan = ?, donation = ?, cash_advance = ?,
        staff_shops = ?, net_pay = ?
      WHERE id = ?
    `;

    db.query(
      sqlUpdate,
      [
        basic_pay_days,
        basic_pay_rate,
        basic_pay_total,
        holiday_days,
        holiday_rate,
        holiday_total,
        management_bonus_total,
        thirteenth_month_total,
        regular_ot_hours,
        regular_ot_rate,
        regular_ot_total,
        regular_ot_nd_hours,
        regular_ot_nd_rate,
        regular_ot_nd_total,
        rest_day_ot_hours,
        rest_day_ot_rate,
        rest_day_ot_total,
        rest_day_ot_excess_hours,
        rest_day_ot_excess_rate,
        rest_day_ot_excess_total,
        rest_day_ot_nd_hours,
        rest_day_ot_nd_rate,
        rest_day_ot_nd_total,
        special_holiday_ot_hours,
        special_holiday_ot_rate,
        special_holiday_ot_total,
        legal_holiday_ot_hours,
        legal_holiday_ot_rate,
        legal_holiday_ot_total,
        legal_holiday_ot_excess_hours,
        legal_holiday_ot_excess_rate,
        legal_holiday_ot_excess_total,
        legal_holiday_ot_nd_hours,
        legal_holiday_ot_nd_rate,
        legal_holiday_ot_nd_total,
        night_diff_hours,
        night_diff_rate,
        night_diff_total,
        basic_allowance_total,
        temp_allowance_total,
        gross,
        sss_contribution,
        sss_loan,
        philhealth_contribution,
        pagibig_contribution,
        pagibig_loan,
        donation,
        cash_advance,
        staff_shops,
        net_pay,
        id,
      ],
      (err, updateResult) => {
        if (err) {
          console.error("Error updating payroll:", err);
          return res
            .status(500)
            .json({ success: false, message: "Database error." });
        }
        if (updateResult.affectedRows === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Payroll not found." });
        }
        res.json({ success: true, message: "Payroll updated successfully." });
      }
    );
  });
};

const confirmPayroll = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid payroll ID." });
  }

  const sqlUpdate = "UPDATE payrolls SET status = ? WHERE id = ?";

  db.query(sqlUpdate, ["Paid", id], (err, result) => {
    if (err) {
      console.error("Error updating status:", err);
      return res.status(500).json({
        success: false,
        message: "Database error while updating payroll status.",
      });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Payroll not found." });
    }

    res.json({ success: true, message: "Payroll status updated to 'Paid'." });
  });
};

const deletePayroll = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid payroll ID." });
  }

  const sqlDelete = "DELETE FROM payrolls WHERE id = ?";

  db.query(sqlDelete, [id], (err, result) => {
    if (err) {
      console.error("Error deleting payroll:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error while deleting." });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Payroll not found." });
    }

    res.json({ success: true, message: "Payroll deleted successfully." });
  });
};

module.exports = {
  getPayrolls,
  insertPayrolls,
  updatePayroll,
  confirmPayroll,
  deletePayroll,
};
