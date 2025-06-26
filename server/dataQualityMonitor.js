const mysql = require('mysql2/promise');

class DataQualityMonitor {
  constructor(pool) {
    this.pool = pool;
    this.qualityMetrics = new Map();
  }

  // Data completeness check
  async checkDataCompleteness() {
    const connection = await this.pool.getConnection();
    try {
      const metrics = {};
      
      // Check patient data completeness
      const [patientStats] = await connection.query(`
        SELECT 
          'tblaimain' as table_name,
          COUNT(*) as total_records,
          COUNT(CASE WHEN Sex IS NULL THEN 1 END) as null_sex,
          COUNT(CASE WHEN DafirstVisit IS NULL THEN 1 END) as null_first_visit,
          COUNT(CASE WHEN ClinicID IS NULL THEN 1 END) as null_clinic_id
        FROM tblaimain
        UNION ALL
        SELECT 
          'tblcimain' as table_name,
          COUNT(*) as total_records,
          COUNT(CASE WHEN Sex IS NULL THEN 1 END) as null_sex,
          COUNT(CASE WHEN DafirstVisit IS NULL THEN 1 END) as null_first_visit,
          COUNT(CASE WHEN ClinicID IS NULL THEN 1 END) as null_clinic_id
        FROM tblcimain
      `);
      
      metrics.patientCompleteness = patientStats;
      
      // Check visit data completeness
      const [visitStats] = await connection.query(`
        SELECT 
          'tblavmain' as table_name,
          COUNT(*) as total_records,
          COUNT(CASE WHEN DatVisit IS NULL THEN 1 END) as null_visit_date,
          COUNT(CASE WHEN DaApp IS NULL THEN 1 END) as null_appointment_date,
          COUNT(CASE WHEN ClinicID IS NULL THEN 1 END) as null_clinic_id
        FROM tblavmain
        UNION ALL
        SELECT 
          'tblcvmain' as table_name,
          COUNT(*) as total_records,
          COUNT(CASE WHEN DatVisit IS NULL THEN 1 END) as null_visit_date,
          COUNT(CASE WHEN DaApp IS NULL THEN 1 END) as null_appointment_date,
          COUNT(CASE WHEN ClinicID IS NULL THEN 1 END) as null_clinic_id
        FROM tblcvmain
      `);
      
      metrics.visitCompleteness = visitStats;
      
      // Check ART data completeness
      const [artStats] = await connection.query(`
        SELECT 
          'tblaart' as table_name,
          COUNT(*) as total_records,
          COUNT(CASE WHEN DaArt IS NULL THEN 1 END) as null_art_date,
          COUNT(CASE WHEN ClinicID IS NULL THEN 1 END) as null_clinic_id
        FROM tblaart
        UNION ALL
        SELECT 
          'tblcart' as table_name,
          COUNT(*) as total_records,
          COUNT(CASE WHEN DaArt IS NULL THEN 1 END) as null_art_date,
          COUNT(CASE WHEN ClinicID IS NULL THEN 1 END) as null_clinic_id
        FROM tblcart
      `);
      
      metrics.artCompleteness = artStats;
      
      this.qualityMetrics.set('completeness', metrics);
      return metrics;
      
    } finally {
      connection.release();
    }
  }

  // Data consistency check
  async checkDataConsistency() {
    const connection = await this.pool.getConnection();
    try {
      const metrics = {};
      
      // Check for orphaned records
      const [orphanedStats] = await connection.query(`
        SELECT 
          'Orphaned adult visits' as issue_type,
          COUNT(*) as count
        FROM tblavmain v
        LEFT JOIN tblaimain p ON v.ClinicID = p.ClinicID
        WHERE p.ClinicID IS NULL
        UNION ALL
        SELECT 
          'Orphaned child visits' as issue_type,
          COUNT(*) as count
        FROM tblcvmain v
        LEFT JOIN tblcimain p ON v.ClinicID = p.ClinicID
        WHERE p.ClinicID IS NULL
        UNION ALL
        SELECT 
          'Orphaned adult ART' as issue_type,
          COUNT(*) as count
        FROM tblaart a
        LEFT JOIN tblaimain p ON a.ClinicID = p.ClinicID
        WHERE p.ClinicID IS NULL
        UNION ALL
        SELECT 
          'Orphaned child ART' as issue_type,
          COUNT(*) as count
        FROM tblcart a
        LEFT JOIN tblcimain p ON a.ClinicID = p.ClinicID
        WHERE p.ClinicID IS NULL
      `);
      
      metrics.orphanedRecords = orphanedStats;
      
      // Check date consistency
      const [dateConsistency] = await connection.query(`
        SELECT 
          'Future visit dates' as issue_type,
          COUNT(*) as count
        FROM (
          SELECT DatVisit FROM tblavmain WHERE DatVisit > CURDATE()
          UNION ALL
          SELECT DatVisit FROM tblcvmain WHERE DatVisit > CURDATE()
        ) future_dates
        UNION ALL
        SELECT 
          'ART before first visit' as issue_type,
          COUNT(*) as count
        FROM (
          SELECT a.ClinicID FROM tblaart a
          JOIN tblaimain p ON a.ClinicID = p.ClinicID
          WHERE a.DaArt < p.DafirstVisit
          UNION ALL
          SELECT a.ClinicID FROM tblcart a
          JOIN tblcimain p ON a.ClinicID = p.ClinicID
          WHERE a.DaArt < p.DafirstVisit
        ) art_before_visit
      `);
      
      metrics.dateConsistency = dateConsistency;
      
      this.qualityMetrics.set('consistency', metrics);
      return metrics;
      
    } finally {
      connection.release();
    }
  }

  // Data accuracy check
  async checkDataAccuracy() {
    const connection = await this.pool.getConnection();
    try {
      const metrics = {};
      
      // Check viral load data accuracy
      const [vlAccuracy] = await connection.query(`
        SELECT 
          'Invalid VL values' as issue_type,
          COUNT(*) as count
        FROM tblpatienttest
        WHERE HIVLoad IS NOT NULL 
          AND (HIVLoad NOT REGEXP '^[0-9]+$' OR CAST(HIVLoad AS UNSIGNED) > 10000000)
        UNION ALL
        SELECT 
          'VL without date' as issue_type,
          COUNT(*) as count
        FROM tblpatienttest
        WHERE HIVLoad IS NOT NULL AND Dat IS NULL
      `);
      
      metrics.viralLoadAccuracy = vlAccuracy;
      
      // Check drug quantity accuracy
      const [drugAccuracy] = await connection.query(`
        SELECT 
          'Invalid drug quantities' as issue_type,
          COUNT(*) as count
        FROM (
          SELECT Quantity FROM tblavarvdrug WHERE Quantity <= 0 OR Quantity > 1000
          UNION ALL
          SELECT Quantity FROM tblcvarvdrug WHERE Quantity <= 0 OR Quantity > 1000
        ) invalid_quantities
      `);
      
      metrics.drugAccuracy = drugAccuracy;
      
      this.qualityMetrics.set('accuracy', metrics);
      return metrics;
      
    } finally {
      connection.release();
    }
  }

  // Get comprehensive quality report
  async getQualityReport() {
    const completeness = await this.checkDataCompleteness();
    const consistency = await this.checkDataConsistency();
    const accuracy = await this.checkDataAccuracy();
    
    return {
      timestamp: new Date().toISOString(),
      completeness,
      consistency,
      accuracy,
      summary: {
        totalIssues: this.calculateTotalIssues(completeness, consistency, accuracy),
        dataQualityScore: this.calculateQualityScore(completeness, consistency, accuracy)
      }
    };
  }

  calculateTotalIssues(completeness, consistency, accuracy) {
    let total = 0;
    
    // Count completeness issues
    Object.values(completeness).forEach(table => {
      if (Array.isArray(table)) {
        table.forEach(row => {
          total += (row.null_sex || 0) + (row.null_first_visit || 0) + (row.null_clinic_id || 0);
        });
      }
    });
    
    // Count consistency issues
    Object.values(consistency).forEach(table => {
      if (Array.isArray(table)) {
        table.forEach(row => {
          total += row.count || 0;
        });
      }
    });
    
    // Count accuracy issues
    Object.values(accuracy).forEach(table => {
      if (Array.isArray(table)) {
        table.forEach(row => {
          total += row.count || 0;
        });
      }
    });
    
    return total;
  }

  calculateQualityScore(completeness, consistency, accuracy) {
    const totalIssues = this.calculateTotalIssues(completeness, consistency, accuracy);
    const totalRecords = this.getTotalRecords(completeness);
    
    if (totalRecords === 0) return 100;
    
    const score = Math.max(0, 100 - (totalIssues / totalRecords) * 100);
    return Math.round(score * 100) / 100;
  }

  getTotalRecords(completeness) {
    let total = 0;
    Object.values(completeness).forEach(table => {
      if (Array.isArray(table)) {
        table.forEach(row => {
          total += row.total_records || 0;
        });
      }
    });
    return total;
  }
}

module.exports = DataQualityMonitor; 