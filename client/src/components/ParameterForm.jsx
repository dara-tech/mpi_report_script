import React from 'react';

const ParameterForm = ({ parameters, onChange, onSubmit, loading }) => {
  const hasParameters = Object.keys(parameters).length > 0;

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Parameters</h2>
      
      {hasParameters ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {Object.entries(parameters).map(([key, value]) => (
            <div key={key}>
              <label htmlFor={key} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {key.replace(/_/g, ' ')}
              </label>
              <input
                type="text"
                id={key}
                name={key}
                value={value}
                onChange={(e) => onChange(key, e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">No parameters detected for this script.</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !hasParameters}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
      >
        {loading ? 'Running...' : 'Run Script'}
      </button>
    </form>
  );
};


export default ParameterForm; 