const db = require("../config/db");

const runQuery = async (sql, params = []) => {
  const conn = await db.getDB();
  const [rows] = await conn.query(sql, params);
  return rows;
};

const getNpiLmrs = async (req, res) => {
  try {
    const lmrs = await runQuery(`
      SELECT
        npi_lmr.*,

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

        -- Crew Names and IDs (from subquery)
        crews.crew_names,
        crews.crew_ids,

        -- DMR Data
        dmr.week AS dmr_week,
        dmr.waybill AS dmr_waybill,
        dmr.category AS dmr_category,
        dmr.site_id AS dmr_site_id,
        s.site_name,
        s.site_code,
        dmr.customer_id AS dmr_customer_id,
        dmr.invoice AS dmr_invoice,
        cs.customer_number AS dmr_customer_number,
        cs.customer_name AS dmr_customer_name,
        dmr.cdn AS dmr_cdn,
        dmr.quantity AS dmr_quantity,
        dmr.amount AS dmr_amount,
        dmr.po_number AS dmr_po_number,
        dmr.fo_number AS dmr_fo_number,
        dmr.seal_number AS dmr_seal_number,
        dmr.transaction_date AS dmr_transaction_date,
        dmr.truck_gate_in AS dmr_truck_gate_in,
        dmr.dispatch_date_and_time AS dmr_dispatch_date_and_time,
        dmr.rdd AS dmr_rdd,
        dmr.tsm_trucktype AS dmr_tsm_trucktype,
        dmr.allowance_matrix_id AS dmr_allowance_matrix_id,
        dmr.second_leg_fo AS dmr_second_leg_fo,
        dmr.status AS dmr_status,
        dmr.created_at AS dmr_created_at,
        dmr.updated_at AS dmr_updated_at,
        npi_lmr.driver_id,
        npi_lmr.truck_id,
        npi_lmr.status,
        npi_lmr.created_at,

        -- ROUTES FROM LMR'S allowance_matrix_id
        am.source AS route_source,
        am.destination AS route_destination,
        CONCAT(am.source, ' - ', am.destination) AS route_name

      FROM npi_lmr
      LEFT JOIN npi_dmr dmr ON npi_lmr.dmr_id = dmr.id
      LEFT JOIN sites s ON dmr.site_id = s.id
      LEFT JOIN users u ON npi_lmr.driver_id = u.id
      LEFT JOIN trucks t ON npi_lmr.truck_id = t.id
      LEFT JOIN customers cs ON dmr.customer_id = cs.id
      
      LEFT JOIN (
        SELECT 
          c.lmr_id,
          GROUP_CONCAT(CONCAT_WS(
            ' ', 
            cu.first_name, 
            IF(cu.middle_name IS NOT NULL AND cu.middle_name != '', CONCAT(SUBSTRING(cu.middle_name,1,1), '.'), ''), 
            cu.last_name
          ) SEPARATOR ', ') AS crew_names,
          GROUP_CONCAT(c.crew_id SEPARATOR ',') AS crew_ids
        FROM npi_lmr_crews c
        LEFT JOIN users cu ON c.crew_id = cu.id
        GROUP BY c.lmr_id
      ) crews ON npi_lmr.id = crews.lmr_id

      -- NOW USING LMR’S allowance_matrix_id
      LEFT JOIN allowance_matrix am ON npi_lmr.allowance_matrix_id = am.id

      ORDER BY 
        FIELD(npi_lmr.status, 'Pending', 'Requested', 'Approved', 'Declined'),
        npi_lmr.created_at ASC
    `);

    res.json({ success: true, data: lmrs });
  } catch (error) {
    console.error("Error fetching LMRs:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

const approveNpiLmr = async (req, res) => {
  const { waybill } = req.params;

  if (!waybill) {
    return res
      .status(400)
      .json({ success: false, message: "Waybill is required." });
  }

  try {
    const checkSql = `
      SELECT id FROM npi_dmr WHERE waybill = ? LIMIT 1
    `;
    const dmrs = await runQuery(checkSql, [waybill]);

    if (!dmrs.length) {
      return res.json({
        success: false,
        message: "Waybill does not exist in DMR.",
      });
    }

    const dmrId = dmrs[0].id;

    const sqlInsert = `
      INSERT INTO allowances
      (waybill, trip_type, stripper_loading, stripper_unloading, crew_allowance,
       toll_fee, transfer_fee, pullout_incentive, transfer_incentive, miscellaneous, status)
      VALUES (?, 'LMR', 0, 0, 0, 0, 0, 0, 0, 0, 'Pending')
      ON DUPLICATE KEY UPDATE
        trip_type = 'LMR',
        stripper_loading = 0,
        stripper_unloading = 0,
        crew_allowance = 0,
        toll_fee = 0,
        transfer_fee = 0,
        pullout_incentive = 0,
        transfer_incentive = 0,
        miscellaneous = 0,
        status = 'Pending'
    `;

    await runQuery(sqlInsert, [waybill]);

    const updateLmrStatus = `
      UPDATE npi_lmr
      SET status = 'Requested'
      WHERE dmr_id = ?
    `;

    await runQuery(updateLmrStatus, [dmrId]);

    return res.json({
      success: true,
      message: "Allowance created and LMR updated to Requested.",
    });
  } catch (error) {
    console.error("Error approving LMR:", error);
    res.status(500).json({ success: false, message: "Database error." });
  }
};

const updateNpiLmr = async (req, res) => {
  try {
    const { waybill } = req.params;
    const { driver_id, truck_id, crew_id, allowance_matrix_id } = req.body;

    if (!waybill) {
      return res
        .status(400)
        .json({ success: false, message: "Waybill is required." });
    }

    const dmrs = await runQuery(`SELECT id FROM npi_dmr WHERE waybill = ?`, [
      waybill,
    ]);

    if (!dmrs.length) {
      return res
        .status(404)
        .json({ success: false, message: "Waybill not found." });
    }

    const dmrIds = dmrs.map((d) => d.id);

    await runQuery(
      `UPDATE npi_lmr
       SET driver_id = ?, 
           truck_id = ?,
           allowance_matrix_id = ?
       WHERE dmr_id IN (${dmrIds.join(",")})`,
      [driver_id, truck_id, allowance_matrix_id]
    );

    const lmrs = await runQuery(
      `SELECT id FROM npi_lmr WHERE dmr_id IN (${dmrIds.join(",")})`
    );
    const lmrIds = lmrs.map((lmr) => lmr.id);

    if (lmrIds.length > 0) {
      await runQuery(
        `DELETE FROM npi_lmr_crews WHERE lmr_id IN (${lmrIds.join(",")})`
      );

      if (Array.isArray(crew_id) && crew_id.length > 0) {
        const crewValues = [];
        lmrIds.forEach((lmrId) => {
          crew_id.forEach((cid) => {
            crewValues.push([lmrId, cid]);
          });
        });

        await runQuery(`INSERT INTO npi_lmr_crews (lmr_id, crew_id) VALUES ?`, [
          crewValues,
        ]);
      }
    }

    res.json({ success: true, message: "LMRs updated successfully." });
  } catch (error) {
    console.error("Error updating LMR:", error);
    res.status(500).json({ success: false, message: "Database error." });
  }
};

const deleteNpiLmr = async (req, res) => {
  const { waybill } = req.params;

  if (!waybill) {
    return res
      .status(400)
      .json({ success: false, message: "Waybill is required." });
  }

  try {
    const deleteCrewQuery = `
      DELETE c FROM npi_lmr_crews c
      JOIN npi_lmr l ON c.lmr_id = l.id
      JOIN npi_dmr d ON l.dmr_id = d.id
      WHERE d.waybill = ?
    `;
    await runQuery(deleteCrewQuery, [waybill]);

    const deleteLmrQuery = `
      DELETE l FROM npi_lmr l
      JOIN npi_dmr d ON l.dmr_id = d.id
      WHERE d.waybill = ?
    `;
    await runQuery(deleteLmrQuery, [waybill]);

    return res.json({ success: true, message: "LMR deleted successfully." });
  } catch (error) {
    console.error("Error deleting LMR:", error);
    return res.status(500).json({ success: false, message: "Database error." });
  }
};

module.exports = {
  getNpiLmrs,
  approveNpiLmr,
  updateNpiLmr,
  deleteNpiLmr,
};
