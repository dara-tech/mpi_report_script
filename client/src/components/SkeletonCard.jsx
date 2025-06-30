import React from 'react';

const SkeletonCard = () => (
  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse">
    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-4"></div>
    <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-6"></div>
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-5">
      {/* Age Group Skeleton */}
      <div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-2.5"></div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
          </div>
          <div className="flex justify-between items-center">
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
          </div>
        </div>
      </div>

      {/* Age Group Skeleton */}
      <div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-2.5"></div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
          </div>
          <div className="flex justify-between items-center">
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SkeletonCard;
