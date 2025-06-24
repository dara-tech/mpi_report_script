-- ===================================================================
-- SCRIPT SETUP
-- ===================================================================
-- Set the reporting period dates from the PDF report
SET @PreviousEndDate = '2024-12-31';

-- Set the patient status codes based on the data dictionary
SET @dead_code = 1;
SET @lost_code = 0;
SET @transfer_out_code = 3;

-- ===================================================================
-- SCRIPT BODY
-- ===================================================================

SELECT
    -- ROW_NUMBER() OVER () AS No,
    PatientList.ClinicID,
    PatientList.type,
    PatientList.Sex
FROM (
    -- Adult Active Patients
    SELECT main.ClinicID, 'Adult' as type, IF(main.Sex=0, 'Female', 'Male') as Sex FROM tblaimain main
    JOIN ( SELECT lv.ClinicID, v.DaApp FROM (SELECT ClinicID, MAX(DatVisit) AS LastVisitDate FROM tblavmain WHERE DatVisit <= @PreviousEndDate GROUP BY ClinicID) lv JOIN tblavmain v ON lv.ClinicID = v.ClinicID AND lv.LastVisitDate = v.DatVisit ) pla ON main.ClinicID = pla.ClinicID
    WHERE NOT EXISTS (SELECT 1 FROM tblavpatientstatus s WHERE s.ClinicID = main.ClinicID AND s.Da <= @PreviousEndDate AND s.Status IN (@dead_code, @transfer_out_code,@lost_code)) AND DATEDIFF(@PreviousEndDate, pla.DaApp) < 28
    UNION ALL
    -- Child Active Patients
    SELECT main.ClinicID, 'Child' as type, IF(main.Sex=0, 'Female', 'Male') as Sex FROM tblcimain main
    JOIN ( SELECT lv.ClinicID, v.DaApp FROM (SELECT ClinicID, MAX(DatVisit) AS LastVisitDate FROM tblcvmain WHERE DatVisit <= @PreviousEndDate GROUP BY ClinicID) lv JOIN tblcvmain v ON lv.ClinicID = v.ClinicID AND lv.LastVisitDate = v.DatVisit ) pla ON main.ClinicID = pla.ClinicID
    WHERE NOT EXISTS (SELECT 1 FROM tblcvpatientstatus s WHERE s.ClinicID = main.ClinicID AND s.Da <= @PreviousEndDate AND s.Status IN (@dead_code, @transfer_out_code,@lost_code)) AND DATEDIFF(@PreviousEndDate, pla.DaApp) < 28
) AS PatientList;