-- ===================================================================
-- SCRIPT SETUP
-- ===================================================================
-- Set the reporting period dates from the PDF report
SET @EndDate = '2025-03-31';

-- Set the patient status codes based on the data dictionary
SET @dead_code = 1;
SET @transfer_out_code = 3;

-- ===================================================================
-- SCRIPT BODY
-- ===================================================================
SELECT
    -- ROW_NUMBER() OVER (ORDER BY ActivePatients.ClinicID) AS No,
    ActivePatients.ClinicID,
    ActivePatients.type,
    ActivePatients.Sex,
    TPT.drugstart AS TPT_Drug,
    TPT.datestart AS TPT_Start_Date,
    TPT.datestop AS TPT_Stop_Date,
    TPT.Numm AS TPT_Duration_Months,
    TPT.Statustpt AS TPT_Status
FROM
    (
        -- First, get the full list of all ACTIVE patients
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
        -- This is the complex subquery from the original file that calculates TPT status, now updated with the correct drug logic
        SELECT ClinicID, datestart, datestop, drugstart, Numm, Statustpt
        FROM (
            SELECT distinct *,
                -- UPDATED LOGIC: Check for '3HP' by name for 2.5 month rule, otherwise use 5.5 month rule
                if(drugstart LIKE '%3HP%',
                    if(Numm>=2.500,"Completed",if(Numm<2.500,"Not Completed","Ongoing")),
                    if(Numm>=5.500,"Completed",if(Numm<5.500,"Not Completed","Ongoing"))
                ) as Statustpt
            FROM (
                -- Adult TPT Episode Calculation
                SELECT pst.clinicid, pst.datestart, pst.drugname as drugstart, psto.datestop, datediff(psto.datestop,pst.datestart)/30 as Numm
                FROM (
                    SELECT dl.clinicid, dl.datestart, dl.drugname FROM (SELECT v.clinicid,v.DatVisit as datestart, ltpt.drugname FROM (SELECT vid, substring(replace(DrugName,"B6-",""),1,(if(locate("-",replace(DrugName,"B6-",""))=0,length(replace(DrugName,"B6-","")),locate("-",replace(DrugName,"B6-",""))-1))) as drugname FROM (SELECT vid,da, group_concat(DrugName order by DrugName separator '-') as drugname FROM (SELECT DrugName, Status, Da, Vid from tblavoidrug union select DrugName, Status, Da, Vid from tblavtptdrug ) ll WHERE Status=0 AND (DrugName LIKE '%Isoniazid%' OR DrugName LIKE '%6H%' OR DrugName LIKE '%3HP%') GROUP BY vid ) ll where drugname!="B6") ltpt INNER JOIN tblavmain v on v.vid=ltpt.vid) dl
                    INNER JOIN (SELECT clinicid,min(datestart) as Datestart FROM (SELECT v.clinicid,v.DatVisit as datestart,ltpt.drugname FROM (SELECT vid, substring(replace(DrugName,"B6-",""),1,(if(locate("-",replace(DrugName,"B6-",""))=0,length(replace(DrugName,"B6-","")),locate("-",replace(DrugName,"B6-",""))-1))) as drugname FROM (SELECT vid,da, group_concat(DrugName order by DrugName separator '-') as drugname FROM (SELECT DrugName, Status, Da, Vid from tblavoidrug union select DrugName, Status, Da, Vid from tblavtptdrug ) ll WHERE Status=0 AND (DrugName LIKE '%Isoniazid%' OR DrugName LIKE '%6H%' OR DrugName LIKE '%3HP%') GROUP BY vid ) ll where drugname!="B6") ltpt INNER JOIN tblavmain v on v.vid=ltpt.vid) md GROUP BY clinicid) md ON md.clinicid=dl.clinicid AND md.Datestart=dl.datestart ) pst
                LEFT JOIN ( SELECT dl.clinicid, dl.datestop, dl.drugname FROM (SELECT v.clinicid, ltpt.da as datestop,ltpt.drugname FROM (SELECT vid, da, substring(replace(DrugName,"B6-",""),1,(if(locate("-",replace(DrugName,"B6-",""))=0,length(replace(DrugName,"B6-","")),locate("-",replace(DrugName,"B6-",""))-1))) as drugname FROM (SELECT vid,da, group_concat(DrugName order by DrugName separator '-') as drugname FROM (SELECT DrugName, Status, Da, Vid from tblavoidrug union select DrugName, Status, Da, Vid from tblavtptdrug ) ll WHERE Status=1 AND (DrugName LIKE '%Isoniazid%' OR DrugName LIKE '%6H%' OR DrugName LIKE '%3HP%') GROUP BY vid ) ll where drugname!="B6") ltpt INNER JOIN tblavmain v on v.vid=ltpt.vid) dl
                INNER JOIN (SELECT clinicid,max(datestop) as Datestop FROM (SELECT v.clinicid,ltpt.da as datestop,ltpt.drugname FROM (SELECT vid, da, substring(replace(DrugName,"B6-",""),1,(if(locate("-",replace(DrugName,"B6-",""))=0,length(replace(DrugName,"B6-","")),locate("-",replace(DrugName,"B6-",""))-1))) as drugname FROM (SELECT vid,da, group_concat(DrugName order by DrugName separator '-') as drugname FROM (SELECT DrugName, Status, Da, Vid from tblavoidrug union select DrugName, Status, Da, Vid from tblavtptdrug ) ll WHERE Status=1 AND (DrugName LIKE '%Isoniazid%' OR DrugName LIKE '%6H%' OR DrugName LIKE '%3HP%') GROUP BY vid ) ll where drugname!="B6") ltpt INNER JOIN tblavmain v on v.vid=ltpt.vid) md GROUP BY clinicid) md ON md.clinicid=dl.clinicid AND md.datestop=dl.datestop ) psto ON psto.clinicid=pst.clinicid
            ) nn
            UNION ALL
            SELECT distinct *,
                if(drugstart LIKE '%3HP%',
                    if(Numm>=2.500,"Completed",if(Numm<2.500,"Not Completed","Ongoing")),
                    if(Numm>=5.500,"Completed",if(Numm<5.500,"Not Completed","Ongoing"))
                ) as Statustpt
            FROM (
                 -- Child TPT Episode Calculation
                SELECT pst.clinicid, pst.datestart, pst.drugname as drugstart, psto.datestop, datediff(psto.datestop,pst.datestart)/30 as Numm FROM (
                    SELECT dl.clinicid, dl.datestart, dl.drugname FROM (SELECT v.clinicid,v.DatVisit as datestart,ltpt.drugname FROM (SELECT vid, substring(replace(DrugName,"B6-",""),1,(if(locate("-",replace(DrugName,"B6-",""))=0,length(replace(DrugName,"B6-","")),locate("-",replace(DrugName,"B6-",""))-1))) as drugname  FROM (SELECT vid,da, group_concat(DrugName order by DrugName separator '-') as drugname FROM (select DrugName, Status, Da, Vid from tblcvoidrug union select DrugName, Status, Da, Vid from tblcvtbdrug ) ll WHERE Status=0 AND (DrugName LIKE '%Isoniazid%' OR DrugName LIKE '%6H%' OR DrugName LIKE '%3HP%') GROUP BY vid ) ll where drugname!="B6") ltpt INNER JOIN tblcvmain v on v.vid=ltpt.vid) dl
                    INNER JOIN (SELECT clinicid,min(datestart) as Datestart FROM (SELECT v.clinicid,v.DatVisit as datestart,ltpt.drugname FROM (SELECT vid, substring(replace(DrugName,"B6-",""),1,(if(locate("-",replace(DrugName,"B6-",""))=0,length(replace(DrugName,"B6-","")),locate("-",replace(DrugName,"B6-",""))-1))) as drugname  FROM (SELECT vid,da, group_concat(DrugName order by DrugName separator '-') as drugname FROM (select DrugName, Status, Da, Vid from tblcvoidrug union select DrugName, Status, Da, Vid from tblcvtbdrug ) ll WHERE Status=0 AND (DrugName LIKE '%Isoniazid%' OR DrugName LIKE '%6H%' OR DrugName LIKE '%3HP%') GROUP BY vid ) ll where drugname!="B6") ltpt INNER JOIN tblcvmain v on v.vid=ltpt.vid) md GROUP BY clinicid) md ON md.clinicid=dl.clinicid AND md.Datestart=dl.datestart
                ) pst
                LEFT JOIN ( SELECT dl.clinicid, dl.datestop, dl.drugname FROM (SELECT v.clinicid,ltpt.da as datestop,ltpt.drugname FROM (SELECT vid, da, substring(replace(DrugName,"B6-",""),1,(if(locate("-",replace(DrugName,"B6-",""))=0,length(replace(DrugName,"B6-","")),locate("-",replace(DrugName,"B6-",""))-1))) as drugname  FROM (SELECT vid,da, group_concat(DrugName order by DrugName separator '-') as drugname FROM (select DrugName, Status, Da, Vid from tblcvoidrug union select DrugName, Status, Da, Vid from tblcvtbdrug ) ll WHERE Status=1 AND (DrugName LIKE '%Isoniazid%' OR DrugName LIKE '%6H%' OR DrugName LIKE '%3HP%') GROUP BY vid ) ll where drugname!="B6") ltpt INNER JOIN tblcvmain v on v.vid=ltpt.vid) dl
                INNER JOIN (SELECT clinicid,max(datestop) as Datestop FROM (SELECT v.clinicid,ltpt.da as datestop,ltpt.drugname FROM (SELECT vid, da, substring(replace(DrugName,"B6-",""),1,(if(locate("-",replace(DrugName,"B6-",""))=0,length(replace(DrugName,"B6-","")),locate("-",replace(DrugName,"B6-",""))-1))) as drugname  FROM (SELECT vid,da, group_concat(DrugName order by DrugName separator '-') as drugname FROM (select DrugName, Status, Da, Vid from tblcvoidrug union select DrugName, Status, Da, Vid from tblcvtbdrug ) ll WHERE Status=1 AND (DrugName LIKE '%Isoniazid%' OR DrugName LIKE '%6H%' OR DrugName LIKE '%3HP%') GROUP BY vid ) ll where drugname!="B6") ltpt INNER JOIN tblcvmain v on v.vid=ltpt.vid) md GROUP BY clinicid) md ON md.clinicid=dl.clinicID AND md.datestop=dl.datestop ) psto ON psto.clinicid=pst.clinicid
            ) nn
        ) TPT_Analysis
    ) TPT ON ActivePatients.ClinicID = TPT.ClinicID
WHERE TPT.Statustpt = 'Completed';