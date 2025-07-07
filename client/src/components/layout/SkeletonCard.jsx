import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="relative h-full w-full">
        <div 
            className="relative h-full w-full rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800"
        >
            <div
                className="relative z-20 flex flex-col justify-between h-full w-full bg-white dark:bg-slate-900/80 backdrop-blur-md p-6 animate-pulse"
            >
                {/* Top Section Skeleton */}
                <div>
                    <div className="flex justify-between items-start mb-3">
                        <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded-md w-3/4"></div>
                        <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                    </div>
                    <div className="h-14 bg-slate-200 dark:bg-slate-700 rounded-md w-1/2 mt-4"></div>
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-md w-1/4 mt-2"></div>
                </div>

                {/* Bottom Section (Chart) Skeleton */}
                <div className="mt-6">
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-md w-1/3 mb-2"></div>
                    <div className="h-[105px] bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default SkeletonCard;