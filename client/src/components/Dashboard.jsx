import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

const Dashboard = ({ indicators, onSelectScript }) => {
  const [filter, setFilter] = useState('');

  const filteredIndicators = useMemo(() => {
    if (!indicators) return [];
    if (!filter) return indicators;
    return indicators.filter(ind => 
      ind.name && ind.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [indicators, filter]);

  return (
    <div className="p-6 sm:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">Dashboard</h1>

      {/* Filter Input */}
      <div className="mb-8 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter indicators by name..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
          />
        </div>
      </div>

      {/* Indicators Grid */}
      {filteredIndicators.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredIndicators.map((indicator, index) => (
            <div 
              key={index} 
              className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 dark:border-gray-700 flex flex-col justify-between cursor-pointer"
              onClick={() => onSelectScript(indicator.name)}
            >
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate mb-2" title={indicator.name}>
                  {indicator.name.replace(/_/g, ' ')}
                </h3>
                <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                  {indicator.total}
                </p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                {/* Age Group 0-14 */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 mb-1.5">Age 0-14</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Male</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{indicator.male_0_14}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Female</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{indicator.female_0_14}</span>
                    </div>
                  </div>
                </div>

                {/* Age Group 15+ */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 mb-1.5">Age 15+</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Male</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{indicator.male_over_14}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Female</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{indicator.female_over_14}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            {filter ? 'No indicators match your filter.' : 'No indicator data available.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 