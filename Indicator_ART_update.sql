-- ===================================================================
-- SCRIPT SETUP
-- ===================================================================
-- Set the reporting period dates from the PDF report
SET @StartDate = '2025-01-01';
SET @EndDate = '2025-03-31';
SET @PreviousEndDate = '2024-12-31';

-- Set the patient status codes based on the data dictionary
SET @lost_code = 0;
SET @dead_code = 1;
SET @transfer_out_code = 3;

-- Set MMD-related variables
SET @mmd_eligible_code = 0; 
SET @mmd_drug_quantity = 60;
SET @vl_suppression_threshold = 1000;

-- Set codes for specific fields based on schema and user feedback
SET @tld_regimen_formula = '3TC + DTG + TDF';
SET @transfer_in_code = 1; 
SET @tpt_drug_list = "'Isoniazid','3HP','6H',3RH";


-- ===================================================================
-- REPORT QUERIES
-- ===================================================================

-- Indicator 1: Number of active ART patients in previous quarter
SELECT
    '1. Active ART patients in previous quarter' AS Indicator,
    IFNULL(COUNT(*), 0) AS TOTAL,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Child' AND PatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_0_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Child' AND PatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_0_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Adult' AND PatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_over_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Adult' AND PatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_over_14
	
FROM (
    -- Adult Active Patients
    SELECT 'Adult' as type, IF(main.Sex=0, 'Female', 'Male') as Sex FROM tblaimain main
    JOIN ( SELECT lv.ClinicID, v.DaApp FROM (SELECT ClinicID, MAX(DatVisit) AS LastVisitDate FROM tblavmain WHERE DatVisit <= @PreviousEndDate GROUP BY ClinicID) lv JOIN tblavmain v ON lv.ClinicID = v.ClinicID AND lv.LastVisitDate = v.DatVisit ) pla ON main.ClinicID = pla.ClinicID
    WHERE NOT EXISTS (SELECT 1 FROM tblavpatientstatus s WHERE s.ClinicID = main.ClinicID AND s.Da <= @PreviousEndDate AND s.Status IN (@dead_code, @transfer_out_code)) AND DATEDIFF(@PreviousEndDate, pla.DaApp) < 28
    UNION ALL
    -- Child Active Patients
    SELECT 'Child' as type, IF(main.Sex=0, 'Female', 'Male') as Sex FROM tblcimain main
    JOIN ( SELECT lv.ClinicID, v.DaApp FROM (SELECT ClinicID, MAX(DatVisit) AS LastVisitDate FROM tblcvmain WHERE DatVisit <= @PreviousEndDate GROUP BY ClinicID) lv JOIN tblcvmain v ON lv.ClinicID = v.ClinicID AND lv.LastVisitDate = v.DatVisit ) pla ON main.ClinicID = pla.ClinicID
    WHERE NOT EXISTS (SELECT 1 FROM tblcvpatientstatus s WHERE s.ClinicID = main.ClinicID AND s.Da <= @PreviousEndDate AND s.Status IN (@dead_code, @transfer_out_code)) AND DATEDIFF(@PreviousEndDate, pla.DaApp) < 28
) AS PatientList

UNION ALL
-- Query for Indicator 2
SELECT
    '2. Active Pre-ART patients in previous quarter' AS Indicator,
    0 AS TOTAL,
    0 AS Male_0_14,
    0 AS Female_0_14,
    0 AS Male_over_14,
    0 AS Female_over_14
UNION ALL
-- Query Indicator Enrolled 3
SELECT
    '3. Newly Enrolled' AS Indicator,
    IFNULL(COUNT(*), 0) AS TOTAL,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Child' AND PatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_0_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Child' AND PatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_0_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Adult' AND PatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_over_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Adult' AND PatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_over_14
FROM (
    -- Adults: Must have ART start date in quarter, NOT be a transfer-in, AND NOT be a lost-return patient
    SELECT 'Adult' as type, IF(p.Sex=0, "Female", "Male") as Sex
    FROM tblaimain p 
    JOIN tblaart art ON p.ClinicID = art.ClinicID
    JOIN tblavmain v ON p.ClinicID = v.ClinicID AND v.DatVisit = art.DaArt 
    WHERE 
        art.DaArt BETWEEN @StartDate AND @EndDate 
        AND (p.OffIn IS NULL OR p.OffIn <> @transfer_in_code)
        AND (p.TypeofReturn IS NULL OR p.TypeofReturn = -1)
    
    UNION ALL
    
    -- Children: Must have ART start date in quarter AND NOT be a transfer-in
    SELECT 'Child' as type, IF(p.Sex=0, "Female", "Male") as Sex
    FROM tblcimain p 
    JOIN tblcart art ON p.ClinicID = art.ClinicID
    JOIN tblcvmain v ON p.ClinicID = v.ClinicID AND v.DatVisit = art.DaArt
    WHERE 
        art.DaArt BETWEEN @StartDate AND @EndDate 
        AND (p.OffIn IS NULL OR p.OffIn <> @transfer_in_code)
) AS PatientList
UNION ALL

-- Query for Indicator 4
SELECT
    '4. Re-tested positive' AS Indicator,
    0 AS TOTAL,
    0 AS Male_0_14,
    0 AS Female_0_14,
    0 AS Male_over_14,
    0 AS Female_over_14

UNION ALL
-- Query Indicator Initiated 5
SELECT
    '5. Newly Initiated' AS Indicator,
    IFNULL(COUNT(*), 0) AS TOTAL,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Child' AND PatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_0_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Child' AND PatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_0_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Adult' AND PatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_over_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Adult' AND PatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_over_14
FROM (
    -- Adults: Must have ART start date in quarter, NOT be a transfer-in, AND NOT be a lost-return patient
    SELECT 'Adult' as type, IF(p.Sex=0, "Female", "Male") as Sex
    FROM tblaimain p 
    JOIN tblaart art ON p.ClinicID = art.ClinicID
    JOIN tblavmain v ON p.ClinicID = v.ClinicID AND v.DatVisit = art.DaArt 
    WHERE 
        art.DaArt BETWEEN @StartDate AND @EndDate 
        AND (p.OffIn IS NULL OR p.OffIn <> @transfer_in_code)
        AND (p.TypeofReturn IS NULL OR p.TypeofReturn = -1)
    
    UNION ALL
    
    -- Children: Must have ART start date in quarter AND NOT be a transfer-in
    SELECT 'Child' as type, IF(p.Sex=0, "Female", "Male") as Sex
    FROM tblcimain p 
    JOIN tblcart art ON p.ClinicID = art.ClinicID
    JOIN tblcvmain v ON p.ClinicID = v.ClinicID AND v.DatVisit = art.DaArt
    WHERE 
        art.DaArt BETWEEN @StartDate AND @EndDate 
        AND (p.OffIn IS NULL OR p.OffIn <> @transfer_in_code)
) AS PatientList
UNION ALL
-- Indicator 5.1.1: New ART started: Same day
SELECT
    '5.1.1. New ART started Same day' AS Indicator,
    IFNULL(COUNT(*), 0) AS TOTAL,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Child' AND PatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_0_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Child' AND PatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_0_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Adult' AND PatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_over_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Adult' AND PatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_over_14
FROM (
    -- Adults: Must not be a lost-return patient
    SELECT 'Adult' as type, IF(p.Sex=0, "Female", "Male") as Sex FROM tblaimain p JOIN tblaart art ON p.ClinicID = art.ClinicID WHERE art.DaArt BETWEEN @StartDate AND @EndDate AND DATEDIFF(art.DaArt, p.DafirstVisit) = 0 AND (p.TypeofReturn IS NULL OR p.TypeofReturn = -1)
    UNION ALL
    -- Children
    SELECT 'Child' as type, IF(p.Sex=0, "Female", "Male") as Sex FROM tblcimain p JOIN tblcart art ON p.ClinicID = art.ClinicID WHERE art.DaArt BETWEEN @StartDate AND @EndDate AND DATEDIFF(art.DaArt, p.DafirstVisit) = 0
) as PatientList

UNION ALL

-- Indicator 5.1.2: New ART started: 1-7 days
SELECT
    '5.1.2. New ART started 1-7 days' AS Indicator,
    IFNULL(COUNT(*), 0) AS TOTAL,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Child' AND PatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_0_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Child' AND PatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_0_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Adult' AND PatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_over_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Adult' AND PatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_over_14
FROM (
    -- Adults: Must not be a lost-return patient
    SELECT 'Adult' as type, IF(p.Sex=0, "Female", "Male") as Sex FROM tblaimain p JOIN tblaart art ON p.ClinicID = art.ClinicID WHERE art.DaArt BETWEEN @StartDate AND @EndDate AND DATEDIFF(art.DaArt, p.DafirstVisit) BETWEEN 1 AND 7 AND (p.TypeofReturn IS NULL OR p.TypeofReturn = -1)
    UNION ALL
    -- Children
    SELECT 'Child' as type, IF(p.Sex=0, "Female", "Male") as Sex FROM tblcimain p JOIN tblcart art ON p.ClinicID = art.ClinicID WHERE art.DaArt BETWEEN @StartDate AND @EndDate AND DATEDIFF(art.DaArt, p.DafirstVisit) BETWEEN 1 AND 7
) as PatientList

UNION ALL

-- Indicator 5.1.3: New ART started: >7 days
SELECT
    '5.1.3. New ART started >7 days' AS Indicator,
    IFNULL(COUNT(*), 0) AS TOTAL,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Child' AND PatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_0_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Child' AND PatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_0_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Adult' AND PatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_over_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Adult' AND PatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_over_14
FROM (
    -- Adults: Must not be a lost-return patient
    SELECT 'Adult' as type, IF(p.Sex=0, "Female", "Male") as Sex FROM tblaimain p JOIN tblaart art ON p.ClinicID = art.ClinicID WHERE art.DaArt BETWEEN @StartDate AND @EndDate AND DATEDIFF(art.DaArt, p.DafirstVisit) > 7 AND (p.TypeofReturn IS NULL OR p.TypeofReturn = -1)
    UNION ALL
    -- Children
    SELECT 'Child' as type, IF(p.Sex=0, "Female", "Male") as Sex FROM tblcimain p JOIN tblcart art ON p.ClinicID = art.ClinicID WHERE art.DaArt BETWEEN @StartDate AND @EndDate AND DATEDIFF(art.DaArt, p.DafirstVisit) > 7
) as PatientList
UNION ALL

-- Indicator 5.2: New ART started with TLD
SELECT
    '5.2. New ART started with TLD' AS Indicator,
    IFNULL(COUNT(*), 0) AS TOTAL,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Child' AND PatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_0_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Child' AND PatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_0_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Adult' AND PatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_over_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Adult' AND PatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_over_14
FROM (
    SELECT 'Adult' as type, IF(p.Sex=0, 'Female', 'Male') as Sex FROM tblaimain p
    JOIN tblaart art ON p.ClinicID = art.ClinicID JOIN tblavmain v ON p.ClinicID = v.ClinicID AND v.DatVisit = art.DaArt
    WHERE art.DaArt BETWEEN @StartDate AND @EndDate
    AND v.Vid IN (SELECT Vid FROM (SELECT Vid, GROUP_CONCAT(DrugName ORDER BY DrugName SEPARATOR ' + ') as regimen FROM tblavarvdrug WHERE Status <> 1 AND Status <> -1 GROUP BY Vid) rg WHERE rg.regimen = @tld_regimen_formula)
    UNION ALL
    SELECT 'Child' as type, IF(p.Sex=0, 'Female', 'Male') as Sex FROM tblcimain p
    JOIN tblcart art ON p.ClinicID = art.ClinicID JOIN tblcvmain v ON p.ClinicID = v.ClinicID AND v.DatVisit = art.DaArt
    WHERE art.DaArt BETWEEN @StartDate AND @EndDate
    AND v.Vid IN (SELECT Vid FROM (SELECT Vid, GROUP_CONCAT(DrugName ORDER BY DrugName SEPARATOR ' + ') as regimen FROM tblcvarvdrug WHERE Status <> 1 AND Status <> -1 GROUP BY Vid) rg WHERE rg.regimen = @tld_regimen_formula)
) AS PatientList

UNION ALL

-- Indicator 6: Number of transfer-in patients
SELECT
    '6. Transfer-in patients' AS Indicator,
    IFNULL(COUNT(*), 0) AS TOTAL,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Child' AND PatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_0_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Child' AND PatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_0_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Adult' AND PatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_over_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Adult' AND PatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_over_14
FROM (
    SELECT 'Adult' as type, IF(Sex=0, 'Female', 'Male') as Sex FROM tblaimain WHERE DafirstVisit BETWEEN @StartDate AND @EndDate AND OffIn = @transfer_in_code
    UNION ALL
    SELECT 'Child' as type, IF(Sex=0, 'Female', 'Male') as Sex FROM tblcimain WHERE DafirstVisit BETWEEN @StartDate AND @EndDate AND OffIn = @transfer_in_code
) as PatientList

UNION ALL

-- Indicator 7: Lost and Return
SELECT
    '7. Lost and Return' AS Indicator,
    IFNULL(COUNT(*), 0) AS TOTAL,
    0 AS Male_0_14,
    0 AS Female_0_14,
    IFNULL(SUM(CASE WHEN PatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_over_14,
    IFNULL(SUM(CASE WHEN PatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_over_14
FROM (
    -- Adult patients who returned in the quarter (exact match to individual script)
    SELECT IF(p.Sex=0, 'Female', 'Male') as Sex
    FROM tblaimain p
    JOIN tblavmain v ON p.ClinicID = v.ClinicID
    JOIN tblaart art ON p.ClinicID = art.ClinicID
    WHERE v.DatVisit BETWEEN @StartDate AND @EndDate
      AND p.TypeofReturn IS NOT NULL AND p.TypeofReturn <> -1
      AND art.DaArt < v.DatVisit
    GROUP BY p.ClinicID, p.Artnum, p.Sex, p.TypeofReturn, art.DaArt
) as PatientList

UNION ALL

-- Indicator 8.1: Dead
SELECT
    '8.1. Dead' AS Indicator,
    IFNULL(COUNT(*), 0) AS TOTAL,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Child' AND PatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_0_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Child' AND PatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_0_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Adult' AND PatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_over_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Adult' AND PatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_over_14
FROM (
    SELECT 'Adult' as type, IF(main.Sex=0, 'Female', 'Male') as Sex FROM tblaimain main JOIN tblavpatientstatus s ON main.ClinicID = s.ClinicID WHERE s.Da BETWEEN @StartDate AND @EndDate AND s.Status = @dead_code
    UNION ALL
    SELECT 'Child' as type, IF(main.Sex=0, 'Female', 'Male') as Sex FROM tblcimain main JOIN tblcvpatientstatus s ON main.ClinicID = s.ClinicID WHERE s.Da BETWEEN @StartDate AND @EndDate AND s.Status = @dead_code
) AS PatientList

UNION ALL

-- Indicator 8.2: Lost to follow up (LTFU)
SELECT
    '8.2. Lost to follow up (LTFU)' AS Indicator,
    IFNULL(COUNT(*), 0) AS TOTAL,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Child' AND PatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_0_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Child' AND PatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_0_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Adult' AND PatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_over_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Adult' AND PatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_over_14
FROM (
    SELECT 'Adult' as type, IF(main.Sex=0, 'Female', 'Male') as Sex FROM tblaimain main JOIN tblavpatientstatus s ON main.ClinicID = s.ClinicID WHERE s.Da BETWEEN @StartDate AND @EndDate AND s.Status = @lost_code
    UNION ALL
    SELECT 'Child' as type, IF(main.Sex=0, 'Female', 'Male') as Sex FROM tblcimain main JOIN tblcvpatientstatus s ON main.ClinicID = s.ClinicID WHERE s.Da BETWEEN @StartDate AND @EndDate AND s.Status = @lost_code
) AS PatientList

UNION ALL

-- Indicator 8.3: Transfer-out
SELECT
    '8.3. Transfer-out' AS Indicator,
    IFNULL(COUNT(*), 0) AS TOTAL,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Child' AND PatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_0_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Child' AND PatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_0_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Adult' AND PatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_over_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Adult' AND PatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_over_14
FROM (
    SELECT 'Adult' as type, IF(main.Sex=0, 'Female', 'Male') as Sex FROM tblaimain main JOIN tblavpatientstatus s ON main.ClinicID = s.ClinicID WHERE s.Da BETWEEN @StartDate AND @EndDate AND s.Status = @transfer_out_code
    UNION ALL
    SELECT 'Child' as type, IF(main.Sex=0, 'Female', 'Male') as Sex FROM tblcimain main JOIN tblcvpatientstatus s ON main.ClinicID = s.ClinicID WHERE s.Da BETWEEN @StartDate AND @EndDate AND s.Status = @transfer_out_code
) AS PatientList

UNION ALL
-- Query for Indicator 9
SELECT
    '9. Active Pre-ART patients in this quarter' AS Indicator,
    0 AS TOTAL,
    0 AS Male_0_14,
    0 AS Female_0_14,
    0 AS Male_over_14,
    0 AS Female_over_14
    
UNION ALL
-- Indicator 10: Number of active ART patients in this quarter
SELECT
    '10. Active ART patients in this quarter' AS Indicator,
    IFNULL(COUNT(*), 0) AS TOTAL,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Child' AND PatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_0_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Child' AND PatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_0_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Adult' AND PatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_over_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Adult' AND PatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_over_14
FROM (
    SELECT 'Adult' as type, IF(main.Sex=0, 'Female', 'Male') as Sex FROM tblaimain main
    JOIN ( SELECT lv.ClinicID, v.DaApp FROM (SELECT ClinicID, MAX(DatVisit) AS LastVisitDate FROM tblavmain WHERE DatVisit <= @EndDate GROUP BY ClinicID) lv JOIN tblavmain v ON lv.ClinicID = v.ClinicID AND lv.LastVisitDate = v.DatVisit ) pla ON main.ClinicID = pla.ClinicID
    WHERE NOT EXISTS (SELECT 1 FROM tblavpatientstatus s WHERE s.ClinicID = main.ClinicID AND s.Da <= @EndDate AND s.Status IN (@dead_code, @transfer_out_code)) AND DATEDIFF(@EndDate, pla.DaApp) < 28
    UNION ALL
    SELECT 'Child' as type, IF(main.Sex=0, 'Female', 'Male') as Sex FROM tblcimain main
    JOIN ( SELECT lv.ClinicID, v.DaApp FROM (SELECT ClinicID, MAX(DatVisit) AS LastVisitDate FROM tblcvmain WHERE DatVisit <= @EndDate GROUP BY ClinicID) lv JOIN tblcvmain v ON lv.ClinicID = v.ClinicID AND lv.LastVisitDate = v.DatVisit ) pla ON main.ClinicID = pla.ClinicID
    WHERE NOT EXISTS (SELECT 1 FROM tblcvpatientstatus s WHERE s.ClinicID = main.ClinicID AND s.Da <= @EndDate AND s.Status IN (@dead_code, @transfer_out_code)) AND DATEDIFF(@EndDate, pla.DaApp) < 28
) AS PatientList

UNION ALL

-- Indicator 10.1: Eligible for MMD (Corrected)
SELECT
    '10.1. Eligible for MMD' AS Indicator,
    IFNULL(COUNT(*), 0) AS TOTAL,
    IFNULL(SUM(CASE WHEN FinalPatientList.type = 'Child' AND FinalPatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_0_14,
    IFNULL(SUM(CASE WHEN FinalPatientList.type = 'Child' AND FinalPatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_0_14,
    IFNULL(SUM(CASE WHEN FinalPatientList.type = 'Adult' AND FinalPatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_over_14,
    IFNULL(SUM(CASE WHEN FinalPatientList.type = 'Adult' AND FinalPatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_over_14
FROM (
    -- Adult Patients
    SELECT
        'Adult' as type,
        IF(i.Sex=0, 'Female', 'Male') as Sex
    FROM tblaimain i
    JOIN tblaart art ON i.ClinicID = art.ClinicID
    JOIN (
        SELECT lv.ClinicID, v.DaApp 
        FROM (SELECT ClinicID, MAX(DatVisit) AS LastVisitDate FROM tblavmain WHERE DatVisit <= @EndDate GROUP BY ClinicID) lv
        JOIN tblavmain v ON lv.ClinicID = v.ClinicID AND lv.LastVisitDate = v.DatVisit
    ) pla ON i.ClinicID = pla.ClinicID
    JOIN (
        -- Find the MOST RECENT viral load for each patient in the last 12 months
        SELECT t.ClinicID, CAST(t.HIVLoad AS UNSIGNED) as LastVLResult
        FROM tblpatienttest t
        INNER JOIN (
            SELECT ClinicID, MAX(Dat) as MaxDate
            FROM tblpatienttest
            WHERE Dat BETWEEN DATE_SUB(@EndDate, INTERVAL 12 MONTH) AND @EndDate 
              AND HIVLoad IS NOT NULL AND HIVLoad REGEXP '^[0-9]+$'
            GROUP BY ClinicID
        ) AS max_vl ON t.ClinicID = max_vl.ClinicID AND t.Dat = max_vl.MaxDate
    ) AS vl ON i.ClinicID = vl.ClinicID
    WHERE
        -- **THE FIX IS HERE**: Time on ART is now correctly set to >= 6 months
        TIMESTAMPDIFF(MONTH, art.DaArt, @EndDate) >= 6
        -- Condition 2: Must be virally suppressed
        AND vl.LastVLResult < @vl_suppression_threshold
        -- Condition 3: They are not more than 28 days late for their appointment
        AND DATEDIFF(@EndDate, pla.DaApp) < 28
        -- Condition 4: They do not have an official Dead or Transfer-out status
        AND NOT EXISTS (SELECT 1 FROM tblavpatientstatus s WHERE s.ClinicID = i.ClinicID AND s.Da <= @EndDate AND s.Status IN (@dead_code, @transfer_out_code))

    UNION ALL

    -- Child Patients
    SELECT
        'Child' as type,
        IF(i.Sex=0, 'Female', 'Male') as Sex
    FROM tblcimain i
    JOIN tblcart art ON i.ClinicID = art.ClinicID
    JOIN (
        SELECT lv.ClinicID, v.DaApp 
        FROM (SELECT ClinicID, MAX(DatVisit) AS LastVisitDate FROM tblcvmain WHERE DatVisit <= @EndDate GROUP BY ClinicID) lv
        JOIN tblcvmain v ON lv.ClinicID = v.ClinicID AND lv.LastVisitDate = v.DatVisit
    ) pla ON i.ClinicID = pla.ClinicID
    JOIN (
        -- Find the MOST RECENT viral load for each patient in the last 12 months
        SELECT t.ClinicID, CAST(t.HIVLoad AS UNSIGNED) as LastVLResult
        FROM tblpatienttest t
        INNER JOIN (
            SELECT ClinicID, MAX(Dat) as MaxDate
            FROM tblpatienttest
            WHERE Dat BETWEEN DATE_SUB(@EndDate, INTERVAL 12 MONTH) AND @EndDate 
              AND HIVLoad IS NOT NULL AND HIVLoad REGEXP '^[0-9]+$'
            GROUP BY ClinicID
        ) AS max_vl ON t.ClinicID = max_vl.ClinicID AND t.Dat = max_vl.MaxDate
    ) AS vl ON i.ClinicID = vl.ClinicID
    WHERE
        -- **THE FIX IS HERE**: Time on ART is now correctly set to >= 6 months
        TIMESTAMPDIFF(MONTH, art.DaArt, @EndDate) >= 6
        -- Condition 2: Must be virally suppressed
        AND vl.LastVLResult < @vl_suppression_threshold
        -- Condition 3: They are not more than 28 days late for their appointment
        AND DATEDIFF(@EndDate, pla.DaApp) < 28
        -- Condition 4: They do not have an official Dead or Transfer-out status
        AND NOT EXISTS (SELECT 1 FROM tblcvpatientstatus s WHERE s.ClinicID = i.ClinicID AND s.Da <= @EndDate AND s.Status IN (@dead_code, @transfer_out_code))

) AS FinalPatientList

UNION ALL
-- Indicator 10.2: Received MMD (Optimized)
SELECT
    '10.2. Received MMD' AS Indicator,
    IFNULL(COUNT(*), 0) AS TOTAL,
    IFNULL(SUM(CASE WHEN ActivePatients.type = 'Child' AND ActivePatients.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_0_14,
    IFNULL(SUM(CASE WHEN ActivePatients.type = 'Child' AND ActivePatients.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_0_14,
    IFNULL(SUM(CASE WHEN ActivePatients.type = 'Adult' AND ActivePatients.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_over_14,
    IFNULL(SUM(CASE WHEN ActivePatients.type = 'Adult' AND ActivePatients.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_over_14
FROM (
    -- Start with the confirmed list of active patients
    SELECT 'Adult' as type, main.ClinicID, IF(main.Sex=0, 'Female', 'Male') as Sex FROM tblaimain main
    JOIN ( SELECT lv.ClinicID, v.DaApp FROM (SELECT ClinicID, MAX(DatVisit) AS LastVisitDate FROM tblavmain WHERE DatVisit <= @EndDate GROUP BY ClinicID) lv JOIN tblavmain v ON lv.ClinicID = v.ClinicID AND lv.LastVisitDate = v.DatVisit ) pla ON main.ClinicID = pla.ClinicID
    WHERE NOT EXISTS (SELECT 1 FROM tblavpatientstatus s WHERE s.ClinicID = main.ClinicID AND s.Da <= @EndDate AND s.Status IN (@dead_code, @transfer_out_code)) AND DATEDIFF(@EndDate, pla.DaApp) < 28
    UNION ALL
    SELECT 'Child' as type, main.ClinicID, IF(main.Sex=0, 'Female', 'Male') as Sex FROM tblcimain main
    JOIN ( SELECT lv.ClinicID, v.DaApp FROM (SELECT ClinicID, MAX(DatVisit) AS LastVisitDate FROM tblcvmain WHERE DatVisit <= @EndDate GROUP BY ClinicID) lv JOIN tblcvmain v ON lv.ClinicID = v.ClinicID AND lv.LastVisitDate = v.DatVisit ) pla ON main.ClinicID = pla.ClinicID
    WHERE NOT EXISTS (SELECT 1 FROM tblcvpatientstatus s WHERE s.ClinicID = main.ClinicID AND s.Da <= @EndDate AND s.Status IN (@dead_code, @transfer_out_code)) AND DATEDIFF(@EndDate, pla.DaApp) < 28
) AS ActivePatients
-- This INNER JOIN is more efficient than "WHERE IN"
-- It joins the active patients with the list of those who received MMD this quarter.
INNER JOIN (
    -- Find the unique IDs of patients who received MMD
    SELECT DISTINCT v.ClinicID
    FROM tblavmain v JOIN tblavarvdrug d ON v.Vid = d.Vid
    WHERE v.DatVisit BETWEEN @StartDate AND @EndDate AND d.Quantity > @mmd_drug_quantity
    UNION -- Using UNION here is correct as we just need a unique list of ClinicIDs
    SELECT DISTINCT v.ClinicID
    FROM tblcvmain v JOIN tblcvarvdrug d ON v.Vid = d.Vid
    WHERE v.DatVisit BETWEEN @StartDate AND @EndDate AND d.Quantity > @mmd_drug_quantity
) AS MMD_Patients ON ActivePatients.ClinicID = MMD_Patients.ClinicID

UNION ALL

-- Indicator 10.3: Patients on TLD (Optimized)
SELECT
    '10.3. Patients on TLD' AS Indicator,
    IFNULL(COUNT(*), 0) AS TOTAL,
    IFNULL(SUM(CASE WHEN FinalPatientList.type = 'Child' AND FinalPatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_0_14,
    IFNULL(SUM(CASE WHEN FinalPatientList.type = 'Child' AND FinalPatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_0_14,
    IFNULL(SUM(CASE WHEN FinalPatientList.type = 'Adult' AND FinalPatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_over_14,
    IFNULL(SUM(CASE WHEN FinalPatientList.type = 'Adult' AND FinalPatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_over_14
FROM (
    -- Adult Patients
    SELECT
        'Adult' as type,
        IF(i.Sex=0, 'Female', 'Male') as Sex
    FROM tblaimain i
    -- Find the last visit for each adult
    JOIN (
        SELECT v.ClinicID, v.DaApp, v.Vid
        FROM tblavmain v
        INNER JOIN (
            SELECT ClinicID, MAX(DatVisit) as LastVisitDate FROM tblavmain WHERE DatVisit <= @EndDate GROUP BY ClinicID
        ) last_v ON v.ClinicID = last_v.ClinicID AND v.DatVisit = last_v.LastVisitDate
    ) AS last_visit_info ON i.ClinicID = last_visit_info.ClinicID
    -- Join to the drug regimen for that specific last visit
    JOIN (
        SELECT Vid, GROUP_CONCAT(DrugName ORDER BY DrugName SEPARATOR ' + ') as regimen
        FROM tblavarvdrug
        WHERE Status <> 1 AND Status <> -1 GROUP BY Vid
    ) AS regimen_info ON last_visit_info.Vid = regimen_info.Vid
    WHERE
        -- Condition 1: The regimen for the last visit must be TLD
        regimen_info.regimen = @tld_regimen_formula
        -- Condition 2: They are not more than 28 days late for their appointment
        AND DATEDIFF(@EndDate, last_visit_info.DaApp) < 28
        -- Condition 3: They do not have an official Dead or Transfer-out status
        AND NOT EXISTS (SELECT 1 FROM tblavpatientstatus s WHERE s.ClinicID = i.ClinicID AND s.Da <= @EndDate AND s.Status IN (@dead_code, @transfer_out_code))

    UNION ALL

    -- Child Patients
    SELECT
        'Child' as type,
        IF(i.Sex=0, 'Female', 'Male') as Sex
    FROM tblcimain i
    -- Find the last visit for each child
    JOIN (
        SELECT v.ClinicID, v.DaApp, v.Vid
        FROM tblcvmain v
        INNER JOIN (
            SELECT ClinicID, MAX(DatVisit) as LastVisitDate FROM tblcvmain WHERE DatVisit <= @EndDate GROUP BY ClinicID
        ) last_v ON v.ClinicID = last_v.ClinicID AND v.DatVisit = last_v.LastVisitDate
    ) AS last_visit_info ON i.ClinicID = last_visit_info.ClinicID
    -- Join to the drug regimen for that specific last visit
    JOIN (
        SELECT Vid, GROUP_CONCAT(DrugName ORDER BY DrugName SEPARATOR ' + ') as regimen
        FROM tblcvarvdrug
        WHERE Status <> 1 AND Status <> -1 GROUP BY Vid
    ) AS regimen_info ON last_visit_info.Vid = regimen_info.Vid
    WHERE
        -- Condition 1: The regimen for the last visit must be TLD
        regimen_info.regimen = @tld_regimen_formula
        -- Condition 2: They are not more than 28 days late for their appointment
        AND DATEDIFF(@EndDate, last_visit_info.DaApp) < 28
        -- Condition 3: They do not have an official Dead or Transfer-out status
        AND NOT EXISTS (SELECT 1 FROM tblcvpatientstatus s WHERE s.ClinicID = i.ClinicID AND s.Da <= @EndDate AND s.Status IN (@dead_code, @transfer_out_code))

) AS FinalPatientList
UNION ALL

-- Indicator 10.4: Newly Patients Start TPT
SELECT
    '10.4. Newly Patients Start TPT' AS Indicator,
    IFNULL(COUNT(*), 0) AS TOTAL,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Child' AND PatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_0_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Child' AND PatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_0_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Adult' AND PatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_over_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Adult' AND PatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_over_14
FROM (
    -- Adults starting specific TPT drugs in the quarter
    SELECT 'Adult' as type, IF(p.Sex=0, 'Female', 'Male') as Sex
    FROM tblaimain p
    JOIN tblavmain v ON p.ClinicID = v.ClinicID
    JOIN (
        -- Combine the two tables that store TPT-related drugs for adults
        SELECT Vid, DrugName, Status FROM tblavoidrug
        UNION ALL
        SELECT Vid, DrugName, Status FROM tblavtptdrug
    ) d ON v.Vid = d.Vid
    WHERE d.Status = 0 -- A status of 0 indicates a drug was started
      AND v.DatVisit BETWEEN @StartDate AND @EndDate -- And the start date must be within the reporting period
      AND (d.DrugName LIKE '%Isoniazid%' OR d.DrugName LIKE '%6H%' OR d.DrugName LIKE '%3HP%')
    UNION ALL
    -- Children starting specific TPT drugs in the quarter
    SELECT 'Child' as type, IF(p.Sex=0, 'Female', 'Male') as Sex
    FROM tblcimain p
    JOIN tblcvmain v ON p.ClinicID = v.ClinicID
    JOIN (
        -- Combine the two tables that store TPT-related drugs for children
        SELECT Vid, DrugName, Status FROM tblcvoidrug
        UNION ALL
        SELECT Vid, DrugName, Status FROM tblcvtbdrug
    ) d ON v.Vid = d.Vid
    WHERE d.Status = 0 -- A status of 0 indicates a drug was started
      AND v.DatVisit BETWEEN @StartDate AND @EndDate -- And the start date must be within the reporting period
      AND (d.DrugName LIKE '%Isoniazid%' OR d.DrugName LIKE '%6H%' OR d.DrugName LIKE '%3HP%')
) as PatientList

UNION ALL

-- Indicator 10.5: Number of patients completed TPT (All-Time among Active)
SELECT
    '10.5. Patients completed TPT' AS Indicator,
    IFNULL(COUNT(*), 0) AS TOTAL,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Child' AND PatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_0_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Child' AND PatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_0_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Adult' AND PatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_over_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Adult' AND PatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_over_14
FROM (
    -- Start with the confirmed list of active patients
    SELECT 'Adult' as type, main.ClinicID, IF(main.Sex=0, 'Female', 'Male') as Sex FROM tblaimain main
    JOIN ( SELECT lv.ClinicID, v.DaApp FROM (SELECT ClinicID, MAX(DatVisit) AS LastVisitDate FROM tblavmain WHERE DatVisit <= @EndDate GROUP BY ClinicID) lv JOIN tblavmain v ON lv.ClinicID = v.ClinicID AND lv.LastVisitDate = v.DatVisit ) pla ON main.ClinicID = pla.ClinicID
    WHERE NOT EXISTS (SELECT 1 FROM tblavpatientstatus s WHERE s.ClinicID = main.ClinicID AND s.Da <= @EndDate AND s.Status IN (@dead_code, @transfer_out_code)) AND DATEDIFF(@EndDate, pla.DaApp) < 28
    UNION ALL
    SELECT 'Child' as type, main.ClinicID, IF(main.Sex=0, 'Female', 'Male') as Sex FROM tblcimain main
    JOIN ( SELECT lv.ClinicID, v.DaApp FROM (SELECT ClinicID, MAX(DatVisit) AS LastVisitDate FROM tblcvmain WHERE DatVisit <= @EndDate GROUP BY ClinicID) lv JOIN tblcvmain v ON lv.ClinicID = v.ClinicID AND lv.LastVisitDate = v.DatVisit ) pla ON main.ClinicID = pla.ClinicID
    WHERE NOT EXISTS (SELECT 1 FROM tblcvpatientstatus s WHERE s.ClinicID = main.ClinicID AND s.Da <= @EndDate AND s.Status IN (@dead_code, @transfer_out_code)) AND DATEDIFF(@EndDate, pla.DaApp) < 28
) AS PatientList
JOIN (
    -- This subquery calculates TPT status for all patients based on the user's provided script logic
    SELECT ClinicID, Statustpt FROM (
        SELECT distinct *,if(left(drugstart,1)=3,if(Numm>=2.500,"Completed",if(Numm<2.500,"Not Completed","Ongoing")),if(Numm>=5.500,"Completed",if(Numm<5.500,"Not Completed","Ongoing"))) as Statustpt
        FROM (
            -- Adult TPT Episode Calculation
            SELECT pst.clinicid, pst.datestart, pst.drugname as drugstart, psto.datestop, datediff(psto.datestop,pst.datestart)/30  as Numm 
            FROM (
                SELECT dl.clinicid, dl.datestart, dl.drugname FROM (SELECT v.clinicid,v.DatVisit as datestart, ltpt.drugname FROM (SELECT vid, substring(replace(DrugName,"B6-",""),1,(if(locate("-",replace(DrugName,"B6-",""))=0,length(replace(DrugName,"B6-","")),locate("-",replace(DrugName,"B6-",""))-1))) as drugname  FROM (SELECT vid,da, group_concat(DrugName order by DrugName separator '-') as drugname FROM (select DrugName, Status, Da,  Vid from tblavoidrug union select DrugName, Status, Da,  Vid from tblavtptdrug ) ll WHERE Status=0 GROUP BY vid ) ll where drugname!="B6") ltpt INNER JOIN tblavmain v on v.vid=ltpt.vid) dl
                INNER JOIN (SELECT clinicid,min(datestart) as Datestart FROM (SELECT v.clinicid,v.DatVisit as datestart,ltpt.drugname FROM (SELECT vid, substring(replace(DrugName,"B6-",""),1,(if(locate("-",replace(DrugName,"B6-",""))=0,length(replace(DrugName,"B6-","")),locate("-",replace(DrugName,"B6-",""))-1))) as drugname  FROM (SELECT vid,da, group_concat(DrugName order by DrugName separator '-') as drugname FROM (select DrugName, Status, Da,  Vid from tblavoidrug union select DrugName, Status, Da,  Vid from tblavtptdrug ) ll WHERE Status=0 GROUP BY vid ) ll where drugname!="B6") ltpt INNER JOIN tblavmain v on v.vid=ltpt.vid) md GROUP BY clinicid) md ON md.clinicid=dl.clinicid AND md.Datestart=dl.datestart ) pst
            LEFT JOIN ( SELECT dl.clinicid, dl.datestop, dl.drugname FROM (SELECT v.clinicid, ltpt.da as datestop,ltpt.drugname FROM (SELECT vid, da, substring(replace(DrugName,"B6-",""),1,(if(locate("-",replace(DrugName,"B6-",""))=0,length(replace(DrugName,"B6-","")),locate("-",replace(DrugName,"B6-",""))-1))) as drugname  FROM (SELECT vid,da, group_concat(DrugName order by DrugName separator '-') as drugname FROM (select DrugName, Status, Da,  Vid from tblavoidrug union select DrugName, Status, Da,  Vid from tblavtptdrug ) ll WHERE Status=1 GROUP BY vid ) ll where drugname!="B6") ltpt INNER JOIN tblavmain v on v.vid=ltpt.vid) dl
            INNER JOIN (SELECT clinicid,max(datestop) as Datestop FROM (SELECT v.clinicid,ltpt.da as datestop,ltpt.drugname FROM (SELECT vid, da, substring(replace(DrugName,"B6-",""),1,(if(locate("-",replace(DrugName,"B6-",""))=0,length(replace(DrugName,"B6-","")),locate("-",replace(DrugName,"B6-",""))-1))) as drugname  FROM (SELECT vid,da, group_concat(DrugName order by DrugName separator '-') as drugname FROM (select DrugName, Status, Da,  Vid from tblavoidrug union select DrugName, Status, Da,  Vid from tblavtptdrug ) ll WHERE Status=1 GROUP BY vid ) ll where drugname!="B6") ltpt INNER JOIN tblavmain v on v.vid=ltpt.vid) md GROUP BY clinicid) md ON md.clinicid=dl.clinicid AND md.datestop=dl.datestop ) psto ON psto.clinicid=pst.clinicid
        ) nn
        UNION ALL
        SELECT distinct *,if(left(drugstart,1)=3,if(Numm>=2.500,"Completed",if(Numm<2.500,"Not Completed","Ongoing")),if(Numm>=5.500,"Completed",if(Numm<5.500,"Not Completed","Ongoing"))) as Statustpt FROM (
            SELECT pst.clinicid, pst.datestart, pst.drugname as drugstart, psto.datestop, datediff(psto.datestop,pst.datestart)/30  as Numm  FROM (
                SELECT dl.clinicid, dl.datestart, dl.drugname FROM (SELECT v.clinicid,v.DatVisit as datestart,ltpt.drugname FROM (SELECT vid, substring(replace(DrugName,"B6-",""),1,(if(locate("-",replace(DrugName,"B6-",""))=0,length(replace(DrugName,"B6-","")),locate("-",replace(DrugName,"B6-",""))-1))) as drugname  FROM (SELECT vid,da, group_concat(DrugName order by DrugName separator '-') as drugname FROM (select DrugName, Status, Da,  Vid from tblcvoidrug union select DrugName, Status, Da,  Vid from tblcvtbdrug ) ll WHERE Status=0 GROUP BY vid ) ll where drugname!="B6") ltpt INNER JOIN tblcvmain v on v.vid=ltpt.vid) dl
                INNER JOIN (SELECT clinicid,min(datestart) as Datestart FROM (SELECT v.clinicid,v.DatVisit as datestart,ltpt.drugname FROM (SELECT vid, substring(replace(DrugName,"B6-",""),1,(if(locate("-",replace(DrugName,"B6-",""))=0,length(replace(DrugName,"B6-","")),locate("-",replace(DrugName,"B6-",""))-1))) as drugname  FROM (SELECT vid,da, group_concat(DrugName order by DrugName separator '-') as drugname FROM (select DrugName, Status, Da,  Vid from tblcvoidrug union select DrugName, Status, Da,  Vid from tblcvtbdrug ) ll WHERE Status=0 GROUP BY vid ) ll where drugname!="B6") ltpt INNER JOIN tblcvmain v on v.vid=ltpt.vid) md GROUP BY clinicid) md ON md.clinicid=dl.clinicid AND md.Datestart=dl.datestart
            ) pst
            LEFT JOIN ( SELECT dl.clinicid, dl.datestop, dl.drugname FROM (SELECT v.clinicid,ltpt.da as datestop,ltpt.drugname FROM (SELECT vid, da, substring(replace(DrugName,"B6-",""),1,(if(locate("-",replace(DrugName,"B6-",""))=0,length(replace(DrugName,"B6-","")),locate("-",replace(DrugName,"B6-",""))-1))) as drugname  FROM (SELECT vid,da, group_concat(DrugName order by DrugName separator '-') as drugname FROM (select DrugName, Status, Da,  Vid from tblcvoidrug union select DrugName, Status, Da,  Vid from tblcvtbdrug ) ll WHERE Status=1 GROUP BY vid ) ll where drugname!="B6") ltpt INNER JOIN tblcvmain v on v.vid=ltpt.vid) dl
            INNER JOIN (SELECT clinicid,max(datestop) as Datestop FROM (SELECT v.clinicid,ltpt.da as datestop,ltpt.drugname FROM (SELECT vid, da, substring(replace(DrugName,"B6-",""),1,(if(locate("-",replace(DrugName,"B6-",""))=0,length(replace(DrugName,"B6-","")),locate("-",replace(DrugName,"B6-",""))-1))) as drugname  FROM (SELECT vid,da, group_concat(DrugName order by DrugName separator '-') as drugname FROM (select DrugName, Status, Da,  Vid from tblcvoidrug union select DrugName, Status, Da,  Vid from tblcvtbdrug ) ll WHERE Status=1 GROUP BY vid ) ll where drugname!="B6") ltpt INNER JOIN tblcvmain v on v.vid=ltpt.vid) md GROUP BY clinicid) md ON md.clinicid=dl.clinicID AND md.datestop=dl.datestop ) psto ON psto.clinicid=pst.clinicid
        ) nn
    ) TPT_Analysis
) TPT ON PatientList.ClinicID = TPT.ClinicID
WHERE TPT.Statustpt = 'Completed'

UNION ALL

-- Indicator 10.6: Eligible for Viral Load test
SELECT
    '10.6. Eligible for VL test' AS Indicator,
    IFNULL(COUNT(*), 0) AS TOTAL,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Child' AND PatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_0_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Child' AND PatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_0_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Adult' AND PatientList.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_over_14,
    IFNULL(SUM(CASE WHEN PatientList.type = 'Adult' AND PatientList.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_over_14
FROM (
    -- Start with the list of active patients and join to their VL data
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
    -- This is the implementation of the 4 eligibility rules from your script
    (PatientList.LastVLLoad IS NULL AND TIMESTAMPDIFF(MONTH, PatientList.DaArt, @EndDate) >= 5)
    OR (PatientList.LastVLLoad >= 40 AND TIMESTAMPDIFF(MONTH, PatientList.LastVLDate, @EndDate) > 4)
    OR (PatientList.LastVLLoad < 40 AND TIMESTAMPDIFF(MONTH, PatientList.LastVLDate, @EndDate) >= 10)
    OR (PatientList.LastVLLoad < 40 AND TIMESTAMPDIFF(MONTH, PatientList.DaArt, PatientList.LastVLDate) BETWEEN 5 AND 7 AND TIMESTAMPDIFF(MONTH, PatientList.LastVLDate, @EndDate) BETWEEN 5 AND 7)

UNION ALL


-- Indicator 10.7: Receive VL test in last 12 months
SELECT
    '10.7. Received VL test in last 12 months' AS Indicator,
    IFNULL(COUNT(*), 0) AS TOTAL,
    IFNULL(SUM(CASE WHEN ActivePatients.type = 'Child' AND ActivePatients.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_0_14,
    IFNULL(SUM(CASE WHEN ActivePatients.type = 'Child' AND ActivePatients.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_0_14,
    IFNULL(SUM(CASE WHEN ActivePatients.type = 'Adult' AND ActivePatients.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_over_14,
    IFNULL(SUM(CASE WHEN ActivePatients.type = 'Adult' AND ActivePatients.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_over_14
FROM 
    (
        -- Start with the confirmed list of active patients
        SELECT 'Adult' as type, main.ClinicID, IF(main.Sex=0, 'Female', 'Male') as Sex FROM tblaimain main
        JOIN ( SELECT lv.ClinicID, v.DaApp FROM (SELECT ClinicID, MAX(DatVisit) AS LastVisitDate FROM tblavmain WHERE DatVisit <= @EndDate GROUP BY ClinicID) lv JOIN tblavmain v ON lv.ClinicID = v.ClinicID AND lv.LastVisitDate = v.DatVisit ) pla ON main.ClinicID = pla.ClinicID
        WHERE NOT EXISTS (SELECT 1 FROM tblavpatientstatus s WHERE s.ClinicID = main.ClinicID AND s.Da <= @EndDate AND s.Status IN (@dead_code, @transfer_out_code)) AND DATEDIFF(@EndDate, pla.DaApp) < 28
        UNION ALL
        SELECT 'Child' as type, main.ClinicID, IF(main.Sex=0, 'Female', 'Male') as Sex FROM tblcimain main
        JOIN ( SELECT lv.ClinicID, v.DaApp FROM (SELECT ClinicID, MAX(DatVisit) AS LastVisitDate FROM tblcvmain WHERE DatVisit <= @EndDate GROUP BY ClinicID) lv JOIN tblcvmain v ON lv.ClinicID = v.ClinicID AND lv.LastVisitDate = v.DatVisit ) pla ON main.ClinicID = pla.ClinicID
        WHERE NOT EXISTS (SELECT 1 FROM tblcvpatientstatus s WHERE s.ClinicID = main.ClinicID AND s.Da <= @EndDate AND s.Status IN (@dead_code, @transfer_out_code)) AND DATEDIFF(@EndDate, pla.DaApp) < 28
    ) AS ActivePatients
WHERE
    -- Check if a test exists for this patient within the last 12 months
    ActivePatients.ClinicID IN (
        SELECT DISTINCT ClinicID FROM tblpatienttest
        WHERE Dat BETWEEN DATE_SUB(@EndDate, INTERVAL 12 MONTH) AND @EndDate AND HIVLoad IS NOT NULL
    )

UNION ALL
-- SCRIPT FOR: Indicator 10.8: Last VL is suppressed (< 1000)
SELECT
    '10.8. Last VL is suppressed' AS Indicator,
    IFNULL(COUNT(*), 0) AS TOTAL,
    IFNULL(SUM(CASE WHEN ActivePatients.type = 'Child' AND ActivePatients.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_0_14,
    IFNULL(SUM(CASE WHEN ActivePatients.type = 'Child' AND ActivePatients.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_0_14,
    IFNULL(SUM(CASE WHEN ActivePatients.type = 'Adult' AND ActivePatients.Sex = 'Male' THEN 1 ELSE 0 END), 0) AS Male_over_14,
    IFNULL(SUM(CASE WHEN ActivePatients.type = 'Adult' AND ActivePatients.Sex = 'Female' THEN 1 ELSE 0 END), 0) AS Female_over_14
FROM 
    (
        -- Start with the confirmed list of active patients
        SELECT 'Adult' as type, main.ClinicID, IF(main.Sex=0, 'Female', 'Male') as Sex FROM tblaimain main
        JOIN ( SELECT lv.ClinicID, v.DaApp FROM (SELECT ClinicID, MAX(DatVisit) AS LastVisitDate FROM tblavmain WHERE DatVisit <= @EndDate GROUP BY ClinicID) lv JOIN tblavmain v ON lv.ClinicID = v.ClinicID AND lv.LastVisitDate = v.DatVisit ) pla ON main.ClinicID = pla.ClinicID
        WHERE NOT EXISTS (SELECT 1 FROM tblavpatientstatus s WHERE s.ClinicID = main.ClinicID AND s.Da <= @EndDate AND s.Status IN (@dead_code, @transfer_out_code)) AND DATEDIFF(@EndDate, pla.DaApp) < 28
        UNION ALL
        SELECT 'Child' as type, main.ClinicID, IF(main.Sex=0, 'Female', 'Male') as Sex FROM tblcimain main
        JOIN ( SELECT lv.ClinicID, v.DaApp FROM (SELECT ClinicID, MAX(DatVisit) AS LastVisitDate FROM tblcvmain WHERE DatVisit <= @EndDate GROUP BY ClinicID) lv JOIN tblcvmain v ON lv.ClinicID = v.ClinicID AND lv.LastVisitDate = v.DatVisit ) pla ON main.ClinicID = pla.ClinicID
        WHERE NOT EXISTS (SELECT 1 FROM tblcvpatientstatus s WHERE s.ClinicID = main.ClinicID AND s.Da <= @EndDate AND s.Status IN (@dead_code, @transfer_out_code)) AND DATEDIFF(@EndDate, pla.DaApp) < 28
    ) AS ActivePatients
JOIN 
    (
        -- Join to their latest VL test result within the last 12 months
        SELECT t.ClinicID, t.HIVLoad
        FROM tblpatienttest t
        INNER JOIN (
            -- Find the date of the last test for each patient WITHIN THE LAST 12 MONTHS
            SELECT ClinicID, MAX(Dat) as LastTestDate FROM tblpatienttest
            -- **THE FIX IS HERE**: The WHERE clause now limits the search to the last 12 months
            WHERE Dat BETWEEN DATE_SUB(@EndDate, INTERVAL 12 MONTH) AND @EndDate
            AND HIVLoad IS NOT NULL AND HIVLoad REGEXP '^[0-9]+$' 
            GROUP BY ClinicID
        ) last_test ON t.ClinicID = last_test.ClinicID AND t.Dat = last_test.LastTestDate
    ) AS vl_results ON ActivePatients.ClinicID = vl_results.ClinicID
WHERE
    -- CAST the HIVLoad text to a number before comparing
    CAST(vl_results.HIVLoad AS UNSIGNED) < 1000;









