-- ===================================================================
-- SCRIPT SETUP
-- ===================================================================
-- Set the reporting period dates from the PDF report
SET @EndDate = '2024-12-31';

-- Set the patient status codes based on the data dictionary
SET @dead_code = 1;
SET @transfer_out_code = 3;

-- ===================================================================
-- SCRIPT BODY
-- ===================================================================

SELECT
    -- ROW_NUMBER() OVER () AS No,
    PatientList.ClinicID,
    PatientList.Artnum, -- ART Number is now included
    PatientList.type,
    PatientList.Sex,
    PatientList.Age, -- Age is now included
    PatientList.LastVisitDate -- Last Visit Date is now included
FROM (
    -- Adult Active Patients
    SELECT 
        main.ClinicID, 
        pla.ARTnum as Artnum, -- Get ARTnum from the last visit
        'Adult' as type, 
        IF(main.Sex=0, 'Female', 'Male') as Sex,
        FLOOR(DATEDIFF(@EndDate, main.DaBirth) / 365.25) as Age, -- Calculate Age
        pla.LastVisitDate
    FROM tblaimain main
    JOIN ( 
        SELECT lv.ClinicID, v.DaApp, v.ARTnum, lv.LastVisitDate 
        FROM (SELECT ClinicID, MAX(DatVisit) AS LastVisitDate FROM tblavmain WHERE DatVisit <= @EndDate GROUP BY ClinicID) lv 
        JOIN tblavmain v ON lv.ClinicID = v.ClinicID AND lv.LastVisitDate = v.DatVisit 
    ) pla ON main.ClinicID = pla.ClinicID
    WHERE 
        NOT EXISTS (SELECT 1 FROM tblavpatientstatus s WHERE s.ClinicID = main.ClinicID AND s.Da <= @EndDate AND s.Status IN (@dead_code, @transfer_out_code)) 
        AND DATEDIFF(@EndDate, pla.DaApp) < 28

    UNION ALL

    -- Child Active Patients
    SELECT 
        main.ClinicID, 
        pla.ARTnum as Artnum, -- Get ARTnum from the last visit
        'Child' as type, 
        IF(main.Sex=0, 'Female', 'Male') as Sex,
        FLOOR(DATEDIFF(@EndDate, main.DaBirth) / 365.25) as Age, -- Calculate Age
        pla.LastVisitDate
    FROM tblcimain main
    JOIN ( 
        SELECT lv.ClinicID, v.DaApp, v.ARTnum, lv.LastVisitDate 
        FROM (SELECT ClinicID, MAX(DatVisit) AS LastVisitDate FROM tblcvmain WHERE DatVisit <= @EndDate GROUP BY ClinicID) lv 
        JOIN tblcvmain v ON lv.ClinicID = v.ClinicID AND lv.LastVisitDate = v.DatVisit 
    ) pla ON main.ClinicID = pla.ClinicID
    WHERE 
        NOT EXISTS (SELECT 1 FROM tblcvpatientstatus s WHERE s.ClinicID = main.ClinicID AND s.Da <= @EndDate AND s.Status IN (@dead_code, @transfer_out_code)) 
        AND DATEDIFF(@EndDate, pla.DaApp) < 28
) AS PatientList;