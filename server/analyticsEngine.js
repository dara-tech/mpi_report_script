const mysql = require('mysql2/promise');

class AnalyticsEngine {
  constructor(pool) {
    this.pool = pool;
    this.analyticsCache = new Map();
    this.cacheDuration = 10 * 60 * 1000; // 10 minutes
  }

  // Get cached analytics result
  getCachedResult(key) {
    const cached = this.analyticsCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }
    return null;
  }

  // Set cached analytics result
  setCachedResult(key, data) {
    this.analyticsCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Trend analysis for patient outcomes
  async analyzePatientTrends(startDate, endDate) {
    const cacheKey = `trends_${startDate}_${endDate}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached) return cached;

    const connection = await this.pool.getConnection();
    try {
      const trends = {};

      // Monthly enrollment trends
      const [enrollmentTrends] = await connection.query(`
        SELECT 
          DATE_FORMAT(DafirstVisit, '%Y-%m') as month,
          COUNT(*) as new_enrollments,
          SUM(CASE WHEN Sex = 0 THEN 1 ELSE 0 END) as female,
          SUM(CASE WHEN Sex = 1 THEN 1 ELSE 0 END) as male
        FROM (
          SELECT DafirstVisit, Sex FROM tblaimain 
          WHERE DafirstVisit BETWEEN ? AND ?
          UNION ALL
          SELECT DafirstVisit, Sex FROM tblcimain 
          WHERE DafirstVisit BETWEEN ? AND ?
        ) all_patients
        GROUP BY DATE_FORMAT(DafirstVisit, '%Y-%m')
        ORDER BY month
      `, [startDate, endDate, startDate, endDate]);

      trends.enrollment = enrollmentTrends;

      // ART initiation trends (temporarily removed to isolate error)
      // const [artTrends] = await connection.query(`
      //   SELECT 
      //     DATE_FORMAT(art_date, '%Y-%m') as month,
      //     COUNT(*) as new_art_starts,
      //     SUM(CASE WHEN sex = 0 THEN 1 ELSE 0 END) as female,
      //     SUM(CASE WHEN sex = 1 THEN 1 ELSE 0 END) as male
      //   FROM (
      //     SELECT DaArt as art_date, Sex as sex FROM tblaart a
      //     JOIN tblaimain p ON a.ClinicID = p.ClinicID
      //     WHERE DaArt BETWEEN ? AND ?
      //     UNION ALL
      //     SELECT DaArt as art_date, Sex as sex FROM tblcart a
      //     JOIN tblcimain p ON a.ClinicID = p.ClinicID
      //     WHERE DaArt BETWEEN ? AND ?
      //   ) all_art
      //   GROUP BY DATE_FORMAT(art_date, '%Y-%m')
      //   ORDER BY month
      // `, [startDate, endDate, startDate, endDate]);
      // trends.artInitiation = artTrends;

      // Viral load suppression trends
      const [vlTrends] = await connection.query(`
        SELECT 
          DATE_FORMAT(Dat, '%Y-%m') as month,
          COUNT(*) as total_tests,
          SUM(CASE WHEN CAST(HIVLoad AS UNSIGNED) < 1000 THEN 1 ELSE 0 END) as suppressed,
          ROUND(SUM(CASE WHEN CAST(HIVLoad AS UNSIGNED) < 1000 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as suppression_rate
        FROM tblpatienttest
        WHERE Dat BETWEEN ? AND ? 
          AND HIVLoad IS NOT NULL 
          AND HIVLoad REGEXP '^[0-9]+$'
        GROUP BY DATE_FORMAT(Dat, '%Y-%m')
        ORDER BY month
      `, [startDate, endDate]);

      trends.viralLoad = vlTrends;

      // Patient outcome trends
      const [outcomeTrends] = await connection.query(`
        SELECT 
          DATE_FORMAT(Da, '%Y-%m') as month,
          SUM(CASE WHEN Status = 1 THEN 1 ELSE 0 END) as deaths,
          SUM(CASE WHEN Status = 0 THEN 1 ELSE 0 END) as lost_to_followup,
          SUM(CASE WHEN Status = 3 THEN 1 ELSE 0 END) as transfers_out
        FROM (
          SELECT Da, Status FROM tblavpatientstatus
          WHERE Da BETWEEN ? AND ?
          UNION ALL
          SELECT Da, Status FROM tblcvpatientstatus
          WHERE Da BETWEEN ? AND ?
        ) all_outcomes
        GROUP BY DATE_FORMAT(Da, '%Y-%m')
        ORDER BY month
      `, [startDate, endDate, startDate, endDate]);

      trends.outcomes = outcomeTrends;

      const result = {
        period: { startDate, endDate },
        trends,
        summary: this.calculateTrendSummary(trends)
      };

      this.setCachedResult(cacheKey, result);
      return result;

    } finally {
      connection.release();
    }
  }

  // Predictive analytics for patient retention
  async predictPatientRetention(monthsAhead = 6) {
    const connection = await this.pool.getConnection();
    try {
      const predictions = {};

      // Calculate retention probability based on historical data
      const [retentionData] = await connection.query(`
        SELECT 
          'retention_analysis' as analysis_type,
          COUNT(DISTINCT p.ClinicID) as total_patients,
          COUNT(DISTINCT CASE WHEN v.DatVisit >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) THEN p.ClinicID END) as retained_3m,
          COUNT(DISTINCT CASE WHEN v.DatVisit >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) THEN p.ClinicID END) as retained_6m,
          COUNT(DISTINCT CASE WHEN v.DatVisit >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) THEN p.ClinicID END) as retained_12m
        FROM (
          SELECT ClinicID FROM tblaimain
          UNION ALL
          SELECT ClinicID FROM tblcimain
        ) p
        LEFT JOIN (
          SELECT ClinicID, DatVisit FROM tblavmain
          UNION ALL
          SELECT ClinicID, DatVisit FROM tblcvmain
        ) v ON p.ClinicID = v.ClinicID
      `);

      if (retentionData.length > 0) {
        const data = retentionData[0];
        const retention3m = (data.retained_3m / data.total_patients) * 100;
        const retention6m = (data.retained_6m / data.total_patients) * 100;
        const retention12m = (data.retained_12m / data.total_patients) * 100;

        // Simple linear prediction
        const monthlyRetentionRate = retention3m / 3;
        const predictedRetention = Math.max(0, Math.min(100, monthlyRetentionRate * monthsAhead));

        predictions.retention = {
          current: {
            '3_months': Math.round(retention3m * 100) / 100,
            '6_months': Math.round(retention6m * 100) / 100,
            '12_months': Math.round(retention12m * 100) / 100
          },
          predicted: {
            months_ahead: monthsAhead,
            retention_rate: Math.round(predictedRetention * 100) / 100,
            confidence: this.calculateConfidence(retention3m, retention6m, retention12m)
          }
        };
      }

      return predictions;

    } finally {
      connection.release();
    }
  }

  // Risk stratification analysis
  async analyzeRiskStratification() {
    const connection = await this.pool.getConnection();
    try {
      const riskAnalysis = {};

      // High risk patients (no recent visits, high viral load)
      const [highRiskPatients] = await connection.query(`
        SELECT 
          'high_risk' as risk_level,
          COUNT(DISTINCT p.ClinicID) as patient_count,
          'No recent visits or high viral load' as risk_factors
        FROM (
          SELECT ClinicID FROM tblaimain
          UNION ALL
          SELECT ClinicID FROM tblcimain
        ) p
        WHERE p.ClinicID IN (
          -- Patients with no visits in last 3 months
          SELECT DISTINCT ClinicID FROM (
            SELECT ClinicID FROM tblavmain WHERE DatVisit < DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
            UNION ALL
            SELECT ClinicID FROM tblcvmain WHERE DatVisit < DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
          ) no_recent_visits
        ) OR p.ClinicID IN (
          -- Patients with high viral load
          SELECT DISTINCT ClinicID FROM tblpatienttest 
          WHERE HIVLoad IS NOT NULL 
            AND HIVLoad REGEXP '^[0-9]+$'
            AND CAST(HIVLoad AS UNSIGNED) >= 1000
            AND Dat >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        )
      `);

      // Medium risk patients (missed appointments, moderate viral load)
      const [mediumRiskPatients] = await connection.query(`
        SELECT 
          'medium_risk' as risk_level,
          COUNT(DISTINCT p.ClinicID) as patient_count,
          'Missed appointments or moderate viral load' as risk_factors
        FROM (
          SELECT ClinicID FROM tblaimain
          UNION ALL
          SELECT ClinicID FROM tblcimain
        ) p
        WHERE p.ClinicID IN (
          -- Patients with missed appointments
          SELECT DISTINCT v.ClinicID FROM (
            SELECT ClinicID, DaApp FROM tblavmain WHERE DaApp < CURDATE() AND DaApp > DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
            UNION ALL
            SELECT ClinicID, DaApp FROM tblcvmain WHERE DaApp < CURDATE() AND DaApp > DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
          ) v
        ) OR p.ClinicID IN (
          -- Patients with moderate viral load
          SELECT DISTINCT ClinicID FROM tblpatienttest 
          WHERE HIVLoad IS NOT NULL 
            AND HIVLoad REGEXP '^[0-9]+$'
            AND CAST(HIVLoad AS UNSIGNED) BETWEEN 200 AND 999
            AND Dat >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        )
      `);

      // Low risk patients (regular visits, suppressed viral load)
      const [lowRiskPatients] = await connection.query(`
        SELECT 
          'low_risk' as risk_level,
          COUNT(DISTINCT p.ClinicID) as patient_count,
          'Regular visits and suppressed viral load' as risk_factors
        FROM (
          SELECT ClinicID FROM tblaimain
          UNION ALL
          SELECT ClinicID FROM tblcimain
        ) p
        WHERE p.ClinicID IN (
          -- Patients with recent visits
          SELECT DISTINCT ClinicID FROM (
            SELECT ClinicID FROM tblavmain WHERE DatVisit >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
            UNION ALL
            SELECT ClinicID FROM tblcvmain WHERE DatVisit >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
          ) recent_visits
        ) AND p.ClinicID IN (
          -- Patients with suppressed viral load
          SELECT DISTINCT ClinicID FROM tblpatienttest 
          WHERE HIVLoad IS NOT NULL 
            AND HIVLoad REGEXP '^[0-9]+$'
            AND CAST(HIVLoad AS UNSIGNED) < 200
            AND Dat >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        )
      `);

      riskAnalysis.riskLevels = [...highRiskPatients, ...mediumRiskPatients, ...lowRiskPatients];
      riskAnalysis.summary = this.calculateRiskSummary(riskAnalysis.riskLevels);

      return riskAnalysis;

    } finally {
      connection.release();
    }
  }

  // Performance benchmarking
  async benchmarkPerformance(comparisonPeriod = 'previous_quarter') {
    const connection = await this.pool.getConnection();
    try {
      const benchmarks = {};

      // Calculate current quarter metrics
      const currentQuarter = this.getQuarterDates();
      const previousQuarter = this.getPreviousQuarterDates();

      const [currentMetrics] = await connection.query(`
        SELECT 
          'current_quarter' as period,
          COUNT(DISTINCT p.ClinicID) as active_patients,
          COUNT(DISTINCT CASE WHEN v.DatVisit BETWEEN ? AND ? THEN p.ClinicID END) as patients_with_visits,
          ROUND(COUNT(DISTINCT CASE WHEN v.DatVisit BETWEEN ? AND ? THEN p.ClinicID END) * 100.0 / COUNT(DISTINCT p.ClinicID), 2) as visit_rate
        FROM (
          SELECT ClinicID FROM tblaimain
          UNION ALL
          SELECT ClinicID FROM tblcimain
        ) p
        LEFT JOIN (
          SELECT ClinicID, DatVisit FROM tblavmain
          UNION ALL
          SELECT ClinicID, DatVisit FROM tblcvmain
        ) v ON p.ClinicID = v.ClinicID
      `, [currentQuarter.start, currentQuarter.end, currentQuarter.start, currentQuarter.end]);

      const [previousMetrics] = await connection.query(`
        SELECT 
          'previous_quarter' as period,
          COUNT(DISTINCT p.ClinicID) as active_patients,
          COUNT(DISTINCT CASE WHEN v.DatVisit BETWEEN ? AND ? THEN p.ClinicID END) as patients_with_visits,
          ROUND(COUNT(DISTINCT CASE WHEN v.DatVisit BETWEEN ? AND ? THEN p.ClinicID END) * 100.0 / COUNT(DISTINCT p.ClinicID), 2) as visit_rate
        FROM (
          SELECT ClinicID FROM tblaimain
          UNION ALL
          SELECT ClinicID FROM tblcimain
        ) p
        LEFT JOIN (
          SELECT ClinicID, DatVisit FROM tblavmain
          UNION ALL
          SELECT ClinicID, DatVisit FROM tblcvmain
        ) v ON p.ClinicID = v.ClinicID
      `, [previousQuarter.start, previousQuarter.end, previousQuarter.start, previousQuarter.end]);

      benchmarks.comparison = {
        current: currentMetrics[0] || {},
        previous: previousMetrics[0] || {},
        improvement: this.calculateImprovement(currentMetrics[0], previousMetrics[0])
      };

      return benchmarks;

    } finally {
      connection.release();
    }
  }

  // Helper methods
  calculateTrendSummary(trends) {
    const summary = {};
    
    if (trends.enrollment && trends.enrollment.length > 0) {
      const recent = trends.enrollment.slice(-3);
      const avgEnrollment = recent.reduce((sum, m) => sum + m.new_enrollments, 0) / recent.length;
      summary.avgMonthlyEnrollment = Math.round(avgEnrollment);
    }
    
    if (trends.viralLoad && trends.viralLoad.length > 0) {
      const recent = trends.viralLoad.slice(-3);
      const avgSuppression = recent.reduce((sum, m) => sum + m.suppression_rate, 0) / recent.length;
      summary.avgSuppressionRate = Math.round(avgSuppression * 100) / 100;
    }
    
    return summary;
  }

  calculateConfidence(retention3m, retention6m, retention12m) {
    // Simple confidence calculation based on consistency
    const variance = Math.abs(retention3m - retention6m) + Math.abs(retention6m - retention12m);
    const confidence = Math.max(0, 100 - variance);
    return Math.round(confidence);
  }

  calculateRiskSummary(riskLevels) {
    const total = riskLevels.reduce((sum, level) => sum + level.patient_count, 0);
    const summary = {};
    
    riskLevels.forEach(level => {
      const percentage = total > 0 ? (level.patient_count / total) * 100 : 0;
      summary[level.risk_level] = {
        count: level.patient_count,
        percentage: Math.round(percentage * 100) / 100
      };
    });
    
    return summary;
  }

  calculateImprovement(current, previous) {
    if (!current || !previous) return {};
    
    const improvements = {};
    
    if (previous.active_patients > 0) {
      improvements.activePatients = Math.round(((current.active_patients - previous.active_patients) / previous.active_patients) * 100);
    }
    
    if (previous.visit_rate > 0) {
      improvements.visitRate = Math.round(((current.visit_rate - previous.visit_rate) / previous.visit_rate) * 100);
    }
    
    return improvements;
  }

  getQuarterDates() {
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const year = now.getFullYear();
    
    const start = new Date(year, currentQuarter * 3, 1);
    const end = new Date(year, (currentQuarter + 1) * 3, 0);
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }

  getPreviousQuarterDates() {
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const year = now.getFullYear();
    
    const prevQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
    const prevYear = currentQuarter === 0 ? year - 1 : year;
    
    const start = new Date(prevYear, prevQuarter * 3, 1);
    const end = new Date(prevYear, (prevQuarter + 1) * 3, 0);
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }
}

module.exports = AnalyticsEngine; 