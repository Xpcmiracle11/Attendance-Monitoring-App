const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const db = require("../config/db");

const getUsers = (req, res) => {
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
        users.email, 
        users.phone_number, 
        users.role, 
        users.branch, 
        users.salary,
        users.password,
        users.image_file_name, 
        DATE_FORMAT(users.created_at, '%Y-%m-%d') AS created_at,

        -- Selecting schedule details
        GROUP_CONCAT(
            CONCAT(
                '{ "day": "', schedule_details.day, '", ',
                '"start_time": "', schedule_details.start_time, '", ',
                '"end_time": "', schedule_details.end_time, '", ', 
                '"schedule_status": "', schedule_details.schedule_status, '"}'
            ) SEPARATOR ',' 
        ) AS schedule_details_json

    FROM users users
    LEFT JOIN departments department ON users.department_id = department.id
    LEFT JOIN schedule_details ON schedule_details.user_id = users.id  

    GROUP BY users.id 
    ORDER BY users.created_at DESC;
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching users:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    results.forEach((user) => {
      user.image_file_path = user.image_file_name
        ? `http://localhost:8080/uploads/${user.image_file_name}`
        : null;

      if (user.schedule_details_json) {
        user.schedule_details = JSON.parse(`[${user.schedule_details_json}]`);
      }
    });

    res.json({ success: true, data: results });
  });
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
      email,
      phone_number,
      department_id,
      role,
      branch,
      salary,
      password,
    } = req.body;

    const sqlCheck = "SELECT * FROM users WHERE email = ?";
    db.query(sqlCheck, [email], async (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      }

      if (result.length > 0) {
        return res
          .status(400)
          .json({ success: false, message: "Email already exists." });
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const sqlInsert = `
        INSERT INTO users (
          first_name, middle_name, last_name, gender, birth_date, region, province, 
          municipality, barangay, street, email, phone_number, department_id, 
          role, branch, salary, password, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      db.query(
        sqlInsert,
        [
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
          phone_number,
          department_id,
          role,
          branch,
          salary,
          hashedPassword,
        ],
        (err, result) => {
          if (err) {
            console.error("Database error:", err);
            return res
              .status(500)
              .json({ success: false, message: "Database error" });
          }

          const userId = result.insertId;
          let newFileName = null;

          if (req.file) {
            const fileExt = path.extname(req.file.originalname);
            newFileName = `${first_name}_${userId}${fileExt}`;
            const newFilePath = path.join(
              __dirname,
              "../uploads/",
              newFileName
            );

            fs.renameSync(req.file.path, newFilePath);

            const sqlUpdateImage = `UPDATE users SET image_file_name = ? WHERE id = ?`;
            db.query(sqlUpdateImage, [newFileName, userId], (err) => {
              if (err) {
                console.error("Error updating image filename:", err);
                return res
                  .status(500)
                  .json({ success: false, message: "Image save error" });
              }
            });
          }

          const daysOfWeek = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ];
          const scheduleValues = daysOfWeek.map((day) => [
            userId,
            day,
            null,
            null,
            "TBD",
          ]);

          const sqlInsertSchedule = `
            INSERT INTO schedule_details (user_id, day, start_time, end_time, schedule_status) VALUES ?
          `;

          db.query(sqlInsertSchedule, [scheduleValues], (err) => {
            if (err) {
              console.error("Error inserting schedule details:", err);
              return res
                .status(500)
                .json({ success: false, message: "Schedule insert error" });
            }

            res.json({
              success: true,
              message: "User added successfully with default schedule",
              image_file_name: newFileName,
            });
          });
        }
      );
    });
  } catch (error) {
    console.error("Server error:", error);
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
    phone_number,
    department_id,
    role,
    branch,
    salary,
    password,
  } = req.body;

  try {
    const sqlCheckID = "SELECT * FROM users WHERE id = ?";
    db.query(sqlCheckID, [id], async (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error." });
      }

      if (result.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }

      const sqlCheckEmail = "SELECT * FROM users WHERE email = ? AND id != ?";
      db.query(sqlCheckEmail, [email, id], async (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res
            .status(500)
            .json({ success: false, message: "Database error." });
        }

        if (result.length > 0) {
          return res
            .status(400)
            .json({ success: false, message: "Email already exists." });
        }

        let updateFields = [
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
          phone_number,
          department_id,
          role,
          branch,
          salary,
        ];
        let updateQuery = `
          UPDATE users SET 
            first_name = ?, middle_name = ?, last_name = ?, gender = ?, birth_date = ?,
            region = ?, province = ?, municipality = ?, barangay = ?, street = ?, 
            email = ?, phone_number = ?, department_id = ?, role = ?, branch = ?, salary = ?
        `;

        if (password) {
          const saltRounds = 10;
          const hashedPassword = await bcrypt.hash(password, saltRounds);
          updateQuery += ", password = ?";
          updateFields.push(hashedPassword);
        }

        if (req.file) {
          const fileExt = path.extname(req.file.originalname);
          const newFileName = `${first_name}_${id}${fileExt}`;
          const newFilePath = path.join(__dirname, "../uploads/", newFileName);

          fs.renameSync(req.file.path, newFilePath);

          updateQuery += ", image_file_name = ?";
          updateFields.push(newFileName);
        }

        updateQuery += " WHERE id = ?";
        updateFields.push(id);

        db.query(updateQuery, updateFields, (err, result) => {
          if (err) {
            console.error("Error updating user:", err);
            return res
              .status(500)
              .json({ success: false, message: "Database error." });
          }

          if (result.affectedRows === 0) {
            return res
              .status(404)
              .json({ success: false, message: "User not found." });
          }

          res.json({ success: true, message: "User updated successfully." });
        });
      });
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const deleteUser = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid user ID." });
  }

  const sqlGetImage = "SELECT image_file_name FROM users WHERE id = ?";

  db.query(sqlGetImage, [id], (err, results) => {
    if (err) {
      console.error("Error fetching user image:", err);
      return res.status(500).json({
        success: false,
        message: "Database error while retrieving image.",
      });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const imageFileName = results[0].image_file_name;

    const sqlDelete = "DELETE FROM users WHERE id = ?";

    db.query(sqlDelete, [id], (err, result) => {
      if (err) {
        console.error("Error deleting user:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error while deleting." });
      }

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }

      if (imageFileName) {
        const imagePath = path.join(__dirname, "../uploads/", imageFileName);

        fs.unlink(imagePath, (err) => {
          if (err && err.code !== "ENOENT") {
            console.error("Error deleting user image:", err);
            return res
              .status(500)
              .json({ success: false, message: "Error deleting user image." });
          }
        });
      }

      res.json({ success: true, message: "User deleted successfully." });
    });
  });
};

const updateSchedule = (req, res) => {
  const { userId } = req.params;
  const { schedule_details } = req.body;

  if (!schedule_details || !Array.isArray(schedule_details)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid schedule data" });
  }

  const updateQueries = schedule_details.map((schedule) => {
    const { day, start_time, end_time, schedule_status } = schedule;
    return new Promise((resolve, reject) => {
      const sqlUpdate = `
        UPDATE schedule_details
        SET start_time = ?, end_time = ?, schedule_status = ?
        WHERE user_id = ? AND day = ?
      `;

      db.query(
        sqlUpdate,
        [start_time, end_time, schedule_status, userId, day],
        (err, result) => {
          if (err) {
            console.error("Error updating schedule for", day, err);
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });
  });

  Promise.all(updateQueries)
    .then(() => {
      res.json({ success: true, message: "Schedule updated successfully" });
    })
    .catch((err) => {
      res
        .status(500)
        .json({ success: false, message: "Failed to update schedule" });
    });
};

module.exports = {
  getUsers,
  insertUser,
  updateUser,
  deleteUser,
  updateSchedule,
};
