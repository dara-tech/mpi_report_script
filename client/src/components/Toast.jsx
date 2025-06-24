import React from 'react';

function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-6 left-1/2 z-50 -translate-x-1/2 px-4 py-2 rounded shadow-lg flex items-center gap-2
      ${toast.type === 'success' ? 'bg-green-500 text-white' : toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-gray-800 text-white'}`}
      style={{ minWidth: 220 }}
    >
      <span className="font-medium">{toast.message}</span>
      <button className="ml-2 text-white/80 hover:text-white text-xs" onClick={onClose}>&times;</button>
    </div>
  );
}

export default Toast; 