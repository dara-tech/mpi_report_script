-- ===================================================================
-- SCRIPT SETUP
-- ===================================================================
-- Set the reporting period dates from the PDF report
SET @StartDate = '2025-01-01';
SET @EndDate = '2025-03-31';

-- Set codes for specific fields
SET @transfer_in_code = 1;

-- ===================================================================
-- SCRIPT BODY
-- ===================================================================

SELECT
    -- ROW_NUMBER() OVER () AS No,
    PatientList.ClinicID,
    PatientList.type,
    PatientList.Sex
FROM (
    -- Adult transfer-in patients
    SELECT
        ClinicID,
        'Adult' as type,
        IF(Sex=0, 'Female', 'Male') as Sex
    FROM tblaimain
    WHERE DafirstVisit BETWEEN @StartDate AND @EndDate AND OffIn = @transfer_in_code

    UNION ALL

    -- Child transfer-in patients
    SELECT
        ClinicID,
        'Child' as type,
        IF(Sex=0, 'Female', 'Male') as Sex
    FROM tblcimain
    WHERE DafirstVisit BETWEEN @StartDate AND @EndDate AND OffIn = @transfer_in_code
) as PatientList;