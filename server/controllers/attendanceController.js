const ZKLib = require("zklib-js");
const db = require("../config/db");
const cron = require("node-cron");

const getAttendance = (req, res) => {
  const sql = `
    SELECT 
        CONCAT_WS(' ', u.first_name, 
            IFNULL(CONCAT(SUBSTRING(u.middle_name, 1, 1), '.'), ''), 
            u.last_name) AS full_name,
        ad.id AS attendance_id,
        ad.user_id,
        DATE_FORMAT(ad.clock_in, '%Y-%m-%dT%H:%i:%s') AS clock_in,
        DATE_FORMAT(ad.clock_out, '%Y-%m-%dT%H:%i:%s') AS clock_out,
        DATE_FORMAT(ad.clock_in, '%h:%i:%s %p') AS clock_in_formatted,
        DATE_FORMAT(ad.clock_out, '%h:%i:%s %p') AS clock_out_formatted,
        ad.status,
        ad.created_at,
        u.image_file_name
    FROM
        attendance_details ad
    LEFT JOIN 
        users u ON ad.user_id = u.id
    WHERE 
        u.id IS NOT NULL
    ORDER BY 
        ad.created_at DESC;
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching attendance details:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No attendance records found.",
      });
    }

    results.forEach((attendance) => {
      attendance.image_file_path = attendance.image_file_name
        ? `http://localhost:8080/uploads/${attendance.image_file_name}`
        : null;
    });

    res.json({ success: true, data: results });
  });
};

const updateAttendance = (req, res) => {
  const { id } = req.params;
  const { clock_in, clock_out } = req.body;

  if (!clock_in || !clock_out) {
    return res.status(400).json({
      success: false,
      message: "Both clock in and clock out are required.",
    });
  }

  const sqlUpdate =
    "UPDATE attendance_details SET clock_in = ?, clock_out = ? WHERE id = ?";

  db.query(sqlUpdate, [clock_in, clock_out, id], (err, result) => {
    if (err) {
      console.error("Error updating attendance:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error." });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Attendance record not found." });
    }

    res.json({ success: true, message: "Attendance updated successfully." });
  });
};

async function syncAttendanceFromBiometric() {
  const zkInstance = new ZKLib("172.16.1.6", 4370, 5200, 5000);

  try {
    await zkInstance.createSocket();
    const logs = await zkInstance.getAttendances();

    const sortedLogs = logs.data.sort(
      (a, b) => new Date(a.recordTime) - new Date(b.recordTime)
    );

    for (const log of sortedLogs) {
      const userId = parseInt(log.deviceUserId);
      const timestamp = new Date(log.recordTime);

      if (isNaN(timestamp.getTime())) {
        console.warn(
          `⚠️ Invalid timestamp for user ${userId}: ${log.recordTime}`
        );
        continue;
      }

      const userExists = await new Promise((resolve) => {
        db.query(
          "SELECT id FROM users WHERE id = ?",
          [userId],
          (err, results) => {
            if (err) {
              console.error("Error checking user existence:", err);
              return resolve(false);
            }
            resolve(results.length > 0);
          }
        );
      });

      if (!userExists) {
        console.log(`⛔ Skipping log for deleted user ID ${userId}`);
        continue;
      }

      const dateOnly = timestamp.toISOString().split("T")[0];

      const checkQuery = `
        SELECT id, clock_in, clock_out FROM attendance_details 
        WHERE user_id = ? AND DATE(clock_in) = ?
        ORDER BY clock_in DESC LIMIT 1
      `;

      await new Promise((resolve) => {
        db.query(checkQuery, [userId, dateOnly], (err, results) => {
          if (err) {
            console.error("❌ DB select error:", err);
            return resolve();
          }

          if (results.length === 0) {
            const insertQuery = `
              INSERT INTO attendance_details (user_id, clock_in, status, created_at, updated_at)
              VALUES (?, ?, ?, NOW(), NOW())
            `;
            db.query(insertQuery, [userId, timestamp, "Present"], (err) => {
              if (err) console.error("Insert error:", err);
              else console.log(`✅ Clock in recorded for user ${userId}`);
              return resolve();
            });
          } else {
            const lastLog = results[0];

            if (!lastLog.clock_out) {
              const clockInTime = new Date(lastLog.clock_in);
              if (timestamp > clockInTime) {
                const updateQuery = `
                  UPDATE attendance_details SET clock_out = ?, updated_at = NOW()
                  WHERE id = ?
                `;
                db.query(updateQuery, [timestamp, lastLog.id], (err) => {
                  if (err) console.error("Update error:", err);
                  else console.log(`✅ Clock out updated for user ${userId}`);
                  return resolve();
                });
              } else {
                console.log(
                  `⏩ Skipping clock out for user ${userId} — earlier timestamp.`
                );
                return resolve();
              }
            } else {
              return resolve();
            }
          }
        });
      });
    }

    await zkInstance.disconnect();
  } catch (e) {
    console.error("❌ Error syncing biometric data:", e);
  }
}

function startBiometricCronJob() {
  cron.schedule("*/10 * * * * *", () => {
    syncAttendanceFromBiometric();
  });
}

module.exports = {
  getAttendance,
  updateAttendance,
  startBiometricCronJob,
};
