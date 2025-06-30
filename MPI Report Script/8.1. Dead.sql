-- ===================================================================
-- SCRIPT SETUP
-- ===================================================================
-- Set the reporting period dates
SET @StartDate = '2025-01-01';
SET @EndDate = '2025-03-31';

-- Set the patient status code for 'Dead'
SET @dead_code = 1;

-- ===================================================================
-- SCRIPT BODY
-- ===================================================================

SELECT
    PatientList.ClinicID,
    PatientList.Artnum,
    PatientList.type,
    PatientList.Sex,
    PatientList.AgeAtDeath,
    PatientList.PlaceOfDeath_Translated,
    PatientList.CauseOfDeath,
    PatientList.DateOfDeath
FROM (
    -- Adult patients recorded as dead in the period
    SELECT
        main.ClinicID,
        s.Artnum, -- **THE FIX IS HERE**: Getting ARTnum from the status table
        'Adult' as type,
        IF(main.Sex=0, 'Female', 'Male') as Sex,
        FLOOR(DATEDIFF(s.Da, main.DaBirth) / 365.25) as AgeAtDeath,
        -- This CASE statement now translates the Place code into English text
        CASE s.Place 
            WHEN 0 THEN 'Home'
            WHEN 1 THEN 'Hospital'
            WHEN 3 THEN 'Other'
            ELSE '' 
        END as PlaceOfDeath_Translated,
        IFNULL(s.Cause, '') as CauseOfDeath,
        s.Da as DateOfDeath
    FROM 
        tblaimain main
    JOIN 
        -- NOTE: We must join to tblavmain first to get the ARTnum from the visit
        (
            SELECT v.ClinicID, v.DatVisit, v.ARTnum, ps.Da, ps.Place, ps.Cause, ps.Status
            FROM tblavmain v
            JOIN tblavpatientstatus ps ON v.Vid = ps.Vid
        ) s ON main.ClinicID = s.ClinicID
    WHERE 
        s.Da BETWEEN @StartDate AND @EndDate AND s.Status = @dead_code

    UNION ALL

    -- Child patients recorded as dead in the period
    SELECT
        main.ClinicID,
        s.Artnum, -- **THE FIX IS HERE**: Getting ARTnum from the status table
        'Child' as type,
        IF(main.Sex=0, 'Female', 'Male') as Sex,
        FLOOR(DATEDIFF(s.Da, main.DaBirth) / 365.25) as AgeAtDeath,
        -- This CASE statement now translates the Place code into English text
        CASE s.Place 
            WHEN 0 THEN 'Home'
            WHEN 1 THEN 'Hospital'
            WHEN 3 THEN 'Other'
            ELSE '' 
        END as PlaceOfDeath_Translated,
        IFNULL(s.Cause, '') as CauseOfDeath,
        s.Da as DateOfDeath
    FROM 
        tblcimain main
    JOIN 
        -- NOTE: We must join to tblcvmain first to get the ARTnum from the visit
        (
            SELECT v.ClinicID, v.DatVisit, v.ARTnum, ps.Da, ps.Place, ps.Cause, ps.Status
            FROM tblcvmain v
            JOIN tblcvpatientstatus ps ON v.Vid = ps.Vid
        ) s ON main.ClinicID = s.ClinicID
    WHERE 
        s.Da BETWEEN @StartDate AND @EndDate AND s.Status = @dead_code
) AS PatientList;