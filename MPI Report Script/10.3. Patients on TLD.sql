-- ===================================================================
-- SCRIPT SETUP
-- ===================================================================
-- Set the reporting period dates from the PDF report
SET @EndDate = '2025-03-31';

-- Set the patient status codes based on the data dictionary
SET @dead_code = 1;
SET @transfer_out_code = 3;

-- Set codes for specific fields based on schema and user feedback
SET @tld_regimen_formula = '3TC + DTG + TDF';

-- ===================================================================
-- SCRIPT BODY
-- ===================================================================

SELECT
    FinalPatientList.ClinicID,
    FinalPatientList.Artnum,
    FinalPatientList.type,
    FinalPatientList.Sex,
    FinalPatientList.Age,
    FinalPatientList.CurrentRegimen,
    FinalPatientList.NextAppointmentDate
FROM (
    -- Adult Patients on TLD
    SELECT
        i.ClinicID,
        last_visit_info.ARTnum, -- **THE FIX IS HERE**: Getting ARTnum from the visit table
        'Adult' as type,
        IF(i.Sex=0, 'Female', 'Male') as Sex,
        FLOOR(DATEDIFF(@EndDate, i.DaBirth) / 365.25) as Age,
        regimen_info.regimen AS CurrentRegimen,
        last_visit_info.DaApp AS NextAppointmentDate
    FROM tblaimain i
    -- Find the last visit for each adult
    JOIN (
        SELECT v.ClinicID, v.DaApp, v.Vid, v.ARTnum -- Selecting ARTnum from the visit table
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
        regimen_info.regimen = @tld_regimen_formula
        AND DATEDIFF(@EndDate, last_visit_info.DaApp) < 28
        AND NOT EXISTS (SELECT 1 FROM tblavpatientstatus s WHERE s.ClinicID = i.ClinicID AND s.Da <= @EndDate AND s.Status IN (@dead_code, @transfer_out_code))

    UNION ALL

    -- Child Patients on TLD
    SELECT
        i.ClinicID,
        last_visit_info.ARTnum, -- **THE FIX IS HERE**: Getting ARTnum from the visit table
        'Child' as type,
        IF(i.Sex=0, 'Female', 'Male') as Sex,
        FLOOR(DATEDIFF(@EndDate, i.DaBirth) / 365.25) as Age,
        regimen_info.regimen AS CurrentRegimen,
        last_visit_info.DaApp AS NextAppointmentDate
    FROM tblcimain i
    -- Find the last visit for each child
    JOIN (
        SELECT v.ClinicID, v.DaApp, v.Vid, v.ARTnum -- Selecting ARTnum from the visit table
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
        regimen_info.regimen = @tld_regimen_formula
        AND DATEDIFF(@EndDate, last_visit_info.DaApp) < 28
        AND NOT EXISTS (SELECT 1 FROM tblcvpatientstatus s WHERE s.ClinicID = i.ClinicID AND s.Da <= @EndDate AND s.Status IN (@dead_code, @transfer_out_code))

) AS FinalPatientList;