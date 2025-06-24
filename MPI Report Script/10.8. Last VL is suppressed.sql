-- ===================================================================
-- SCRIPT SETUP
-- ===================================================================
-- Set the reporting period dates from the PDF report
SET @EndDate = '2025-03-31';

-- Set the patient status codes based on the data dictionary
SET @dead_code = 1;
SET @transfer_out_code = 3;

-- Set the threshold for viral load suppression
SET @vl_suppression_threshold = 1000;

-- ===================================================================
-- SCRIPT BODY
-- ===================================================================
SELECT
    -- ROW_NUMBER() OVER (ORDER BY ActivePatients.ClinicID) AS No,
    ActivePatients.ClinicID,
    ActivePatients.type,
    ActivePatients.Sex,
    vl_results.LastVLDate,
    vl_results.LastVLResult
FROM
    (
        -- First, get the full list of all ACTIVE patients
        SELECT main.ClinicID, 'Adult' as type, IF(main.Sex=0, 'Female', 'Male') as Sex
        FROM tblaimain main
        JOIN ( SELECT lv.ClinicID, v.DaApp FROM (SELECT ClinicID, MAX(DatVisit) AS LastVisitDate FROM tblavmain WHERE DatVisit <= @EndDate GROUP BY ClinicID) lv JOIN tblavmain v ON lv.ClinicID = v.ClinicID AND lv.LastVisitDate = v.DatVisit ) pla ON main.ClinicID = pla.ClinicID
        WHERE NOT EXISTS (SELECT 1 FROM tblavpatientstatus s WHERE s.ClinicID = main.ClinicID AND s.Da <= @EndDate AND s.Status IN (@dead_code, @transfer_out_code)) AND DATEDIFF(@EndDate, pla.DaApp) < 28
        UNION ALL
        SELECT main.ClinicID, 'Child' as type, IF(main.Sex=0, 'Female', 'Male') as Sex
        FROM tblcimain main
        JOIN ( SELECT lv.ClinicID, v.DaApp FROM (SELECT ClinicID, MAX(DatVisit) AS LastVisitDate FROM tblcvmain WHERE DatVisit <= @EndDate GROUP BY ClinicID) lv JOIN tblcvmain v ON lv.ClinicID = v.ClinicID AND lv.LastVisitDate = v.DatVisit ) pla ON main.ClinicID = pla.ClinicID
        WHERE NOT EXISTS (SELECT 1 FROM tblcvpatientstatus s WHERE s.ClinicID = main.ClinicID AND s.Da <= @EndDate AND s.Status IN (@dead_code, @transfer_out_code)) AND DATEDIFF(@EndDate, pla.DaApp) < 28
    ) AS ActivePatients
JOIN
    (
        -- Join to their latest VL test result within the last 12 months
        SELECT
            t.ClinicID,
            t.Dat AS LastVLDate,
            CAST(t.HIVLoad AS UNSIGNED) AS LastVLResult
        FROM tblpatienttest t
        INNER JOIN (
            -- Find the date of the last test for each patient WITHIN THE LAST 12 MONTHS
            SELECT ClinicID, MAX(Dat) as LastTestDate FROM tblpatienttest
            WHERE Dat BETWEEN DATE_SUB(@EndDate, INTERVAL 12 MONTH) AND @EndDate
            AND HIVLoad IS NOT NULL AND HIVLoad REGEXP '^[0-9]+$'
            GROUP BY ClinicID
        ) last_test ON t.ClinicID = last_test.ClinicID AND t.Dat = last_test.LastTestDate
    ) AS vl_results ON ActivePatients.ClinicID = vl_results.ClinicID
WHERE
    -- Filter for patients whose last VL is suppressed
    vl_results.LastVLResult < @vl_suppression_threshold;