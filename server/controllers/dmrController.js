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

        CONCAT(
        am.source, ' - ', am.first_destination,
        IF(am.second_destination IS NULL OR am.second_destination = '', 
          '', 
          CONCAT(' - ', am.second_destination)
            )
        ) AS route_name

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
        FIELD(npi_dmr.status, 'Pending', 'Approved', 'Declined', 'Completed'),
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
  const originalWaybill = req.params.id;
  const { rows } = req.body;

  if (!originalWaybill) {
    return res
      .status(400)
      .json({ success: false, message: "Waybill is required." });
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Rows payload is required." });
  }

  const pool = await db.getDB();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [existingDmrs] = await conn.execute(
      "SELECT id, second_leg_fo, category FROM npi_dmr WHERE waybill = ?",
      [originalWaybill]
    );

    const existingIds = existingDmrs.map((d) => d.id);

    if (existingIds.length > 0) {
      await conn.execute(
        `DELETE FROM npi_dmr_crews WHERE dmr_id IN (${existingIds
          .map(() => "?")
          .join(",")})`,
        existingIds
      );
      await conn.execute(
        `DELETE FROM npi_lmr WHERE dmr_id IN (${existingIds
          .map(() => "?")
          .join(",")})`,
        existingIds
      );
    }
    await conn.execute("DELETE FROM allowances WHERE waybill = ?", [
      originalWaybill,
    ]);
    await conn.execute("DELETE FROM npi_dmr WHERE waybill = ?", [
      originalWaybill,
    ]);

    const insertedDmrs = [];
    const secondLegMap = new Map();
    const allowanceInserted = new Set();

    const generateWaybill = async (siteCode) => {
      let unique = false;
      let wb;
      while (!unique) {
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        wb = `WBNPI${siteCode}${randomNum}`;
        const [existsRows] = await conn.execute(
          "SELECT COUNT(*) AS count FROM npi_dmr WHERE waybill = ?",
          [wb]
        );
        if (existsRows[0].count === 0) unique = true;
      }
      return wb;
    };

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

    for (const row of rows) {
      const currentWeek =
        row.week || getISOWeekNumber(row.transaction_date || new Date());

      let siteCode = "ILO";
      if (row.site_id) {
        const [siteRows] = await conn.execute(
          "SELECT site_code FROM sites WHERE id = ? LIMIT 1",
          [row.site_id]
        );
        if (siteRows[0]?.site_code)
          siteCode = siteRows[0].site_code.toUpperCase();
      }

      let waybill;

      if (row.category === "Transshipment" && row.second_leg_fo) {
        const [existingRows] = await conn.execute(
          "SELECT waybill FROM npi_dmr WHERE second_leg_fo = ? LIMIT 1",
          [row.second_leg_fo]
        );
        if (existingRows.length > 0) {
          waybill = existingRows[0].waybill;
        } else if (secondLegMap.has(row.second_leg_fo)) {
          waybill = secondLegMap.get(row.second_leg_fo);
        } else {
          waybill = await generateWaybill(siteCode);
        }
        secondLegMap.set(row.second_leg_fo, waybill);
      } else {
        waybill = await generateWaybill(siteCode);
      }

      row.waybill = waybill;

      const crews = Array.isArray(row.crews) ? row.crews : [];
      delete row.crews;

      const columns = Object.keys(row);
      const placeholders = columns.map(() => "?").join(",");
      const values = Object.values(row);

      const [result] = await conn.execute(
        `INSERT INTO npi_dmr (${columns.join(",")}) VALUES (${placeholders})`,
        values
      );
      const dmrId = result.insertId;

      for (const crewId of crews) {
        await conn.execute(
          "INSERT INTO npi_dmr_crews (dmr_id, crew_id) VALUES (?, ?)",
          [dmrId, crewId]
        );
      }

      const isLMR =
        row.second_leg_fo && String(row.second_leg_fo).trim() !== "";
      if (!allowanceInserted.has(waybill)) {
        if (isLMR) {
          await conn.execute(
            "INSERT INTO npi_lmr (dmr_id, driver_id, truck_id) VALUES (?, NULL, NULL)",
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
          const ap = ac.map(() => "?").join(",");
          const av = Object.values(allowancePayload);

          await conn.execute(
            `INSERT INTO allowances (${ac.join(",")}) VALUES (${ap})`,
            av
          );
        }
        allowanceInserted.add(waybill);
      }

      insertedDmrs.push({ id: dmrId, waybill, week: currentWeek });
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
    console.error("UPDATE DMR ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating DMR.",
      error: error.message,
    });
  }
};

const deleteNpiDmr = async (req, res) => {
  const waybill = req.params.id;

  if (!waybill) {
    return res
      .status(400)
      .json({ success: false, message: "Waybill is required." });
  }

  const pool = await db.getDB();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [existingDmrs] = await conn.execute(
      "SELECT id FROM npi_dmr WHERE waybill = ?",
      [waybill]
    );

    if (existingDmrs.length === 0) {
      conn.release();
      return res.status(404).json({
        success: false,
        message: "No DMRs found with the given waybill.",
      });
    }

    const existingIds = existingDmrs.map((d) => d.id);

    if (existingIds.length > 0) {
      await conn.execute(
        `DELETE FROM npi_dmr_crews WHERE dmr_id IN (${existingIds
          .map(() => "?")
          .join(",")})`,
        existingIds
      );

      await conn.execute(
        `DELETE FROM npi_lmr WHERE dmr_id IN (${existingIds
          .map(() => "?")
          .join(",")})`,
        existingIds
      );
    }

    await conn.execute("DELETE FROM allowances WHERE waybill = ?", [waybill]);

    await conn.execute("DELETE FROM npi_dmr WHERE waybill = ?", [waybill]);

    await conn.commit();
    conn.release();

    res.json({ success: true, message: "DMRs deleted successfully." });
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error("DELETE DMR ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Database error while deleting DMRs.",
      error: error.message,
    });
  }
};

const getUlDmrs = async (req, res) => {
  try {
    const dmrs = await runQuery(`
      SELECT 
        ul_dmr.*,
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

        CONCAT(
          am.source, ' - ', am.first_destination,
          IF(am.second_destination IS NULL OR am.second_destination = '', 
            '', 
            CONCAT(' - ', am.second_destination)
          )
      ) AS route_name

      FROM ul_dmr
      LEFT JOIN users u ON ul_dmr.driver_id = u.id
      LEFT JOIN sites s ON ul_dmr.site_id = s.id
      LEFT JOIN customers cs ON ul_dmr.customer_id = cs.id
      LEFT JOIN trucks t ON ul_dmr.truck_id = t.id
      LEFT JOIN ul_dmr_crews c ON ul_dmr.id = c.dmr_id
      LEFT JOIN users cu ON c.crew_id = cu.id

      -- NEW JOIN HERE
      LEFT JOIN allowance_matrix am 
        ON ul_dmr.allowance_matrix_id = am.id

      GROUP BY ul_dmr.id
      ORDER BY 
        FIELD(ul_dmr.status, 'Pending', 'Approved', 'Declined', 'Completed'),
        ul_dmr.created_at ASC
    `);

    res.json({ success: true, data: dmrs });
  } catch (error) {
    console.error("Error fetching DMRs:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const insertUlDmr = async (req, res) => {
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
    const waybillCache = {};
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

      const truckId = row.truck_id;
      if (!truckId) {
        return res
          .status(400)
          .json({ success: false, message: "Truck ID is required." });
      }

      let waybill;

      if (waybillCache[truckId]) {
        waybill = waybillCache[truckId];
      } else {
        const [existingWB] = await runQuery(
          `SELECT waybill, status 
           FROM ul_dmr 
           WHERE truck_id = ? 
           ORDER BY id DESC 
           LIMIT 1`,
          [truckId]
        );

        if (existingWB && existingWB.status !== "Completed") {
          waybill = existingWB.waybill;
        } else {
          let unique = false;
          while (!unique) {
            const randomNum = Math.floor(10000 + Math.random() * 90000);
            const wb = `WBUL${siteCode}${randomNum}`;

            const [exists] = await runQuery(
              "SELECT COUNT(*) AS count FROM ul_dmr WHERE waybill = ?",
              [wb]
            );

            if (exists.count === 0) {
              waybill = wb;
              unique = true;
            }
          }
        }

        waybillCache[truckId] = waybill;
      }

      const dmrPayload = {
        week: currentWeek,
        waybill,
        category: row.category ?? null,
        site_id: row.site_id ?? null,
        customer_id: row.customer_id ?? null,
        do_number: row.do_number ?? null,
        invoice: row.invoice ?? null,
        quantity: row.quantity ?? null,
        amount: row.amount ?? null,
        cbm: row.cbm ?? null,
        billing_cbm: row.billing_cbm ?? null,
        transaction_date: row.transaction_date ?? null,
        truck_gate_in: row.truck_gate_in ?? null,
        dispatch_date_and_time: row.dispatch_date_and_time ?? null,
        rdd: row.rdd ?? null,
        driver_id: row.driver_id ?? null,
        truck_id: row.truck_id ?? null,
        tsm_trucktype: row.tsm_trucktype ?? null,
        allowance_matrix_id: row.allowance_matrix_id ?? null,
        status: "Pending",
      };

      const columns = Object.keys(dmrPayload);
      const placeholders = columns.map(() => "?").join(", ");
      const values = Object.values(dmrPayload);

      const result = await runQuery(
        `INSERT INTO ul_dmr (${columns.join(", ")}) VALUES (${placeholders})`,
        values
      );

      const dmrId = result.insertId;

      if (Array.isArray(row.crews) && row.crews.length > 0) {
        for (const crewId of row.crews) {
          await runQuery(
            "INSERT INTO ul_dmr_crews (dmr_id, crew_id) VALUES (?, ?)",
            [dmrId, parseInt(crewId)]
          );
        }
      }

      if (!allowanceInserted.has(waybill)) {
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

const updateUlDmr = async (req, res) => {
  const waybillParam = req.params.id;
  const { rows } = req.body;

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Rows payload is required." });
  }

  const pool = await db.getDB();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const first = rows[0];

    const [active] = await conn.execute(
      `SELECT waybill 
       FROM ul_dmr 
       WHERE truck_id = ? AND status != 'Completed' AND waybill IS NOT NULL
       LIMIT 1`,
      [first.truck_id]
    );

    let useWaybill;

    if (active.length > 0) {
      useWaybill = active[0].waybill;
    } else {
      const [wb] = await conn.execute("SELECT generate_ul_waybill() AS wb");
      useWaybill = wb[0].wb;
    }

    const [oldRows] = await conn.execute(
      "SELECT id FROM ul_dmr WHERE waybill = ?",
      [waybillParam]
    );

    const oldIds = oldRows.map((r) => r.id);

    if (oldIds.length > 0) {
      await conn.execute(
        `DELETE FROM ul_dmr_crews WHERE dmr_id IN (${oldIds
          .map(() => "?")
          .join(",")})`,
        oldIds
      );

      await conn.execute(
        `DELETE FROM ul_lmr WHERE dmr_id IN (${oldIds
          .map(() => "?")
          .join(",")})`,
        oldIds
      );

      await conn.execute("DELETE FROM ul_dmr WHERE waybill = ?", [
        waybillParam,
      ]);
    }

    for (const r of rows) {
      const [insert] = await conn.execute(
        `INSERT INTO ul_dmr (
          week, waybill, category, site_id, customer_id, do_number,
          invoice, quantity, amount, cbm, billing_cbm, transaction_date,
          truck_gate_in, dispatch_date_and_time, rdd, driver_id,
          truck_id, tsm_trucktype, allowance_matrix_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          r.week,
          useWaybill,
          r.category,
          r.site_id,
          r.customer_id,
          r.do_number,
          r.invoice,
          r.quantity,
          r.amount,
          r.cbm,
          r.billing_cbm,
          r.transaction_date,
          r.truck_gate_in,
          r.dispatch_date_and_time,
          r.rdd,
          r.driver_id,
          r.truck_id,
          r.tsm_trucktype,
          r.allowance_matrix_id,
        ]
      );

      const newId = insert.insertId;

      if (Array.isArray(r.crews)) {
        for (const crewId of r.crews) {
          await conn.execute(
            "INSERT INTO ul_dmr_crews (dmr_id, crew_id) VALUES (?, ?)",
            [newId, crewId]
          );
        }
      }
    }

    await conn.commit();
    conn.release();

    res.json({
      success: true,
      message: "UL DMR updated successfully.",
      waybill: useWaybill,
    });
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error("UPDATE UL DMR ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Database error while updating UL DMR.",
    });
  }
};

const deleteUlDmr = async (req, res) => {
  const waybill = req.params.id;

  if (!waybill) {
    return res
      .status(400)
      .json({ success: false, message: "Waybill is required." });
  }

  const pool = await db.getDB();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [existing] = await conn.execute(
      "SELECT id FROM ul_dmr WHERE waybill = ?",
      [waybill]
    );

    if (existing.length === 0) {
      conn.release();
      return res.status(404).json({
        success: false,
        message: "No UL DMRs found for this waybill.",
      });
    }

    const ids = existing.map((d) => d.id);

    await conn.execute(
      `DELETE FROM ul_dmr_crews WHERE dmr_id IN (${ids
        .map(() => "?")
        .join(",")})`,
      ids
    );

    await conn.execute(
      `DELETE FROM ul_lmr WHERE dmr_id IN (${ids.map(() => "?").join(",")})`,
      ids
    );

    await conn.execute("DELETE FROM ul_dmr WHERE waybill = ?", [waybill]);

    await conn.commit();
    conn.release();

    res.json({ success: true, message: "UL DMR group deleted successfully." });
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error("DELETE UL DMR ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Database error while deleting UL DMR records.",
    });
  }
};

const getPanaDmrs = async (req, res) => {
  try {
    const dmrs = await runQuery(`
      SELECT 
        pana_dmr.*,
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

       CONCAT(
          am.source, ' - ', am.first_destination,
          IF(am.second_destination IS NULL OR am.second_destination = '', 
            '', 
            CONCAT(' - ', am.second_destination)
          )
      ) AS route_name

      FROM pana_dmr
      LEFT JOIN users u ON pana_dmr.driver_id = u.id
      LEFT JOIN sites s ON pana_dmr.site_id = s.id
      LEFT JOIN customers cs ON pana_dmr.customer_id = cs.id
      LEFT JOIN trucks t ON pana_dmr.truck_id = t.id
      LEFT JOIN pana_dmr_crews c ON pana_dmr.id = c.dmr_id
      LEFT JOIN users cu ON c.crew_id = cu.id

      -- NEW JOIN HERE
      LEFT JOIN allowance_matrix am 
        ON pana_dmr.allowance_matrix_id = am.id

      GROUP BY pana_dmr.id
      ORDER BY 
        FIELD(pana_dmr.status, 'Pending', 'Approved', 'Declined', 'Completed'),
        pana_dmr.created_at ASC
    `);

    res.json({ success: true, data: dmrs });
  } catch (error) {
    console.error("Error fetching DMRs:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const insertPanaDmr = async (req, res) => {
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
    const waybillCache = {};
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

      const truckId = row.truck_id;
      if (!truckId) {
        return res
          .status(400)
          .json({ success: false, message: "Truck ID is required." });
      }

      let waybill;

      if (waybillCache[truckId]) {
        waybill = waybillCache[truckId];
      } else {
        const [existingWB] = await runQuery(
          `SELECT waybill, status 
           FROM pana_dmr 
           WHERE truck_id = ? 
           ORDER BY id DESC 
           LIMIT 1`,
          [truckId]
        );

        if (existingWB && existingWB.status !== "Completed") {
          waybill = existingWB.waybill;
        } else {
          let unique = false;
          while (!unique) {
            const randomNum = Math.floor(10000 + Math.random() * 90000);
            const wb = `WBPANA${siteCode}${randomNum}`;

            const [exists] = await runQuery(
              "SELECT COUNT(*) AS count FROM pana_dmr WHERE waybill = ?",
              [wb]
            );

            if (exists.count === 0) {
              waybill = wb;
              unique = true;
            }
          }
        }

        waybillCache[truckId] = waybill;
      }

      const dmrPayload = {
        week: currentWeek,
        waybill,
        category: row.category ?? null,
        site_id: row.site_id ?? null,
        customer_id: row.customer_id ?? null,
        dr_number: row.dr_number ?? null,
        po_number: row.po_number ?? null,
        model: row.model ?? null,
        quantity: row.quantity ?? null,
        amount: row.amount ?? null,
        cbm: row.cbm ?? null,
        transaction_date: row.transaction_date ?? null,
        truck_gate_in: row.truck_gate_in ?? null,
        dispatch_date_and_time: row.dispatch_date_and_time ?? null,
        driver_id: row.driver_id ?? null,
        truck_id: row.truck_id ?? null,
        tsm_trucktype: row.tsm_trucktype ?? null,
        allowance_matrix_id: row.allowance_matrix_id ?? null,
        status: "Pending",
      };

      const columns = Object.keys(dmrPayload);
      const placeholders = columns.map(() => "?").join(", ");
      const values = Object.values(dmrPayload);

      const result = await runQuery(
        `INSERT INTO pana_dmr (${columns.join(", ")}) VALUES (${placeholders})`,
        values
      );

      const dmrId = result.insertId;

      if (Array.isArray(row.crews) && row.crews.length > 0) {
        for (const crewId of row.crews) {
          await runQuery(
            "INSERT INTO pana_dmr_crews (dmr_id, crew_id) VALUES (?, ?)",
            [dmrId, parseInt(crewId)]
          );
        }
      }

      if (!allowanceInserted.has(waybill)) {
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

const updatePanaDmr = async (req, res) => {
  const oldWaybill = req.params.id;
  const { rows } = req.body;

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid request: rows are required.",
    });
  }

  const pool = await db.getDB();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [existing] = await conn.query(
      "SELECT id FROM pana_dmr WHERE waybill = ?",
      [oldWaybill]
    );

    if (existing.length > 0) {
      const dmrIds = existing.map((x) => x.id);
      await conn.query(
        `DELETE FROM pana_dmr_crews WHERE dmr_id IN (${dmrIds
          .map(() => "?")
          .join(",")})`,
        dmrIds
      );
    }

    await conn.query("DELETE FROM pana_dmr WHERE waybill = ?", [oldWaybill]);

    for (const row of rows) {
      const {
        week,
        waybill,
        category,
        site_id,
        customer_id,
        dr_number,
        po_number,
        model,
        quantity,
        amount,
        cbm,
        transaction_date,
        truck_gate_in,
        dispatch_date_and_time,
        driver_id,
        truck_id,
        tsm_trucktype,
        allowance_matrix_id,
        crews,
      } = row;

      const [result] = await conn.query(
        `INSERT INTO pana_dmr 
        (
          week, waybill, category, site_id, customer_id,
          dr_number, po_number, model, quantity, amount, cbm,
          transaction_date, truck_gate_in, dispatch_date_and_time,
          driver_id, truck_id, tsm_trucktype, allowance_matrix_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          week,
          waybill,
          category,
          site_id,
          customer_id,
          dr_number,
          po_number,
          model,
          quantity,
          amount,
          cbm,
          transaction_date,
          truck_gate_in,
          dispatch_date_and_time,
          driver_id,
          truck_id,
          tsm_trucktype,
          allowance_matrix_id,
        ]
      );

      const insertId = result.insertId;

      if (Array.isArray(crews) && crews.length > 0) {
        const crewValues = crews.map((cid) => [insertId, cid]);
        await conn.query(
          `INSERT INTO pana_dmr_crews (dmr_id, crew_id) VALUES ?`,
          [crewValues]
        );
      }
    }

    await conn.commit();
    conn.release();

    res.json({ success: true, message: "PANA DMR updated successfully." });
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error("Error updating PANA DMR:", error);

    res.status(500).json({
      success: false,
      message: "Database error while updating PANA DMR.",
    });
  }
};

const deletePanaDmr = async (req, res) => {
  const waybill = req.params.id;

  const pool = await db.getDB();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [existingDmrs] = await conn.query(
      "SELECT id FROM pana_dmr WHERE waybill = ?",
      [waybill]
    );

    if (existingDmrs.length === 0) {
      conn.release();
      return res.status(404).json({
        success: false,
        message: "No PANA DMRs found for this waybill.",
      });
    }

    const ids = existingDmrs.map((d) => d.id);

    await conn.query(
      `DELETE FROM pana_dmr_crews WHERE dmr_id IN (${ids
        .map(() => "?")
        .join(",")})`,
      ids
    );

    await conn.query("DELETE FROM pana_dmr WHERE waybill = ?", [waybill]);

    await conn.commit();
    conn.release();

    return res.json({
      success: true,
      message: "PANA DMR deleted successfully.",
    });
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error("Error deleting PANA DMR:", error);

    return res.status(500).json({
      success: false,
      message: "Database error while deleting PANA DMR.",
    });
  }
};

const getTdiDmrs = async (req, res) => {
  try {
    const dmrs = await runQuery(`
      SELECT 
        tdi_dmr.*,
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

        CONCAT(
          am.source, ' - ', am.first_destination,
          IF(am.second_destination IS NULL OR am.second_destination = '', 
            '', 
            CONCAT(' - ', am.second_destination)
          )
      ) AS route_name

      FROM tdi_dmr
      LEFT JOIN users u ON tdi_dmr.driver_id = u.id
      LEFT JOIN sites s ON tdi_dmr.site_id = s.id
      LEFT JOIN customers cs ON tdi_dmr.customer_id = cs.id
      LEFT JOIN trucks t ON tdi_dmr.truck_id = t.id
      LEFT JOIN tdi_dmr_crews c ON tdi_dmr.id = c.dmr_id
      LEFT JOIN users cu ON c.crew_id = cu.id

      -- NEW JOIN HERE
      LEFT JOIN allowance_matrix am 
        ON tdi_dmr.allowance_matrix_id = am.id

      GROUP BY tdi_dmr.id
      ORDER BY 
        FIELD(tdi_dmr.status, 'Pending', 'Approved', 'Declined', 'Completed'),
        tdi_dmr.created_at ASC
    `);

    res.json({ success: true, data: dmrs });
  } catch (error) {
    console.error("Error fetching DMRs:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const insertTdiDmr = async (req, res) => {
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
    const waybillCache = {};
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

      const truckId = row.truck_id;
      if (!truckId) {
        return res
          .status(400)
          .json({ success: false, message: "Truck ID is required." });
      }

      let waybill;

      if (waybillCache[truckId]) {
        waybill = waybillCache[truckId];
      } else {
        const [existingWB] = await runQuery(
          `SELECT waybill, status 
           FROM tdi_dmr 
           WHERE truck_id = ? 
           ORDER BY id DESC 
           LIMIT 1`,
          [truckId]
        );

        if (existingWB && existingWB.status !== "Completed") {
          waybill = existingWB.waybill;
        } else {
          let unique = false;
          while (!unique) {
            const randomNum = Math.floor(10000 + Math.random() * 90000);
            const wb = `WBTDI${siteCode}${randomNum}`;

            const [exists] = await runQuery(
              "SELECT COUNT(*) AS count FROM tdi_dmr WHERE waybill = ?",
              [wb]
            );

            if (exists.count === 0) {
              waybill = wb;
              unique = true;
            }
          }
        }

        waybillCache[truckId] = waybill;
      }

      const dmrPayload = {
        week: currentWeek,
        waybill,
        category: row.category ?? null,
        site_id: row.site_id ?? null,
        customer_id: row.customer_id ?? null,
        dr_number: row.dr_number ?? null,
        quantity: row.quantity ?? null,
        amount: row.amount ?? null,
        gp_number: row.gp_number ?? null,
        seal_number: row.seal_number ?? null,
        transaction_date: row.transaction_date ?? null,
        truck_gate_in: row.truck_gate_in ?? null,
        dispatch_date_and_time: row.dispatch_date_and_time ?? null,
        driver_id: row.driver_id ?? null,
        truck_id: row.truck_id ?? null,
        tsm_trucktype: row.tsm_trucktype ?? null,
        allowance_matrix_id: row.allowance_matrix_id ?? null,
        status: "Pending",
      };

      const columns = Object.keys(dmrPayload);
      const placeholders = columns.map(() => "?").join(", ");
      const values = Object.values(dmrPayload);

      const result = await runQuery(
        `INSERT INTO tdi_dmr (${columns.join(", ")}) VALUES (${placeholders})`,
        values
      );

      const dmrId = result.insertId;

      if (Array.isArray(row.crews) && row.crews.length > 0) {
        for (const crewId of row.crews) {
          await runQuery(
            "INSERT INTO tdi_dmr_crews (dmr_id, crew_id) VALUES (?, ?)",
            [dmrId, parseInt(crewId)]
          );
        }
      }

      if (!allowanceInserted.has(waybill)) {
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

module.exports = {
  getNpiDmrs,
  insertNpiDmr,
  updateNpiDmr,
  deleteNpiDmr,
  getUlDmrs,
  insertUlDmr,
  updateUlDmr,
  deleteUlDmr,
  getPanaDmrs,
  insertPanaDmr,
  updatePanaDmr,
  deletePanaDmr,
  getTdiDmrs,
  insertTdiDmr,
};
