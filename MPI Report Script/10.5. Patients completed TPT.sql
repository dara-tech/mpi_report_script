-- ===================================================================
-- SCRIPT SETUP
-- ===================================================================
-- Set the end date to define the current active patient cohort
SET @EndDate = '2025-03-31';

-- Set the patient status codes
SET @dead_code = 1;
SET @transfer_out_code = 3;

-- ===================================================================
-- SCRIPT BODY
-- ===================================================================
SELECT
    PatientList.type,
    PatientList.ClinicID,
    PatientList.Sex,
    TPT.Statustpt,
    TPT.datestart as TPT_Start,
    TPT.datestop as TPT_Stop,
    TPT.Numm as TPT_Duration_Months
FROM (
    -- Start with the confirmed list of active patients as of @EndDate
    SELECT 'Adult' as type, main.ClinicID, IF(main.Sex=0, 'Female', 'Male') as Sex FROM tblaimain main
    JOIN ( SELECT lv.ClinicID, v.DaApp FROM (SELECT ClinicID, MAX(DatVisit) AS LastVisitDate FROM tblavmain WHERE DatVisit <= @EndDate GROUP BY ClinicID) lv JOIN tblavmain v ON lv.ClinicID = v.ClinicID AND lv.LastVisitDate = v.DatVisit ) pla ON main.ClinicID = pla.ClinicID
    WHERE NOT EXISTS (SELECT 1 FROM tblavpatientstatus s WHERE s.ClinicID = main.ClinicID AND s.Da <= @EndDate AND s.Status IN (@dead_code, @transfer_out_code)) AND DATEDIFF(@EndDate, pla.DaApp) < 28
    UNION ALL
    SELECT 'Child' as type, main.ClinicID, IF(main.Sex=0, 'Female', 'Male') as Sex FROM tblcimain main
    JOIN ( SELECT lv.ClinicID, v.DaApp FROM (SELECT ClinicID, MAX(DatVisit) AS LastVisitDate FROM tblcvmain WHERE DatVisit <= @EndDate GROUP BY ClinicID) lv JOIN tblcvmain v ON lv.ClinicID = v.ClinicID AND lv.LastVisitDate = v.DatVisit ) pla ON main.ClinicID = pla.ClinicID
    WHERE NOT EXISTS (SELECT 1 FROM tblcvpatientstatus s WHERE s.ClinicID = main.ClinicID AND s.Da <= @EndDate AND s.Status IN (@dead_code, @transfer_out_code)) AND DATEDIFF(@EndDate, pla.DaApp) < 28
) AS PatientList
-- Join to the TPT analysis results, which calculates the TPT status over the patient's entire history
JOIN (
    SELECT ClinicID, Statustpt, datestart, datestop, Numm FROM (
        SELECT distinct *,if(left(drugstart,1)=3,if(Numm>=2.500,"Completed",if(Numm<2.500,"Not Completed","Ongoing")),if(Numm>=5.500,"Completed",if(Numm<5.500,"Not Completed","Ongoing"))) as Statustpt
        FROM (
            -- Adult TPT Episode Calculation
            SELECT pst.clinicid, pst.datestart, pst.drugname as drugstart, psto.datestop, datediff(psto.datestop,pst.datestart)/30  as Numm 
            FROM (
                SELECT dl.clinicid, dl.datestart, dl.drugname FROM (SELECT v.clinicid,v.DatVisit as datestart, ltpt.drugname FROM (SELECT vid, substring(replace(DrugName,"B6-",""),1,(if(locate("-",replace(DrugName,"B6-",""))=0,length(replace(DrugName,"B6-","")),locate("-",replace(DrugName,"B6-",""))-1))) as drugname  FROM (SELECT vid,da, group_concat(DrugName order by DrugName separator '-') as drugname FROM (select DrugName, Status, Da,  Vid from tblavoidrug union select DrugName, Status, Da,  Vid from tblavtptdrug ) ll WHERE Status=0 GROUP BY vid ) ll where drugname!="B6") ltpt INNER JOIN tblavmain v on v.vid=ltpt.vid) dl
                INNER JOIN (SELECT clinicid,min(datestart) as Datestart FROM (SELECT v.clinicid,v.DatVisit as datestart,ltpt.drugname FROM (SELECT vid, substring(replace(DrugName,"B6-",""),1,(if(locate("-",replace(DrugName,"B6-",""))=0,length(replace(DrugName,"B6-","")),locate("-",replace(DrugName,"B6-",""))-1))) as drugname  FROM (SELECT vid,da, group_concat(DrugName order by DrugName separator '-') as drugname FROM (select DrugName, Status, Da,  Vid from tblavoidrug union select DrugName, Status, Da,  Vid from tblavtptdrug ) ll WHERE Status=0 GROUP BY vid ) ll where drugname!="B6") ltpt INNER JOIN tblavmain v on v.vid=ltpt.vid) md GROUP BY clinicid) md ON md.clinicid=dl.clinicid AND md.Datestart=dl.datestart ) pst
            LEFT JOIN ( SELECT dl.clinicid, dl.datestop, dl.drugname FROM (SELECT v.clinicid,ltpt.da as datestop,ltpt.drugname FROM (SELECT vid, da, substring(replace(DrugName,"B6-",""),1,(if(locate("-",replace(DrugName,"B6-",""))=0,length(replace(DrugName,"B6-","")),locate("-",replace(DrugName,"B6-",""))-1))) as drugname  FROM (SELECT vid,da, group_concat(DrugName order by DrugName separator '-') as drugname FROM (select DrugName, Status, Da,  Vid from tblavoidrug union select DrugName, Status, Da,  Vid from tblavtptdrug ) ll WHERE Status=1 GROUP BY vid ) ll where drugname!="B6") ltpt INNER JOIN tblavmain v on v.vid=ltpt.vid) dl
            INNER JOIN (SELECT clinicid,max(datestop) as Datestop FROM (SELECT v.clinicid,ltpt.da as datestop,ltpt.drugname FROM (SELECT vid, da, substring(replace(DrugName,"B6-",""),1,(if(locate("-",replace(DrugName,"B6-",""))=0,length(replace(DrugName,"B6-","")),locate("-",replace(DrugName,"B6-",""))-1))) as drugname  FROM (SELECT vid,da, group_concat(DrugName order by DrugName separator '-') as drugname FROM (select DrugName, Status, Da,  Vid from tblavoidrug union select DrugName, Status, Da,  Vid from tblavtptdrug ) ll WHERE Status=1 GROUP BY vid ) ll where drugname!="B6") ltpt INNER JOIN tblavmain v on v.vid=ltpt.vid) md GROUP BY clinicid) md ON md.clinicid=dl.clinicid AND md.datestop=dl.datestop ) psto ON psto.clinicid=pst.clinicid
        ) nn
        UNION ALL
        SELECT distinct *,if(left(drugstart,1)=3,if(Numm>=2.500,"Completed",if(Numm<2.500,"Not Completed","Ongoing")),if(Numm>=5.500,"Completed",if(Numm<5.500,"Not Completed","Ongoing"))) as Statustpt
        FROM (
             -- Child TPT Episode Calculation
            SELECT pst.clinicid, pst.datestart, pst.drugname as drugstart, psto.datestop, datediff(psto.datestop,pst.datestart)/30  as Numm 
            FROM (
                SELECT dl.clinicid, dl.datestart, dl.drugname FROM
                (SELECT v.clinicid,v.DatVisit as datestart,ltpt.drugname FROM (SELECT vid, substring(replace(DrugName,"B6-",""),1,(if(locate("-",replace(DrugName,"B6-",""))=0,length(replace(DrugName,"B6-","")),locate("-",replace(DrugName,"B6-",""))-1))) as drugname  FROM (SELECT vid,da, group_concat(DrugName order by DrugName separator '-') as drugname FROM (select DrugName, Status, Da,  Vid from tblcvoidrug union select DrugName, Status, Da,  Vid from tblcvtbdrug ) ll WHERE Status=0 GROUP BY vid ) ll where drugname!="B6") ltpt INNER JOIN tblcvmain v on v.vid=ltpt.vid) dl
                INNER JOIN (SELECT clinicid,min(datestart) as Datestart FROM (SELECT v.clinicid,v.DatVisit as datestart,ltpt.drugname FROM (SELECT vid, substring(replace(DrugName,"B6-",""),1,(if(locate("-",replace(DrugName,"B6-",""))=0,length(replace(DrugName,"B6-","")),locate("-",replace(DrugName,"B6-",""))-1))) as drugname  FROM (SELECT vid,da, group_concat(DrugName order by DrugName separator '-') as drugname FROM (select DrugName, Status, Da,  Vid from tblcvoidrug union select DrugName, Status, Da,  Vid from tblcvtbdrug ) ll WHERE Status=0 GROUP BY vid ) ll where drugname!="B6") ltpt INNER JOIN tblcvmain v on v.vid=ltpt.vid) md GROUP BY clinicid) md ON md.clinicid=dl.clinicid AND md.Datestart=dl.datestart
            ) pst
            LEFT JOIN (
                SELECT dl.clinicid, dl.datestop, dl.drugname FROM
                (SELECT v.clinicid,ltpt.da as datestop,ltpt.drugname FROM (SELECT vid, da, substring(replace(DrugName,"B6-",""),1,(if(locate("-",replace(DrugName,"B6-",""))=0,length(replace(DrugName,"B6-","")),locate("-",replace(DrugName,"B6-",""))-1))) as drugname  FROM (SELECT vid,da, group_concat(DrugName order by DrugName separator '-') as drugname FROM (select DrugName, Status, Da,  Vid from tblcvoidrug union select DrugName, Status, Da,  Vid from tblcvtbdrug ) ll WHERE Status=1 GROUP BY vid ) ll where drugname!="B6") ltpt INNER JOIN tblcvmain v on v.vid=ltpt.vid) dl
                INNER JOIN (SELECT clinicid,max(datestop) as Datestop FROM (SELECT v.clinicid,ltpt.da as datestop,ltpt.drugname FROM (SELECT vid, da, substring(replace(DrugName,"B6-",""),1,(if(locate("-",replace(DrugName,"B6-",""))=0,length(replace(DrugName,"B6-","")),locate("-",replace(DrugName,"B6-",""))-1))) as drugname  FROM (SELECT vid,da, group_concat(DrugName order by DrugName separator '-') as drugname FROM (select DrugName, Status, Da,  Vid from tblcvoidrug union select DrugName, Status, Da,  Vid from tblcvtbdrug ) ll WHERE Status=1 GROUP BY vid ) ll where drugname!="B6") ltpt INNER JOIN tblcvmain v on v.vid=ltpt.vid) md GROUP BY clinicid) md ON md.clinicid=dl.clinicID AND md.datestop=dl.datestop
            ) psto ON psto.clinicid=pst.clinicid
        ) nn
    ) TPT_Analysis
) TPT ON PatientList.ClinicID = TPT.ClinicID
WHERE
    -- Filter for only those who have a lifetime status of "Completed"
    TPT.Statustpt = 'Completed';