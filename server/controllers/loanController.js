const db = require("../config/db");

const getLoans = (req, res) => {
  const sql = `
  SELECT 
      l.id,
      u.id AS user_id,
      CONCAT_WS(' ', u.first_name, 
          IF(u.middle_name IS NOT NULL AND u.middle_name != '', CONCAT(SUBSTRING(u.middle_name, 1, 1), '.'), ''), 
          u.last_name
      ) AS full_name, 
      l.loan_amount,
      l.loan_balance,
      l.institution,
      l.loan_type,
      l.payment_every,
      l.payment_duration,
      l.status,
      DATE_FORMAT(l.created_at, '%Y-%m-%d') as created_at
    FROM loans l
    LEFT JOIN users u ON l.user_id = u.id;
    `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching loans:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error." });
    }
    res.json({ success: true, data: results });
  });
};

const insertLoan = (req, res) => {
  const {
    user_id,
    loan_amount,
    institution,
    loan_type,
    payment_every,
    payment_duration,
  } = req.body;

  const sqlInsert = `
    INSERT INTO loans (user_id, loan_amount, loan_balance, institution, loan_type, payment_every, payment_duration, status)
    VALUES (?, ?, ?, ?, ?, ?, "Pending")
    `;
  db.query(
    sqlInsert,
    [
      user_id,
      loan_amount,
      loan_amount,
      institution,
      loan_type,
      payment_every,
      payment_duration,
    ],
    (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error." });
      }
      res.json({ success: true, message: "Loan added successfully." });
    }
  );
};

const updateLoan = (req, res) => {
  const { id } = req.params;
  const {
    user_id,
    loan_amount,
    institution,
    loan_type,
    payment_every,
    payment_duration,
  } = req.body;

  if (
    !id ||
    !user_id ||
    !loan_amount ||
    !institution ||
    !loan_type ||
    !payment_every ||
    !payment_duration
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid loan data.",
    });
  }

  const sqlCheckID = "SELECT * FROM loans WHERE id = ?";
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
        .json({ success: false, message: "Loan not found." });
    }

    const sqlUpdate = `
    UPDATE loans
    SET user_id = ?, loan_amount = ?, loan_balance = ?, institution = ?, loan_type = ?, payment_every = ?, payment_duration = ? WHERE id = ?
    `;
    db.query(
      sqlUpdate,
      [
        user_id,
        loan_amount,
        loan_amount,
        institution,
        loan_type,
        payment_every,
        payment_duration,
        id,
      ],
      (err, updateResult) => {
        if (err) {
          console.error("Error updating loan:", err);
          return res
            .status(500)
            .json({ success: false, message: "Database error." });
        }
        if (updateResult.affectedRows === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Loan not found." });
        }
        res.json({ success: true, message: "Loan updated successfully." });
      }
    );
  });
};

const deleteLoan = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid loan ID." });
  }

  const sqlDelete = "DELETE FROM loans WHERE id = ?";
  db.query(sqlDelete, [id], (err, result) => {
    if (err) {
      console.error("Error deleting loan:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error while deleting." });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Loan not found." });
    }

    res.json({ success: true, message: "Loan deleted successfully." });
  });
};

module.exports = {
  getLoans,
  insertLoan,
  updateLoan,
  deleteLoan,
};
