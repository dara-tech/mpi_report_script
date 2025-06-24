import React from 'react';
import { Database, FileText, Play, BarChart2, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, connectionStatus, isCollapsed, toggleSidebar }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Database },
    { id: 'scripts', label: 'Scripts', icon: FileText },
    { id: 'execution', label: 'Execution', icon: Play },
    { id: 'results', label: 'Results', icon: BarChart2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`flex items-center h-16 border-b border-gray-200 dark:border-gray-700 px-4 ${isCollapsed ? 'justify-center' : ''}`}>
        <Database size={28} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
        <span className={`ml-2 text-xl font-bold truncate transition-opacity duration-300 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>SQL Analyst</span>
      </div>
      <nav className="flex-grow mt-4">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            title={isCollapsed ? item.label : ''}
            className={`flex items-center w-full py-3 text-left text-sm font-medium transition-colors duration-150 relative ${isCollapsed ? 'justify-center px-2' : 'px-6'}
              ${
                activeTab === item.id
                  ? 'text-blue-600 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            {activeTab === item.id && !isCollapsed && <div className="absolute left-0 w-1 h-full bg-blue-500 rounded-r-md"></div>}
            <div className={`p-2 rounded-lg ${activeTab === item.id ? 'bg-blue-50 dark:bg-blue-900/50' : ''}`}>
              <item.icon size={20} className="flex-shrink-0" />
            </div>
            <span className={`ml-4 truncate transition-all duration-300 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>{item.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className={`flex items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 mb-4 transition-all duration-300 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${connectionStatus?.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`ml-2 text-xs font-medium truncate ${isCollapsed ? 'hidden' : 'block'}`}>{connectionStatus?.success ? 'DB Connected' : 'DB Disconnected'}</span>
        </div>
        
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
