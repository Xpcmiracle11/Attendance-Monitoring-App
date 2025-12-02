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

        -- Driver Name
        CONCAT_WS(
          ' ', 
          u.first_name, 
          IF(u.middle_name IS NOT NULL AND u.middle_name != '', CONCAT(SUBSTRING(u.middle_name, 1, 1), '.'), ''), 
          u.last_name
        ) AS driver_name,

        -- Truck Info
        t.truck_type,
        t.plate_number,

        -- Crew Names
        GROUP_CONCAT(
          CONCAT_WS(
            ' ', 
            cu.first_name, 
            IF(cu.middle_name IS NOT NULL AND cu.middle_name != '', CONCAT(SUBSTRING(cu.middle_name,1,1), '.'), ''), 
            cu.last_name
          ) SEPARATOR ', '
        ) AS crew_names,

        GROUP_CONCAT(c.crew_id SEPARATOR ',') AS crews,

        -- Allowance Matrix Route (source + destination)
        CONCAT(am.source, ' - ', am.destination) AS route_name

      FROM npi_dmr
      LEFT JOIN users u ON npi_dmr.driver_id = u.id
      LEFT JOIN sites s ON npi_dmr.site_id = s.id
      LEFT JOIN customers cs ON npi_dmr.customer_id = cs.id
      LEFT JOIN trucks t ON npi_dmr.truck_id = t.id
      LEFT JOIN npi_dmr_crews c ON npi_dmr.id = c.dmr_id
      LEFT JOIN users cu ON c.crew_id = cu.id

      -- NEW JOIN HERE
      LEFT JOIN allowance_matrix am 
        ON npi_dmr.allowance_matrix_id = am.id

      GROUP BY npi_dmr.id
      ORDER BY 
        FIELD(npi_dmr.status, 'Pending', 'Approved', 'Declined'),
        npi_dmr.created_at ASC
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

    for (const row of data.rows) {
      if (!row.customer_id) {
        return res.status(400).json({
          success: false,
          message: "Customer is required.",
        });
      }
    }

    const getISOWeekNumber = (dateInput) => {
      const date = new Date(dateInput);
      const tempDate = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
      );
      const dayNum = tempDate.getUTCDay() || 7;
      tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
      return Math.ceil(((tempDate - yearStart) / 86400000 + 1) / 7);
    };

    const insertedDmrs = [];
    const waybillMap = {};
    const allowanceInserted = new Set();

    for (const row of data.rows) {
      const currentWeek =
        row.week || getISOWeekNumber(row.transaction_date || new Date());

      let siteCode = "ILO";
      if (row.site_id) {
        const [site] = await runQuery(
          "SELECT site_code FROM sites WHERE id = ? LIMIT 1",
          [row.site_id]
        );
        if (site?.site_code) {
          siteCode = site.site_code.toUpperCase();
        }
      }

      const key =
        row.category === "Transshipment"
          ? `${row.fo_number}_${row.second_leg_fo || ""}`
          : `${row.fo_number}`;

      let waybill = row.waybill || waybillMap[key] || null;

      if (!waybill) {
        let unique = false;
        while (!unique) {
          const randomNum = Math.floor(10000 + Math.random() * 90000);
          const wb = `WBNPI${siteCode}${randomNum}`;
          const [exists] = await runQuery(
            "SELECT COUNT(*) AS count FROM npi_dmr WHERE waybill = ?",
            [wb]
          );
          if (exists.count === 0) {
            waybill = wb;
            unique = true;
          }
        }
        waybillMap[key] = waybill;
      }

      const dmrPayload = {
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
        tsm_trucktype: row.tsm_trucktype ?? null,
        allowance_matrix_id: row.allowance_matrix_id ?? null,
        second_leg_fo: row.second_leg_fo ?? null,
        status: "Pending",
      };

      const columns = Object.keys(dmrPayload);
      const placeholders = columns.map(() => "?").join(", ");
      const values = Object.values(dmrPayload);

      const result = await runQuery(
        `INSERT INTO npi_dmr (${columns.join(", ")}) VALUES (${placeholders})`,
        values
      );

      const dmrId = result.insertId;

      if (Array.isArray(row.crews) && row.crews.length > 0) {
        for (const crewId of row.crews) {
          await runQuery(
            "INSERT INTO npi_dmr_crews (dmr_id, crew_id) VALUES (?, ?)",
            [dmrId, parseInt(crewId)]
          );
        }
      }

      const isLMR =
        row.second_leg_fo && String(row.second_leg_fo).trim() !== "";

      if (!allowanceInserted.has(waybill)) {
        if (isLMR) {
          await runQuery(
            `INSERT INTO npi_lmr (dmr_id, driver_id, truck_id) VALUES (?, NULL, NULL)`,
            [dmrId]
          );
        } else {
          const allowancePayload = {
            waybill,
            trip_type: "DMR",
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

          const ac = Object.keys(allowancePayload);
          const ap = ac.map(() => "?").join(", ");
          const av = Object.values(allowancePayload);

          await runQuery(
            `INSERT INTO allowances (${ac.join(", ")}) VALUES (${ap})`,
            av
          );
        }

        allowanceInserted.add(waybill);
      }

      insertedDmrs.push({
        id: dmrId,
        waybill,
        week: currentWeek,
      });
    }

    res.json({
      success: true,
      message: "DMRs inserted successfully.",
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
  const foNumber = req.params.id;
  const { rows } = req.body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({
      success: false,
      message: "At least one DMR row is required.",
    });
  }

  const pool = await db.getDB();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Fetch existing DMRs
    const [existingDmrs] = await conn.execute(
      "SELECT id, waybill FROM npi_dmr WHERE fo_number = ?",
      [foNumber]
    );

    if (existingDmrs.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({
        success: false,
        message: "No DMRs found with the given FO Number.",
      });
    }

    const existingIds = existingDmrs.map((d) => d.id);
    const existingWaybills = existingDmrs.map((d) => d.waybill);

    // Delete related crews
    if (existingIds.length > 0) {
      await conn.execute(
        `DELETE FROM npi_dmr_crews WHERE dmr_id IN (${existingIds
          .map(() => "?")
          .join(",")})`,
        existingIds
      );

      // Delete related LMRs
      await conn.execute(
        `DELETE FROM npi_lmr WHERE dmr_id IN (${existingIds
          .map(() => "?")
          .join(",")})`,
        existingIds
      );
    }

    // Delete related allowances by waybill
    if (existingWaybills.length > 0) {
      await conn.execute(
        `DELETE FROM allowances WHERE waybill IN (${existingWaybills
          .map(() => "?")
          .join(",")})`,
        existingWaybills
      );
    }

    // Delete parent DMRs
    await conn.execute("DELETE FROM npi_dmr WHERE fo_number = ?", [foNumber]);

    // Helper to get ISO week
    const getISOWeekNumber = (dateInput) => {
      const date = new Date(dateInput);
      const tempDate = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
      );
      const dayNum = tempDate.getUTCDay() || 7;
      tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
      return Math.ceil(((tempDate - yearStart) / 86400000 + 1) / 7);
    };

    // Re-insert updated rows
    const insertedDmrs = [];
    const waybillMap = new Map();
    const allowanceInserted = new Set();

    for (const row of rows) {
      const currentWeek =
        row.week || getISOWeekNumber(row.transaction_date || new Date());

      // Fetch site code
      let siteCode = "ILO";
      if (row.site_id) {
        const [siteRows] = await conn.execute(
          "SELECT site_code FROM sites WHERE id = ? LIMIT 1",
          [row.site_id]
        );
        const site = siteRows[0];
        if (site?.site_code) siteCode = site.site_code.toUpperCase();
      }

      // Determine key for waybill
      const key =
        row.category === "Transshipment"
          ? `${row.fo_number}_${row.second_leg_fo || ""}`
          : `${row.fo_number}`;

      let waybill = row.waybill || waybillMap.get(key) || null;

      if (!waybill) {
        let unique = false;
        while (!unique) {
          const randomNum = Math.floor(10000 + Math.random() * 90000);
          const wb = `WBNPI${siteCode}${randomNum}`;
          const [existsRows] = await conn.execute(
            "SELECT COUNT(*) AS count FROM npi_dmr WHERE waybill = ?",
            [wb]
          );
          if (existsRows[0].count === 0) {
            waybill = wb;
            unique = true;
          }
        }
        waybillMap.set(key, waybill);
      }

      // Insert new DMR
      const dmrPayload = {
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
        tsm_trucktype: row.tsm_trucktype ?? null,
        allowance_matrix_id: row.allowance_matrix_id ?? null,
        second_leg_fo: row.second_leg_fo ?? null,
        status: "Pending",
      };

      const columns = Object.keys(dmrPayload);
      const placeholders = columns.map(() => "?").join(", ");
      const values = Object.values(dmrPayload);

      const [result] = await conn.execute(
        `INSERT INTO npi_dmr (${columns.join(", ")}) VALUES (${placeholders})`,
        values
      );

      const dmrId = result.insertId;

      // Insert crews
      if (Array.isArray(row.crews) && row.crews.length > 0) {
        for (const crewId of row.crews) {
          await conn.execute(
            "INSERT INTO npi_dmr_crews (dmr_id, crew_id) VALUES (?, ?)",
            [dmrId, parseInt(crewId)]
          );
        }
      }

      // Insert allowance / LMR
      const isLMR =
        row.second_leg_fo && String(row.second_leg_fo).trim() !== "";
      if (!allowanceInserted.has(waybill)) {
        if (isLMR) {
          await conn.execute(
            `INSERT INTO npi_lmr (dmr_id, driver_id, truck_id) VALUES (?, NULL, NULL)`,
            [dmrId]
          );
        } else {
          const allowancePayload = {
            waybill,
            trip_type: "DMR",
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
          const ac = Object.keys(allowancePayload);
          const ap = ac.map(() => "?").join(", ");
          const av = Object.values(allowancePayload);
          await conn.execute(
            `INSERT INTO allowances (${ac.join(",")}) VALUES (${ap})`,
            av
          );
        }
        allowanceInserted.add(waybill);
      }

      insertedDmrs.push({
        id: dmrId,
        waybill,
        week: currentWeek,
      });
    }

    await conn.commit();
    conn.release();

    res.json({
      success: true,
      message: "DMRs updated successfully.",
      data: insertedDmrs,
    });
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error("BACKEND: Error updating DMRs:", error);
    res.status(500).json({
      success: false,
      message: "Database error while updating DMRs.",
      error: error.message,
    });
  }
};

const deleteNpiDmr = async (req, res) => {
  const id = req.params.id;

  const conn = await db.getDB();
  await conn.beginTransaction();

  try {
    const existingDmrs = await runQuery(
      "SELECT id FROM npi_dmr WHERE fo_number = ?",
      [id]
    );

    if (existingDmrs.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No DMRs found with the given FO Number.",
      });
    }

    const existingIds = existingDmrs.map((d) => d.id);

    await runQuery(
      `DELETE FROM npi_dmr_crews WHERE dmr_id IN (${existingIds
        .map(() => "?")
        .join(",")})`,
      existingIds
    );

    await runQuery("DELETE FROM npi_dmr WHERE fo_number = ?", [id]);

    await conn.commit();

    res.json({ success: true, message: "DMRs deleted successfully." });
  } catch (error) {
    await conn.rollback();
    console.error("Error deleting DMRs by FO:", error);
    res.status(500).json({
      success: false,
      message: "Database error while deleting DMRs.",
    });
  }
};
module.exports = {
  getNpiDmrs,
  insertNpiDmr,
  updateNpiDmr,
  deleteNpiDmr,
};
