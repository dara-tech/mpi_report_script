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
    -- Adults: Must have ART start date in quarter, NOT be a transfer-in, AND NOT be a lost-return patient
    SELECT p.ClinicID, 'Adult' as type, IF(p.Sex=0, "Female", "Male") as Sex
    FROM tblaimain p
    JOIN tblaart art ON p.ClinicID = art.ClinicID
    JOIN tblavmain v ON p.ClinicID = v.ClinicID AND v.DatVisit = art.DaArt
    WHERE
        art.DaArt BETWEEN @StartDate AND @EndDate
        AND (p.OffIn IS NULL OR p.OffIn <> @transfer_in_code)
        AND (p.TypeofReturn IS NULL OR p.TypeofReturn = -1)

    UNION ALL

    -- Children: Must have ART start date in quarter AND NOT be a transfer-in
    SELECT p.ClinicID, 'Child' as type, IF(p.Sex=0, "Female", "Male") as Sex
    FROM tblcimain p
    JOIN tblcart art ON p.ClinicID = art.ClinicID
    JOIN tblcvmain v ON p.ClinicID = v.ClinicID AND v.DatVisit = art.DaArt
    WHERE
        art.DaArt BETWEEN @StartDate AND @EndDate
        AND (p.OffIn IS NULL OR p.OffIn <> @transfer_in_code)
) AS PatientList;