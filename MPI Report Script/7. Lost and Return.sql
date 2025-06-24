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
    -- ROW_NUMBER() OVER (ORDER BY p.ClinicID) AS No,
    p.Artnum,
    p.ClinicID,
    'Adult' AS type,
    IF(p.Sex=0, 'Female', 'Male') AS Sex,
    MIN(v.DatVisit) AS ReturnVisitDate,
    p.TypeofReturn AS ReturnCode,
    art.DaArt AS ART_Start_Date
FROM
    tblaimain p
JOIN
    tblavmain v ON p.ClinicID = v.ClinicID
JOIN
    tblaart art ON p.ClinicID = art.ClinicID
WHERE
    v.DatVisit BETWEEN @StartDate AND @EndDate
    AND p.TypeofReturn IS NOT NULL AND p.TypeofReturn <> -1
    -- This new condition ensures the patient started ART BEFORE they returned
    AND art.DaArt < v.DatVisit
GROUP BY
    p.ClinicID,
    p.Artnum,
    p.Sex,
    p.TypeofReturn,
    art.DaArt;