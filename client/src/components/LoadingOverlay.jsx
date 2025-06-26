import React, { useState, useEffect } from 'react';

function LoadingOverlay({ show, text = 'Loading...' }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 300); // Match duration of fade-out
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out
        ${show ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="absolute h-full w-full animate-spin rounded-full border-4 border-solid border-blue-500 border-t-transparent"></div>
        <div className="absolute h-full w-full animate-pulse rounded-full border-2 border-dashed border-blue-300/70"></div>
        <div className="text-blue-400"></div>
      </div>
      <p className="mt-4 text-lg font-semibold text-white drop-shadow-md">
        {text}
      </p>
    </div>
  );
}

export default LoadingOverlay; 