const db = require("../config/db");
const jwt = require("jsonwebtoken");
const tokenBlacklist = new Set();

const getTrip = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(400)
      .json({ success: false, message: "No token provided." });
  }

  if (tokenBlacklist.has(token)) {
    return res
      .status(400)
      .json({ success: false, message: "Token has been invalidated." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    const sql = `
      SELECT 
        d.id,
        CONCAT_WS(' ', u.first_name, IFNULL(CONCAT(SUBSTRING(u.middle_name, 1, 1), '.'), ''), u.last_name) AS driver_name,
        t.plate_number,
        d.bound_from,
        d.bound_to,
        d.cargo_type,
        d.start_time,
        d.end_time,
        d.status,        
        DATE_FORMAT(d.created_at, '%Y-%m-%d') AS created_at
      FROM dispatches d
      LEFT JOIN users u ON u.id = d.driver_id
      LEFT JOIN trucks t ON t.id = d.plate_number_id
      WHERE d.driver_id = ?
      ORDER BY d.created_at DESC
      LIMIT 1;
    `;

    db.query(sql, [decoded.id], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error." });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No pending dispatch records found for this driver.",
        });
      }

      const dispatchRecord = results[0];

      const normalizedDispatchRecord = {
        id: dispatchRecord.id || null,
        driver_name: dispatchRecord.driver_name || "Unknown Driver",
        plate_number: dispatchRecord.plate_number || "N/A",
        bound_from: dispatchRecord.bound_from || "N/A",
        bound_to: dispatchRecord.bound_to || "N/A",
        cargo_type: dispatchRecord.cargo_type || "N/A",
        start_time: dispatchRecord.start_time || null,
        end_time: dispatchRecord.end_time || null,
        status: dispatchRecord.status || "Unknown",
        created_at: dispatchRecord.created_at || "N/A",
      };

      return res.json({
        success: true,
        dispatchDetails: normalizedDispatchRecord,
      });
    });
  } catch (error) {
    console.error("Error in getDriverDispatch:", error.message);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log-in again.",
      });
    }
    return res.status(401).json({ success: false, message: "Invalid token." });
  }
};

const startTrip = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { dispatch_id, location } = req.body;

  if (!token) {
    return res
      .status(400)
      .json({ success: false, message: "No token provided." });
  }

  if (tokenBlacklist.has(token)) {
    return res
      .status(400)
      .json({ success: false, message: "Token has been invalidated." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    if (!Array.isArray(location) || location.length !== 2) {
      return res.status(400).json({
        success: false,
        message: "Invalid location format. Expected [latitude, longitude].",
      });
    }

    const [latitude, longitude] = location;

    const updateDispatchSql = `
      UPDATE dispatches
      SET start_time = NOW(), status = 'Active'
      WHERE id = ? AND driver_id = ?
    `;

    db.query(
      updateDispatchSql,
      [dispatch_id, decoded.id],
      async (err, results) => {
        if (err) {
          console.error("Database error:", err);
          return res
            .status(500)
            .json({ success: false, message: "Database error." });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            message:
              "Dispatch record not found or does not belong to the driver.",
          });
        }

        const insertRouteHistorySql = `
        INSERT INTO route_history (dispatch_id, latitude, longitude, timestamp)
        VALUES (?, ?, ?, NOW())
      `;

        await new Promise((resolve, reject) => {
          db.query(
            insertRouteHistorySql,
            [dispatch_id, latitude, longitude],
            (err, results) => {
              if (err) {
                console.error("Database error:", err);
                return reject(
                  res
                    .status(500)
                    .json({ success: false, message: "Database error." })
                );
              }
              resolve();
            }
          );
        });

        return res.json({
          success: true,
          message: "Trip started successfully and first location recorded.",
        });
      }
    );
  } catch (error) {
    console.error("Error in startTrip:", error.message);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log-in again.",
      });
    }
    return res.status(401).json({ success: false, message: "Invalid token." });
  }
};

const getRouteHistory = (req, res) => {
  const { dispatchId } = req.params;

  const query = `
    SELECT latitude, longitude
    FROM route_history
    WHERE dispatch_id = ?
    ORDER BY timestamp ASC
  `;

  db.query(query, [dispatchId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error." });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No route history found for the given dispatch ID.",
      });
    }

    res.json({ success: true, data: results });
  });
};

const insertRouteHistory = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { dispatch_id, location } = req.body;

  if (!token) {
    return res
      .status(400)
      .json({ success: false, message: "No token provided." });
  }

  if (tokenBlacklist.has(token)) {
    return res
      .status(400)
      .json({ success: false, message: "Token has been invalidated." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    if (!Array.isArray(location) || location.length !== 2) {
      return res.status(400).json({
        success: false,
        message: "Invalid location format. Expected [latitude, longitude].",
      });
    }

    const [latitude, longitude] = location;

    const sql = `
      INSERT INTO route_history (dispatch_id, latitude, longitude, timestamp)
      VALUES (?, ?, ?, NOW())
    `;

    db.query(sql, [dispatch_id, latitude, longitude], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error." });
      }

      return res.json({
        success: true,
        message: "New row inserted into route history successfully.",
      });
    });
  } catch (error) {
    console.error("Error in insertRouteHistory:", error.message);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log-in again.",
      });
    }
    return res.status(401).json({ success: false, message: "Invalid token." });
  }
};

const endTrip = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { dispatch_id, location } = req.body;

  if (!token) {
    return res
      .status(400)
      .json({ success: false, message: "No token provided." });
  }

  if (tokenBlacklist.has(token)) {
    return res
      .status(400)
      .json({ success: false, message: "Token has been invalidated." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    if (!Array.isArray(location) || location.length !== 2) {
      return res.status(400).json({
        success: false,
        message: "Invalid location format. Expected [latitude, longitude].",
      });
    }

    const [latitude, longitude] = location;

    const updateDispatchSql = `
      UPDATE dispatches
      SET end_time = NOW(), status = 'Done'
      WHERE id = ? AND driver_id = ?
    `;

    db.query(
      updateDispatchSql,
      [dispatch_id, decoded.id],
      async (err, results) => {
        if (err) {
          console.error("Database error:", err);
          return res
            .status(500)
            .json({ success: false, message: "Database error." });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            message:
              "Dispatch record not found or does not belong to the driver.",
          });
        }

        const insertRouteHistorySql = `
        INSERT INTO route_history (dispatch_id, latitude, longitude, timestamp)
        VALUES (?, ?, ?, NOW())
      `;

        await new Promise((resolve, reject) => {
          db.query(
            insertRouteHistorySql,
            [dispatch_id, latitude, longitude],
            (err, results) => {
              if (err) {
                console.error("Database error:", err);
                return reject(
                  res
                    .status(500)
                    .json({ success: false, message: "Database error." })
                );
              }
              resolve();
            }
          );
        });

        return res.json({
          success: true,
          message: "Trip ended successfully and final location recorded.",
        });
      }
    );
  } catch (error) {
    console.error("Error in endTrip:", error.message);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log-in again.",
      });
    }
    return res.status(401).json({ success: false, message: "Invalid token." });
  }
};

module.exports = {
  getTrip,
  startTrip,
  getRouteHistory,
  insertRouteHistory,
  endTrip,
};
