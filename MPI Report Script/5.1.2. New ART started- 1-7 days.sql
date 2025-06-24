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
    -- ROW_NUMBER() OVER () AS No,
    PatientList.ClinicID,
    PatientList.type,
    PatientList.Sex,
    PatientList.DafirstVisit,
    PatientList.DaArt,
    PatientList.DaysToStart
FROM (
    -- Adults starting ART 1-7 days after their first visit
    SELECT
        p.ClinicID,
        'Adult' as type,
        IF(p.Sex=0, "Female", "Male") as Sex,
        p.DafirstVisit,
        art.DaArt,
        DATEDIFF(art.DaArt, p.DafirstVisit) AS DaysToStart
    FROM tblaimain p
    JOIN tblaart art ON p.ClinicID = art.ClinicID
    WHERE art.DaArt BETWEEN @StartDate AND @EndDate
      AND DATEDIFF(art.DaArt, p.DafirstVisit) BETWEEN 1 AND 7 -- <<< THIS LINE IS NOW CORRECTED
      AND (p.TypeofReturn IS NULL OR p.TypeofReturn = -1)

    UNION ALL

    -- Children starting ART 1-7 days after their first visit
    SELECT
        p.ClinicID,
        'Child' as type,
        IF(p.Sex=0, "Female", "Male") as Sex,
        p.DafirstVisit,
        art.DaArt,
        DATEDIFF(art.DaArt, p.DafirstVisit) AS DaysToStart
    FROM tblcimain p
    JOIN tblcart art ON p.ClinicID = art.ClinicID
    WHERE art.DaArt BETWEEN @StartDate AND @EndDate
      AND DATEDIFF(art.DaArt, p.DafirstVisit) BETWEEN 1 AND 7
) as PatientList;