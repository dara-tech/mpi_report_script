-- ===================================================================
-- SCRIPT SETUP
-- ===================================================================
-- Set the reporting period dates from the PDF report
SET @StartDate = '2025-01-01';
SET @EndDate = '2025-03-31';

-- Set the patient status codes based on the data dictionary
SET @dead_code = 1;
SET @transfer_out_code = 3;
SET @vl_suppression_threshold = 1000;

-- ===================================================================
-- SCRIPT BODY
-- ===================================================================
SELECT
    -- ROW_NUMBER() OVER () AS No,
    p.ClinicID,
    p.type,
    p.Sex,
    p.DaArt AS ART_Start_Date,
    TIMESTAMPDIFF(MONTH, p.DaArt, @EndDate) AS MonthsOnART,
    vl.LastVLDate,
    vl.LastVLResult
FROM
    (
        -- Rule 1: Find all ACTIVE patients (Adults and Children)
        SELECT main.ClinicID, 'Adult' as type, IF(main.Sex=0, 'Female', 'Male') as Sex, art.DaArt
        FROM tblaimain main
        JOIN tblaart art ON main.ClinicID = art.ClinicID
        JOIN (
            SELECT lv.ClinicID, v.DaApp FROM (SELECT ClinicID, MAX(DatVisit) AS LastVisitDate FROM tblavmain WHERE DatVisit <= @EndDate GROUP BY ClinicID) lv
            JOIN tblavmain v ON lv.ClinicID = v.ClinicID AND lv.LastVisitDate = v.DatVisit
        ) pla ON main.ClinicID = pla.ClinicID
        WHERE NOT EXISTS (SELECT 1 FROM tblavpatientstatus s WHERE s.ClinicID = main.ClinicID AND s.Da <= @EndDate AND s.Status IN (@dead_code, @transfer_out_code))
          AND DATEDIFF(@EndDate, pla.DaApp) < 28
        UNION ALL
        SELECT main.ClinicID, 'Child' as type, IF(main.Sex=0, 'Female', 'Male') as Sex, art.DaArt
        FROM tblcimain main
        JOIN tblcart art ON main.ClinicID = art.ClinicID
        JOIN (
            SELECT lv.ClinicID, v.DaApp FROM (SELECT ClinicID, MAX(DatVisit) AS LastVisitDate FROM tblcvmain WHERE DatVisit <= @EndDate GROUP BY ClinicID) lv
            JOIN tblcvmain v ON lv.ClinicID = v.ClinicID AND lv.LastVisitDate = v.DatVisit
        ) pla ON main.ClinicID = pla.ClinicID
        WHERE NOT EXISTS (SELECT 1 FROM tblcvpatientstatus s WHERE s.ClinicID = main.ClinicID AND s.Da <= @EndDate AND s.Status IN (@dead_code, @transfer_out_code))
          AND DATEDIFF(@EndDate, pla.DaApp) < 28
    ) AS p
JOIN
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
    ) AS vl ON p.ClinicID = vl.ClinicID
WHERE
    -- Rule 2: Must be on ART for at least 12 months
    TIMESTAMPDIFF(MONTH, p.DaArt, @EndDate) >= 12
AND
    -- Rule 3: Must be Virally Suppressed
    vl.LastVLResult < @vl_suppression_threshold;