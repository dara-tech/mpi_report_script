-- ===================================================================
-- SCRIPT SETUP
-- ===================================================================
-- Set the reporting period dates from the PDF report
SET @EndDate = '2025-03-31';

-- Set the patient status codes based on the data dictionary
SET @dead_code = 1;
SET @transfer_out_code = 3;

-- ===================================================================
-- SCRIPT BODY
-- ===================================================================
SELECT
    -- ROW_NUMBER() OVER (ORDER BY ActivePatients.ClinicID) AS No,
    ActivePatients.ClinicID,
    ActivePatients.type,
    ActivePatients.Sex,
    LastVL.LastVLDate,
    LastVL.LastVLResult
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
INNER JOIN
    (
        -- Find the MOST RECENT viral load for each patient in the last 12 months
        SELECT t.ClinicID, CAST(t.HIVLoad AS UNSIGNED) as LastVLResult, t.Dat as LastVLDate
        FROM tblpatienttest t
        INNER JOIN (
            SELECT ClinicID, MAX(Dat) as MaxDate
            FROM tblpatienttest
            WHERE Dat BETWEEN DATE_SUB(@EndDate, INTERVAL 12 MONTH) AND @EndDate AND HIVLoad IS NOT NULL AND HIVLoad REGEXP '^[0-9]+$'
            GROUP BY ClinicID
        ) AS max_vl ON t.ClinicID = max_vl.ClinicID AND t.Dat = max_vl.MaxDate
    ) AS LastVL ON ActivePatients.ClinicID = LastVL.ClinicID;
    