const db = require("../config/db");
const jwt = require("jsonwebtoken");

const getUserIdFromToken = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch (err) {
    return null;
  }
};

const startBreak = async (req, res) => {
  const { breakType } = req.body;
  const userId = getUserIdFromToken(req);

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }

  try {
    const attendanceQuery = `
      SELECT id FROM attendance_details 
      WHERE user_id = ? AND DATE(clock_in) = CURDATE()
      ORDER BY clock_in DESC LIMIT 1
    `;
    const [attendanceResults] = await db
      .promise()
      .query(attendanceQuery, [userId]);

    if (attendanceResults.length === 0) {
      return res.status(400).json({
        success: false,
        message: "You must clock in before taking a break.",
      });
    }

    const attendanceId = attendanceResults[0].id;

    const checkQuery = `
      SELECT break_type, COUNT(*) AS count 
      FROM break_details 
      WHERE attendance_id = ?
      GROUP BY break_type
    `;
    const [breakCounts] = await db.promise().query(checkQuery, [attendanceId]);

    const breakLimit = {
      "Coffee Break": 2,
      "Lunch Break": 1,
    };

    const currentCount =
      breakCounts.find((b) => b.break_type === breakType)?.count || 0;

    if (currentCount >= breakLimit[breakType]) {
      return res.status(400).json({
        success: false,
        message: `You have already taken the maximum number of ${breakType.toLowerCase()}s today.`,
      });
    }

    const insertQuery = `
      INSERT INTO break_details 
      (attendance_id, break_start, break_type, created_at, updated_at) 
      VALUES (?, NOW(), ?, NOW(), NOW())
    `;
    const [insertResults] = await db
      .promise()
      .query(insertQuery, [attendanceId, breakType]);

    return res.json({
      success: true,
      message: `${breakType} started successfully.`,
      breakId: insertResults.insertId,
    });
  } catch (error) {
    console.error("Error starting break:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

const checkBreakLimits = async (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }

  try {
    const attendanceQuery = `
      SELECT id FROM attendance_details 
      WHERE user_id = ? AND DATE(clock_in) = CURDATE()
      ORDER BY clock_in DESC LIMIT 1
    `;
    const [attendanceResults] = await db
      .promise()
      .query(attendanceQuery, [userId]);

    if (attendanceResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No attendance record found for today.",
      });
    }

    const attendanceId = attendanceResults[0].id;

    const countQuery = `
      SELECT 
        SUM(CASE WHEN break_type = 'Coffee Break' THEN 1 ELSE 0 END) AS coffeeBreakCount,
        SUM(CASE WHEN break_type = 'Lunch Break' THEN 1 ELSE 0 END) AS lunchBreakCount
      FROM break_details
      WHERE attendance_id = ?
    `;
    const [results] = await db.promise().query(countQuery, [attendanceId]);

    res.json({
      success: true,
      data: {
        coffeeBreakCount: results[0].coffeeBreakCount || 0,
        lunchBreakCount: results[0].lunchBreakCount || 0,
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
    const updateQuery = `
      UPDATE break_details 
      SET break_end = NOW(), updated_at = NOW() 
      WHERE id = ?
    `;
    const [updateResults] = await db.promise().query(updateQuery, [breakId]);

    if (updateResults.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "No break found with the provided ID.",
      });
    }

    res.json({
      success: true,
      message: "Break ended successfully.",
    });
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
