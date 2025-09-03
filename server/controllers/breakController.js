const jwt = require("jsonwebtoken");
const db = require("../config/db");

const runQuery = async (sql, params = []) => {
  const conn = await db.getDB();
  const [rows] = await conn.query(sql, params);
  return rows;
};

const getUserIdFromToken = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch {
    return null;
  }
};

const getTodayAttendanceId = async (userId) => {
  const sql = `
    SELECT id FROM attendance_details 
    WHERE user_id = ? AND DATE(clock_in) = CURDATE()
    ORDER BY clock_in DESC LIMIT 1
  `;
  const rows = await runQuery(sql, [userId]);
  return rows.length > 0 ? rows[0].id : null;
};

const startBreak = async (req, res) => {
  const { breakType } = req.body;
  const userId = getUserIdFromToken(req);

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }

  try {
    const attendanceId = await getTodayAttendanceId(userId);
    if (!attendanceId) {
      return res.status(400).json({
        success: false,
        message: "You must clock in before taking a break.",
      });
    }

    const breakLimit = { "Coffee Break": 2, "Lunch Break": 1 };

    const breakCounts = await runQuery(
      `
      SELECT break_type, COUNT(*) AS count 
      FROM break_details 
      WHERE attendance_id = ?
      GROUP BY break_type
    `,
      [attendanceId]
    );

    const currentCount =
      breakCounts.find((b) => b.break_type === breakType)?.count || 0;

    if (currentCount >= (breakLimit[breakType] || 0)) {
      return res.status(400).json({
        success: false,
        message: `You have already taken the maximum number of ${breakType.toLowerCase()}s today.`,
      });
    }

    const result = await runQuery(
      `
      INSERT INTO break_details 
      (attendance_id, break_start, break_type, created_at, updated_at) 
      VALUES (?, NOW(), ?, NOW(), NOW())
    `,
      [attendanceId, breakType]
    );

    res.json({
      success: true,
      message: `${breakType} started successfully.`,
      breakId: result.insertId,
    });
  } catch (error) {
    console.error("Error starting break:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const checkBreakLimits = async (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }

  try {
    const attendanceId = await getTodayAttendanceId(userId);
    if (!attendanceId) {
      return res.status(404).json({
        success: false,
        message: "No attendance record found for today.",
      });
    }

    const [counts] = await runQuery(
      `
      SELECT 
        SUM(CASE WHEN break_type = 'Coffee Break' THEN 1 ELSE 0 END) AS coffeeBreakCount,
        SUM(CASE WHEN break_type = 'Lunch Break' THEN 1 ELSE 0 END) AS lunchBreakCount
      FROM break_details
      WHERE attendance_id = ?
    `,
      [attendanceId]
    );

    res.json({
      success: true,
      data: {
        coffeeBreakCount: counts.coffeeBreakCount || 0,
        lunchBreakCount: counts.lunchBreakCount || 0,
      },
    });
  } catch (error) {
    console.error("Error checking break limits:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const endBreak = async (req, res) => {
  const { breakId } = req.body;

  if (!breakId) {
    return res.status(400).json({
      success: false,
      message: "Break ID is required.",
    });
  }

  try {
    const result = await runQuery(
      `
      UPDATE break_details 
      SET break_end = NOW(), updated_at = NOW() 
      WHERE id = ?
    `,
      [breakId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "No break found with the provided ID.",
      });
    }

    res.json({ success: true, message: "Break ended successfully." });
  } catch (error) {
    console.error("Error ending break:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  startBreak,
  checkBreakLimits,
  endBreak,
};
