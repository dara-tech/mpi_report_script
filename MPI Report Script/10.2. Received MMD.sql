-- ===================================================================
-- SCRIPT SETUP
-- ===================================================================
-- Set the reporting period dates
SET @StartDate = '2025-01-01';
SET @EndDate = '2025-03-31';

-- Set the patient status codes
SET @dead_code = 1;
SET @transfer_out_code = 3;

-- ===================================================================
-- DEBUGGING SCRIPT BODY (Using ARTnum from Visit)
-- ===================================================================
SELECT
    ActivePatients.ClinicID,
    MMD_Visits.Artnum, -- Using ARTnum from the MMD_Visits subquery
    ActivePatients.type,
    ActivePatients.Sex,
    MMD_Visits.DispensingDate,
    MMD_Visits.RegimenFormula,
    MMD_Visits.Quantities,
    MMD_Visits.MaxQuantity,
    ROUND(MMD_Visits.MaxQuantity / 30, 1) AS Estimated_Months_Supply 
FROM
    (
        -- Get the full list of all active patients
        SELECT main.ClinicID, 'Adult' as type, IF(main.Sex=0, 'Female', 'Male') as Sex FROM tblaimain main
        JOIN ( SELECT lv.ClinicID, v.DaApp FROM (SELECT ClinicID, MAX(DatVisit) AS LastVisitDate FROM tblavmain WHERE DatVisit <= @EndDate GROUP BY ClinicID) lv JOIN tblavmain v ON lv.ClinicID = v.ClinicID AND lv.LastVisitDate = v.DatVisit ) pla ON main.ClinicID = pla.ClinicID
        WHERE NOT EXISTS (SELECT 1 FROM tblavpatientstatus s WHERE s.ClinicID = main.ClinicID AND s.Da <= @EndDate AND s.Status IN (@dead_code, @transfer_out_code)) AND DATEDIFF(@EndDate, pla.DaApp) < 28
        UNION ALL
        SELECT main.ClinicID, 'Child' as type, IF(main.Sex=0, 'Female', 'Male') as Sex FROM tblcimain main
        JOIN ( SELECT lv.ClinicID, v.DaApp FROM (SELECT ClinicID, MAX(DatVisit) AS LastVisitDate FROM tblcvmain WHERE DatVisit <= @EndDate GROUP BY ClinicID) lv JOIN tblcvmain v ON lv.ClinicID = v.ClinicID AND lv.LastVisitDate = v.DatVisit ) pla ON main.ClinicID = pla.ClinicID
        WHERE NOT EXISTS (SELECT 1 FROM tblcvpatientstatus s WHERE s.ClinicID = main.ClinicID AND s.Da <= @EndDate AND s.Status IN (@dead_code, @transfer_out_code)) AND DATEDIFF(@EndDate, pla.DaApp) < 28
    ) AS ActivePatients
JOIN
    (
        -- This subquery now gets details for only the MOST RECENT visit in the quarter
        SELECT
            VisitDetails.ClinicID,
            VisitDetails.Artnum, -- Artnum from visit table is now included
            VisitDetails.DispensingDate,
            VisitDetails.RegimenFormula,
            VisitDetails.Quantities,
            VisitDetails.MaxQuantity
        FROM (
            -- Get details for ALL visits in the period, including MAX quantity
            SELECT 
                v.ClinicID,
                v.ARTnum as Artnum, -- Selecting ARTnum from the visit table
                v.DatVisit as DispensingDate,
                GROUP_CONCAT(d.DrugName ORDER BY d.DrugName SEPARATOR ' + ') as RegimenFormula,
                GROUP_CONCAT(d.Quantity ORDER BY d.DrugName) as Quantities,
                MAX(d.Quantity) as MaxQuantity
            FROM tblavmain v JOIN tblavarvdrug d ON v.Vid = d.Vid
            WHERE v.DatVisit BETWEEN @StartDate AND @EndDate
            GROUP BY v.ClinicID, v.ARTnum, v.DatVisit
            UNION ALL
            SELECT 
                v.ClinicID,
                v.ARTnum as Artnum, -- Selecting ARTnum from the visit table
                v.DatVisit,
                GROUP_CONCAT(d.DrugName ORDER BY d.DrugName SEPARATOR ' + '),
                GROUP_CONCAT(d.Quantity ORDER BY d.DrugName),
                MAX(d.Quantity)
            FROM tblcvmain v JOIN tblcvarvdrug d ON v.Vid = d.Vid
            WHERE v.DatVisit BETWEEN @StartDate AND @EndDate
            GROUP BY v.ClinicID, v.ARTnum, v.DatVisit
        ) AS VisitDetails
        -- Join to a subquery that finds the MAX visit date to ensure uniqueness
        INNER JOIN (
            SELECT ClinicID, MAX(DatVisit) as MaxVisitDate
            FROM (
                SELECT ClinicID, DatVisit FROM tblavmain WHERE DatVisit BETWEEN @StartDate AND @EndDate
                UNION ALL
                SELECT ClinicID, DatVisit FROM tblcvmain WHERE DatVisit BETWEEN @StartDate AND @EndDate
            ) as AllVisits
            GROUP BY ClinicID
        ) as LatestVisit ON VisitDetails.ClinicID = LatestVisit.ClinicID AND VisitDetails.DispensingDate = LatestVisit.MaxVisitDate

    ) AS MMD_Visits ON ActivePatients.ClinicID = MMD_Visits.ClinicID
ORDER BY ActivePatients.ClinicID, MMD_Visits.DispensingDate;