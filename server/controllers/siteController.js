const db = require("../config/db");

const runQuery = async (sql, params = []) => {
  const conn = await db.getDB();
  const [rows] = await conn.query(sql, params);
  return rows;
};

const getSites = async (req, res) => {
  try {
    const sql = `
      SELECT 
        id, site_name, site_code,
        DATE_FORMAT(created_at, '%Y-%m-%d') AS created_at 
      FROM sites 
      ORDER BY created_at ASC
    `;
    const sites = await runQuery(sql);
    res.json({ success: true, data: sites });
  } catch (error) {
    console.error("Error fetching sites:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const insertSite = async (req, res) => {
  const { site_name, site_code } = req.body;

  if (!site_name || !site_code) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid site data." });
  }

  try {
    const existing = await runQuery(
      "SELECT id FROM sites WHERE site_code = ?",
      [site_code]
    );
    if (existing.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Site already exists." });
    }

    const sql = `
      INSERT INTO sites (site_name, site_code)
      VALUES (?, ?)
    `;
    await runQuery(sql, [site_name, site_code]);

    res.json({ success: true, message: "Site added successfully." });
  } catch (error) {
    console.error("Error inserting site:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const updateSite = async (req, res) => {
  const { id } = req.params;
  const { site_name, site_code } = req.body;

  if (!id || !site_name || !site_code) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid site data." });
  }

  try {
    const site = await runQuery("SELECT id FROM sites WHERE id = ?", [id]);
    if (site.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Site not found." });
    }

    const duplicate = await runQuery(
      "SELECT id FROM sites WHERE site_code = ? AND id != ?",
      [site_code, id]
    );
    if (duplicate.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Site IP already exists." });
    }

    const sql = `
      UPDATE sites 
      SET site_name = ?, site_code = ?
      WHERE id = ?
    `;
    const result = await runQuery(sql, [site_name, site_code, id]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Site not found." });
    }

    res.json({ success: true, message: "Site updated successfully." });
  } catch (error) {
    console.error("Error updating site:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const deleteSite = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid site ID." });
  }

  try {
    const sql = "DELETE FROM sites WHERE id = ?";
    const result = await runQuery(sql, [id]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Site not found." });
    }

    res.json({ success: true, message: "Site deleted successfully." });
  } catch (error) {
    console.error("Error deleting site:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

module.exports = {
  getSites,
  insertSite,
  updateSite,
  deleteSite,
};
