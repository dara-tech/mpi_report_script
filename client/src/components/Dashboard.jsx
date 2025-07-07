import React, { useState, useMemo } from 'react';
import DashboardHeader from './layout/DashboardHeader';
import IndicatorCard from './layout/IndicatorCard';
import SkeletonCard from './layout/SkeletonCard';
import EmptyState from './layout/EmptyState';

const Dashboard = ({ indicators, isLoading, onRefresh, onSelectScript }) => {
  const [filter, setFilter] = useState('');

  const filteredIndicators = useMemo(() => {
    if (!indicators) return [];
    return indicators.filter(ind =>
      ind.name?.toLowerCase().includes(filter.toLowerCase())
    );
  }, [indicators, filter]);

  const hasContent = !isLoading && filteredIndicators.length > 0;
  const isFiltering = filter.length > 0;

  return (
    <div className="bg-slate-100 dark:bg-[#0A0A0A] min-h-screen font-sans text-slate-900 dark:text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardHeader
          filter={filter}
          onFilterChange={setFilter}
          onRefresh={onRefresh}
          isLoading={isLoading}
          indicatorCount={filteredIndicators.length}
        />

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        )}

        {!isLoading && !hasContent && (
           <EmptyState isFiltering={isFiltering} />
        )}
        
        {hasContent && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredIndicators.map((indicator) => (
              <IndicatorCard
                key={indicator.name}
                indicator={indicator}
                onSelect={() => onSelectScript(indicator.name)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;