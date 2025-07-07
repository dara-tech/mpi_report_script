import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

const AgeGenderChart = ({ analysis }) => (
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
);

export default AgeGenderChart;
