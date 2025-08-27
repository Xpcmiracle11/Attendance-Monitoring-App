const path = require("path");
const db = require("../config/db");
require("dotenv").config();

const getMonitorings = (req, res) => {
  const sql = `
    SELECT 
      CONCAT_WS(' ', u.first_name, 
        IFNULL(CONCAT(SUBSTRING(u.middle_name, 1, 1), '.'), ''), 
        u.last_name
      ) AS full_name,  
      ad.id AS attendance_id,
      ad.user_id,
      ad.clock_in,
      ad.clock_out,
      ad.status,
      ad.created_at,
      ad.updated_at,
      u.image_file_name
    FROM users u
    LEFT JOIN attendance_details ad 
      ON u.id = ad.user_id
      AND ad.id = (
        SELECT MAX(id) 
        FROM attendance_details 
        WHERE user_id = u.id
      )
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching attendance details:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    results.forEach((attendance) => {
      attendance.image_file_path = attendance.image_file_name
        ? `${process.env.API_BASE_URL}/uploads/${attendance.image_file_name}`
        : null;
    });

    res.json({ success: true, data: results });
  });
};

module.exports = {
  getMonitorings,
};
