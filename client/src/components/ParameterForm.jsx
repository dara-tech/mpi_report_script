import React from 'react';
import { Play } from 'lucide-react';

const ParameterForm = ({ parameters, onChange, onSubmit, loading }) => {
  const hasParameters = Object.keys(parameters).length > 0;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleFormSubmit} className="parameters-grid">
      {hasParameters ? (
        Object.entries(parameters).map(([key, value]) => {
          const isDate = key.toLowerCase().includes('date');
          return (
            <div key={key} className="parameter-item col-span-2 sm:col-span-1">
              <label htmlFor={key} className="block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                {key.replace(/_/g, ' ')}
              </label>
              <input
                type={isDate ? 'date' : 'text'}
                id={key}
                name={key}
                value={value || ''}
                onChange={e => onChange(key, e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          );
        })
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No parameters detected for this script.</p>
      )}
      {hasParameters && (
        <div className="col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <Play className="mr-2 h-5 w-5" />
            {loading ? 'Executing...' : 'Execute Script'}
          </button>
        </div>
      )}
    </form>
  );
};

export default ParameterForm; 