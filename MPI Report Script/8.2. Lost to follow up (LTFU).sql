-- ===================================================================
-- SCRIPT SETUP
-- ===================================================================
-- Set the reporting period dates from the PDF report
SET @StartDate = '2025-01-01';
SET @EndDate = '2025-03-31';

-- Set the patient status codes based on the data dictionary
SET @lost_code = 0;

-- ===================================================================
-- SCRIPT BODY
-- ===================================================================

SELECT
    -- ROW_NUMBER() OVER () AS No,
    PatientList.ClinicID,
    PatientList.type,
    PatientList.Sex,
    PatientList.StatusDate
FROM (
    -- Adult patients recorded as LTFU in the period
    SELECT
        main.ClinicID,
        'Adult' as type,
        IF(main.Sex=0, 'Female', 'Male') as Sex,
        s.Da as StatusDate
    FROM tblaimain main
    JOIN tblavpatientstatus s ON main.ClinicID = s.ClinicID
    WHERE s.Da BETWEEN @StartDate AND @EndDate AND s.Status = @lost_code

    UNION ALL

    -- Child patients recorded as LTFU in the period
    SELECT
        main.ClinicID,
        'Child' as type,
        IF(main.Sex=0, 'Female', 'Male') as Sex,
        s.Da as StatusDate
    FROM tblcimain main
    JOIN tblcvpatientstatus s ON main.ClinicID = s.ClinicID
    WHERE s.Da BETWEEN @StartDate AND @EndDate AND s.Status = @lost_code
) AS PatientList;