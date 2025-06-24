-- ===================================================================
-- SCRIPT SETUP
-- ===================================================================
-- Set the reporting period dates from the PDF report
SET @StartDate = '2025-01-01';
SET @EndDate = '2025-03-31';

-- Set the patient status codes based on the data dictionary
SET @dead_code = 1;
SET @transfer_out_code = 3;

-- Set the MMD quantity threshold
SET @mmd_drug_quantity = 60;

-- ===================================================================
-- SCRIPT BODY
-- ===================================================================
SELECT
    -- ROW_NUMBER() OVER (ORDER BY ActivePatients.ClinicID, Last_Visit_Date.Last_MMD_Date) AS No,
    ActivePatients.ClinicID,
    ActivePatients.type,
    ActivePatients.Sex,
    MMD_Details.MMD_Dispensing_Date,
    GROUP_CONCAT(MMD_Details.MMD_Drug ORDER BY MMD_Details.MMD_Drug SEPARATOR ' + ') AS MMD_Formula,
    GROUP_CONCAT(MMD_Details.MMD_Quantity_Dispensed ORDER BY MMD_Details.MMD_Drug) AS MMD_Quantities,
    ROUND(MIN(MMD_Details.MMD_Quantity_Dispensed) / 30, 1) AS Estimated_Months_Supply
FROM
    (
        -- Get the full list of all active patients
        SELECT main.ClinicID, 'Adult' as type, IF(main.Sex=0, 'Female', 'Male') as Sex
        FROM tblaimain main
        JOIN ( SELECT lv.ClinicID, v.DaApp FROM (SELECT ClinicID, MAX(DatVisit) AS LastVisitDate FROM tblavmain WHERE DatVisit <= @EndDate GROUP BY ClinicID) lv JOIN tblavmain v ON lv.ClinicID = v.ClinicID AND lv.LastVisitDate = v.DatVisit ) pla ON main.ClinicID = pla.ClinicID
        WHERE NOT EXISTS (SELECT 1 FROM tblavpatientstatus s WHERE s.ClinicID = main.ClinicID AND s.Da <= @EndDate AND s.Status IN (@dead_code, @transfer_out_code)) AND DATEDIFF(@EndDate, pla.DaApp) < 28
        UNION ALL
        SELECT main.ClinicID, 'Child' as type, IF(main.Sex=0, 'Female', 'Male') as Sex
        FROM tblcimain main
        JOIN ( SELECT lv.ClinicID, v.DaApp FROM (SELECT ClinicID, MAX(DatVisit) AS LastVisitDate FROM tblcvmain WHERE DatVisit <= @EndDate GROUP BY ClinicID) lv JOIN tblcvmain v ON lv.ClinicID = v.ClinicID AND lv.LastVisitDate = v.DatVisit ) pla ON main.ClinicID = pla.ClinicID
        WHERE NOT EXISTS (SELECT 1 FROM tblcvpatientstatus s WHERE s.ClinicID = main.ClinicID AND s.Da <= @EndDate AND s.Status IN (@dead_code, @transfer_out_code)) AND DATEDIFF(@EndDate, pla.DaApp) < 28
    ) AS ActivePatients
JOIN
    (
        -- This subquery now finds the details for EACH MMD dispensing event
        SELECT v.ClinicID, v.DatVisit AS MMD_Dispensing_Date, d.DrugName AS MMD_Drug, d.Quantity AS MMD_Quantity_Dispensed
        FROM tblavmain v JOIN tblavarvdrug d ON v.Vid = d.Vid
        -- The issue is here: DTG is likely not being recorded with a quantity > 60
        WHERE v.DatVisit BETWEEN @StartDate AND @EndDate AND d.Quantity > @mmd_drug_quantity
        UNION ALL
        SELECT v.ClinicID, v.DatVisit, d.DrugName, d.Quantity
        FROM tblcvmain v JOIN tblcvarvdrug d ON v.Vid = d.Vid
        -- The issue is here: DTG is likely not being recorded with a quantity > 60
        WHERE v.DatVisit BETWEEN @StartDate AND @EndDate AND d.Quantity > @mmd_drug_quantity
    ) AS MMD_Details ON ActivePatients.ClinicID = MMD_Details.ClinicID
JOIN
    (
        -- This subquery finds the MOST RECENT (MAX) visit date for each patient to ensure unique IDs
        SELECT ClinicID, MAX(DatVisit) AS Last_MMD_Date
        FROM (
            SELECT v.ClinicID, v.DatVisit FROM tblavmain v JOIN tblavarvdrug d ON v.Vid = d.Vid WHERE v.DatVisit BETWEEN @StartDate AND @EndDate AND d.Quantity > @mmd_drug_quantity
            UNION ALL
            SELECT v.ClinicID, v.DatVisit FROM tblcvmain v JOIN tblcvarvdrug d ON v.Vid = d.Vid WHERE v.DatVisit BETWEEN @StartDate AND @EndDate AND d.Quantity > @mmd_drug_quantity
        ) AS All_MMD_Visits
        GROUP BY ClinicID
    ) AS Last_Visit_Date ON MMD_Details.ClinicID = Last_Visit_Date.ClinicID AND MMD_Details.MMD_Dispensing_Date = Last_Visit_Date.Last_MMD_Date
GROUP BY
    ActivePatients.ClinicID, ActivePatients.type, ActivePatients.Sex, MMD_Details.MMD_Dispensing_Date;