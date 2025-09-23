const ZKLib = require("zklib-js");
const db = require("../config/db");
const cron = require("node-cron");
const crypto = require("crypto");
const fs = require("fs");

const runQuery = async (sql, params = []) => {
  const conn = await db.getDB();
  const [rows] = await conn.query(sql, params);
  return rows;
};

const runSingle = async (sql, params = []) => {
  const rows = await runQuery(sql, params);
  return rows.length > 0 ? rows[0] : null;
};

const writeLog = (msg) =>
  fs.appendFileSync("autoCloseLogs.log", `${new Date()} - ${msg}\n`);

const getAttendance = async (req, res) => {
  try {
    const sql = `
      SELECT 
      CONCAT_WS(' ', u.first_name, 
        IFNULL(CONCAT(SUBSTRING(u.middle_name, 1, 1), '.'), ''), 
        u.last_name
      ) AS full_name,
      u.role,
      ad.id AS attendance_id,
      ad.user_id,
      DATE_FORMAT(ad.clock_in, '%Y-%m-%dT%H:%i:%s') AS clock_in,
      DATE_FORMAT(ad.clock_out, '%Y-%m-%dT%H:%i:%s') AS clock_out,
      DATE_FORMAT(ad.clock_in, '%W, %M %e, %Y %h:%i:%s %p') AS clock_in_formatted,
      DATE_FORMAT(ad.clock_out, '%W, %M %e, %Y %h:%i:%s %p') AS clock_out_formatted,
      CONCAT(
        LPAD(
          FLOOR(
            GREATEST((
              CASE
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
            ), 0) / 3600
          ), 2, '0'
        ), ':',
        LPAD(
          FLOOR(
            MOD(
              GREATEST((
                CASE
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
              ), 0), 3600
            ) / 60
          ), 2, '0'
        )
      ) AS duration,
      ROUND(u.salary / 8, 2) AS rate,
      ROUND(
        ((u.salary / 8) / 3600) * 
        GREATEST((
          CASE
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
        ), 0),
        2
      ) AS salary,
      ad.status,
      ad.created_at,
      u.image_file_name
    FROM attendance_details ad
    LEFT JOIN users u ON ad.user_id = u.id
    WHERE u.id IS NOT NULL
    ORDER BY ad.clock_in DESC;
    `;
    const results = await runQuery(sql);

    if (!results.length) {
      return res
        .status(404)
        .json({ success: false, message: "No attendance records found." });
    }

    const formatted = results.map((row) => ({
      ...row,
      image_file_path: row.image_file_name
        ? `http://localhost:8080/uploads/${row.image_file_name}`
        : null,
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error("❌ Error fetching attendance:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateAttendance = async (req, res) => {
  const { id } = req.params;
  const { clock_in, clock_out } = req.body;

  if (!clock_in || !clock_out) {
    return res.status(400).json({
      success: false,
      message: "Both clock in and clock out are required.",
    });
  }

  try {
    const result = await runQuery(
      `UPDATE attendance_details SET clock_in = ?, clock_out = ? WHERE id = ?`,
      [clock_in, clock_out, id]
    );

    if (!result.affectedRows) {
      return res
        .status(404)
        .json({ success: false, message: "Attendance record not found." });
    }

    res.json({ success: true, message: "Attendance updated successfully." });
  } catch (err) {
    console.error("❌ Error updating attendance:", err);
    res.status(500).json({ success: false, message: "Database error." });
  }
};

const insertClockIn = async (userId, timestamp, logHash) => {
  await runQuery(
    `INSERT INTO attendance_details 
     (user_id, clock_in, status, created_at, updated_at, log_hash)
     VALUES (?, ?, 'Present', NOW(), NOW(), ?)`,
    [userId, timestamp, logHash]
  );
  console.log(`🆕 Clock-In: ${userId} at ${timestamp}`);
};

const updateClockOut = async (userId, recordId, timestamp, logHash) => {
  await runQuery(
    `UPDATE attendance_details 
     SET clock_out = ?, updated_at = NOW(), log_hash = ? 
     WHERE id = ?`,
    [timestamp, logHash, recordId]
  );
  console.log(`📝 Clock-Out: ${userId} at ${timestamp}`);
};

const syncAttendanceFromAllDevices = async () => {
  const devices = await runQuery(
    `SELECT id, name, ip_address, port FROM biometric_devices`
  );
  if (!devices.length) return console.log("⚠️ No biometric devices found.");

  for (const device of devices) {
    const zk = new ZKLib(device.ip_address, Number(device.port), 5200, 5000);

    try {
      await zk.createSocket();
      const logs = await zk.getAttendances();
      const sortedLogs = logs.data.sort(
        (a, b) => new Date(a.recordTime) - new Date(b.recordTime)
      );

      for (const log of sortedLogs) {
        const userId = parseInt(log.deviceUserId);
        const timestamp = new Date(log.recordTime);
        const logHash = crypto
          .createHash("sha1")
          .update(`${log.userSn}-${log.recordTime}`)
          .digest("hex");

        if (isNaN(timestamp.getTime())) continue;
        if (
          await runSingle(
            `SELECT id FROM attendance_details WHERE log_hash=?`,
            [logHash]
          )
        )
          continue;
        if (!(await runSingle(`SELECT id FROM users WHERE id=?`, [userId])))
          continue;

        const lastRecord = await runSingle(
          `SELECT id, clock_in, clock_out 
           FROM attendance_details 
           WHERE user_id=? 
           ORDER BY clock_in DESC LIMIT 1`,
          [userId]
        );

        if (lastRecord) {
          const lastIn = new Date(lastRecord.clock_in);
          const lastOut = lastRecord.clock_out
            ? new Date(lastRecord.clock_out)
            : null;

          if (timestamp <= lastIn || (lastOut && timestamp <= lastOut))
            continue;

          if (!lastOut) {
            const diffSec = (timestamp - lastIn) / 1000;
            if (diffSec >= 10) {
              await updateClockOut(userId, lastRecord.id, timestamp, logHash);
            }
            continue;
          }
        }

        await insertClockIn(userId, timestamp, logHash);
      }

      await zk.disconnect();
    } catch (err) {
      console.error(`❌ Device ${device.name} sync failed:`, err);
    }
  }
};

const autoCloseMissingClockOuts = async () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split("T")[0];

  console.log(`⏰ Auto-clocking out: ${dateStr}`);
  const rows = await runQuery(
    `SELECT ad.id, ad.user_id, u.role, ad.log_hash
     FROM attendance_details ad
     JOIN users u ON ad.user_id = u.id
     WHERE DATE(ad.clock_in)=? AND ad.clock_out IS NULL`,
    [dateStr]
  );

  for (const row of rows) {
    if (["Crew", "Driver"].includes(row.role)) continue;
    const clockOutTime = new Date(`${dateStr}T17:00:00`);
    await updateClockOut(row.user_id, row.id, clockOutTime, row.log_hash);
    console.log(`✅ Auto clocked-out ${row.user_id}`);
  }
};

const startBiometricCronJob = () => {
  cron.schedule("*/10 * * * * *", syncAttendanceFromAllDevices);
  cron.schedule(
    "5 0 * * *",
    async () => {
      writeLog("⏰ autoCloseMissingClockOuts started");
      try {
        await autoCloseMissingClockOuts();
        writeLog("✅ autoCloseMissingClockOuts completed");
      } catch (err) {
        writeLog("❌ ERROR: " + err.message);
      }
    },
    { timezone: "Asia/Manila" }
  );
};

module.exports = {
  getAttendance,
  updateAttendance,
  startBiometricCronJob,
};
