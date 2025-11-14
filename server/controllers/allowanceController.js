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
        SELECT 'NPI' AS principal, id, week, waybill, site_id, customer_id, dispatch_date_and_time, rdd, driver_id, truck_id, destination, created_at, updated_at FROM npi_dmr
        UNION ALL
        SELECT 'PANA', id, week, waybill, site_id, customer_id, dispatch_date_and_time, rdd, driver_id, truck_id, destination, created_at, updated_at FROM pana_dmr
        UNION ALL
        SELECT 'UL', id, week, waybill, site_id, customer_id, dispatch_date_and_time, rdd, driver_id, truck_id, destination, created_at, updated_at FROM ul_dmr
        UNION ALL
        SELECT 'TDI', id, week, waybill, site_id, customer_id, dispatch_date_and_time, rdd, driver_id, truck_id, destination, created_at, updated_at FROM tdi_dmr
        UNION ALL
        SELECT 'AP', id, week, waybill, site_id, customer_id, dispatch_date_and_time, rdd, driver_id, truck_id, destination, created_at, updated_at FROM ap_dmr
      ),
      all_crews AS (
        SELECT d.waybill, 
               GROUP_CONCAT(CONCAT(u.first_name, ' ',
                                   IF(u.middle_name IS NOT NULL AND u.middle_name != '', CONCAT(LEFT(u.middle_name,1),'. '), ''),
                                   u.last_name
                                  ) SEPARATOR ', '
               ) AS crews,
               'NPI' AS principal
        FROM npi_dmr_crews c
        JOIN npi_dmr d ON c.dmr_id = d.id
        JOIN users u ON c.crew_id = u.id
        GROUP BY d.waybill
        UNION ALL
        SELECT d.waybill, 
               GROUP_CONCAT(CONCAT(u.first_name, ' ',
                                   IF(u.middle_name IS NOT NULL AND u.middle_name != '', CONCAT(LEFT(u.middle_name,1),'. '), ''),
                                   u.last_name
                                  ) SEPARATOR ', '
               ), 'PANA'
        FROM pana_dmr_crews c
        JOIN pana_dmr d ON c.dmr_id = d.id
        JOIN users u ON c.crew_id = u.id
        GROUP BY d.waybill
        UNION ALL
        SELECT d.waybill, 
               GROUP_CONCAT(CONCAT(u.first_name, ' ',
                                   IF(u.middle_name IS NOT NULL AND u.middle_name != '', CONCAT(LEFT(u.middle_name,1),'. '), ''),
                                   u.last_name
                                  ) SEPARATOR ', '
               ), 'UL'
        FROM ul_dmr_crews c
        JOIN ul_dmr d ON c.dmr_id = d.id
        JOIN users u ON c.crew_id = u.id
        GROUP BY d.waybill
        UNION ALL
        SELECT d.waybill, 
               GROUP_CONCAT(CONCAT(u.first_name, ' ',
                                   IF(u.middle_name IS NOT NULL AND u.middle_name != '', CONCAT(LEFT(u.middle_name,1),'. '), ''),
                                   u.last_name
                                  ) SEPARATOR ', '
               ), 'TDI'
        FROM tdi_dmr_crews c
        JOIN tdi_dmr d ON c.dmr_id = d.id
        JOIN users u ON c.crew_id = u.id
        GROUP BY d.waybill
        UNION ALL
        SELECT d.waybill, 
               GROUP_CONCAT(CONCAT(u.first_name, ' ',
                                   IF(u.middle_name IS NOT NULL AND u.middle_name != '', CONCAT(LEFT(u.middle_name,1),'. '), ''),
                                   u.last_name
                                  ) SEPARATOR ', '
               ), 'AP'
        FROM ap_dmr_crews c
        JOIN ap_dmr d ON c.dmr_id = d.id
        JOIN users u ON c.crew_id = u.id
        GROUP BY d.waybill
      )
      SELECT 
        a.waybill,
        MAX(a.id) AS allowance_id,
        MAX(dmr.week) AS week,
        MAX(dmr.principal) AS principal,
        -- if trip_type is ETMR use dispatch_date_and_time, else 0
        CASE 
          WHEN MAX(a.trip_type) = 'ETMR' THEN DATE_FORMAT(MAX(dmr.dispatch_date_and_time), '%Y-%m-%d %H:%i')
          ELSE '0'
        END AS trip_ticket,
        MAX(cust.customer_name) AS customer_name,
        DATE_FORMAT(MAX(dmr.rdd), '%Y-%m-%d') AS rdd,
        CONCAT(
          MAX(drv.first_name), ' ',
          IF(MAX(drv.middle_name) IS NOT NULL AND MAX(drv.middle_name) != '', CONCAT(LEFT(MAX(drv.middle_name),1),'. '), ''),
          MAX(drv.last_name)
        ) AS driver,
        MAX(cr.crews) AS crews,
        MAX(tr.plate_number) AS truck_plate,
        MAX(tr.truck_type) AS truck_type,
        MAX(a.trip_type) AS trip_type,
        CONCAT(MAX(s.site_name), ' - ', MAX(s.site_code)) AS source,
        MAX(dmr.destination) AS destination,
        MAX(mat.allowance_10w) AS allowance,
        MAX(mat.shipping_10w) AS shipping,
        MAX(mat.fuel_10w) AS fuel,
        MAX(a.stripper_loading) AS stripper_loading,
        MAX(a.stripper_unloading) AS stripper_unloading,
        MAX(a.crew_allowance) AS crew_allowance,
        MAX(a.toll_fee) AS toll_fee,
        MAX(a.transfer_fee) AS transfer_fee,
        MAX(a.pullout_incentive) AS pullout_incentive,
        MAX(a.transfer_incentive) AS transfer_incentive,
        MAX(a.miscellaneous) AS miscellaneous,
        MAX(a.status) AS status,
        MAX(a.created_at) AS created_at,
        MAX(a.updated_at) AS updated_at
      FROM allowances a
      LEFT JOIN all_dmr dmr ON a.waybill = dmr.waybill
      LEFT JOIN all_crews cr ON cr.waybill = a.waybill AND cr.principal = dmr.principal
      LEFT JOIN customers cust ON dmr.customer_id = cust.id
      LEFT JOIN users drv ON dmr.driver_id = drv.id
      LEFT JOIN trucks tr ON dmr.truck_id = tr.id
      LEFT JOIN sites s ON dmr.site_id = s.id
      LEFT JOIN allowance_matrix mat ON a.allowance_matrix_id = mat.id
      GROUP BY a.waybill
      ORDER BY MAX(a.created_at) DESC;
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
