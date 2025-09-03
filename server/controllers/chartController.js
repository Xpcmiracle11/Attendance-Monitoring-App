const db = require("../config/db");
const dayjs = require("dayjs");

const getUserCount = async (req, res) => {
  const today = dayjs().format("YYYY-MM-DD");

  try {
    const totalCountSQL = `
      SELECT
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM users WHERE role NOT IN ('Crew', 'Driver')) AS total_admins,
        (SELECT COUNT(*) FROM users WHERE role = 'Crew') AS total_crews,
        (SELECT COUNT(*) FROM users WHERE role = 'Driver') AS total_drivers
    `;

    const stackedChartSQL = `
      SELECT
        ym.y,
        ym.m,
        COALESCE(SUM(CASE WHEN u.role NOT IN ('Crew', 'Driver') THEN u.num ELSE 0 END), 0) AS admins,
        COALESCE(SUM(CASE WHEN u.role = 'Crew' THEN u.num ELSE 0 END), 0) AS crews,
        COALESCE(SUM(CASE WHEN u.role = 'Driver' THEN u.num ELSE 0 END), 0) AS drivers
      FROM (
        SELECT y.y, m.m
        FROM (
          SELECT DISTINCT YEAR(created_at) AS y FROM users
        ) AS y
        CROSS JOIN (
          SELECT 1 AS m UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL
          SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL
          SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL
          SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12
        ) AS m
      ) AS ym
      LEFT JOIN (
        SELECT 
          YEAR(created_at) AS y,
          MONTH(created_at) AS m,
          role,
          COUNT(*) AS num
        FROM users
        GROUP BY y, m, role
      ) AS u
      ON u.y = ym.y AND u.m = ym.m
      GROUP BY ym.y, ym.m
      ORDER BY ym.y, ym.m
    `;

    const attendanceRateSQL = `
      SELECT
        (SELECT COUNT(*) FROM users) AS total,
        (SELECT COUNT(DISTINCT user_id) FROM attendance_details WHERE DATE(clock_in) = ? AND status = 'Present') AS present
    `;

    const dailyAttendanceSQL = `
      WITH RECURSIVE DateSeries AS (
        SELECT CURDATE() - INTERVAL 15 DAY AS date
        UNION ALL
        SELECT date + INTERVAL 1 DAY
        FROM DateSeries
        WHERE date + INTERVAL 1 DAY <= CURDATE()
      )

      SELECT
        ds.date,
        COUNT(DISTINCT ad.user_id) AS present
      FROM DateSeries ds
      LEFT JOIN attendance_details ad
        ON DATE(ad.clock_in) = ds.date AND ad.status = 'Present'
      GROUP BY ds.date
      ORDER BY ds.date;
    `;

    const [totals] = await db.query(totalCountSQL);
    const [chart] = await db.query(stackedChartSQL);
    const [rateResults] = await db.query(attendanceRateSQL, [today]);
    const [dailyAttendance] = await db.query(dailyAttendanceSQL);

    const { total, present } = rateResults[0];
    const attendanceRate =
      total > 0 ? ((present / total) * 100).toFixed(2) : "0.00";

    res.json({
      success: true,
      data: {
        totals: totals[0],
        chart,
        attendanceRateToday: {
          date: today,
          total,
          present,
          rate: `${attendanceRate}%`,
        },
        dailyAttendance,
      },
    });
  } catch (error) {
    console.error("❌ Error in getUserCount:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getUserCount };
