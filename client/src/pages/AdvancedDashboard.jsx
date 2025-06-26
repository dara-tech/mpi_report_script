import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer
} from 'recharts';
import { useTheme } from '../hooks/useTheme.jsx';

const themeConfig = {
  light: {
    grid: '#e5e7eb',
    axis: '#9ca3af',
    tick: '#6b7280',
    tooltip: {
      bg: 'rgba(255, 255, 255, 0.95)',
      text: '#374151',
    },
    legend: '#374151',
    pie: {
      score: '#22d3ee',
      issues: '#f87171',
      stroke: '#a5f3fc',
    },
    bar: {
      default: '#0ea5e9',
      danger: '#f87171',
      accent: '#22d3ee',
    },
    line: {
      primary: '#0ea5e9',
      secondary: '#f472b6',
      tertiary: '#22d3ee',
    },
  },
  dark: {
    grid: '#374151',
    axis: '#9ca3af',
    tick: '#d1d5db',
    tooltip: {
      bg: 'rgba(17, 24, 39, 0.95)',
      text: '#e5e7eb',
    },
    legend: '#d1d5db',
    pie: {
      score: '#22d3ee',
      issues: '#f87171',
      stroke: '#0c4a6e',
    },
    bar: {
      default: '#0ea5e9',
      danger: '#f87171',
      accent: '#22d3ee',
    },
    line: {
      primary: '#0ea5e9',
      secondary: '#f472b6',
      tertiary: '#22d3ee',
    },
  },
};

const fetcher = url => fetch(url).then(res => res.json());

const GlassCard = ({ children, className = '' }) => (
  <div className={`backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border border-blue-200/30 dark:border-blue-400/10 rounded-2xl p-6 mb-10 ${className}`}>
    {children}
  </div>
);

const SkeletonCard = ({ className = '' }) => (
  <div className={`backdrop-blur-md bg-white/60 dark:bg-gray-900/60 border border-blue-200/20 dark:border-blue-400/10 rounded-2xl p-6 mb-10 animate-pulse ${className}`} style={{}}>
    <div className="h-8 w-1/3 mb-6 rounded bg-gradient-to-r from-cyan-100 via-blue-100 to-cyan-50 dark:from-cyan-900 dark:via-blue-900 dark:to-cyan-800" />
    <div className="flex flex-col md:flex-row gap-8">
      <div className="flex-1 flex flex-col gap-4">
        <div className="h-24 w-full rounded bg-gradient-to-r from-cyan-100 via-blue-100 to-cyan-50 dark:from-cyan-900 dark:via-blue-900 dark:to-cyan-800" />
        <div className="h-8 w-1/2 rounded bg-gradient-to-r from-cyan-100 via-blue-100 to-cyan-50 dark:from-cyan-900 dark:via-blue-900 dark:to-cyan-800" />
      </div>
      <div className="flex-1 flex flex-col gap-4">
        <div className="h-24 w-full rounded bg-gradient-to-r from-cyan-100 via-blue-100 to-cyan-50 dark:from-cyan-900 dark:via-blue-900 dark:to-cyan-800" />
        <div className="h-8 w-1/2 rounded bg-gradient-to-r from-cyan-100 via-blue-100 to-cyan-50 dark:from-cyan-900 dark:via-blue-900 dark:to-cyan-800" />
      </div>
    </div>
  </div>
);



export default function AdvancedDashboard() {
  const { theme } = useTheme();
  const colors = themeConfig[theme];
  const [quality, setQuality] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [trends, setTrends] = useState(null);
  const [risk, setRisk] = useState(null);
  const [retention, setRetention] = useState(null);
  const [benchmark, setBenchmark] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set your default reporting period here
  const startDate = '2025-01-01';
  const endDate = '2025-03-31';

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetcher('/api/data-quality'),
      fetcher('/api/performance'),
      fetcher(`/api/analytics?startDate=${startDate}&endDate=${endDate}`),
      fetcher('/api/analytics/risk'),
      fetcher('/api/analytics/retention'),
      fetcher('/api/analytics/benchmark'),
    ]).then(([q, p, t, r, ret, b]) => {
      console.log('Data Quality:', q);
      console.log('Performance:', p);
      console.log('Trends:', t);
      console.log('Risk:', r);
      console.log('Retention:', ret);
      console.log('Benchmark:', b);

      setQuality(q.report);
      setPerformance(p.report);
      setTrends(t.report);
      setRisk(r.report);
      setRetention(ret.report);
      setBenchmark(b.report);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-extrabold mb-10 text-cyan-700 dark:text-cyan-300 tracking-tight">Advanced Data Warehouse Dashboard</h1>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );

  // Helper to check if a report is valid
  const isValid = (obj, ...keys) => {
    let o = obj;
    for (const k of keys) {
      if (!o || !(k in o)) return false;
      o = o[k];
    }
    return true;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-extrabold mb-10 text-cyan-700 dark:text-cyan-300 tracking-tight">Advanced Data Warehouse Dashboard</h1>

      {/* Data Quality Section */}
      <GlassCard>
        <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-300 mb-4">Data Quality Overview</h2>
        {isValid(quality, 'summary', 'dataQualityScore') && isValid(quality, 'completeness', 'patientCompleteness') ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="flex flex-col items-center md:col-span-1">
              <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-200">Data Quality Score</h3>
              <div className="w-full h-48">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={[{ name: 'Score', value: quality.summary.dataQualityScore }, { name: 'Issues', value: 100 - quality.summary.dataQualityScore }]}
                      cx="50%" cy="50%" innerRadius={40} outerRadius={70} fill={colors.pie.score} dataKey="value"
                      stroke={colors.pie.stroke} strokeWidth={3}
                    >
                      <Cell key="score" fill={colors.pie.score} />
                      <Cell key="issues" fill={colors.pie.issues} />
                    </Pie>
                    <Tooltip contentStyle={{ background: colors.tooltip.bg, borderRadius: 12, color: colors.tooltip.text, fontWeight: 600 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-2xl font-bold text-emerald-600 dark:text-emerald-300 mt-2">{quality.summary.dataQualityScore}%</div>
            </div>
            <div className="md:col-span-2">
              <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-200">Completeness Issues</h3>
              <div className="w-full h-48">
                <ResponsiveContainer>
                  <BarChart data={quality.completeness.patientCompleteness}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} strokeOpacity={0.4} />
                    <XAxis dataKey="table_name" className="text-xs font-semibold" stroke={colors.axis} tick={{ fill: colors.tick, fontWeight: 600 }} />
                    <YAxis stroke={colors.axis} tick={{ fill: colors.tick, fontWeight: 600 }} />
                    <Tooltip contentStyle={{ background: colors.tooltip.bg, borderRadius: 12, color: colors.tooltip.text, fontWeight: 600 }} />
                    <Legend wrapperStyle={{ fontWeight: 600, color: colors.legend }} />
                    <Bar dataKey="null_sex" fill={colors.bar.danger} name="Null Sex" radius={[8,8,0,0]} />
                    <Bar dataKey="null_first_visit" fill={colors.bar.default} name="Null First Visit" radius={[8,8,0,0]} />
                    <Bar dataKey="null_clinic_id" fill={colors.bar.accent} name="Null ClinicID" radius={[8,8,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-red-500">Data quality report unavailable.</div>
        )}
      </GlassCard>

      {/* Performance Section */}
      <GlassCard>
        <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-4">Performance Overview</h2>
        {isValid(performance, 'summary', 'performanceScore') && Array.isArray(performance.slowQueries) ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="flex flex-col items-center md:col-span-1">
              <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-200">Performance Score</h3>
              <div className="w-full h-48">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={[{ name: 'Score', value: performance.summary.performanceScore }, { name: 'Lost', value: 100 - performance.summary.performanceScore }]}
                      cx="50%" cy="50%" innerRadius={40} outerRadius={70} fill={colors.pie.score} dataKey="value"
                      stroke={colors.pie.stroke} strokeWidth={3}
                    >
                      <Cell key="score" fill={colors.bar.default} />
                      <Cell key="lost" fill={colors.bar.danger} />
                    </Pie>
                    <Tooltip contentStyle={{ background: colors.tooltip.bg, borderRadius: 12, color: colors.tooltip.text, fontWeight: 600 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-2xl font-bold text-blue-600 dark:text-blue-300 mt-2">{performance.summary.performanceScore}%</div>
            </div>
            <div className="md:col-span-2">
              <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-200">Slow Queries (last 10)</h3>
              <div className="w-full h-48">
                <ResponsiveContainer>
                  <BarChart data={performance.slowQueries}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} strokeOpacity={0.4} />
                    <XAxis dataKey="queryId" className="text-xs font-semibold" stroke={colors.axis} tick={{ fill: colors.tick, fontWeight: 600 }} />
                    <YAxis stroke={colors.axis} tick={{ fill: colors.tick, fontWeight: 600 }} />
                    <Tooltip contentStyle={{ background: colors.tooltip.bg, borderRadius: 12, color: colors.tooltip.text, fontWeight: 600 }} />
                    <Legend wrapperStyle={{ fontWeight: 600, color: colors.legend }} />
                    <Bar dataKey="duration" fill={colors.bar.danger} name="Duration (ms)" radius={[8,8,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-red-500">Performance report unavailable.</div>
        )}
      </GlassCard>

      {/* Trends Section */}
      <GlassCard>
        <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-300 mb-4">Patient Trends (Quarter)</h2>
        {isValid(trends, 'trends', 'enrollment') && isValid(trends, 'trends', 'viralLoad') ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-200">Monthly Enrollment</h3>
              <div className="w-full h-64">
                <ResponsiveContainer>
                  <LineChart data={trends.trends.enrollment}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} strokeOpacity={0.3} />
                    <XAxis dataKey="month" className="text-xs font-semibold" stroke={colors.axis} tick={{ fill: colors.tick, fontWeight: 600 }} />
                    <YAxis stroke={colors.axis} tick={{ fill: colors.tick, fontWeight: 600 }} />
                    <Tooltip contentStyle={{ background: colors.tooltip.bg, borderRadius: 12, color: colors.tooltip.text, fontWeight: 600 }} />
                    <Legend wrapperStyle={{ fontWeight: 600, color: colors.legend }} />
                    <Line type="monotone" dataKey="new_enrollments" stroke={colors.line.primary} name="New Enrollments" strokeWidth={3} dot={{ r: 4, fill: colors.line.primary }} />
                    <Line type="monotone" dataKey="female" stroke={colors.line.secondary} name="Female" strokeWidth={3} dot={{ r: 4, fill: colors.line.secondary }} />
                    <Line type="monotone" dataKey="male" stroke={colors.line.tertiary} name="Male" strokeWidth={3} dot={{ r: 4, fill: colors.line.tertiary }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-200">Viral Load Suppression</h3>
              <div className="w-full h-64">
                <ResponsiveContainer>
                  <LineChart data={trends.trends.viralLoad}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} strokeOpacity={0.3} />
                    <XAxis dataKey="month" className="text-xs font-semibold" stroke={colors.axis} tick={{ fill: colors.tick, fontWeight: 600 }} />
                    <YAxis stroke={colors.axis} tick={{ fill: colors.tick, fontWeight: 600 }} />
                    <Tooltip contentStyle={{ background: colors.tooltip.bg, borderRadius: 12, color: colors.tooltip.text, fontWeight: 600 }} />
                    <Legend wrapperStyle={{ fontWeight: 600, color: colors.legend }} />
                    <Line type="monotone" dataKey="suppression_rate" stroke={colors.line.tertiary} name="Suppression Rate (%)" strokeWidth={3} dot={{ r: 4, fill: colors.line.tertiary }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-red-500">Trends report unavailable.</div>
        )}
      </GlassCard>

      {/* Risk Stratification Section */}
      <GlassCard>
        <h2 className="text-2xl font-bold text-pink-700 dark:text-pink-300 mb-4">Risk Stratification</h2>
        {Array.isArray(risk?.riskLevels) ? (
          <div className="w-full h-64">
            <ResponsiveContainer>
              <BarChart data={risk.riskLevels}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} strokeOpacity={0.3} />
                <XAxis dataKey="risk_level" className="text-xs font-semibold" stroke={colors.axis} tick={{ fill: colors.tick, fontWeight: 600 }} />
                <YAxis stroke={colors.axis} tick={{ fill: colors.tick, fontWeight: 600 }} />
                <Tooltip contentStyle={{ background: colors.tooltip.bg, borderRadius: 12, color: colors.tooltip.text, fontWeight: 600 }} />
                <Legend wrapperStyle={{ fontWeight: 600, color: colors.legend }} />
                <Bar dataKey="patient_count" fill={colors.bar.danger} name="Patient Count" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-red-500">Risk stratification report unavailable.</div>
        )}
      </GlassCard>

      {/* Retention Prediction Section */}
      <GlassCard>
        <h2 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mb-4">Retention Prediction</h2>
        {retention?.retention ? (
          <>
            <div className="w-full h-64">
              <ResponsiveContainer>
                <BarChart data={[
                  { name: '3 Months', value: retention.retention.current['3_months'] },
                  { name: '6 Months', value: retention.retention.current['6_months'] },
                  { name: '12 Months', value: retention.retention.current['12_months'] },
                  { name: `${retention.retention.predicted.months_ahead} Months Ahead`, value: retention.retention.predicted.retention_rate }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} strokeOpacity={0.3} />
                  <XAxis dataKey="name" className="text-xs font-semibold" stroke={colors.axis} tick={{ fill: colors.tick, fontWeight: 600 }} />
                  <YAxis stroke={colors.axis} tick={{ fill: colors.tick, fontWeight: 600 }} />
                  <Tooltip contentStyle={{ background: colors.tooltip.bg, borderRadius: 12, color: colors.tooltip.text, fontWeight: 600 }} />
                  <Legend wrapperStyle={{ fontWeight: 600, color: colors.legend }} />
                  <Bar dataKey="value" fill={colors.bar.default} name="Retention Rate (%)" radius={[8,8,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-base text-gray-700 dark:text-gray-300">
              <b>Predicted {retention.retention.predicted.months_ahead} months ahead:</b> {retention.retention.predicted.retention_rate}% (Confidence: {retention.retention.predicted.confidence}%)
            </div>
          </>
        ) : (
          <div className="text-red-500">Retention prediction report unavailable.</div>
        )}
      </GlassCard>

      {/* Benchmarking Section */}
      <GlassCard>
        <h2 className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mb-4">Benchmarking (Current vs Previous Quarter)</h2>
        {isValid(benchmark, 'comparison', 'current') && isValid(benchmark, 'comparison', 'previous') ? (
          <>
            <div className="w-full h-64">
              <ResponsiveContainer>
                <BarChart data={[
                  { name: 'Current', ...benchmark.comparison.current },
                  { name: 'Previous', ...benchmark.comparison.previous }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} strokeOpacity={0.3} />
                  <XAxis dataKey="name" className="text-xs font-semibold" stroke={colors.axis} tick={{ fill: colors.tick, fontWeight: 600 }} />
                  <YAxis stroke={colors.axis} tick={{ fill: colors.tick, fontWeight: 600 }} />
                  <Tooltip contentStyle={{ background: colors.tooltip.bg, borderRadius: 12, color: colors.tooltip.text, fontWeight: 600 }} />
                  <Legend wrapperStyle={{ fontWeight: 600, color: colors.legend }} />
                  <Bar dataKey="active_patients" fill={colors.bar.default} name="Active Patients" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="patients_with_visits" fill={colors.bar.accent} name="Patients with Visits" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="visit_rate" fill={colors.bar.danger} name="Visit Rate (%)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {isValid(benchmark, 'comparison', 'improvement') && (
              <div className="mt-4 text-base text-gray-700 dark:text-gray-300">
                <b>Improvement:</b> Active Patients: {benchmark.comparison.improvement.activePatients || 0}% | Visit Rate: {benchmark.comparison.improvement.visitRate || 0}%
              </div>
            )}
          </>
        ) : (
          <div className="text-red-500">Benchmarking report unavailable.</div>
        )}
      </GlassCard>
    </div>
  );
} 