const db = require("../config/db");

const runQuery = async (sql, params = []) => {
  const conn = await db.getDB();
  const [rows] = await conn.query(sql, params);
  return rows;
};

const getFuels = async (req, res) => {
  try {
    const sql = `
      SELECT 
        fp.id,
        fp.site_id,
        s.site_name,
        fp.price_per_liter,
        fp.effective_date,
        fp.created_at,
        fp.updated_at
      FROM fuel_prices fp
      LEFT JOIN sites s 
        ON fp.site_id = s.id
      ORDER BY fp.id ASC
    `;

    const fuels = await runQuery(sql);

    res.json({ success: true, data: fuels });
  } catch (error) {
    console.error("Error fetching fuels:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const insertFuel = async (req, res) => {
  const { site_id, price_per_liter, effective_date } = req.body;

  if (!site_id || !price_per_liter || !effective_date) {
    return res
      .status(400)
      .json({ success: false, message: "All inputs are required." });
  }

  try {
    const existing = await runQuery(
      "SELECT id FROM fuel_prices WHERE site_id = ?",
      [site_id]
    );

    if (existing.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Site fuel price already exists." });
    }

    const sql = `
      INSERT INTO fuel_prices
        (site_id, price_per_liter, effective_date)
      VALUES (?, ?, ?)
    `;

    await runQuery(sql, [site_id, price_per_liter, effective_date]);

    res.json({ success: true, message: "Fuel added successfully." });
  } catch (error) {
    console.error("Error inserting fuel:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const updateFuel = async (req, res) => {
  const { id } = req.params;
  const { site_id, price_per_liter, effective_date } = req.body;

  if (!id || !site_id || !price_per_liter || !effective_date) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid fuel data." });
  }

  try {
    const fuel = await runQuery("SELECT * FROM fuel_prices WHERE id = ?", [id]);
    if (fuel.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Fuel not found." });
    }

    const currentFuel = fuel[0];

    if (
      currentFuel.price_per_liter != price_per_liter ||
      currentFuel.effective_date != effective_date
    ) {
      await runQuery(
        `INSERT INTO fuel_prices_history
         (fuel_id, site_id, price_per_liter, effective_date)
         VALUES (?, ?, ?, ?)`,
        [
          id,
          currentFuel.site_id,
          currentFuel.price_per_liter,
          currentFuel.effective_date,
        ]
      );
    }

    const sql = `
      UPDATE fuel_prices
      SET site_id = ?, price_per_liter = ?, effective_date = ? WHERE id = ?
    `;
    await runQuery(sql, [site_id, price_per_liter, effective_date, id]);

    res.json({ success: true, message: "Fuel updated successfully." });
  } catch (error) {
    console.error("Error updating fuel:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const deleteFuel = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid fuel ID." });
  }

  try {
    const sql = "DELETE FROM fuel_prices WHERE id = ?";
    const result = await runQuery(sql, [id]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Fuel not found." });
    }

    res.json({ success: true, message: "Fuel deleted successfully." });
  } catch (error) {
    console.error("Error deleting fuel:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

module.exports = {
  getFuels,
  insertFuel,
  updateFuel,
  deleteFuel,
};
