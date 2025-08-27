const ZKLib = require("zklib-js");
const db = require("../config/db");
const cron = require("node-cron");
const crypto = require("crypto");
const fs = require("fs");

const getAttendance = (req, res) => {
  const sql = `
   SELECT 
  CONCAT_WS(' ', u.first_name, 
    IFNULL(CONCAT(SUBSTRING(u.middle_name, 1, 1), '.'), ''), 
    u.last_name
  ) AS full_name,
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
  AND u.role NOT IN ('Manager', 'Corporate')
ORDER BY ad.clock_in DESC;

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

async function syncAttendanceFromAllDevices() {
  const devices = await queryAll(
    `SELECT id, name, ip_address, port FROM biometric_devices`
  );

  if (!devices || devices.length === 0) {
    console.log("⚠️ No biometric devices found in the database.");
    return;
  }

  for (const device of devices) {
    // console.log(
    //   `\n🔌 Connecting to device ${device.name} (${device.ip_address}:${device.port})`
    // );
    const zkInstance = new ZKLib(
      device.ip_address,
      Number(device.port),
      5200,
      5000
    );

    try {
      await zkInstance.createSocket();
      const logs = await zkInstance.getAttendances();

      // console.log(`📥 Raw Biometric Logs from ${device.name}`);

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

        // console.log("\n🔍 Processing Log:", {
        //   userId,
        //   recordTime: log.recordTime,
        //   timestamp,
        //   logHash,
        // });

        if (isNaN(timestamp.getTime())) {
          console.warn(`⚠️ Invalid timestamp: ${log.recordTime}`);
          continue;
        }

        const logAlreadyUsed = await querySingleResult(
          `SELECT id FROM attendance_details WHERE log_hash = ?`,
          [logHash]
        );
        if (logAlreadyUsed) {
          // console.log(`🔁 Duplicate log. Skipping logHash: ${logHash}`);
          continue;
        }

        const userExists = await querySingleResult(
          `SELECT id FROM users WHERE id = ?`,
          [userId]
        );
        if (!userExists) {
          // console.log(`⛔ User ${userId} not found. Skipping.`);
          continue;
        }

        const lastRecord = await querySingleResult(
          `SELECT id, clock_in, clock_out FROM attendance_details
           WHERE user_id = ?
           ORDER BY clock_in DESC LIMIT 1`,
          [userId]
        );

        if (lastRecord) {
          const lastClockIn = new Date(lastRecord.clock_in);
          const lastClockOut = lastRecord.clock_out
            ? new Date(lastRecord.clock_out)
            : null;

          if (
            timestamp <= lastClockIn ||
            (lastClockOut && timestamp <= lastClockOut)
          ) {
            // console.log(
            //   "⚠️ Skipped: Timestamp is older than last clock_in/clock_out"
            // );
            continue;
          }

          if (!lastClockOut) {
            const diffSec = (timestamp - lastClockIn) / 1000;
            if (diffSec >= 10) {
              await updateClockOut(userId, lastRecord.id, timestamp, logHash);
            } else {
              console.log(
                `⚠️ Skipped: Diff too short (${diffSec.toFixed(2)}s)`
              );
            }
            continue;
          }
        }

        await insertClockIn(userId, timestamp, logHash);
      }

      await zkInstance.disconnect();
      // console.log(`✅ Device ${device.name} sync complete.`);
    } catch (e) {
      console.error(`❌ Error syncing device ${device.name}:`, e);
    }
  }
}

function insertClockIn(userId, timestamp, logHash) {
  return new Promise((resolve) => {
    db.query(
      `INSERT INTO attendance_details 
       (user_id, clock_in, status, created_at, updated_at, log_hash)
       VALUES (?, ?, 'Present', NOW(), NOW(), ?)`,
      [userId, timestamp, logHash],
      (err, result) => {
        if (err) console.error("❌ Insert error:", err);
        else
          console.log(
            `🆕 INSERTED: user_id=${userId}, clock_in=${timestamp.toISOString()}, id=${
              result.insertId
            }`
          );
        resolve();
      }
    );
  });
}

function updateClockOut(userId, recordId, timestamp, logHash) {
  return new Promise((resolve) => {
    db.query(
      `UPDATE attendance_details 
       SET clock_out = ?, updated_at = NOW(), log_hash = ? 
       WHERE id = ?`,
      [timestamp, logHash, recordId],
      (err) => {
        if (err) console.error("❌ Update error:", err);
        else
          console.log(
            `📝 UPDATED: clock_out=${timestamp.toISOString()} for record ID ${recordId}`
          );
        resolve();
      }
    );
  });
}

function querySingleResult(query, params) {
  return new Promise((resolve) => {
    db.query(query, params, (err, results) => {
      if (err) {
        console.error("❌ DB error:", err);
        return resolve(null);
      }
      resolve(results.length > 0 ? results[0] : null);
    });
  });
}

function queryAll(query, params = []) {
  return new Promise((resolve, reject) => {
    db.query(query, params, (err, results) => {
      if (err) {
        console.error("❌ DB query error:", err);
        return reject(err);
      }
      resolve(results);
    });
  });
}

async function autoCloseMissingClockOuts() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split("T")[0];

  console.log(`⏰ Auto-clocking out for: ${dateStr}`);

  const missingClockOuts = await queryAll(
    `
    SELECT ad.id, ad.user_id, u.role, ad.log_hash
    FROM attendance_details ad
    JOIN users u ON ad.user_id = u.id
    WHERE DATE(ad.clock_in) = ? AND ad.clock_out IS NULL
  `,
    [dateStr]
  );

  for (const row of missingClockOuts) {
    const { id, user_id, role, log_hash } = row;

    if (role === "Crew" || role === "Driver") {
      // console.log(`⛔ Skipped user ${user_id} (${role})`);
      continue;
    }

    const clockOutTime = new Date(`${dateStr}T17:00:00`);

    await updateClockOut(user_id, id, clockOutTime, log_hash);
    console.log(`✅ Auto clocked-out user ${user_id} at 5:00 PM`);
  }
}

const logToFile = (message) => {
  fs.appendFileSync(
    "autoCloseLogs.log",
    `${new Date().toString()} - ${message}\n`
  );
};
function startBiometricCronJob() {
  cron.schedule("*/10 * * * * *", () => {
    syncAttendanceFromAllDevices();
  });
  cron.schedule(
    "0 8 * * *",
    async () => {
      logToFile("⏰ autoCloseMissingClockOuts started");

      try {
        await autoCloseMissingClockOuts();
        logToFile("✅ autoCloseMissingClockOuts completed");
      } catch (err) {
        logToFile("❌ ERROR: " + err.message);
      }
    },
    {
      timezone: "Asia/Manila",
    }
  );
}

module.exports = {
  getAttendance,
  updateAttendance,
  startBiometricCronJob,
};
