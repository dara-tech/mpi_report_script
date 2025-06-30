import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Users, Baby } from 'lucide-react';

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

  const analysis = useMemo(() => {
    if (!selectedIndicator) return { chartType: 'none', stats: { total: 0 } };

    const isMmdIndicator = selectedIndicator.hasOwnProperty('less_than_3_months') ||
                           selectedIndicator.hasOwnProperty('three_to_five_months') ||
                           selectedIndicator.hasOwnProperty('six_or_more_months');

    if (isMmdIndicator) {
      const less_than_3 = parseInt(selectedIndicator.less_than_3_months || '0', 10);
      const three_to_five = parseInt(selectedIndicator.three_to_five_months || '0', 10);
      const six_or_more = parseInt(selectedIndicator.six_or_more_months || '0', 10);

      const mmdData = [
        { name: '< 3 Months', value: less_than_3, color: '#3B82F6' },
        { name: '3-5 Months', value: three_to_five, color: '#10B981' },
        { name: '6+ Months', value: six_or_more, color: '#F59E0B' },
      ];
      
      const total = less_than_3 + three_to_five + six_or_more;

      return {
        chartType: 'mmd',
        chartData: mmdData,
        stats: { total }
      };
    }

    const male_0_14 = parseInt(selectedIndicator.male_0_14 || '0', 10);
    const female_0_14 = parseInt(selectedIndicator.female_0_14 || '0', 10);
    const male_over_14 = parseInt(selectedIndicator.male_over_14 || '0', 10);
    const female_over_14 = parseInt(selectedIndicator.female_over_14 || '0', 10);

    const barData = [
      { name: 'Male 0-14', value: male_0_14, color: '#3B82F6' },
      { name: 'Female 0-14', value: female_0_14, color: '#EC4899' },
      { name: 'Male 15+', value: male_over_14, color: '#10B981' },
      { name: 'Female 15+', value: female_over_14, color: '#F59E0B' },
    ];

    const totalMale = male_0_14 + male_over_14;
    const totalFemale = female_0_14 + female_over_14;

    const pieData = [
        { name: 'Male', value: totalMale, color: '#2563EB' },
        { name: 'Female', value: totalFemale, color: '#D946EF' },
    ];

    const calculatedStats = {
      total: totalMale + totalFemale,
      totalMale: totalMale,
      totalFemale: totalFemale,
      totalUnder15: male_0_14 + female_0_14,
      totalOver15: male_over_14 + female_over_14,
    };

    return { 
        chartType: 'age_gender',
        barChartData: barData, 
        pieChartData: pieData, 
        stats: calculatedStats 
    };
  }, [selectedIndicator]);

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

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Detailed Breakdown</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analysis.barChartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)"/>
                      <XAxis type="number" stroke="#9CA3AF" />
                      <YAxis type="category" dataKey="name" stroke="#9CA3AF" width={100} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', borderColor: '#4B5563', color: '#F9FAFB' }} />
                      <Bar dataKey="value" name="Count">
                        {analysis.barChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Gender Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={analysis.pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                        {analysis.pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', borderColor: '#4B5563', color: '#F9FAFB' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {analysis.chartType === 'mmd' && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">MMD Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analysis.chartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)"/>
                  <XAxis type="number" stroke="#9CA3AF" />
                  <YAxis type="category" dataKey="name" stroke="#9CA3AF" width={100} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', borderColor: '#4B5563', color: '#F9FAFB' }} />
                  <Bar dataKey="value" name="Count">
                    {analysis.chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
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
