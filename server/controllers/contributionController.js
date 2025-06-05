const db = require("../config/db");

const getContributions = (req, res) => {
  const sql = `
    SELECT
    c.id,
    u.id AS user_id,
    CONCAT_WS(' ', u.first_name, 
          IF(u.middle_name IS NOT NULL AND u.middle_name != '', CONCAT(SUBSTRING(u.middle_name, 1, 1), '.'), ''), 
          u.last_name
      ) AS full_name, 
    c.sss,
    c.philhealth,
    c.pagibig,
    DATE_FORMAT(c.created_at, '%Y-%m-%d') as created_at
    FROM contributions c
    LEFT JOIN users u on c.user_id = u.id;
    `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching contributions:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error." });
    }
    res.json({ success: true, data: results });
  });
};

const updateContribution = (req, res) => {
  const { id } = req.params;
  const { sss, philhealth, pagibig } = req.body;

  if (!sss || !philhealth || !pagibig) {
    return res.status(400).json({
      success: false,
      message: "Invalid contribution data",
    });
  }

  const sqlCheckID = "SELECT * FROM contributions WHERE id = ?";
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
        .json({ success: false, message: "Contribution not found." });
    }

    const sqlUpdate = `
        UPDATE contributions
        SET sss = ?, philhealth = ?, pagibig = ? WHERE id = ?
        `;
    db.query(sqlUpdate, [sss, philhealth, pagibig, id], (err, updateResult) => {
      if (err) {
        console.error("Error updating contribution:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error." });
      }
      if (updateResult.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Contribution not found." });
      }
      res.json({ success: true, message: "Contribution updated successfully" });
    });
  });
};
module.exports = {
  getContributions,
  updateContribution,
};
