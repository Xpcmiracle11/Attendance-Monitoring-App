const db = require("../config/db");

const getTrucks = (req, res) => {
  const sql = `
    SELECT 
      trucks.id AS truck_id,
      trucks.renewal_month,
      trucks.plate_number,
      trucks.truck_type,
      trucks.truck_brand,
      trucks.body_type,
      trucks.engine_number,
      trucks.chasis_number,
      trucks.classification,
      trucks.mv_file_number,
      trucks.cr_number,
      trucks.gross_weight,
      trucks.year_model,
      trucks.color,
      trucks.registered_owner,
      trucks.status,
      DATE_FORMAT(trucks.created_at, '%Y-%m-%d') AS created_at,
      DATE_FORMAT(truck_registration.registration_date, '%Y-%m-%d') AS registration_date,
      truck_registration.amount
    FROM trucks
    LEFT JOIN truck_registration ON trucks.id = truck_registration.truck_id
    ORDER BY trucks.created_at DESC;
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching trucks:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    const truckMap = {};
    const orderedTrucks = [];

    results.forEach((row) => {
      if (!truckMap[row.truck_id]) {
        truckMap[row.truck_id] = {
          id: row.truck_id,
          plate_number: row.plate_number,
          renewal_month: row.renewal_month,
          truck_type: row.truck_type,
          truck_brand: row.truck_brand,
          body_type: row.body_type,
          engine_number: row.engine_number,
          chasis_number: row.chasis_number,
          classification: row.classification,
          mv_file_number: row.mv_file_number,
          cr_number: row.cr_number,
          gross_weight: row.gross_weight,
          year_model: row.year_model,
          color: row.color,
          registered_owner: row.registered_owner,
          status: row.status,
          created_at: row.created_at,
          registration_history: [],
        };
        orderedTrucks.push(truckMap[row.truck_id]);
      }

      if (row.registration_date && row.amount !== null) {
        truckMap[row.truck_id].registration_history.push({
          registration_date: row.registration_date,
          amount: row.amount,
        });
      }
    });

    res.json({ success: true, data: orderedTrucks });
  });
};

const insertTruck = (req, res) => {
  const {
    plate_number,
    renewal_month,
    truck_type,
    truck_brand,
    body_type,
    engine_number,
    chasis_number,
    classification,
    mv_file_number,
    cr_number,
    gross_weight,
    year_model,
    color,
    registered_owner,
  } = req.body;

  const sqlCheck = "SELECT * FROM trucks WHERE plate_number = ?";
  db.query(sqlCheck, [plate_number], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    if (result.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Truck already exists." });
    }

    const sqlInsert = `
      INSERT INTO trucks (
        plate_number,
        renewal_month,
        truck_type,
        truck_brand,
        body_type,
        engine_number,
        chasis_number,
        classification,
        mv_file_number,
        cr_number,
        gross_weight,
        year_model,
        color,
        registered_owner,
        status,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const values = [
      plate_number,
      renewal_month,
      truck_type,
      truck_brand,
      body_type,
      engine_number,
      chasis_number,
      classification,
      mv_file_number,
      cr_number,
      gross_weight,
      year_model,
      color,
      registered_owner,
      "Unknown",
    ];

    db.query(sqlInsert, values, (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      }

      res.json({ success: true, message: "Truck added successfully" });
    });
  });
};

const updateTruck = (req, res) => {
  const { id } = req.params;
  const {
    plate_number,
    renewal_month,
    truck_type,
    truck_brand,
    body_type,
    engine_number,
    chasis_number,
    classification,
    mv_file_number,
    cr_number,
    gross_weight,
    year_model,
    color,
    registered_owner,
  } = req.body;

  if (!id || !plate_number || !renewal_month || !truck_type) {
    return res.status(400).json({
      success: false,
      message: "Missing required truck fields.",
    });
  }

  const sqlCheckID = "SELECT * FROM trucks WHERE id = ?";
  db.query(sqlCheckID, [id], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error." });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Truck not found.",
      });
    }

    const sqlCheckPlate =
      "SELECT * FROM trucks WHERE plate_number = ? AND id != ?";
    db.query(sqlCheckPlate, [plate_number, id], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error." });
      }

      if (result.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Truck already exists",
        });
      }

      const sqlUpdate = `
        UPDATE trucks SET
          plate_number = ?,
          renewal_month = ?,
          truck_type = ?,
          truck_brand = ?,
          body_type = ?,
          engine_number = ?,
          chasis_number = ?,
          classification = ?,
          mv_file_number = ?,
          cr_number = ?,
          gross_weight = ?,
          year_model = ?,
          color = ?,
          registered_owner = ?
        WHERE id = ?
      `;

      const values = [
        plate_number,
        renewal_month,
        truck_type,
        truck_brand,
        body_type,
        engine_number,
        chasis_number,
        classification,
        mv_file_number,
        cr_number,
        gross_weight,
        year_model,
        color,
        registered_owner,
        id,
      ];

      db.query(sqlUpdate, values, (err, result) => {
        if (err) {
          console.error("Error updating truck:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to update truck.",
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            message: "Truck not found.",
          });
        }

        res.json({
          success: true,
          message: "Truck updated successfully.",
        });
      });
    });
  });
};

const deleteTruck = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid truck ID." });
  }

  const sqlDelete = "DELETE FROM trucks WHERE id = ?";

  db.query(sqlDelete, [id], (err, result) => {
    if (err) {
      console.error("Error deleting truck:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error while deleting." });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Truck not found." });
    }

    res.json({ success: true, message: "Truck deleted successfully." });
  });
};

const insertTruckRegistration = (req, res) => {
  const truckId = req.params.id;
  const { registration_date, amount } = req.body;

  if (!truckId || !registration_date || !amount) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields." });
  }

  const registrationYear = new Date(registration_date).getFullYear();

  const checkSql = `
    SELECT * FROM truck_registration 
    WHERE truck_id = ? AND YEAR(registration_date) = ?
  `;

  db.query(checkSql, [truckId, registrationYear], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("Error checking truck registration:", checkErr);
      return res
        .status(500)
        .json({ success: false, message: "Database error." });
    }

    if (checkResults.length > 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Truck already registered this year.",
        });
    }

    const insertSql = `
      INSERT INTO truck_registration (truck_id, registration_date, amount) 
      VALUES (?, ?, ?)
    `;

    db.query(
      insertSql,
      [truckId, registration_date, amount],
      (insertErr, insertResults) => {
        if (insertErr) {
          console.error("Error inserting registration:", insertErr);
          return res.status(500).json({
            success: false,
            message: "Failed to insert registration.",
          });
        }

        return res.status(200).json({
          success: true,
          message: "Registration added successfully.",
          data: {
            id: insertResults.insertId,
            truck_id: truckId,
            registration_date,
            amount,
          },
        });
      }
    );
  });
};
module.exports = {
  getTrucks,
  insertTruck,
  updateTruck,
  deleteTruck,
  insertTruckRegistration,
};
