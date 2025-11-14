const db = require("../config/db");

const runQuery = async (sql, params = []) => {
  const conn = await db.getDB();
  const [rows] = await conn.query(sql, params);
  return rows;
};

const getNpiDmrs = async (req, res) => {
  try {
    const dmrs = await runQuery(`
      SELECT 
        npi_dmr.*,
        s.site_name,
        s.site_code,
        cs.customer_number,
        cs.customer_name,
        CONCAT_WS(
          ' ', 
          u.first_name, 
          IF(u.middle_name IS NOT NULL AND u.middle_name != '', CONCAT(SUBSTRING(u.middle_name, 1, 1), '.'), ''), 
          u.last_name
        ) AS driver_name,
        t.truck_type,
        t.plate_number,
        GROUP_CONCAT(CONCAT_WS(' ', cu.first_name, IF(cu.middle_name IS NOT NULL AND cu.middle_name != '', CONCAT(SUBSTRING(cu.middle_name,1,1), '.'), ''), cu.last_name) SEPARATOR ', ') AS crew_names,
        GROUP_CONCAT(c.crew_id SEPARATOR ',') AS crews
      FROM npi_dmr
      LEFT JOIN users u ON npi_dmr.driver_id = u.id
      LEFT JOIN sites s ON npi_dmr.site_id = s.id
      LEFT JOIN customers cs ON npi_dmr.customer_id = cs.id
      LEFT JOIN trucks t ON npi_dmr.truck_id = t.id
      LEFT JOIN npi_dmr_crews c ON npi_dmr.id = c.dmr_id
      LEFT JOIN users cu ON c.crew_id = cu.id
      GROUP BY npi_dmr.id
      ORDER BY npi_dmr.created_at ASC
    `);

    res.json({ success: true, data: dmrs });
  } catch (error) {
    console.error("Error fetching DMRs:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const insertNpiDmr = async (req, res) => {
  try {
    const data = req.body;

    if (!Array.isArray(data.rows) || data.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one DMR row is required.",
      });
    }

    const getISOWeekNumber = (dateInput) => {
      const date = new Date(dateInput);
      const tempDate = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
      );
      const dayNum = tempDate.getUTCDay() || 7;
      tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil(((tempDate - yearStart) / 86400000 + 1) / 7);
      return weekNo;
    };

    const insertedDmrs = [];
    const waybillMap = {};
    const insertedAllowances = new Set();

    for (const row of data.rows) {
      if (!row.customer_id) {
        return res.status(400).json({
          success: false,
          message: "Each DMR must have a customer_id.",
        });
      }

      if (row.category === "Transshipment" && !row.fo_number?.trim()) {
        return res.status(400).json({
          success: false,
          message: "FO Number is required for Transshipment.",
        });
      }

      if (String(row.customer_id) !== "152") {
        if (row.category === "Transshipment" && !row.second_leg_fo?.trim()) {
          return res.status(400).json({
            success: false,
            message:
              "Second Leg FO Number is required for Transshipment rows (except TRANSSHIPMENT).",
          });
        }

        if (!row.invoice || String(row.invoice).trim() === "") {
          return res.status(400).json({
            success: false,
            message:
              "Invoice number is required for all customers except TRANSSHIPMENT.",
          });
        }
      }

      const currentWeek =
        row.week || getISOWeekNumber(row.transaction_date || new Date());

      let siteCode = "";
      if (row.site_id) {
        const [site] = await runQuery(
          "SELECT site_code FROM sites WHERE id = ? LIMIT 1",
          [row.site_id]
        );
        siteCode = site?.site_code ? site.site_code.toUpperCase() : "ILO";
      } else {
        siteCode = "ILO";
      }

      let key;
      if (row.category === "Transshipment") {
        key = `${row.fo_number}_${row.second_leg_fo || ""}`;
      } else {
        key = `${row.fo_number}`;
      }

      let waybill = row.waybill || waybillMap[key] || null;

      if (!waybill) {
        let unique = false;
        while (!unique) {
          const randomNum = Math.floor(10000 + Math.random() * 90000);
          const wb = `NPI${siteCode}${randomNum}`;
          const [existing] = await runQuery(
            "SELECT COUNT(*) AS count FROM npi_dmr WHERE waybill = ?",
            [wb]
          );
          if (existing.count === 0) {
            waybill = wb;
            unique = true;
          }
        }
        waybillMap[key] = waybill;
      }

      const formattedData = {
        week: currentWeek,
        waybill,
        category: row.category ?? null,
        site_id: row.site_id ?? null,
        customer_id: row.customer_id ?? null,
        invoice: row.invoice ?? null,
        cdn: row.cdn ?? null,
        quantity: row.quantity ?? null,
        amount: row.amount ?? null,
        po_number: row.po_number ?? null,
        fo_number: row.fo_number ?? null,
        seal_number: row.seal_number ?? null,
        transaction_date: row.transaction_date ?? null,
        truck_gate_in: row.truck_gate_in ?? null,
        dispatch_date_and_time: row.dispatch_date_and_time ?? null,
        rdd: row.rdd ?? null,
        driver_id: row.driver_id ?? null,
        truck_id: row.truck_id ?? null,
        destination: row.destination ?? null,
        second_leg_fo: row.second_leg_fo ?? null,
      };

      const columns = Object.keys(formattedData);
      const placeholders = columns.map(() => "?").join(", ");
      const values = Object.values(formattedData);

      const result = await runQuery(
        `INSERT INTO npi_dmr (${columns.join(", ")}) VALUES (${placeholders})`,
        values
      );

      if (Array.isArray(row.crews) && row.crews.length > 0) {
        for (const crewId of row.crews) {
          await runQuery(
            "INSERT INTO npi_dmr_crews (dmr_id, crew_id) VALUES (?, ?)",
            [result.insertId, parseInt(crewId)]
          );
        }
      }

      if (!insertedAllowances.has(waybill)) {
        const trip_type =
          row.second_leg_fo && row.second_leg_fo.trim() !== "" ? "LMR" : "DMR";

        const allowanceData = {
          waybill,
          trip_type,
          allowance_matrix_id: row.allowance_matrix_id ?? null,
          stripper_loading: row.stripper_loading ?? 0,
          stripper_unloading: row.stripper_unloading ?? 0,
          crew_allowance: row.crew_allowance ?? 0,
          toll_fee: row.toll_fee ?? 0,
          transfer_fee: row.transfer_fee ?? 0,
          pullout_incentive: row.pullout_incentive ?? 0,
          transfer_incentive: row.transfer_incentive ?? 0,
          miscellaneous: row.miscellaneous ?? 0,
          status: "Pending",
        };

        const allowanceColumns = Object.keys(allowanceData);
        const allowancePlaceholders = allowanceColumns
          .map(() => "?")
          .join(", ");
        const allowanceValues = Object.values(allowanceData);

        await runQuery(
          `INSERT INTO allowances (${allowanceColumns.join(
            ", "
          )}) VALUES (${allowancePlaceholders})`,
          allowanceValues
        );

        insertedAllowances.add(waybill);
      }

      insertedDmrs.push({
        id: result.insertId,
        waybill,
        week: currentWeek,
      });
    }

    res.json({
      success: true,
      message: "DMRs and allowances inserted successfully.",
      data: insertedDmrs,
    });
  } catch (error) {
    console.error("BACKEND: Error inserting DMRs:", error);
    res.status(500).json({
      success: false,
      message: "Database error while inserting DMRs.",
      error: error.message,
    });
  }
};

const updateNpiDmr = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const columns = Object.keys(updateData)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(updateData);

    const result = await runQuery(
      `UPDATE npi_dmr SET ${columns} WHERE id = ?`,
      [...values, id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "DMR not found." });
    }

    res.json({ success: true, message: "DMR updated successfully." });
  } catch (error) {
    console.error("Error updating DMR:", error);
    res
      .status(500)
      .json({ success: false, message: "Database error while updating DMR." });
  }
};

const deleteNpiDmr = async (req, res) => {
  try {
    const { id } = req.params;

    await runQuery("DELETE FROM npi_dmr_crews WHERE dmr_id = ?", [id]);

    const result = await runQuery("DELETE FROM npi_dmr WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "DMR not found." });
    }

    res.json({ success: true, message: "DMR deleted successfully." });
  } catch (error) {
    console.error("Error deleting DMR:", error);
    res
      .status(500)
      .json({ success: false, message: "Database error while deleting DMR." });
  }
};

module.exports = {
  getNpiDmrs,
  insertNpiDmr,
  updateNpiDmr,
  deleteNpiDmr,
};
