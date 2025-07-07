import React from 'react';

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 flex-1">
    <div className="flex items-center">
      <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-500 dark:text-blue-400 mr-4">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      </div>
    </div>
  </div>
);

export default StatCard;
