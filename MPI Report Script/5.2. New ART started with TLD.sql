-- ===================================================================
-- SCRIPT SETUP
-- ===================================================================
-- Set the reporting period dates from the PDF report
SET @StartDate = '2025-01-01';
SET @EndDate = '2025-03-31';

-- Set codes for specific fields based on schema and user feedback
SET @tld_regimen_formula = '3TC + DTG + TDF';

-- ===================================================================
-- SCRIPT BODY
-- ===================================================================

SELECT
    -- ROW_NUMBER() OVER () AS No,
    PatientList.ClinicID,
    PatientList.type,
    PatientList.Sex,
    PatientList.regimen
FROM (
    -- Adults starting ART with TLD regimen
    SELECT
        p.ClinicID,
        'Adult' as type,
        IF(p.Sex=0, 'Female', 'Male') as Sex,
        rg.regimen
    FROM tblaimain p
    JOIN tblaart art ON p.ClinicID = art.ClinicID
    JOIN tblavmain v ON p.ClinicID = v.ClinicID AND v.DatVisit = art.DaArt
    JOIN (
        SELECT Vid, GROUP_CONCAT(DrugName ORDER BY DrugName SEPARATOR ' + ') as regimen
        FROM tblavarvdrug
        WHERE Status <> 1 AND Status <> -1
        GROUP BY Vid
    ) rg ON v.Vid = rg.Vid
    WHERE art.DaArt BETWEEN @StartDate AND @EndDate AND rg.regimen = @tld_regimen_formula

    UNION ALL

    -- Children starting ART with TLD regimen
    SELECT
        p.ClinicID,
        'Child' as type,
        IF(p.Sex=0, 'Female', 'Male') as Sex,
        rg.regimen
    FROM tblcimain p
    JOIN tblcart art ON p.ClinicID = art.ClinicID
    JOIN tblcvmain v ON p.ClinicID = v.ClinicID AND v.DatVisit = art.DaArt
    JOIN (
        SELECT Vid, GROUP_CONCAT(DrugName ORDER BY DrugName SEPARATOR ' + ') as regimen
        FROM tblcvarvdrug
        WHERE Status <> 1 AND Status <> -1
        GROUP BY Vid
    ) rg ON v.Vid = rg.Vid
    WHERE art.DaArt BETWEEN @StartDate AND @EndDate AND rg.regimen = @tld_regimen_formula
) AS PatientList;