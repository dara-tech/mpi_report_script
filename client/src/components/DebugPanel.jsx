import React, { useState } from 'react';

function DebugPanel({ data }) {
  const [open, setOpen] = useState(false);
  if (!data) return null;
  return (
    <div className="mt-4">
      <button
        className="text-xs text-blue-600 underline hover:text-blue-800 mb-1"
        onClick={() => setOpen(o => !o)}
      >
        {open ? 'Hide' : 'Show'} raw API response
      </button>
      {open && (
        <div className=" border border-gray-200 dark:border-gray-700 rounded p-4 text-xs overflow-x-auto max-h-64 whitespace-pre-wrap">

            {JSON.stringify(data, null, 2)}
           
        </div>
      )}
    </div>
  );
}

export default DebugPanel; 