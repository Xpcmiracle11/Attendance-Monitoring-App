const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const loginUser = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err)
      return res.status(500).json({ success: false, message: "Server error" });

    if (results.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Email does not exist." });
    }

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ success: true, token });
  });
};

const getUserDetails = (req, res) => {
  const sql = `
    SELECT 
      users.department_id, 
      departments.name AS department_name, 
      users.first_name, 
      CONCAT(LEFT(users.middle_name, 1), '.') as middle_initial, 
      users.last_name, 
      users.email, 
      users.phone_number, 
      users.role, 
      users.image_file_name 
    FROM users 
    LEFT JOIN departments ON users.department_id = departments.id 
    WHERE users.id = ?
  `;

  db.query(sql, [req.user.id], (err, results) => {
    if (err) {
      return res
        .status(500)
        .json({ success: false, message: "Database error." });
    }
    if (results.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    let user = results[0];
    user.image_file_path = user.image_file_name
      ? `http://localhost:8080/uploads/${user.image_file_name}`
      : null;

    return res.json({ success: true, user });
  });
};

module.exports = { getUserDetails, loginUser };
