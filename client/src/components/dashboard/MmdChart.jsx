import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const MmdChart = ({ analysis }) => (
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
);

export default MmdChart;
