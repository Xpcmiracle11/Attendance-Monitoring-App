const db = require("../config/db");

const getTrucks = async (req, res) => {
  try {
    const sql = `
      SELECT 
        t.id AS truck_id,
        t.renewal_month,
        t.plate_number,
        t.truck_type,
        t.truck_brand,
        t.body_type,
        t.engine_number,
        t.chasis_number,
        t.classification,
        t.mv_file_number,
        t.cr_number,
        t.gross_weight,
        t.year_model,
        t.color,
        t.registered_owner,
        t.status,
        DATE_FORMAT(t.created_at, '%Y-%m-%d') AS created_at,
        DATE_FORMAT(tr.registration_date, '%Y-%m-%d') AS registration_date,
        tr.amount
      FROM trucks t
      LEFT JOIN truck_registration tr ON t.id = tr.truck_id
      ORDER BY t.created_at DESC
    `;

    const [results] = await db.query(sql);

    const truckMap = {};
    const trucks = [];

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
        trucks.push(truckMap[row.truck_id]);
      }

      if (row.registration_date && row.amount !== null) {
        truckMap[row.truck_id].registration_history.push({
          registration_date: row.registration_date,
          amount: row.amount,
        });
      }
    });

    res.json({ success: true, data: trucks });
  } catch (err) {
    console.error("❌ Error fetching trucks:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const insertTruck = async (req, res) => {
  try {
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

    const [check] = await db.query(
      "SELECT * FROM trucks WHERE plate_number = ?",
      [plate_number]
    );
    if (check.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Truck already exists." });
    }

    const sqlInsert = `
      INSERT INTO trucks (
        plate_number, renewal_month, truck_type, truck_brand, body_type, engine_number, 
        chasis_number, classification, mv_file_number, cr_number, gross_weight, 
        year_model, color, registered_owner, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Unknown', NOW())
    `;

    await db.query(sqlInsert, [
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
    ]);

    res.json({ success: true, message: "Truck added successfully" });
  } catch (err) {
    console.error("❌ Error inserting truck:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const updateTruck = async (req, res) => {
  try {
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
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });
    }

    const [truck] = await db.query("SELECT * FROM trucks WHERE id = ?", [id]);
    if (truck.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Truck not found." });
    }

    const [plateCheck] = await db.query(
      "SELECT * FROM trucks WHERE plate_number = ? AND id != ?",
      [plate_number, id]
    );
    if (plateCheck.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Truck already exists." });
    }

    const sqlUpdate = `
      UPDATE trucks SET 
        plate_number=?, renewal_month=?, truck_type=?, truck_brand=?, body_type=?, engine_number=?, 
        chasis_number=?, classification=?, mv_file_number=?, cr_number=?, gross_weight=?, 
        year_model=?, color=?, registered_owner=? WHERE id=?
    `;

    await db.query(sqlUpdate, [
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
    ]);

    res.json({ success: true, message: "Truck updated successfully" });
  } catch (err) {
    console.error("❌ Error updating truck:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const deleteTruck = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id)
      return res
        .status(400)
        .json({ success: false, message: "Invalid truck ID." });

    const [result] = await db.query("DELETE FROM trucks WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Truck not found." });
    }

    res.json({ success: true, message: "Truck deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting truck:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const insertTruckRegistration = async (req, res) => {
  try {
    const truckId = req.params.id;
    const { registration_date, amount } = req.body;

    if (!truckId || !registration_date || !amount) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });
    }

    const registrationYear = new Date(registration_date).getFullYear();

    const [check] = await db.query(
      "SELECT * FROM truck_registration WHERE truck_id = ? AND YEAR(registration_date) = ?",
      [truckId, registrationYear]
    );
    if (check.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Truck already registered this year.",
      });
    }

    const [insertResult] = await db.query(
      "INSERT INTO truck_registration (truck_id, registration_date, amount) VALUES (?, ?, ?)",
      [truckId, registration_date, amount]
    );

    res.json({
      success: true,
      message: "Registration added successfully",
      data: {
        id: insertResult.insertId,
        truck_id: truckId,
        registration_date,
        amount,
      },
    });
  } catch (err) {
    console.error("❌ Error inserting registration:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

module.exports = {
  getTrucks,
  insertTruck,
  updateTruck,
  deleteTruck,
  insertTruckRegistration,
};
