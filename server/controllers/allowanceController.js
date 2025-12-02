const db = require("../config/db");

const runQuery = async (sql, params = []) => {
  const conn = await db.getDB();
  const [rows] = await conn.query(sql, params);
  return rows;
};

const getAllowances = async (req, res) => {
  try {
    const rows = await runQuery(`
      WITH all_dmr AS (
        SELECT 'NPI' AS principal, id, week, waybill, site_id, customer_id,
              dispatch_date_and_time, rdd, allowance_matrix_id,
              created_at, updated_at, driver_id, truck_id
        FROM npi_dmr
        UNION ALL SELECT 'PANA', id, week, waybill, site_id, customer_id,
              dispatch_date_and_time, rdd, allowance_matrix_id,
              created_at, updated_at, driver_id, truck_id
        FROM pana_dmr
        UNION ALL SELECT 'UL', id, week, waybill, site_id, customer_id,
              dispatch_date_and_time, rdd, allowance_matrix_id,
              created_at, updated_at, driver_id, truck_id
        FROM ul_dmr
        UNION ALL SELECT 'TDI', id, week, waybill, site_id, customer_id,
              dispatch_date_and_time, rdd, allowance_matrix_id,
              created_at, updated_at, driver_id, truck_id
        FROM tdi_dmr
        UNION ALL SELECT 'AP', id, week, waybill, site_id, customer_id,
              dispatch_date_and_time, rdd, allowance_matrix_id,
              created_at, updated_at, driver_id, truck_id
        FROM ap_dmr
      ),

      all_lmr AS (
        SELECT 'NPI' AS principal, id AS lmr_id, dmr_id, driver_id, truck_id, allowance_matrix_id, status
        FROM npi_lmr
        UNION ALL SELECT 'PANA', id, dmr_id, driver_id, truck_id, allowance_matrix_id, status FROM pana_lmr
        UNION ALL SELECT 'UL', id, dmr_id, driver_id, truck_id, allowance_matrix_id, status FROM ul_lmr
        UNION ALL SELECT 'TDI', id, dmr_id, driver_id, truck_id, allowance_matrix_id, status FROM tdi_lmr
        UNION ALL SELECT 'AP', id, dmr_id, driver_id, truck_id, allowance_matrix_id, status FROM ap_lmr
      ),

      all_lmr_crews AS (
        SELECT principal, lmr_id,
        GROUP_CONCAT(CONCAT(u.first_name, ' ',
          IF(u.middle_name!='' AND u.middle_name IS NOT NULL, CONCAT(LEFT(u.middle_name,1),'. '), ''),
          u.last_name) SEPARATOR ', ') AS crews
        FROM (
          SELECT 'NPI' principal, lmr_id, crew_id FROM npi_lmr_crews
          UNION ALL SELECT 'PANA', lmr_id, crew_id FROM pana_lmr_crews
          UNION ALL SELECT 'UL', lmr_id, crew_id FROM ul_lmr_crews
          UNION ALL SELECT 'TDI', lmr_id, crew_id FROM tdi_lmr_crews
          UNION ALL SELECT 'AP', lmr_id, crew_id FROM ap_lmr_crews
        ) c
        JOIN users u ON u.id = c.crew_id
        GROUP BY principal, lmr_id
      ),

      all_dmr_crews AS (
        SELECT principal, dmr_id,
        GROUP_CONCAT(CONCAT(u.first_name, ' ',
          IF(u.middle_name!='' AND u.middle_name IS NOT NULL, CONCAT(LEFT(u.middle_name,1),'. '), ''),
          u.last_name) SEPARATOR ', ') AS crews
        FROM (
          SELECT 'NPI' principal, dmr_id, crew_id FROM npi_dmr_crews
          UNION ALL SELECT 'PANA', dmr_id, crew_id FROM pana_dmr_crews
          UNION ALL SELECT 'UL', dmr_id, crew_id FROM ul_dmr_crews
          UNION ALL SELECT 'TDI', dmr_id, crew_id FROM tdi_dmr_crews
          UNION ALL SELECT 'AP', dmr_id, crew_id FROM ap_dmr_crews
        ) c
        JOIN users u ON u.id = c.crew_id
        GROUP BY principal, dmr_id
      )

      SELECT
        a.waybill,
        a.id AS allowance_id,
        dmr.week,
        dmr.principal,

        DATE_FORMAT(dmr.dispatch_date_and_time, '%Y-%m-%d %H:%i') AS trip_ticket,
        DATE_FORMAT(dmr.rdd, '%Y-%m-%d') AS rdd,

        CONCAT(
          u.first_name, ' ',
          IF(u.middle_name!='' AND u.middle_name IS NOT NULL, CONCAT(LEFT(u.middle_name,1),'. '), ''),
          u.last_name
        ) AS driver,

        CASE
          WHEN a.trip_type = 'LMR' THEN lmr_crews.crews
          WHEN a.trip_type = 'DMR' THEN dmr_crews.crews
        END AS crews,

        t.plate_number AS truck_plate,
        t.truck_type,

        cs.customer_name,

        s.site_code,

        mat.source,
        mat.destination,

        -- ADD THESE:
        mat.allowance,
        mat.shipping,
        mat.fuel,
        mat.truck_type,

        a.trip_type,
        a.stripper_loading,
        a.stripper_unloading,
        a.crew_allowance,
        a.toll_fee,
        a.transfer_fee,
        a.pullout_incentive,
        a.transfer_incentive,
        a.miscellaneous,
        a.status,
        a.created_at,
        a.created_at AS date_allowance_requested,
        a.updated_at

      FROM allowances a
      LEFT JOIN all_dmr dmr ON a.waybill = dmr.waybill
      LEFT JOIN sites s ON s.id = dmr.site_id
      LEFT JOIN customers cs ON cs.id = dmr.customer_id
      LEFT JOIN all_lmr lmr
        ON a.trip_type = 'LMR'
        AND dmr.id = lmr.dmr_id
        AND dmr.principal = lmr.principal

      LEFT JOIN users u
        ON (
          (a.trip_type = 'LMR' AND u.id = lmr.driver_id) OR
          (a.trip_type = 'DMR' AND u.id = dmr.driver_id)
        )

      LEFT JOIN trucks t
        ON (
          (a.trip_type = 'LMR' AND t.id = lmr.truck_id) OR
          (a.trip_type = 'DMR' AND t.id = dmr.truck_id)
        )
      LEFT JOIN allowance_matrix mat 
        ON (
          (a.trip_type = 'LMR' AND mat.id = lmr.allowance_matrix_id) OR
          (a.trip_type = 'DMR' AND mat.id = dmr.allowance_matrix_id)
        ) 
      LEFT JOIN all_lmr_crews lmr_crews
        ON a.trip_type = 'LMR'
        AND lmr_crews.lmr_id = lmr.lmr_id
        AND lmr_crews.principal = dmr.principal

      LEFT JOIN all_dmr_crews dmr_crews
        ON a.trip_type = 'DMR'
        AND dmr_crews.dmr_id = dmr.id
        AND dmr_crews.principal = dmr.principal
      ORDER BY FIELD(a.status, 'Pending', 'Approved', 'Declined'), a.created_at DESC;
    `);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error fetching allowances:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllowances,
};
