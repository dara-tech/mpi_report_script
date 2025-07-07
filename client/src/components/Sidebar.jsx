import React from 'react';
import { Database, FileText, Play, BarChart2, BarChartBig, Settings, ChevronLeft, ChevronRight, Upload } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, connectionStatus, isCollapsed, toggleSidebar }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Database },
    { id: 'scripts', label: 'Scripts', icon: FileText },
    { id: 'execution', label: 'Execution', icon: Play },
    { id: 'results', label: 'Results', icon: BarChart2 },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'advanced-dashboard', label: 'Advanced Dashboard', icon: BarChartBig },
  ];

  return (
    <div className={`backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-r border-blue-200/30 dark:border-blue-400/10 flex flex-col flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}
      style={{}}>
      <div className={`flex items-center h-16 border-b border-blue-200/30 dark:border-blue-400/10 px-4 ${isCollapsed ? 'justify-center' : ''}`}>
        <Database size={28} className="text-cyan-500 dark:text-cyan-400 flex-shrink-0" />
        <span className={`ml-2 text-xl font-bold truncate tracking-wide transition-opacity duration-300 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'} text-gray-900 dark:text-white`}>SQL Analyst</span>
      </div>
      <nav className="flex-grow mt-4 space-y-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            title={isCollapsed ? item.label : ''}
            className={`relative flex items-center w-full py-2 text-sm font-medium transition-all duration-200 
              ${isCollapsed ? 'justify-center px-2' : 'px-4'}
              ${activeTab === item.id
                ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-100/50 dark:bg-cyan-900/30'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/30 hover:text-cyan-600 dark:hover:text-cyan-400'}`}
          >
            <div className={`p-2 rounded-lg ${activeTab === item.id ? 'bg-cyan-300/40 dark:bg-cyan-800/60' : ''}`}>
              <item.icon size={20} className="flex-shrink-0" />
            </div>
            <span className={`ml-4 truncate transition-all duration-300 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>{item.label}</span>
            {activeTab === item.id && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-full bg-cyan-400 dark:bg-cyan-500 animate-pulse" />
            )}
          </button>
        ))}
        <div className="my-2 border-t border-blue-200/30 dark:border-blue-400/10" />
      </nav>
      <div className="p-4 border-t border-blue-200/30 dark:border-blue-400/10 mt-2">
        <div className={`flex items-center p-2 rounded-lg bg-cyan-50/60 dark:bg-cyan-900/30 mb-4 transition-all duration-300 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${connectionStatus?.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={`ml-2 text-xs font-medium truncate ${isCollapsed ? 'hidden' : 'block'} text-gray-700 dark:text-gray-200`}>{connectionStatus?.success ? 'DB Connected' : 'DB Disconnected'}</span>
        </div>
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 rounded-lg text-cyan-500 hover:bg-cyan-100/60 dark:hover:bg-cyan-800/30 dark:text-cyan-400"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
