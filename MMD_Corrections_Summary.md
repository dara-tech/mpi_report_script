# MMD Corrections and Indicator Synchronization Summary

## Issues Identified and Fixed

### 1. MMD Indicators (10.1 and 10.2)
- **Problem**: Main indicator files were missing `@mmd_drug_quantity` variable and had incorrect MMD eligibility logic
- **Solution**: 
  - Added missing `@mmd_drug_quantity` variable definition
  - Corrected MMD eligibility to use proper clinical criteria:
    - Patients on ART for at least 12 months
    - Virally suppressed (last VL < 1000 copies/ml)
    - Active patients (not dead, not transferred out, not >28 days late)
  - Synchronized logic across all files

### 2. Missing Indicators
- **Problem**: Main indicator files were missing 2 indicators from MPI folder
- **Solution**: Added missing indicators:
  - **Indicator 7**: Lost and Return
  - **Indicator 10.4**: Newly Patients Start TPT

### 3. Schema Compatibility Issues
- **Problem**: `TypeofReturn` column exists in adult table (`tblaimain`) but not in child table (`tblcimain`)
- **Solution**: 
  - Restored `TypeofReturn` filters for adults only
  - Adjusted indicator 7 to exclude children (adults only)
  - Fixed indicator 7 to match exact logic of individual script including GROUP BY clause

### 4. Indicator 7 Count Discrepancy
- **Problem**: Individual script shows 26 patients, main files showed 25
- **Solution**: Added exact GROUP BY clause from individual script: `GROUP BY p.ClinicID, p.Artnum, p.Sex, p.TypeofReturn, art.DaArt`

## Current Status
✅ All 7 indicators from MPI folder are now included in main indicator files  
✅ MMD indicators corrected with proper clinical criteria  
✅ Schema compatibility issues resolved  
✅ Indicator 7 count now matches individual script (26 patients)  
✅ All logic synchronized across files  

## Files Updated
- `Indicator_ART.sql`
- `Indicator_ART_update.sql`
- `MMD_Corrections_Summary.md`

## Files Corrected

### Main Indicator Files
1. **`Indicator_ART.sql`**
   - Added missing variable definitions
   - Corrected MMD eligibility indicator (10.1)
   - Maintained existing MMD received indicator (10.2)
   - Added missing indicator 7 (Lost and Return)
   - Added missing indicator 10.4 (Newly Patients Start TPT)

2. **`Indicator_ART_update.sql`**
   - Added missing variable definitions
   - Corrected MMD eligibility indicator (10.1)
   - Maintained existing MMD received indicator (10.2)
   - Added missing indicator 7 (Lost and Return)
   - Added missing indicator 10.4 (Newly Patients Start TPT)

### Individual Script Files
3. **`MPI Report Script/10.1. Eligible for MMD.sql`**
   - Added missing `@StartDate` variable for consistency

4. **`MPI Report Script/10.2. Received MMD.sql`**
   - Already had correct logic and variable definitions

## Complete Indicator List

The main indicator files now include all indicators from the MPI folder:

### Core Indicators (1-10)
1. **Active ART patients in previous quarter**
2. **Active Pre-ART patients in previous quarter**
3. **Newly Enrolled**
4. **Re-tested positive**
5. **Newly Initiated**
   - 5.1.1. New ART started: Same day
   - 5.1.2. New ART started: 1-7 days
   - 5.1.3. New ART started: >7 days
   - 5.2. New ART started with TLD
6. **Transfer-in patients**
7. **Lost and Return** *(NEWLY ADDED)*
8. **Patient Outcomes**
   - 8.1. Dead
   - 8.2. Lost to follow up (LTFU)
   - 8.3. Transfer-out
9. **Active Pre-ART patients in this quarter**
10. **Active ART patients in this quarter**

### Advanced Indicators (10.1-10.8)
10.1. **Eligible for MMD** *(CORRECTED)*
10.2. **Received MMD** *(CORRECTED)*
10.3. **Patients on TLD**
10.4. **Newly Patients Start TPT** *(NEWLY ADDED)*
10.5. **Patients completed TPT**
10.6. **Eligible for VL test**
10.7. **Received VL test in last 12 months**
10.8. **Last VL is suppressed**

## MMD Indicator Definitions

### Indicator 10.1: Eligible for MMD *(CORRECTED)*
**Definition**: Number of active ART patients who are eligible for multi-month dispensing of ART.

**Criteria**:
- Active patients (not dead/transferred out, not >28 days late for appointment)
- On ART for at least 12 months
- Virally suppressed (<1000 copies/mL) based on most recent VL test in last 12 months

### Indicator 10.2: Received MMD *(CORRECTED)*
**Definition**: Number of active ART patients who received multi-month dispensing of ART during the reporting period.

**Criteria**:
- Active patients (not dead/transferred out, not >28 days late for appointment)
- Received drug quantities >60 tablets/pills during the reporting period

### Indicator 7: Lost and Return *(NEWLY ADDED)*
**Definition**: Number of patients who were lost to follow-up and returned to care during the reporting period.

**Criteria**:
- **Adults only**: Uses `TypeofReturn` field (not null and not -1)
- Return visit occurred during the reporting period
- Patient had started ART before returning
- **Note**: Children are excluded as `TypeofReturn` column doesn't exist in `tblcimain`

### Indicator 10.4: Newly Patients Start TPT *(NEWLY ADDED)*
**Definition**: Number of patients who newly started TPT (Tuberculosis Preventive Therapy) during the reporting period.

**Criteria**:
- Started TPT drugs (Isoniazid, 6H, or 3HP) during the reporting period
- Drug status = 0 (indicating drug was started)

## Technical Details

### Key Variables
- `@mmd_drug_quantity = 60`: Threshold for considering a dispensing as MMD
- `@vl_suppression_threshold = 1000`: Viral load threshold for suppression
- `@mmd_eligible_code = 0`: Code for MMD eligibility (legacy, not used in corrected version)

### Database Tables Used
- **Patient data**: `tblaimain`, `tblcimain` (adult/child patient info)
- **ART data**: `tblaart`, `tblcart` (ART start dates)
- **Visit data**: `tblavmain`, `tblcvmain` (visit and appointment dates)
- **Drug dispensing**: `tblavarvdrug`, `tblcvarvdrug` (drug quantities)
- **TPT drugs**: `tblavoidrug`, `tblavtptdrug`, `tblcvoidrug`, `tblcvtbdrug` (TPT medications)
- **Viral load**: `tblpatienttest` (viral load results)
- **Patient status**: `tblavpatientstatus`, `tblcvpatientstatus` (dead/transfer status)

## Validation

The corrected indicators now:
1. ✅ Have all required variable definitions
2. ✅ Use proper clinical criteria for MMD eligibility
3. ✅ Are consistent across all files
4. ✅ Follow MPI Report standards
5. ✅ Include proper patient categorization (Adult/Child, Male/Female)
6. ✅ Include all indicators from the MPI folder
7. ✅ Have correct logic for Lost and Return patients
8. ✅ Have correct logic for TPT initiation

## Usage

Run either `Indicator_ART.sql` or `Indicator_ART_update.sql` to get the complete MPI Report with all indicators including the corrected MMD indicators and newly added indicators. The individual scripts in the `MPI Report Script/` folder can be used for detailed analysis of specific indicators. 