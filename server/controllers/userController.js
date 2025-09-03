const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const db = require("../config/db");
const ZKLib = require("zklib-js");
const Zkteco = require("zkteco-js");
require("dotenv").config();

const getUsers = async (req, res) => {
  try {
    const sql = `
      SELECT 
        users.id, 
        users.department_id, 
        department.name AS department_name,
        users.first_name,
        users.middle_name,
        users.last_name,
        CONCAT_WS(' ', users.first_name, 
            IF(users.middle_name IS NOT NULL AND users.middle_name != '', CONCAT(SUBSTRING(users.middle_name, 1, 1), '.'), ''), 
            users.last_name
        ) AS full_name,        
        users.gender, 
        DATE_FORMAT(users.birth_date, '%Y-%m-%d') as birth_date,
        users.region, 
        users.province, 
        users.municipality, 
        users.barangay,
        users.street,
        users.company,
        users.email, 
        users.phone_number, 
        users.role, 
        users.branch, 
        users.salary,
        users.password,
        users.image_file_name, 
        DATE_FORMAT(users.created_at, '%Y-%m-%d') AS created_at
      FROM users
      LEFT JOIN departments department ON users.department_id = department.id
      ORDER BY users.created_at DESC;
    `;

    const [results] = await db.query(sql);

    const data = results.map((user) => ({
      ...user,
      image_file_path: user.image_file_name
        ? `${process.env.API_BASE_URL}/uploads/${user.image_file_name}`
        : null,
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const insertUser = async (req, res) => {
  try {
    const {
      first_name,
      middle_name,
      last_name,
      gender,
      birth_date,
      region,
      province,
      municipality,
      barangay,
      street,
      company,
      email,
      phone_number,
      department_id,
      role,
      branch,
      salary,
      password,
    } = req.body;

    const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (existing.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertSql = `
      INSERT INTO users (
        first_name, middle_name, last_name, gender, birth_date, region, province, 
        municipality, barangay, street, company, email, phone_number, department_id, 
        role, branch, salary, password, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const [result] = await db.query(insertSql, [
      first_name,
      middle_name,
      last_name,
      gender,
      birth_date,
      region,
      province,
      municipality,
      barangay,
      street,
      company,
      email,
      phone_number,
      department_id,
      role,
      branch,
      salary,
      hashedPassword,
    ]);

    const userId = result.insertId;
    let newFileName = null;

    if (req.file) {
      const fileExt = path.extname(req.file.originalname);
      newFileName = `${first_name}_${userId}${fileExt}`;
      const newFilePath = path.join(__dirname, "../uploads/", newFileName);
      fs.renameSync(req.file.path, newFilePath);

      await db.query("UPDATE users SET image_file_name = ? WHERE id = ?", [
        newFileName,
        userId,
      ]);
    }

    const [devices] = await db.query(
      "SELECT ip_address, port FROM biometric_devices"
    );
    const shortName = first_name.split(" ")[0];

    for (const device of devices) {
      const zk = new ZKLib(
        device.ip_address,
        parseInt(device.port),
        10000,
        4000
      );
      try {
        await zk.createSocket();
        await zk.setUser(userId, userId.toString(), shortName, "1", "0");
        await zk.disconnect();
      } catch (zkErr) {
        console.error(
          `Failed to register on device ${device.ip_address}:`,
          zkErr
        );
      }
    }

    res.json({
      success: true,
      message: "User added successfully with biometric registration",
      image_file_name: newFileName,
    });
  } catch (error) {
    console.error("❌ Server error inserting user:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const {
    first_name,
    middle_name,
    last_name,
    gender,
    birth_date,
    region,
    province,
    municipality,
    barangay,
    street,
    email,
    company,
    phone_number,
    department_id,
    role,
    branch,
    salary,
    password,
  } = req.body;

  try {
    const [userCheck] = await db.query("SELECT * FROM users WHERE id = ?", [
      id,
    ]);
    if (userCheck.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const currentUser = userCheck[0];

    const [emailCheck] = await db.query(
      "SELECT * FROM users WHERE email = ? AND id != ?",
      [email || currentUser.email, id]
    );
    if (emailCheck.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists." });
    }

    const getValue = (newVal, oldVal) =>
      newVal !== undefined && newVal !== null && newVal !== ""
        ? newVal
        : oldVal;

    const updateFields = [
      getValue(first_name, currentUser.first_name),
      getValue(middle_name, currentUser.middle_name),
      getValue(last_name, currentUser.last_name),
      getValue(gender, currentUser.gender),
      getValue(birth_date, currentUser.birth_date),
      getValue(region, currentUser.region),
      getValue(province, currentUser.province),
      getValue(municipality, currentUser.municipality),
      getValue(barangay, currentUser.barangay),
      getValue(street, currentUser.street),
      getValue(company, currentUser.company),
      getValue(email, currentUser.email),
      getValue(phone_number, currentUser.phone_number),
      getValue(department_id, currentUser.department_id),
      getValue(role, currentUser.role),
      getValue(branch, currentUser.branch),
      getValue(salary, currentUser.salary),
    ];

    let updateQuery = `
      UPDATE users SET 
        first_name = ?, middle_name = ?, last_name = ?, gender = ?, birth_date = ?,
        region = ?, province = ?, municipality = ?, barangay = ?, street = ?, company = ?,
        email = ?, phone_number = ?, department_id = ?, role = ?, branch = ?, salary = ?
    `;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ", password = ?";
      updateFields.push(hashedPassword);
    }

    if (req.file) {
      const fileExt = path.extname(req.file.originalname);
      const newFileName = `${getValue(
        first_name,
        currentUser.first_name
      )}_${id}${fileExt}`;
      const newFilePath = path.join(__dirname, "../uploads/", newFileName);
      fs.renameSync(req.file.path, newFilePath);

      updateQuery += ", image_file_name = ?";
      updateFields.push(newFileName);
    }

    updateQuery += " WHERE id = ?";
    updateFields.push(id);

    const [result] = await db.query(updateQuery, updateFields);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    res.json({ success: true, message: "User updated successfully." });
  } catch (error) {
    console.error("❌ Server error updating user:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const [userRows] = await db.query(
      "SELECT image_file_name FROM users WHERE id = ?",
      [id]
    );
    if (userRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const imageFileName = userRows[0].image_file_name;

    const [devices] = await db.query(
      "SELECT ip_address, port FROM biometric_devices"
    );
    for (const device of devices) {
      const zk = new Zkteco(device.ip_address, device.port, 10000, 4000);
      try {
        await zk.createSocket();
        await zk.deleteUser(id);
        await zk.disconnect();
        console.log(`✅ User ${id} deleted from device ${device.ip_address}`);
      } catch (zkErr) {
        console.error(
          `❌ Error deleting user ${id} from ${device.ip_address}:`,
          zkErr.message
        );
      }
    }

    await db.query("DELETE FROM users WHERE id = ?", [id]);

    if (imageFileName) {
      const filePath = path.join(__dirname, "../uploads/", imageFileName);
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr && unlinkErr.code !== "ENOENT") {
          console.error("Error deleting image file:", unlinkErr);
        }
      });
    }

    res.json({
      success: true,
      message: "User deleted from DB and all biometric devices.",
    });
  } catch (error) {
    console.error("❌ Server error deleting user:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  getUsers,
  insertUser,
  updateUser,
  deleteUser,
};
