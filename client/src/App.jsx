import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Database, Play, Eye, FileText, CheckCircle, XCircle, AlertCircle, Settings, Upload, Sun, Moon, RefreshCw } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import LoadingOverlay from './components/LoadingOverlay';
import ParameterForm from './components/ParameterForm';
import CodeEditor from './components/CodeEditor';
import ResultsTable from './components/ResultsTable';
import DebugPanel from './components/DebugPanel';
import Dashboard from './components/Dashboard';
import AdvancedDashboard from './components/AdvancedDashboard';
import FileUpload from './components/FileUpload';

import ScriptExecutionPanel from './components/ScriptExecutionPanel';

function App() {
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedScript, setSelectedScript] = useState(null);
  const [scriptContent, setScriptContent] = useState('');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [parameters, setParameters] = useState({});
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('sqlAnalystActiveTab') || 'dashboard';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('table');
  const [exportFormat, setExportFormat] = useState('csv');
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const [currentScriptPath, setCurrentScriptPath] = useState(null);
  const [indicators, setIndicators] = useState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Helper function to normalize names for comparison
  const normalizeForMatch = (name) => {
    if (!name) return '';
    return (
      name
        // Remove .sql extension
        .replace(/\.sql$/i, '')
        // Remove leading numbers, allowing for optional trailing dot and space/underscore separator
        .replace(/^\d+(\.\d+)*\.?_?/, '')
        // Remove special characters, keeping only letters, numbers, and whitespace
        .replace(/[^\w\s]/g, '')
        .trim()
        // Standardize all space/underscore separators to a single underscore
        .replace(/[\s_]+/g, '_')
        .toLowerCase()
    );
  };

  const handleSelectScript = (indicatorName) => {
    const normalizedIndicatorName = normalizeForMatch(indicatorName);

    const scriptToSelect = scripts.find(
      (s) => normalizeForMatch(s.name) === normalizedIndicatorName
    );

    if (scriptToSelect) {
      setSelectedScript(scriptToSelect);
      setActiveTab('execution');
    } else {
      console.error(
        `Script not found for indicator "${indicatorName}".`
      );
      console.log(`Normalized indicator name: "${normalizedIndicatorName}"`);
      console.log("Available normalized script names:", scripts.map(s => normalizeForMatch(s.name)));
      showToast(`Script for indicator "${indicatorName}" not found.`, 'error');
    }
  };
  
  // Import state

  
  const [settings, setSettings] = useState({
    database: {
      host: '127.0.0.1',
      port: '3306',
      database: 'preart',
      username: '',
      password: ''
    },
    defaults: {
      startDate: '2025-01-01',
      endDate: '2025-03-31',
      previousStartDate: '2024-10-01',
      previousEndDate: '2024-12-31',
      mmdDrugQuantity: '60',
      vlSuppressionThreshold: '1000',
      quarter: 'Q1',
      year: '2025',
      deadCode: '1',
      transferOutCode: '3',
      transferInCode: '1',
      tldRegimenFormula: '3TC + DTG + TDF',
      tptDrugList: "'Isoniazid','3HP','6H'"
    },
    export: {
      defaultFormat: 'csv',
      includeHeaders: true,
      autoExport: false
    },
    ui: {
      theme: 'light',
      rowsPerPage: 20,
      autoNavigateToResults: true
    }
  });

  // Save activeTab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sqlAnalystActiveTab', activeTab);
  }, [activeTab]);

  // Toast helpers
  const showToast = (message, type = 'info', duration = 3000) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), duration);
  };

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('sqlAnalystSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem('sqlAnalystSettings', JSON.stringify(settings));
  }, [settings]);

    const fetchIndicators = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/indicators?script=Indicator_ART_update.sql');
      if (response.data && Array.isArray(response.data.indicators)) {
        setIndicators(response.data.indicators);
      } else {
        setIndicators([]);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard indicators:', error);
      showToast('Could not load dashboard indicators.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard' || activeTab === 'advanced-dashboard') {
      fetchIndicators();
    }
  }, [activeTab]);

  const updateSettings = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const applySettingsToCurrentScript = () => {
    if (selectedScript && scriptContent) {
      const extractedParams = extractParametersFromScript(scriptContent);
      
      // Only apply settings defaults for parameters that exist in the script
      const paramsWithDefaults = {};
      Object.keys(extractedParams).forEach(paramName => {
        paramsWithDefaults[paramName] = extractedParams[paramName];
      });
      
      setParameters(paramsWithDefaults);
      showToast('Settings applied to current script', 'success');
    } else {
      showToast('No script selected', 'info');
    }
  };

  useEffect(() => {
    testConnection();
    loadScripts();
  }, []);

  const testConnection = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/test-connection');
      setConnectionStatus(response.data);
      showToast('Database connection successful', 'success');
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: 'Database connection failed',
        error: error.response?.data?.error || error.message
      });
      showToast('Database connection failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadScripts = async () => {
    try {
      const response = await axios.get('/api/scripts');
      setScripts(response.data.scripts);
    } catch (error) {
      showToast('Error loading scripts', 'error');
    }
  };

  const executeScript = async (script, customParams = {}) => {
    setLoading(true);
    setResults(null);
    setIsLoading(true);
    try {
      const finalParams = { ...parameters, ...customParams };
      const response = await fetch('/api/execute-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptPath: script.path, parameters: finalParams })
      });
      if (!response.ok) {
        const errorText = await response.text();
        showToast('Script execution failed', 'error');
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      const data = await response.json();

      if (data && Array.isArray(data.results)) {
        const formattedResults = data.results.map(result => {
          if (result && Array.isArray(result.data)) {
            return {
              ...result,
              data: result.data.map(row => {
                const newRow = { ...row };
                Object.keys(newRow).forEach(key => {
                  const value = newRow[key];
                  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
                    newRow[key] = value.split('T')[0];
                  }
                });
                return newRow;
              })
            };
          }
          return result;
        });

        setResults({ ...data, results: formattedResults });
        showToast('Script executed successfully', 'success');
        if (settings.ui.autoNavigateToResults) {
          setActiveTab('results');
        }
      } else {
        console.warn("API response format is not as expected. Setting raw data.", data);
        setResults(data);
        showToast('Script executed, but response format was unexpected.', 'warning');
      }
      setPage(1);
    } catch (error) {
      setResults({ success: false, message: 'Failed to execute script', error: error.message });
      showToast('Failed to execute script', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleParameterChange = (key, value) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  };

  const extractParametersFromScript = (content) => {
    if (!content) return {};
    const paramMatches = content.match(/@(\w+)/g);
    if (!paramMatches) return {};
    const uniqueParams = [...new Set(paramMatches)];
    const extractedParams = {};
    const userConfigurableParams = [
      'StartDate', 'EndDate', 'PreviousStartDate', 'PreviousEndDate',
      'mmd_drug_quantity', 'vl_suppression_threshold', 'quarter', 'year',
      'dead_code', 'transfer_out_code', 'transfer_in_code', 'tld_regimen_formula',
      'tpt_drug_list'
    ];
    uniqueParams.forEach(match => {
      const paramName = match.substring(1);
      if (userConfigurableParams.includes(paramName)) {
        let defaultValue = '';
        switch (paramName.toLowerCase()) {
          case 'startdate': defaultValue = settings.defaults.startDate; break;
          case 'enddate': defaultValue = settings.defaults.endDate; break;
          case 'previousstartdate': defaultValue = settings.defaults.previousStartDate; break;
          case 'previousenddate': defaultValue = settings.defaults.previousEndDate; break;
          case 'mmd_drug_quantity': defaultValue = settings.defaults.mmdDrugQuantity; break;
          case 'vl_suppression_threshold': defaultValue = settings.defaults.vlSuppressionThreshold; break;
          case 'quarter': defaultValue = settings.defaults.quarter; break;
          case 'year': defaultValue = settings.defaults.year; break;
          case 'dead_code': defaultValue = '1'; break;
          case 'transfer_out_code': defaultValue = '3'; break;
          case 'transfer_in_code': defaultValue = '1'; break;
          case 'tld_regimen_formula': defaultValue = '3TC + DTG + TDF'; break;
          case 'tpt_drug_list': defaultValue = "'Isoniazid','3HP','6H'"; break;
          default: defaultValue = '';
        }
        extractedParams[paramName] = defaultValue;
      }
    });
    return extractedParams;
  };

  useEffect(() => {
    if (selectedScript && selectedScript.path !== currentScriptPath) {
      setCurrentScriptPath(selectedScript.path);
      loadScriptParameters(selectedScript);
    }
    // eslint-disable-next-line
  }, [selectedScript]);

  const loadScriptParameters = async (script) => {
    try {
      const response = await axios.get(`/api/script/${encodeURIComponent(script.path)}`);
      const content = response.data.content;
      setScriptContent(content);
      const extractedParams = extractParametersFromScript(content);
      
      // Only set the parameters that were actually found in the script
      setParameters(extractedParams);
    } catch (error) {
      showToast('Error loading script parameters', 'error');
    }
  };

  const exportData = (data, format) => {
    if (!data || data.length === 0) {
      showToast('No data to export', 'info');
      return;
    }
    try {
      let content, filename, mimeType;
      
      const exportData = Array.isArray(data) ? data : [data];
      
      if (format === 'csv') {
        const headers = Object.keys(exportData[0]);
        const csvContent = [
          ...(settings.export.includeHeaders ? [headers.join(',')] : []),
          ...exportData.map(row => headers.map(header => `"${row[header]}"`).join(','))
        ].join('\n');
        content = csvContent;
        filename = `${selectedScript?.name || 'data'}_${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      } else {
        content = JSON.stringify(exportData, null, 2);
        filename = `${selectedScript?.name || 'data'}_${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      }
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Data exported', 'success');
    } catch (error) {
      showToast('Failed to export data', 'error');
    }
  };

  const filteredScripts = scripts.filter(script =>
    script.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'type') return a.type.localeCompare(b.type);
    return 0;
  });

  const mainData = results?.results && results.results.filter(r => r.type === 'select' && r.data && r.data.length > 0);

  const rowsPerPage = settings.ui.rowsPerPage;
  const currentData = useMemo(() => (mainData && mainData.length > 0 ? mainData[0].data : []), [mainData]);
  const pagedRows = currentData.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalRows = currentData.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);



  return (
    <div className={`flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans`}>
      <LoadingOverlay show={loading} />
      <Toast toast={toast} onClose={() => setToast(null)} />
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        connectionStatus={connectionStatus} 
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
              {activeTab === 'upload' && <FileUpload showToast={showToast} onUploadSuccess={loadScripts} />} 
        <header className="flex items-center justify-between px-8 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
          <h1 className="text-2xl font-semibold capitalize">{activeTab}</h1>
          <div className="flex items-center gap-4">
            <button onClick={testConnection} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <RefreshCw size={20} className={`${loading ? 'animate-spin' : ''}`} />
            </button>

          </div>
        </header>

      <main className="flex-1 overflow-y-auto p-8">
        {activeTab === 'dashboard' && (
          <Dashboard 
            connectionStatus={connectionStatus}
            scripts={scripts}
            setActiveTab={setActiveTab}
            indicators={indicators} 
            onSelectScript={handleSelectScript} 
            isLoading={isLoading}
            onRefresh={fetchIndicators}
          />
        )}
        {activeTab === 'advanced-dashboard' && (
          <AdvancedDashboard indicators={indicators} isLoading={isLoading} />
        )}

        {activeTab === 'scripts' && (
          <section>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex gap-2 w-full md:w-auto">
                <input
                  type="text"
                  className="border border-gray-300 rounded px-3 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Search scripts..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <select
                  className="border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                >
                  <option value="name">Sort by Name</option>
                  <option value="type">Sort by Type</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredScripts.map(script => (
                <div
                  key={script.path}
                  className={`border border-gray-200 rounded-lg p-4 cursor-pointer transition ${selectedScript?.path === script.path ? 'ring-2 ring-blue-400' : ''}`}
                  onClick={() => {
                    setSelectedScript(script);
                    setActiveTab('execution');
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{script.type === 'main' ? '📊' : '📁'}</span>
                    <span className="font-semibold text-base truncate">{script.name}</span>
                  </div>
                  <div className="text-xs text-gray-500 truncate mb-3">{script.path}</div>
                  <button
                    className="px-3 py-1 rounded bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition"
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedScript(script);
                      setActiveTab('execution');
                    }}
                  >Execute</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'execution' && selectedScript && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <ParameterForm
                parameters={parameters}
                onChange={handleParameterChange}
                onSubmit={() => executeScript(selectedScript)}
                loading={loading}
              />
              <button
                type="button"
                className="mt-2 w-full py-2 rounded bg-gray-500 text-white font-semibold hover:bg-gray-600 transition"
                onClick={() => {
                  if (selectedScript && scriptContent) {
                    const extractedParams = extractParametersFromScript(scriptContent);
                    const paramsWithDefaults = {
                      ...extractedParams,
                      StartDate: extractedParams.StartDate || settings.defaults.startDate,
                      EndDate: extractedParams.EndDate || settings.defaults.endDate,
                      PreviousStartDate: extractedParams.PreviousStartDate || settings.defaults.previousStartDate,
                      PreviousEndDate: extractedParams.PreviousEndDate || settings.defaults.previousEndDate,
                      mmd_drug_quantity: extractedParams.mmd_drug_quantity || settings.defaults.mmdDrugQuantity,
                      vl_suppression_threshold: extractedParams.vl_suppression_threshold || settings.defaults.vlSuppressionThreshold,
                      quarter: extractedParams.quarter || settings.defaults.quarter,
                      year: extractedParams.year || settings.defaults.year
                    };
                    setParameters(paramsWithDefaults);
                    showToast('Parameters reset to defaults', 'info');
                  }
                }}
              >
                🔄 Reset Parameters
              </button>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-4">Script Editor</h2>
              <CodeEditor code={scriptContent} setCode={setScriptContent} />
            </div>
          </section>
        )}

        {activeTab === 'results' && (
          <section>
            {results ? (
              <>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-semibold">Results</h2>
                    <div className="text-sm text-gray-500">{results.success ? '✅ Script executed successfully' : '❌ Execution failed'}</div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      className="border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none"
                      value={exportFormat}
                      onChange={e => setExportFormat(e.target.value)}
                    >
                      <option value="csv">Export as CSV</option>
                      <option value="json">Export as JSON</option>
                    </select>
                    <button
                      className="px-3 py-1 rounded bg-green-500 text-white text-xs font-medium hover:bg-green-600 transition"
                      onClick={() => exportData(currentData, exportFormat)}
                      disabled={!currentData || currentData.length === 0}
                    >Export Data</button>
                  </div>
                </div>
                <ResultsTable data={loading ? null : currentData} />
                {results.error && (
                  <div className="mt-4 text-red-500 text-sm">{results.error}</div>
                )}
                <DebugPanel data={results} />
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Yet</h3>
                <p className="text-gray-500 mb-4">Execute a script to see results here.</p>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  onClick={() => setActiveTab('scripts')}
                >
                  Browse Scripts
                </button>
              </div>
            )}
          </section>
        )}


     
        {activeTab === 'settings' && (
          <section className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Settings</h2>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                onClick={applySettingsToCurrentScript}
              >
                Apply to Current Script
              </button>
            </div>
            
            {/* Database Settings */}
            <div className="border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Database Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Host</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={settings.database.host}
                    onChange={e => updateSettings('database', 'host', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={settings.database.port}
                    onChange={e => updateSettings('database', 'port', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Database</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={settings.database.database}
                    onChange={e => updateSettings('database', 'database', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={settings.database.username}
                    onChange={e => updateSettings('database', 'username', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={settings.database.password}
                    onChange={e => updateSettings('database', 'password', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Default Parameters */}
            <div className="border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Default Parameters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={settings.defaults.startDate}
                    onChange={e => updateSettings('defaults', 'startDate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={settings.defaults.endDate}
                    onChange={e => updateSettings('defaults', 'endDate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MMD Drug Quantity</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={settings.defaults.mmdDrugQuantity}
                    onChange={e => updateSettings('defaults', 'mmdDrugQuantity', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">VL Suppression Threshold</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={settings.defaults.vlSuppressionThreshold}
                    onChange={e => updateSettings('defaults', 'vlSuppressionThreshold', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Export Settings */}
            <div className="border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Export Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Export Format</label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={settings.export.defaultFormat}
                    onChange={e => updateSettings('export', 'defaultFormat', e.target.value)}
                  >
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeHeaders"
                    className="mr-2"
                    checked={settings.export.includeHeaders}
                    onChange={e => updateSettings('export', 'includeHeaders', e.target.checked)}
                  />
                  <label htmlFor="includeHeaders" className="text-sm font-medium text-gray-700">
                    Include headers in CSV exports
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoExport"
                    className="mr-2"
                    checked={settings.export.autoExport}
                    onChange={e => updateSettings('export', 'autoExport', e.target.checked)}
                  />
                  <label htmlFor="autoExport" className="text-sm font-medium text-gray-700">
                    Auto-export results after execution
                  </label>
                </div>
              </div>
            </div>

            {/* UI Settings */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Interface Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rows per page</label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={settings.ui.rowsPerPage}
                    onChange={e => updateSettings('ui', 'rowsPerPage', parseInt(e.target.value))}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoNavigate"
                    className="mr-2"
                    checked={settings.ui.autoNavigateToResults}
                    onChange={e => updateSettings('ui', 'autoNavigateToResults', e.target.checked)}
                  />
                  <label htmlFor="autoNavigate" className="text-sm font-medium text-gray-700">
                    Automatically navigate to results after execution
                  </label>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
        </div>
    </div>
  );
}

export default App;





