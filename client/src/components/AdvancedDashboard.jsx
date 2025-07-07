import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Users, Baby } from 'lucide-react';
import StatCard from './dashboard/StatCard';
import SkeletonLoader from './dashboard/SkeletonLoader';
import { useIndicatorAnalysis } from '../hooks/useIndicatorAnalysis';
import AgeGenderChart from './dashboard/AgeGenderChart';
import MmdChart from './dashboard/MmdChart';





const AdvancedDashboard = ({ indicators, isLoading }) => {
  const getIndicatorNumber = (name) => {
    if (!name) return Infinity;
    const match = name.match(/^(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : Infinity;
  };

  const sortedIndicators = useMemo(() => 
    indicators ? [...indicators].sort((a, b) => getIndicatorNumber(a.name) - getIndicatorNumber(b.name)) : [], 
    [indicators]
  );

  const [selectedIndicatorName, setSelectedIndicatorName] = useState('');

  useEffect(() => {
    if (sortedIndicators.length > 0 && !selectedIndicatorName) {
      setSelectedIndicatorName(sortedIndicators[0].name);
    }
  }, [sortedIndicators, selectedIndicatorName]);

  const selectedIndicator = useMemo(() => 
    sortedIndicators.find(ind => ind.name === selectedIndicatorName),
    [sortedIndicators, selectedIndicatorName]
  );

  const analysis = useIndicatorAnalysis(selectedIndicator);

  const cleanName = (name) => name ? name.replace(/_/g, ' ').replace(/\.sql$/i, '') : '';

  return (
    <div className="p-6 sm:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">Advanced Dashboard</h1>
      
      <div className="mb-8 max-w-lg">
        <label htmlFor="indicator-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Indicator
        </label>
        <select
          id="indicator-select"
          value={selectedIndicatorName}
          onChange={(e) => setSelectedIndicatorName(e.target.value)}
          className="w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-200 dark:disabled:bg-gray-700"
          disabled={isLoading || !indicators || indicators.length === 0}
        >
          {sortedIndicators.map(ind => (
            <option key={ind.name} value={ind.name}>
              {cleanName(ind.name)}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <SkeletonLoader />
      ) : selectedIndicator ? (
        <div className="space-y-8">
          <div className="flex justify-between items-start bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {cleanName(selectedIndicator.name)}
            </h2>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Patients</p>
              <p className="text-5xl font-bold text-blue-600 dark:text-blue-400">{analysis.stats.total}</p>
            </div>
          </div>

          {analysis.chartType === 'age_gender' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Male" value={analysis.stats.totalMale} icon={<Users size={22}/>} />
                <StatCard title="Total Female" value={analysis.stats.totalFemale} icon={<Users size={22}/>} />
                <StatCard title="Total Age 0-14" value={analysis.stats.totalUnder15} icon={<Baby size={22}/>} />
                <StatCard title="Total Age 15+" value={analysis.stats.totalOver15} icon={<Users size={22}/>} />
              </div>

              <AgeGenderChart analysis={analysis} />
            </>
          )}

          {analysis.chartType === 'mmd' && <MmdChart analysis={analysis} />}
        </div>
      ) : (
        <div className="flex justify-center items-center py-20">
          <p className="text-gray-500 dark:text-gray-400">
            {indicators && indicators.length > 0 ? 'Select an indicator to view details.' : 'No indicator data available.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AdvancedDashboard;
