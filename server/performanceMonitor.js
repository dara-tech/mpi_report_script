const mysql = require('mysql2/promise');

class PerformanceMonitor {
  constructor(pool) {
    this.pool = pool;
    this.performanceMetrics = new Map();
    this.slowQueryThreshold = 5000; // 5 seconds
    this.queryStats = new Map();
  }

  // Start query timing
  startQueryTimer(queryId) {
    this.queryStats.set(queryId, {
      startTime: Date.now(),
      queryId,
      status: 'running'
    });
  }

  // End query timing and record metrics
  endQueryTimer(queryId, success = true, error = null) {
    const stats = this.queryStats.get(queryId);
    if (stats) {
      stats.endTime = Date.now();
      stats.duration = stats.endTime - stats.startTime;
      stats.success = success;
      stats.error = error;
      stats.status = 'completed';
      
      // Record slow queries
      if (stats.duration > this.slowQueryThreshold) {
        this.recordSlowQuery(stats);
      }
      
      // Update performance metrics
      this.updatePerformanceMetrics(stats);
    }
  }

  // Record slow query for analysis
  recordSlowQuery(stats) {
    if (!this.performanceMetrics.has('slowQueries')) {
      this.performanceMetrics.set('slowQueries', []);
    }
    
    const slowQueries = this.performanceMetrics.get('slowQueries');
    slowQueries.push({
      ...stats,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 100 slow queries
    if (slowQueries.length > 100) {
      slowQueries.splice(0, slowQueries.length - 100);
    }
  }

  // Update overall performance metrics
  updatePerformanceMetrics(stats) {
    if (!this.performanceMetrics.has('overall')) {
      this.performanceMetrics.set('overall', {
        totalQueries: 0,
        successfulQueries: 0,
        failedQueries: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        slowQueryCount: 0
      });
    }
    
    const overall = this.performanceMetrics.get('overall');
    overall.totalQueries++;
    overall.totalDuration += stats.duration;
    overall.averageDuration = overall.totalDuration / overall.totalQueries;
    overall.minDuration = Math.min(overall.minDuration, stats.duration);
    overall.maxDuration = Math.max(overall.maxDuration, stats.duration);
    
    if (stats.success) {
      overall.successfulQueries++;
    } else {
      overall.failedQueries++;
    }
    
    if (stats.duration > this.slowQueryThreshold) {
      overall.slowQueryCount++;
    }
  }

  // Get database performance statistics
  async getDatabaseStats() {
    const connection = await this.pool.getConnection();
    try {
      const stats = {};
      
      // Get table sizes
      const [tableSizes] = await connection.query(`
        SELECT 
          table_name,
          ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)',
          table_rows
        FROM information_schema.tables 
        WHERE table_schema = DATABASE()
        ORDER BY (data_length + index_length) DESC
      `);
      
      stats.tableSizes = tableSizes;
      
      // Get index statistics
      const [indexStats] = await connection.query(`
        SELECT 
          table_name,
          index_name,
          cardinality,
          sub_part,
          packed,
          null,
          index_type
        FROM information_schema.statistics 
        WHERE table_schema = DATABASE()
        ORDER BY table_name, index_name
      `);
      
      stats.indexStats = indexStats;
      
      // Get connection statistics
      const [connectionStats] = await connection.query(`
        SHOW STATUS LIKE 'Connections'
      `);
      
      stats.connectionStats = connectionStats;
      
      return stats;
      
    } finally {
      connection.release();
    }
  }

  // Get query performance analysis
  async getQueryPerformanceAnalysis() {
    const connection = await this.pool.getConnection();
    try {
      const analysis = {};
      
      // Analyze query patterns
      const [queryPatterns] = await connection.query(`
        SELECT 
          'Adult vs Child queries' as analysis_type,
          'tblaimain' as table_name,
          COUNT(*) as record_count,
          'Adult patient queries' as description
        FROM tblaimain
        UNION ALL
        SELECT 
          'Adult vs Child queries' as analysis_type,
          'tblcimain' as table_name,
          COUNT(*) as record_count,
          'Child patient queries' as description
        FROM tblcimain
        UNION ALL
        SELECT 
          'Visit frequency analysis' as analysis_type,
          'tblavmain' as table_name,
          COUNT(*) as record_count,
          'Adult visit records' as description
        FROM tblavmain
        UNION ALL
        SELECT 
          'Visit frequency analysis' as analysis_type,
          'tblcvmain' as table_name,
          COUNT(*) as record_count,
          'Child visit records' as description
        FROM tblcvmain
      `);
      
      analysis.queryPatterns = queryPatterns;
      
      // Analyze date ranges for optimization
      const [dateRanges] = await connection.query(`
        SELECT 
          'Date range analysis' as analysis_type,
          'tblavmain' as table_name,
          MIN(DatVisit) as min_date,
          MAX(DatVisit) as max_date,
          COUNT(*) as total_records,
          'Adult visit date range' as description
        FROM tblavmain
        UNION ALL
        SELECT 
          'Date range analysis' as analysis_type,
          'tblcvmain' as table_name,
          MIN(DatVisit) as min_date,
          MAX(DatVisit) as max_date,
          COUNT(*) as total_records,
          'Child visit date range' as description
        FROM tblcvmain
        UNION ALL
        SELECT 
          'Date range analysis' as analysis_type,
          'tblaart' as table_name,
          MIN(DaArt) as min_date,
          MAX(DaArt) as max_date,
          COUNT(*) as total_records,
          'Adult ART date range' as description
        FROM tblaart
        UNION ALL
        SELECT 
          'Date range analysis' as analysis_type,
          'tblcart' as table_name,
          MIN(DaArt) as min_date,
          MAX(DaArt) as max_date,
          COUNT(*) as total_records,
          'Child ART date range' as description
        FROM tblcart
      `);
      
      analysis.dateRanges = dateRanges;
      
      return analysis;
      
    } finally {
      connection.release();
    }
  }

  // Get performance recommendations
  getPerformanceRecommendations() {
    const overall = this.performanceMetrics.get('overall') || {};
    const slowQueries = this.performanceMetrics.get('slowQueries') || [];
    
    const recommendations = [];
    
    // Analyze slow query patterns
    if (slowQueries.length > 0) {
      const avgSlowQueryDuration = slowQueries.reduce((sum, q) => sum + q.duration, 0) / slowQueries.length;
      
      recommendations.push({
        type: 'slow_queries',
        priority: 'high',
        title: 'Slow Query Optimization',
        description: `${slowQueries.length} queries are taking longer than ${this.slowQueryThreshold}ms (avg: ${Math.round(avgSlowQueryDuration)}ms)`,
        action: 'Consider adding indexes or optimizing query structure'
      });
    }
    
    // Analyze success rate
    if (overall.totalQueries > 0) {
      const successRate = (overall.successfulQueries / overall.totalQueries) * 100;
      
      if (successRate < 95) {
        recommendations.push({
          type: 'error_rate',
          priority: 'medium',
          title: 'High Error Rate',
          description: `Query success rate is ${successRate.toFixed(1)}% (${overall.failedQueries} failed queries)`,
          action: 'Review error logs and fix data quality issues'
        });
      }
    }
    
    // Analyze average query time
    if (overall.averageDuration > 2000) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        title: 'Slow Average Query Time',
        description: `Average query time is ${Math.round(overall.averageDuration)}ms`,
        action: 'Consider query optimization and caching strategies'
      });
    }
    
    return recommendations;
  }

  // Get comprehensive performance report
  async getPerformanceReport() {
    const overall = this.performanceMetrics.get('overall') || {};
    const slowQueries = this.performanceMetrics.get('slowQueries') || [];
    const dbStats = await this.getDatabaseStats();
    const queryAnalysis = await this.getQueryPerformanceAnalysis();
    const recommendations = this.getPerformanceRecommendations();
    
    return {
      timestamp: new Date().toISOString(),
      overall,
      slowQueries: slowQueries.slice(-10), // Last 10 slow queries
      databaseStats: dbStats,
      queryAnalysis,
      recommendations,
      summary: {
        performanceScore: this.calculatePerformanceScore(overall),
        optimizationOpportunities: recommendations.length
      }
    };
  }

  calculatePerformanceScore(overall) {
    if (overall.totalQueries === 0) return 100;
    
    let score = 100;
    
    // Deduct points for slow queries
    const slowQueryPercentage = (overall.slowQueryCount / overall.totalQueries) * 100;
    score -= slowQueryPercentage * 10;
    
    // Deduct points for failed queries
    const failureRate = (overall.failedQueries / overall.totalQueries) * 100;
    score -= failureRate * 20;
    
    // Deduct points for slow average time
    if (overall.averageDuration > 1000) {
      score -= Math.min(20, (overall.averageDuration - 1000) / 100);
    }
    
    return Math.max(0, Math.round(score));
  }

  // Reset performance metrics
  resetMetrics() {
    this.performanceMetrics.clear();
    this.queryStats.clear();
  }
}

module.exports = PerformanceMonitor; 