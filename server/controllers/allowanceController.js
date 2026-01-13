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
              dispatch_date_and_time, NULL AS rdd, allowance_matrix_id,
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
        SELECT 'NPI' AS principal, id AS lmr_id, dmr_id, driver_id, truck_id, allowance_matrix_id, status, created_at
        FROM npi_lmr
        UNION ALL SELECT 'PANA', id, dmr_id, driver_id, truck_id, allowance_matrix_id, status, created_at FROM pana_lmr
        UNION ALL SELECT 'UL', id, dmr_id, driver_id, truck_id, allowance_matrix_id, status, created_at FROM ul_lmr
        UNION ALL SELECT 'TDI', id, dmr_id, driver_id, truck_id, allowance_matrix_id, status, created_at FROM tdi_lmr
        UNION ALL SELECT 'AP', id, dmr_id, driver_id, truck_id, allowance_matrix_id, status, created_at FROM ap_lmr
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
        a.created_at AS date_allowance_requested,
        dmr.week,
        dmr.principal,

        DATE_FORMAT(dmr.dispatch_date_and_time, '%Y-%m-%d %H:%i') AS trip_ticket,
        CASE 
          WHEN dmr.principal = 'PANA' THEN NULL
          ELSE DATE_FORMAT(dmr.rdd, '%Y-%m-%d')
        END AS rdd,

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
        mat.first_destination,
        mat.second_destination,
        mat.code,
        mat.trip_type,
        mat.allowance,
        mat.shipping,
        mat.truck_type AS matrix_truck_type,

        /* Fuel calculation */
        mat.fuel * COALESCE(
          (
            SELECT fp.price_per_liter
            FROM fuel_prices fp
            WHERE fp.site_id = dmr.site_id
              AND dmr.created_at >= fp.effective_date
            ORDER BY fp.effective_date DESC
            LIMIT 1
          ),
          (
            SELECT fph.price_per_liter
            FROM fuel_prices_history fph
            WHERE fph.site_id = dmr.site_id
              AND dmr.created_at >= fph.effective_date
            ORDER BY fph.effective_date DESC
            LIMIT 1
          ),
          0
        ) AS fuel_amount,

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
        a.updated_at,

        /* TOTAL */
        (
          COALESCE(mat.allowance, 0)
          + COALESCE(mat.shipping, 0)
          + COALESCE(
              mat.fuel * COALESCE(
                (
                  SELECT fp.price_per_liter
                  FROM fuel_prices fp
                  WHERE fp.site_id = dmr.site_id
                    AND dmr.created_at >= fp.effective_date
                  ORDER BY fp.effective_date DESC
                  LIMIT 1
                ),
                (
                  SELECT fph.price_per_liter
                  FROM fuel_prices_history fph
                  WHERE fph.site_id = dmr.site_id
                    AND dmr.created_at >= fph.effective_date
                  ORDER BY fph.effective_date DESC
                  LIMIT 1
                ),
                0
              ), 0
            )
          + COALESCE(a.stripper_unloading, 0)
          + COALESCE(a.crew_allowance, 0)
          + COALESCE(a.toll_fee, 0)
          + COALESCE(a.transfer_fee, 0)
          + COALESCE(a.pullout_incentive, 0)
          + COALESCE(a.transfer_incentive, 0)
          + COALESCE(a.miscellaneous, 0)
        ) AS total_amount

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
          (a.trip_type = 'LMR' AND u.id = lmr.driver_id)
          OR (a.trip_type = 'DMR' AND u.id = dmr.driver_id)
        )
      LEFT JOIN trucks t
      ON (
        (a.trip_type = 'LMR' AND t.id = lmr.truck_id)
        OR (a.trip_type = 'DMR' AND t.id = dmr.truck_id)
      )
      LEFT JOIN allowance_matrix mat
      ON mat.id = CASE
          WHEN a.trip_type = 'LMR' THEN lmr.allowance_matrix_id
          WHEN a.trip_type = 'DMR' THEN dmr.allowance_matrix_id
        END
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

const updateAllowance = async (req, res) => {
  const { waybill } = req.params;
  const {
    stripperLoading,
    stripperUnloading,
    crewAllowance,
    tollFee,
    transferFee,
    pullOutIncentive,
    transferIncentive,
    miscellaneous,
  } = req.body;

  if (!waybill) {
    return res.status(400).json({
      success: false,
      message: "Waybill is required.",
    });
  }

  try {
    await runQuery(
      `UPDATE allowances 
       SET stripper_loading = ?,
       stripper_unloading = ?,
       crew_allowance = ?,
       toll_fee = ?,
       transfer_fee = ?,
       pullout_incentive = ?,
       transfer_incentive = ?,
       miscellaneous = ?,
       status = 'Reviewed', 
       updated_at = NOW() 
       WHERE waybill = ?`,
      [
        stripperLoading,
        stripperUnloading,
        crewAllowance,
        tollFee,
        transferFee,
        pullOutIncentive,
        transferIncentive,
        miscellaneous,
        waybill,
      ]
    );

    let principal = "";
    if (waybill.startsWith("WBNPI")) principal = "npi";
    else if (waybill.startsWith("WBAP")) principal = "ap";
    else if (waybill.startsWith("WBTDI")) principal = "tdi";
    else if (waybill.startsWith("WBPANA")) principal = "pana";
    else if (waybill.startsWith("WBUL")) principal = "ul";

    if (!principal) {
      return res.status(400).json({
        success: false,
        message: "Invalid waybill. Cannot determine principal.",
      });
    }

    await runQuery(
      `UPDATE ${principal}_dmr
       SET status = 'Reviewed', updated_at = NOW()
       WHERE waybill = ?`,
      [waybill]
    );

    await runQuery(
      `UPDATE ${principal}_lmr
       SET status = 'Reviewed', updated_at = NOW()
       WHERE dmr_id IN (SELECT id FROM ${principal}_dmr WHERE waybill = ?)`,
      [waybill]
    );

    res.json({
      success: true,
      message: "Allowance, DMR, and LMR statuses updated to 'Reviewed'.",
    });
  } catch (error) {
    console.error("Error updating allowance:", error);
    res.status(500).json({
      success: false,
      message: "Database error.",
    });
  }
};

const checkAllowance = async (req, res) => {
  const { waybill } = req.params;

  if (!waybill) {
    return res.status(400).json({
      success: false,
      message: "Waybill is required.",
    });
  }

  try {
    await runQuery(
      `
      UPDATE allowances
      SET
        status = 'Requested',
        updated_at = NOW()
      WHERE waybill = ?
      `,
      [waybill]
    );

    let principal = "";
    if (waybill.startsWith("WBNPI")) principal = "npi";
    else if (waybill.startsWith("WBAP")) principal = "ap";
    else if (waybill.startsWith("WBTDI")) principal = "tdi";
    else if (waybill.startsWith("WBPANA")) principal = "pana";
    else if (waybill.startsWith("WBUL")) principal = "ul";

    if (!principal) {
      return res.status(400).json({
        success: false,
        message: "Invalid waybill. Cannot determine principal.",
      });
    }

    await runQuery(
      `
      UPDATE ${principal}_dmr
      SET status = 'Requested', updated_at = NOW()
      WHERE waybill = ?
      `,
      [waybill]
    );

    await runQuery(
      `
      UPDATE ${principal}_lmr
      SET status = 'Requested', updated_at = NOW()
      WHERE dmr_id IN (
        SELECT id FROM ${principal}_dmr WHERE waybill = ?
      )
  `,
      [waybill]
    );

    res.json({
      success: true,
      message: "Allowance reviewed successfully.",
    });
  } catch (error) {
    console.error("Error updating allowance:", error);
    res.status(500).json({
      success: false,
      message: "Database error.",
    });
  }
};

const approveAllowance = async (req, res) => {
  const { waybill } = req.params;

  if (!waybill) {
    return res.status(400).json({
      success: false,
      message: "Waybill is required.",
    });
  }

  try {
    await runQuery(
      `
      UPDATE allowances
      SET
        status = 'Approved',
        updated_at = NOW()
      WHERE waybill = ?
      `,
      [waybill]
    );

    let principal = "";
    if (waybill.startsWith("WBNPI")) principal = "npi";
    else if (waybill.startsWith("WBAP")) principal = "ap";
    else if (waybill.startsWith("WBTDI")) principal = "tdi";
    else if (waybill.startsWith("WBPANA")) principal = "pana";
    else if (waybill.startsWith("WBUL")) principal = "ul";

    if (!principal) {
      return res.status(400).json({
        success: false,
        message: "Invalid waybill. Cannot determine principal.",
      });
    }

    await runQuery(
      `
      UPDATE ${principal}_dmr
      SET status = 'Approved', updated_at = NOW()
      WHERE waybill = ?
      `,
      [waybill]
    );

    await runQuery(
      `
      UPDATE ${principal}_lmr
      SET status = 'Approved', updated_at = NOW()
      WHERE dmr_id IN (
        SELECT id FROM ${principal}_dmr WHERE waybill = ?
      )
  `,
      [waybill]
    );

    res.json({
      success: true,
      message: "Allowance reviewed successfully.",
    });
  } catch (error) {
    console.error("Error updating allowance:", error);
    res.status(500).json({
      success: false,
      message: "Database error.",
    });
  }
};

const declineAllowance = async (req, res) => {
  const { waybill } = req.params;

  if (!waybill) {
    return res.status(400).json({
      success: false,
      message: "Waybill is required.",
    });
  }

  try {
    await runQuery(
      `
      UPDATE allowances
      SET
        status = 'Declined',
        updated_at = NOW()
      WHERE waybill = ?
      `,
      [waybill]
    );

    let principal = "";
    if (waybill.startsWith("WBNPI")) principal = "npi";
    else if (waybill.startsWith("WBAP")) principal = "ap";
    else if (waybill.startsWith("WBTDI")) principal = "tdi";
    else if (waybill.startsWith("WBPANA")) principal = "pana";
    else if (waybill.startsWith("WBUL")) principal = "ul";

    if (!principal) {
      return res.status(400).json({
        success: false,
        message: "Invalid waybill. Cannot determine principal.",
      });
    }

    await runQuery(
      `
      UPDATE ${principal}_dmr
      SET status = 'Declined', updated_at = NOW()
      WHERE waybill = ?
      `,
      [waybill]
    );

    await runQuery(
      `
      UPDATE ${principal}_lmr
      SET status = 'Declined', updated_at = NOW()
      WHERE dmr_id IN (
        SELECT id FROM ${principal}_dmr WHERE waybill = ?
      )
  `,
      [waybill]
    );

    res.json({
      success: true,
      message: "Allowance reviewed successfully.",
    });
  } catch (error) {
    console.error("Error updating allowance:", error);
    res.status(500).json({
      success: false,
      message: "Database error.",
    });
  }
};

module.exports = {
  getAllowances,
  updateAllowance,
  checkAllowance,
  approveAllowance,
  declineAllowance,
};
