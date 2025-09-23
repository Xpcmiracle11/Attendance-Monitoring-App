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
        p.status,
        DATE_FORMAT(p.created_at, '%Y-%m-%d') AS created_at
      FROM payrolls p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.role NOT IN ('Manager', 'Corporate')
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
    const sql = `
      WITH RECURSIVE dates AS (
      SELECT DATE(?) AS d
      UNION ALL
      SELECT DATE_ADD(d, INTERVAL 1 DAY) FROM dates WHERE d < DATE(?)
    ),
    ad_per_day AS (
      SELECT
        ad.user_id,
        DATE(ad.clock_in) AS d,
        SUM(
          GREATEST((
            CASE
              WHEN ad.clock_in IS NULL OR ad.clock_out IS NULL THEN 0
              WHEN TIME(ad.clock_out) BETWEEN '12:00:00' AND '13:00:00' THEN 
                TIMESTAMPDIFF(SECOND, 
                  GREATEST(ad.clock_in, CONCAT(DATE(ad.clock_in), ' 08:00:00')),
                  STR_TO_DATE(CONCAT(DATE(ad.clock_out), ' 12:00:00'), '%Y-%m-%d %H:%i:%s')
                )
              WHEN TIME(ad.clock_in) BETWEEN '12:00:00' AND '13:00:00' THEN 
                TIMESTAMPDIFF(SECOND,
                  STR_TO_DATE(CONCAT(DATE(ad.clock_in), ' 13:00:00'), '%Y-%m-%d %H:%i:%s'),
                  LEAST(ad.clock_out, CONCAT(DATE(ad.clock_in), ' 17:00:00'))
                )
              WHEN TIME(ad.clock_in) < '12:00:00' AND TIME(ad.clock_out) >= '13:00:00' THEN 
                TIMESTAMPDIFF(SECOND, 
                  GREATEST(ad.clock_in, CONCAT(DATE(ad.clock_in), ' 08:00:00')),
                  LEAST(ad.clock_out, CONCAT(DATE(ad.clock_in), ' 17:00:00'))
                ) - 3600
              ELSE 
                TIMESTAMPDIFF(SECOND, 
                  GREATEST(ad.clock_in, CONCAT(DATE(ad.clock_in), ' 08:00:00')),
                  LEAST(ad.clock_out, CONCAT(DATE(ad.clock_in), ' 17:00:00'))
                )
            END
          ), 0)
        ) AS worked_seconds
      FROM attendance_details ad
      WHERE ad.clock_in >= ? 
        AND ad.clock_in < DATE_ADD(?, INTERVAL 1 DAY)
      GROUP BY ad.user_id, DATE(ad.clock_in)
    )

    SELECT 
      u.id AS user_id,
      u.salary / 8 AS daily_rate,
      FORMAT(
        (SUM(COALESCE(apd.worked_seconds, 0))/3600)
        + SUM(
            CASE 
              WHEN h.holiday_type IS NOT NULL      
              AND apd.user_id IS NULL           
              THEN 8 ELSE 0
            END
          )
      , 2) AS hours_worked,
      (
        (SUM(COALESCE(apd.worked_seconds, 0))/3600) * (u.salary / 8)
        + SUM(
            CASE 
              WHEN h.holiday_type IS NOT NULL AND apd.user_id IS NULL 
              THEN u.salary ELSE 0
            END
          )
      ) AS gross_pay,
      SUM(
        CASE 
          WHEN h.holiday_type = 'Legal'
          THEN COALESCE(apd.worked_seconds,0)/3600
          ELSE 0
        END
      ) AS legal_holiday_days,
      (u.salary / 8) AS legal_holiday_rate,
      SUM(
        CASE 
          WHEN h.holiday_type = 'Legal'
          THEN (u.salary / 8) * (COALESCE(apd.worked_seconds,0)/3600)
          ELSE 0
        END
      ) AS legal_holiday_total,

      SUM(
        CASE 
          WHEN h.holiday_type = 'Special'
          THEN COALESCE(apd.worked_seconds,0)/3600
          ELSE 0
        END
      ) AS special_holiday_days,
      (u.salary / 8) * 0.30 AS special_holiday_rate,
      SUM(
        CASE 
          WHEN h.holiday_type = 'Special'
          THEN (u.salary / 8) * 0.30 * (COALESCE(apd.worked_seconds,0)/3600)
          ELSE 0
        END
      ) AS special_holiday_total,

      GROUP_CONCAT(
        DISTINCT CASE 
          WHEN apd.worked_seconds IS NOT NULL AND apd.worked_seconds > 0 
          THEN CONCAT(d.d, '|', FORMAT(apd.worked_seconds/3600, 2))
          ELSE NULL
        END
        ORDER BY d.d
      ) AS date_attended

    FROM users u
    CROSS JOIN dates d                             
    LEFT JOIN ad_per_day apd
      ON apd.user_id = u.id
    AND apd.d = d.d                              
    LEFT JOIN holidays h
      ON MONTH(d.d) = h.holiday_month
    AND DAY(d.d)   = h.holiday_date              
    WHERE u.role = ?
    GROUP BY u.id, u.salary
    `;

    const queryParams = [
      period_start,
      period_end,
      period_start,
      period_end,
      role,
    ];

    const results = await runQuery(sql, queryParams);

    const values = results.map((user) => {
      const basicTotal = parseFloat(user.gross_pay || 0);
      const legalHolidayTotal = parseFloat(user.legal_holiday_total || 0);
      const specialHolidayTotal = parseFloat(user.special_holiday_total || 0);
      const adjustmentTotal = 0;
      const leaveTotal = 0;
      const managementBonusTotal = 0;
      const thirteenthMonthTotal = 0;
      const regularOtTotal = 0;
      const regularOtNdTotal = 0;
      const restDayOtTotal = 0;
      const restDayOtExcessTotal = 0;
      const restDayOtNdTotal = 0;
      const specialHolidayOtTotal = 0;
      const legalHolidayOtTotal = 0;
      const legalHolidayOtExcessTotal = 0;
      const legalHolidayOtNdTotal = 0;
      const nightDiffTotal = 0;
      const basicAllowanceTotal = 0;
      const tempAllowanceTotal = 0;

      const totalEarnings =
        basicTotal +
        legalHolidayTotal +
        specialHolidayTotal +
        adjustmentTotal +
        leaveTotal +
        managementBonusTotal +
        thirteenthMonthTotal +
        regularOtTotal +
        regularOtNdTotal +
        restDayOtTotal +
        restDayOtExcessTotal +
        restDayOtNdTotal +
        specialHolidayOtTotal +
        legalHolidayOtTotal +
        legalHolidayOtExcessTotal +
        legalHolidayOtNdTotal +
        nightDiffTotal +
        basicAllowanceTotal +
        tempAllowanceTotal;

      const grossForSSS = totalEarnings * 2;
      let sssContribution = 0;
      if (payroll_period === "Payroll Period 1") {
        if (grossForSSS <= 4000) sssContribution = 180.0;
        else if (grossForSSS <= 4500) sssContribution = 202.5;
        else if (grossForSSS <= 5000) sssContribution = 225.0;
        else if (grossForSSS <= 5500) sssContribution = 247.5;
        else if (grossForSSS <= 6000) sssContribution = 270.0;
        else if (grossForSSS <= 6500) sssContribution = 292.5;
        else if (grossForSSS <= 7000) sssContribution = 315.0;
        else if (grossForSSS <= 7500) sssContribution = 337.5;
        else if (grossForSSS <= 8000) sssContribution = 360.0;
        else if (grossForSSS <= 8500) sssContribution = 382.5;
        else if (grossForSSS <= 9000) sssContribution = 405.0;
        else if (grossForSSS <= 9500) sssContribution = 427.5;
        else if (grossForSSS <= 10000) sssContribution = 450.0;
        else if (grossForSSS <= 10500) sssContribution = 472.5;
        else if (grossForSSS <= 11000) sssContribution = 495.0;
        else if (grossForSSS <= 11500) sssContribution = 517.5;
        else if (grossForSSS <= 12000) sssContribution = 540.0;
        else if (grossForSSS <= 12500) sssContribution = 562.5;
        else if (grossForSSS <= 13000) sssContribution = 585.0;
        else if (grossForSSS <= 13500) sssContribution = 607.5;
        else if (grossForSSS <= 14000) sssContribution = 630.0;
        else if (grossForSSS <= 14500) sssContribution = 652.5;
        else if (grossForSSS <= 15000) sssContribution = 675.0;
        else if (grossForSSS <= 15500) sssContribution = 697.5;
        else if (grossForSSS <= 16000) sssContribution = 720.0;
        else if (grossForSSS <= 16500) sssContribution = 742.5;
        else if (grossForSSS <= 17000) sssContribution = 765.0;
        else if (grossForSSS <= 17500) sssContribution = 787.5;
        else if (grossForSSS <= 18000) sssContribution = 810.0;
        else if (grossForSSS <= 18500) sssContribution = 832.5;
        else if (grossForSSS <= 19000) sssContribution = 855.0;
        else if (grossForSSS <= 19500) sssContribution = 877.5;
        else sssContribution = 900.0;
      }

      const philhealthContribution =
        payroll_period === "Payroll Period 1"
          ? +(totalEarnings * 0.05).toFixed(2)
          : 0;

      const pagibigContribution =
        payroll_period === "Payroll Period 2" ? 200 : 0;

      return [
        user.user_id, // user_id
        user.date_attended || "", // date_attended
        payroll_period, // payroll_period
        period_start, // period_start
        period_end, // period_end
        parseFloat(user.hours_worked || 0), // basic_pay_days
        parseFloat(user.daily_rate || 0), // basic_pay_rate
        basicTotal, // basic_pay_total
        parseFloat(user.legal_holiday_days || 0), // legal_holiday_days
        parseFloat(user.legal_holiday_rate || 0), // legal_holiday_rate
        legalHolidayTotal, // legal_holiday_total
        parseFloat(user.special_holiday_days || 0), // special_holiday_days
        parseFloat(user.special_holiday_rate || 0), // special_holiday_rate
        specialHolidayTotal, // special_holiday_total
        0, // adjustment_days
        0, // adjustment_rate
        adjustmentTotal, // adjustment_total
        0, // leave_days
        0, // leave_rate
        leaveTotal, // leave_total
        managementBonusTotal, // management_bonus_total
        thirteenthMonthTotal, // thirteenth_month_total
        0, // regular_ot_hours
        0, // regular_ot_rate
        regularOtTotal, // regular_ot_total
        0, // regular_ot_nd_hours
        0, // regular_ot_nd_rate
        regularOtNdTotal, // regular_ot_nd_total
        0, // rest_day_ot_hours
        0, // rest_day_ot_rate
        restDayOtTotal, // rest_day_ot_total
        0, // rest_day_ot_excess_hours
        0, // rest_day_ot_excess_rate
        restDayOtExcessTotal, // rest_day_ot_excess_total
        0, // rest_day_ot_nd_hours
        0, // rest_day_ot_nd_rate
        restDayOtNdTotal, // rest_day_ot_nd_total
        0, // special_holiday_ot_hours
        0, // special_holiday_ot_rate
        specialHolidayOtTotal, // special_holiday_ot_total
        0, // legal_holiday_ot_hours
        0, // legal_holiday_ot_rate
        legalHolidayOtTotal, // legal_holiday_ot_total
        0, // legal_holiday_ot_excess_hours
        0, // legal_holiday_ot_excess_rate
        legalHolidayOtExcessTotal, // legal_holiday_ot_excess_total
        0, // legal_holiday_ot_nd_hours
        0, // legal_holiday_ot_nd_rate
        legalHolidayOtNdTotal, // legal_holiday_ot_nd_total
        0, // night_diff_hours
        0, // night_diff_rate
        nightDiffTotal, // night_diff_total
        basicAllowanceTotal, // basic_allowance_total
        tempAllowanceTotal, // temp_allowance_total
        totalEarnings, // total_earnings
        sssContribution, // sss_contribution
        0, // sss_loan
        philhealthContribution, // philhealth_contribution
        pagibigContribution, // pagibig_contribution
        0, // pagibig_loan
        0, // donation
        0, // cash_advance
        0, // staff_shops
        totalEarnings, // net_pay
      ];
    });

    const insertSql = `
    INSERT INTO payrolls (
    user_id,
    date_attended,
    payroll_period,
    period_start,
    period_end,
    basic_pay_days,
    basic_pay_rate,
    basic_pay_total,
    legal_holiday_days,
    legal_holiday_rate,
    legal_holiday_total,
    special_holiday_days,
    special_holiday_rate,
    special_holiday_total,
    adjustment_days,
    adjustment_rate,
    adjustment_total,
    leave_days,
    leave_rate,
    leave_total,
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
    net_pay
  ) VALUES ?
`;

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

    payrollData.status = "Unpaid";

    const fields = Object.keys(payrollData)
      .map((field) => `${field} = ?`)
      .join(", ");
    const values = [...Object.values(payrollData), id];

    const updateSql = `UPDATE payrolls SET ${fields} WHERE id = ?`;
    await runQuery(updateSql, values);

    res.json({
      success: true,
      message: "Payroll updated successfully, status set to Unpaid.",
    });
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

const getArchivePayrolls = async (req, res) => {
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
        p.gross, p.net_pay, p.status, p.sss_loan, p.pagibig_loan, p.staff_shops, p.cash_advance,
        p.sss_contribution, p.pagibig_contribution, p.philhealth_contribution,
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
        DATE_FORMAT(p.created_at, '%Y-%m-%d') AS created_at
      FROM payrolls p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE p.status = 'Paid'
      AND u.role NOT IN ('Manager', 'Corporate')
      ORDER BY p.period_start DESC;
    `;

    const rows = await runQuery(sql);

    const grouped = rows.reduce((acc, row) => {
      const key = `${row.period_start}_${row.period_end}`;
      if (!acc[key]) {
        acc[key] = {
          payroll_period: row.payroll_period,
          role: row.role,
          period_start: row.period_start,
          period_end: row.period_end,
          employees: [],
        };
      }
      acc[key].employees.push(row);
      return acc;
    }, {});

    res.json({ success: true, data: Object.values(grouped) });
  } catch (error) {
    console.error("Error fetching archive payrolls:", error);
    res.status(500).json({ success: false, message: "Database error." });
  }
};

module.exports = {
  getPayrolls,
  insertPayrolls,
  updatePayroll,
  confirmPayroll,
  deletePayroll,
  getArchivePayrolls,
};
