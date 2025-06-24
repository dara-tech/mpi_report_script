-- ===================================================================
-- SCRIPT SETUP
-- ===================================================================
-- Set the reporting period dates from the PDF report
SET @StartDate = '2025-01-01';
SET @EndDate = '2025-03-31';

-- Set the patient status codes based on the data dictionary
SET @dead_code = 1;
SET @transfer_out_code = 3;

-- ===================================================================
-- SCRIPT BODY
-- ===================================================================
SELECT
    -- ROW_NUMBER() OVER(ORDER BY PatientList.ClinicID) AS No,
    PatientList.ClinicID,
    PatientList.type,
    PatientList.Sex,
    PatientList.DaArt AS ART_Start_Date,
    PatientList.LastVLDate,
    PatientList.LastVLLoad,
    -- This new column explains which rule was met
    CASE
        WHEN PatientList.LastVLLoad IS NULL AND TIMESTAMPDIFF(MONTH, PatientList.DaArt, @EndDate) >= 5 THEN 'On ART >= 5 months, no previous VL'
        WHEN PatientList.LastVLLoad >= 40 AND TIMESTAMPDIFF(MONTH, PatientList.LastVLDate, @EndDate) > 4 THEN 'Last VL was high, >4 months ago'
        WHEN PatientList.LastVLLoad < 40 AND TIMESTAMPDIFF(MONTH, PatientList.LastVLDate, @EndDate) >= 10 THEN 'Last VL was suppressed, >=10 months ago'
        WHEN PatientList.LastVLLoad < 40 AND TIMESTAMPDIFF(MONTH, PatientList.DaArt, PatientList.LastVLDate) BETWEEN 5 AND 7 AND TIMESTAMPDIFF(MONTH, PatientList.LastVLDate, @EndDate) BETWEEN 5 AND 7 THEN 'Special Case: First VL was suppressed, now due'
        ELSE 'Unknown'
    END AS EligibilityReason
FROM (
    -- This is the base query from the original file that gathers all necessary patient data
    SELECT
        'Adult' as type,
        main.ClinicID,
        IF(main.Sex=0, 'Female', 'Male') as Sex,
        art.DaArt,
        previous_vl.LastVLDate,
        previous_vl.LastVLLoad
    FROM (
        -- Confirmed Active Adult Patient subquery
        SELECT main.ClinicID, main.Sex FROM tblaimain main
        JOIN ( SELECT lv.ClinicID, v.DaApp FROM (SELECT ClinicID, MAX(DatVisit) AS LastVisitDate FROM tblavmain WHERE DatVisit <= @EndDate GROUP BY ClinicID) lv JOIN tblavmain v ON lv.ClinicID = v.ClinicID AND lv.LastVisitDate = v.DatVisit ) pla ON main.ClinicID = pla.ClinicID
        WHERE NOT EXISTS (SELECT 1 FROM tblavpatientstatus s WHERE s.ClinicID = main.ClinicID AND s.Da <= @EndDate AND s.Status IN (@dead_code, @transfer_out_code)) AND DATEDIFF(@EndDate, pla.DaApp) < 28
    ) main
    JOIN (SELECT ClinicID, DaArt FROM tblaart) art ON main.ClinicID = art.ClinicID
    -- Get the LAST VL test that occurred BEFORE the start of this quarter
    LEFT JOIN (
        SELECT pt.clinicid, MAX(pt.Dat) as LastVLDate, CAST(SUBSTRING_INDEX(GROUP_CONCAT(pt.HIVLoad ORDER BY pt.Dat DESC), ',', 1) AS UNSIGNED) as LastVLLoad
        FROM tblpatienttest pt
        WHERE pt.hivload IS NOT NULL AND pt.HIVLoad REGEXP '^[0-9]+$' AND pt.Dat < @StartDate
        GROUP BY pt.clinicid
    ) previous_vl ON main.ClinicID = previous_vl.ClinicID
    UNION ALL
    -- Do the same for Child patients
    SELECT
        'Child' as type,
        main.ClinicID,
        IF(main.Sex=0, 'Female', 'Male') as Sex,
        art.DaArt,
        previous_vl.LastVLDate,
        previous_vl.LastVLLoad
    FROM (
        -- Confirmed Active Child Patient subquery
        SELECT main.ClinicID, main.Sex FROM tblcimain main
        JOIN ( SELECT lv.ClinicID, v.DaApp FROM (SELECT ClinicID, MAX(DatVisit) AS LastVisitDate FROM tblcvmain WHERE DatVisit <= @EndDate GROUP BY ClinicID) lv JOIN tblcvmain v ON lv.ClinicID = v.ClinicID AND lv.LastVisitDate = v.DatVisit ) pla ON main.ClinicID = pla.ClinicID
        WHERE NOT EXISTS (SELECT 1 FROM tblcvpatientstatus s WHERE s.ClinicID = main.ClinicID AND s.Da <= @EndDate AND s.Status IN (@dead_code, @transfer_out_code)) AND DATEDIFF(@EndDate, pla.DaApp) < 28
    ) main
    JOIN (SELECT ClinicID, DaArt FROM tblcart) art ON main.ClinicID = art.ClinicID
    LEFT JOIN (
        SELECT pt.clinicid, MAX(pt.Dat) as LastVLDate, CAST(SUBSTRING_INDEX(GROUP_CONCAT(pt.HIVLoad ORDER BY pt.Dat DESC), ',', 1) AS UNSIGNED) as LastVLLoad
        FROM tblpatienttest pt
        WHERE pt.hivload IS NOT NULL AND pt.HIVLoad REGEXP '^[0-9]+$' AND pt.Dat < @StartDate
        GROUP BY pt.clinicid
    ) previous_vl ON main.ClinicID = previous_vl.ClinicID
) AS PatientList
WHERE
    -- This is the implementation of the 4 eligibility rules from the original script
    (PatientList.LastVLLoad IS NULL AND TIMESTAMPDIFF(MONTH, PatientList.DaArt, @EndDate) >= 5)
    OR (PatientList.LastVLLoad >= 40 AND TIMESTAMPDIFF(MONTH, PatientList.LastVLDate, @EndDate) > 4)
    OR (PatientList.LastVLLoad < 40 AND TIMESTAMPDIFF(MONTH, PatientList.LastVLDate, @EndDate) >= 10)
    OR (PatientList.LastVLLoad < 40 AND TIMESTAMPDIFF(MONTH, PatientList.DaArt, PatientList.LastVLDate) BETWEEN 5 AND 7 AND TIMESTAMPDIFF(MONTH, PatientList.LastVLDate, @EndDate) BETWEEN 5 AND 7);