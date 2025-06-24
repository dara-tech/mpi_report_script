-- ===================================================================
-- SCRIPT SETUP
-- ===================================================================
-- Set the reporting period dates from the PDF report
SET @StartDate = '2025-01-01';
SET @EndDate = '2025-03-31';

-- ===================================================================
-- SCRIPT BODY
-- ===================================================================
SELECT
    -- ROW_NUMBER() OVER(ORDER BY PatientList.ClinicID, PatientList.StartDate) AS No,
    PatientList.ClinicID,
    PatientList.type,
    PatientList.Sex,
    PatientList.TPT_Drug_Started,
    PatientList.StartDate
FROM (
    -- Adults starting specific TPT drugs in the quarter
    SELECT
        p.ClinicID,
        'Adult' as type,
        IF(p.Sex=0, 'Female', 'Male') as Sex,
        d.DrugName AS TPT_Drug_Started,
        v.DatVisit AS StartDate
    FROM tblaimain p
    JOIN tblavmain v ON p.ClinicID = v.ClinicID
    JOIN (
        -- Combine the two tables that store TPT-related drugs for adults
        SELECT Vid, DrugName, Status FROM tblavoidrug
        UNION ALL
        SELECT Vid, DrugName, Status FROM tblavtptdrug
    ) d ON v.Vid = d.Vid
    WHERE
        d.Status = 0 -- A status of 0 indicates a drug was started
        AND v.DatVisit BETWEEN @StartDate AND @EndDate -- And the start date must be within the reporting period
        -- This new filter checks for the specific TPT drugs you listed
        AND (d.DrugName LIKE '%Isoniazid%' OR d.DrugName LIKE '%6H%' OR d.DrugName LIKE '%3HP%')

    UNION ALL

    -- Children starting specific TPT drugs in the quarter
    SELECT
        p.ClinicID,
        'Child' as type,
        IF(p.Sex=0, 'Female', 'Male') as Sex,
        d.DrugName AS TPT_Drug_Started,
        v.DatVisit AS StartDate
    FROM tblcimain p
    JOIN tblcvmain v ON p.ClinicID = v.ClinicID
    JOIN (
        -- Combine the two tables that store TPT-related drugs for children
        SELECT Vid, DrugName, Status FROM tblcvoidrug
        UNION ALL
        SELECT Vid, DrugName, Status FROM tblcvtbdrug
    ) d ON v.Vid = d.Vid
    WHERE
        d.Status = 0 -- A status of 0 indicates a drug was started
        AND v.DatVisit BETWEEN @StartDate AND @EndDate -- And the start date must be within the reporting period
        -- This new filter checks for the specific TPT drugs you listed
        AND (d.DrugName LIKE '%Isoniazid%' OR d.DrugName LIKE '%6H%' OR d.DrugName LIKE '%3HP%')
) as PatientList;