import React from 'react';
import { motion } from 'framer-motion';
import { Info, Search } from 'lucide-react';

const EmptyState = ({ isFiltering }) => {
  const Icon = isFiltering ? Search : Info;
  const message = isFiltering ? "No Indicators Found" : "No Data Available";
  const suggestion = isFiltering
    ? "Try adjusting your filter or search query."
    : "There is currently no indicator data to display.";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="text-center py-16 px-6 mt-8 border border-slate-200 dark:border-slate-700/50 rounded-3xl bg-white/50 dark:bg-slate-900/60 backdrop-blur-md"
    >
      <div className="flex items-center justify-center mx-auto h-16 w-16 text-sky-500 dark:text-sky-300 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-full">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="mt-6 text-xl font-semibold text-slate-700 dark:text-slate-100">{message}</h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">{suggestion}</p>
    </motion.div>
  );
};

export default EmptyState;