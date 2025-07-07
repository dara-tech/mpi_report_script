import React from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const DashboardHeader = ({ filter, onFilterChange, onRefresh, isLoading, indicatorCount }) => {
  return (
    <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="mb-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Health Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{isLoading ? 'Fetching latest data...' : `${indicatorCount} indicators shown`}</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
            <input
              type="text"
              value={filter}
              onChange={(e) => onFilterChange(e.target.value)}
              placeholder="Filter indicators..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 backdrop-blur-sm transition-all duration-300"
            />
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 backdrop-blur-sm"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardHeader;