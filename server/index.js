const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
require('dotenv').config();
const DataQualityMonitor = require('./dataQualityMonitor');
const PerformanceMonitor = require('./performanceMonitor');
const AnalyticsEngine = require('./analyticsEngine');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/plain' || 
        file.originalname.endsWith('.sql') || 
        file.originalname.endsWith('.txt')) {
      cb(null, true);
    } else {
      cb(new Error('Only SQL files (.sql) or text files (.txt) are allowed'), false);
    }
  }
});

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'test',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
});

// Query cache for performance
const queryCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Execution history
const executionHistory = [];
const MAX_HISTORY = 100;

// Helper function to get cached query result
const getCachedResult = (cacheKey) => {
  const cached = queryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

// Helper function to set cached query result
const setCachedResult = (cacheKey, data) => {
  queryCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
};

// Helper function to add to execution history
const addToHistory = (scriptPath, parameters, success, executionTime, rowsReturned) => {
  executionHistory.unshift({
    timestamp: new Date().toISOString(),
    scriptPath,
    parameters,
    success,
    executionTime,
    rowsReturned
  });
  
  // Keep only the last MAX_HISTORY entries
  if (executionHistory.length > MAX_HISTORY) {
    executionHistory.splice(MAX_HISTORY);
  }
};

// Test database connection
app.get('/api/test-connection', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    res.json({ success: true, message: 'Database connection successful' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ success: false, message: 'Database connection failed', error: error.message });
  }
});

// Get execution history
app.get('/api/history', (req, res) => {
  res.json({ success: true, history: executionHistory });
});

// Clear execution history
app.delete('/api/history', (req, res) => {
  executionHistory.length = 0;
  res.json({ success: true, message: 'Execution history cleared' });
});

// Get cache statistics
app.get('/api/cache-stats', (req, res) => {
  const stats = {
    cacheSize: queryCache.size,
    cacheKeys: Array.from(queryCache.keys()),
    maxCacheDuration: CACHE_DURATION
  };
  res.json({ success: true, stats });
});

// Clear cache
app.delete('/api/cache', (req, res) => {
  queryCache.clear();
  res.json({ success: true, message: 'Cache cleared' });
});

// Get list of available SQL scripts
app.get('/api/scripts', async (req, res) => {
  try {
    const scripts = [];
    
    // Read main indicator files
    const mainScripts = ['Indicator_ART.sql', 'Indicator_ART_update.sql'];
    for (const script of mainScripts) {
      if (await fs.pathExists(script)) {
        scripts.push({
          name: script,
          type: 'main',
          path: script
        });
      }
    }
    
    // Read MPI Report Scripts
    const mpiDir = path.join(__dirname, '../MPI Report Script');
    if (await fs.pathExists(mpiDir)) {
      const mpiFiles = await fs.readdir(mpiDir);
      for (const file of mpiFiles) {
        if (file.endsWith('.sql')) {
          scripts.push({
            name: file,
            type: 'mpi',
            path: path.join('MPI Report Script', file)
          });
        }
      }
    }
    
    res.json({ success: true, scripts });
  } catch (error) {
    console.error('Error reading scripts:', error);
    res.status(500).json({ success: false, message: 'Error reading scripts', error: error.message });
  }
});

// Get indicators for the dashboard
app.get('/api/indicators', async (req, res) => {
  const { script: scriptName } = req.query;

  if (!scriptName) {
    return res.status(400).json({ success: false, message: 'Script name is required' });
  }

  try {
    const scriptPath = path.resolve(__dirname, '..', scriptName);
    if (!await fs.pathExists(scriptPath)) {
      return res.status(404).json({ success: false, message: 'Script not found' });
    }

    const scriptContent = await fs.readFile(scriptPath, 'utf8');
    const connection = await pool.getConnection();

    try {
            const [results] = await connection.query(scriptContent);
      
      // When multipleStatements is true, results is an array of result sets.
      // We need to find the one that contains our indicator data.
      const dataRows = results.find(r => Array.isArray(r) && r.length > 0 && r[0].hasOwnProperty('Indicator'));

      if (dataRows) {
        const indicators = dataRows.map(row => ({
          name: row.Indicator || 'Unnamed Indicator',
          total: row.TOTAL || 0,
          male_0_14: row.Male_0_14 || 0,
          female_0_14: row.Female_0_14 || 0,
          male_over_14: row.Male_over_14 || 0,
          female_over_14: row.Female_over_14 || 0
        }));
        res.json({ success: true, indicators });
      } else {
        res.json({ success: true, indicators: [] });
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(`Error executing indicator script ${scriptName}:`, error);
    res.status(500).json({ success: false, message: 'Error executing indicator script', error: error.message });
  }
});

// Execute SQL script
app.post('/api/execute-script', async (req, res) => {
  const { scriptPath, parameters = {} } = req.body;
  
  if (!scriptPath) {
    return res.status(400).json({ success: false, message: 'Script path is required' });
  }
  
  const startTime = Date.now();
  
  try {
    // Create cache key based on script path and parameters
    const cacheKey = `${scriptPath}:${JSON.stringify(parameters)}`;
    
    // Check cache first
    const cachedResult = getCachedResult(cacheKey);
    if (cachedResult) {
      console.log('Returning cached result for:', scriptPath);
      const executionTime = Date.now() - startTime;
      addToHistory(scriptPath, parameters, true, executionTime, cachedResult.totalRows || 0);
      return res.json({
        ...cachedResult,
        cached: true,
        executionTime
      });
    }
    
    // Read the SQL script
    const scriptContent = await fs.readFile(scriptPath, 'utf8');
    
    // Two-phase execution: First SET statements, then main query
    const connection = await pool.getConnection();
    const results = [];
    
    try {
      // Phase 1: Extract and execute SET statements individually
      const setStatements = scriptContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && stmt.toUpperCase().startsWith('SET'));
      
      console.log(`Found ${setStatements.length} SET statements`);
      
      // Execute each SET statement individually
      for (let i = 0; i < setStatements.length; i++) {
        const statement = setStatements[i];
        try {
          console.log(`Executing SET statement ${i + 1}:`, statement.substring(0, 100) + '...');
          await connection.query(statement);
          results.push({
            statement: `SET Statement ${i + 1}`,
            rows: 1,
            data: [{ message: 'Statement executed successfully' }],
            type: 'set'
          });
        } catch (error) {
          console.error(`Error executing SET statement ${i + 1}:`, error.message);
          results.push({
            statement: `SET Statement ${i + 1} (Error)`,
            rows: 0,
            data: [],
            type: 'error',
            error: error.message
          });
        }
      }
      
      // Phase 2: Extract the main query (everything that's not a SET statement)
      // First, remove all SET statements and comments to get the main query
      let mainQuery = scriptContent;
      
      // Remove SET statements
      const setRegex = /SET\s+@\w+\s*=\s*[^;]+;/gi;
      mainQuery = mainQuery.replace(setRegex, '');
      
      // Remove comments
      mainQuery = mainQuery.replace(/--.*$/gm, '');
      
      // Clean up whitespace and get the main query
      mainQuery = mainQuery.trim();
      
      console.log('Main query length:', mainQuery.length);
      console.log('Main query preview:', mainQuery.substring(0, 500) + '...');
      
      // First, let's check what date ranges are available in the database
      console.log('Checking available date ranges in database...');
      try {
        const [dateRanges] = await connection.query(`
          SELECT 
            'Adult visits' as table_name,
            MIN(DatVisit) as min_date,
            MAX(DatVisit) as max_date,
            COUNT(*) as total_records
          FROM tblavmain
          UNION ALL
          SELECT 
            'Child visits' as table_name,
            MIN(DatVisit) as min_date,
            MAX(DatVisit) as max_date,
            COUNT(*) as total_records
          FROM tblcvmain
          UNION ALL
          SELECT 
            'Adult ART' as table_name,
            MIN(DaArt) as min_date,
            MAX(DaArt) as max_date,
            COUNT(*) as total_records
          FROM tblaart
          UNION ALL
          SELECT 
            'Child ART' as table_name,
            MIN(DaArt) as min_date,
            MAX(DaArt) as max_date,
            COUNT(*) as total_records
          FROM tblcart
        `);
        console.log('Available date ranges:', dateRanges);
      } catch (error) {
        console.error('Error checking date ranges:', error.message);
      }
      
      if (mainQuery.length > 0) {
        // Replace parameters in the main query
        let processedMainQuery = mainQuery;
        for (const [key, value] of Object.entries(parameters)) {
          const regex = new RegExp(`@${key}\\b`, 'g');
          processedMainQuery = processedMainQuery.replace(regex, `'${value}'`);
        }
        
        console.log('Executing main query...');
        console.log('Main query length:', processedMainQuery.length);
        console.log('Main query preview:', processedMainQuery.substring(0, 500) + '...');
        
        try {
          const [rows] = await connection.query(processedMainQuery);
          console.log('Query result:', rows);
          console.log('Result type:', typeof rows);
          console.log('Is array:', Array.isArray(rows));
          console.log('Length:', rows ? rows.length : 'null');
          
          if (Array.isArray(rows) && rows.length > 0) {
            results.push({
              statement: 'Main Indicator Query',
              rows: rows.length,
              data: rows,
              type: 'select',
              isData: true
            });
          } else {
            results.push({
              statement: 'Main Indicator Query (No Data)',
              rows: 0,
              data: [],
              type: 'select',
              isData: true
            });
          }
        } catch (error) {
          console.error('Error executing main query:', error.message);
          results.push({
            statement: 'Main Indicator Query (Error)',
            rows: 0,
            data: [],
            type: 'error',
            error: error.message
          });
        }
      }
      
      const executionTime = Date.now() - startTime;
      const totalRows = results.reduce((sum, r) => sum + (r.data ? r.data.length : 0), 0);
      
      // Add to execution history
      addToHistory(scriptPath, parameters, true, executionTime, totalRows);
      
      // Cache the result
      const resultData = {
        success: true,
        message: 'Script executed successfully',
        results: results,
        totalStatements: results.length,
        hasData: results.filter(r => r.type === 'select' && r.isData).length > 0,
        executionTime,
        totalRows
      };
      
      setCachedResult(cacheKey, resultData);
      
      res.json(resultData);
    } finally {
      connection.release();
    }
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('Error executing script:', error);
    
    // Add failed execution to history
    addToHistory(scriptPath, parameters, false, executionTime, 0);
    
    res.status(500).json({
      success: false,
      message: 'Error executing script',
      error: error.message,
      executionTime
    });
  }
});

// Get script content for preview
app.get('/api/script/:scriptPath(*)', async (req, res) => {
  try {
    const scriptPath = req.params.scriptPath;
    const content = await fs.readFile(scriptPath, 'utf8');
    res.json({ success: true, content });
  } catch (error) {
    console.error('Error reading script:', error);
    res.status(500).json({ success: false, message: 'Error reading script', error: error.message });
  }
});

// Import SQL file (simplified - no decryption)
app.post('/api/import-backup', upload.single('backupFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file provided' });
  }

  const { targetDatabase = 'preart' } = req.body;
  const tempFilePath = req.file.path;

  try {
    console.log('Starting database import process...');
    console.log('File:', req.file.originalname);
    console.log('Target database:', targetDatabase);

    // Read the file as plain text
    const fileContent = await fs.readFile(tempFilePath, 'utf8');
    console.log('File size:', fileContent.length, 'bytes');
        
    // Check if it's valid SQL
    if (!fileContent.includes('CREATE') && !fileContent.includes('INSERT') && !fileContent.includes('--')) {
      return res.status(400).json({ 
        success: false, 
        message: 'File does not appear to contain valid SQL content. Please upload a SQL file.',
        error: 'Invalid SQL content'
      });
    }

    console.log('File appears to be valid SQL');

    // Parse the SQL statements
    console.log('Parsing SQL statements...');
    const sqlStatements = fileContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log('Found', sqlStatements.length, 'SQL statements');

    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Drop existing database if it exists
      console.log('Dropping existing database if exists...');
      try {
        await connection.query(`DROP DATABASE IF EXISTS \`${targetDatabase}\``);
      } catch (dropError) {
        console.log('Database did not exist or could not be dropped:', dropError.message);
      }

      // Create new database
      console.log('Creating new database...');
      await connection.query(`CREATE DATABASE \`${targetDatabase}\` DEFAULT CHARACTER SET utf8`);
      
      // Use the new database
      await connection.query(`USE \`${targetDatabase}\``);

      // Execute SQL statements
      console.log('Executing SQL statements...');
      let executedCount = 0;
      let errorCount = 0;
      const errors = [];

      for (let i = 0; i < sqlStatements.length; i++) {
        const statement = sqlStatements[i];
        if (statement.toLowerCase().startsWith('use ')) {
          console.log(`Skipping 'USE' statement: ${statement.substring(0, 50)}...`);
          executedCount++;
          continue;
        }
        
          try {
            await connection.query(statement);
            executedCount++;
          } catch (error) {
          console.log(`Error in statement ${i + 1}:`, error.message.substring(0, 200));
            errorCount++;
            errors.push({
              statement: i + 1,
              error: error.message,
            sql: statement.substring(0, 50) + '...'
            });
        }
      }

      console.log(`Import completed. Executed: ${executedCount}, Errors: ${errorCount}`);

      res.json({
        success: true,
        message: 'Database imported successfully', 
        details: {
          targetDatabase,
          totalStatements: sqlStatements.length,
          executedStatements: executedCount,
          errorCount,
          errors
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error during import process:', error);
    res.status(500).json({ success: false, message: 'An error occurred during the import process', error: error.message });
  } finally {
    // Clean up uploaded file
    fs.unlink(tempFilePath).catch(err => console.error('Failed to delete temp file:', err));
  }
});

// Get import status and history
app.get('/api/import-status', (req, res) => {
  // This could be expanded to track import history
  res.json({
    success: true,
    message: 'Import functionality is available',
    supportedFormats: ['.sql', '.txt'],
    maxFileSize: '100MB',
    description: 'Upload SQL files to import database structure and data'
  });
});

// Data Quality API
app.get('/api/data-quality', async (req, res) => {
  try {
    const dataQualityMonitor = new DataQualityMonitor(pool);
    const report = await dataQualityMonitor.getQualityReport();
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating data quality report', error: error.message });
  }
});

// Performance API
app.get('/api/performance', async (req, res) => {
  try {
    const performanceMonitor = new PerformanceMonitor(pool);
    const report = await performanceMonitor.getPerformanceReport();
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating performance report', error: error.message });
  }
});

// Analytics API
app.get('/api/analytics', async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'startDate and endDate are required' });
    }
    const analyticsEngine = new AnalyticsEngine(pool);
    const report = await analyticsEngine.analyzePatientTrends(startDate, endDate);
    res.json({ success: true, report });
  } catch (error) {
    console.error('Analytics endpoint error:', error);
    if (error && error.stack) console.error(error.stack);
    res.status(500).json({ success: false, message: 'Error generating analytics report', error: error.message });
  }
});

// Advanced Analytics: Risk Stratification
app.get('/api/analytics/risk', async (req, res) => {
  try {
    const analyticsEngine = new AnalyticsEngine(pool);
    const report = await analyticsEngine.analyzeRiskStratification();
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating risk stratification report', error: error.message });
  }
});

// Advanced Analytics: Retention Prediction
app.get('/api/analytics/retention', async (req, res) => {
  const { monthsAhead } = req.query;
  try {
    const analyticsEngine = new AnalyticsEngine(pool);
    const report = await analyticsEngine.predictPatientRetention(Number(monthsAhead) || 6);
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating retention prediction report', error: error.message });
  }
});

// Advanced Analytics: Benchmarking
app.get('/api/analytics/benchmark', async (req, res) => {
  try {
    const analyticsEngine = new AnalyticsEngine(pool);
    const report = await analyticsEngine.benchmarkPerformance();
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating benchmarking report', error: error.message });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
}); 