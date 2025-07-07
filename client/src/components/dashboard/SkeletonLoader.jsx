import React from 'react';

const SkeletonLoader = () => (
  <div className="space-y-8 animate-pulse">
    <div className="flex justify-between items-start bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="text-right">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20 mb-2"></div>
        <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 h-24"></div>
      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 h-24"></div>
      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 h-24"></div>
      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 h-24"></div>
    </div>
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-80"></div>
  </div>
);

export default SkeletonLoader;
