import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// Military-inspired theme configuration
const toastConfig = {
  success: {
    icon: <CheckCircle className="h-6 w-6 text-green-400" />,
    style: 'bg-gray-800/90 border-l-4 border-green-500 text-green-300 backdrop-blur-sm',
    title: 'MISSION ACCOMPLISHED',
  },
  error: {
    icon: <XCircle className="h-6 w-6 text-red-400" />,
    style: 'bg-gray-800/90 border-l-4 border-red-500 text-red-300 backdrop-blur-sm',
    title: 'CRITICAL FAILURE',
  },
  warning: {
    icon: <AlertTriangle className="h-6 w-6 text-yellow-400" />,
    style: 'bg-gray-800/90 border-l-4 border-yellow-500 text-yellow-300 backdrop-blur-sm',
    title: 'SITUATION ALERT',
  },
  info: {
    icon: <Info className="h-6 w-6 text-cyan-400" />,
    style: 'bg-gray-800/90 border-l-4 border-cyan-500 text-cyan-300 backdrop-blur-sm',
    title: 'INTEL RECEIVED',
  },
};

function Toast({ toast, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (toast) {
      // Set visible after a short delay to trigger animation
      const timer = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      // When toast is null, start fade out
      setVisible(false);
    }
  }, [toast]);

  if (!toast) return null;

  const config = toastConfig[toast.type] || toastConfig.info;

  return (
    <div
      className={`fixed top-6 right-6 z-50 w-full max-w-sm font-mono transform transition-all duration-300 ease-out
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}
    >
      <div
        className={`flex flex-col border border-gray-600/50 shadow-2xl ${config.style}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-1 border-b border-gray-700/50">
          <div className="flex items-center gap-2">
            {config.icon}
            <span className="text-sm font-bold tracking-widest">{config.title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400/70 hover:text-white hover:bg-white/10 focus:outline-none"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Body */}
        <div className="px-3 py-3">
          <p className="text-sm text-gray-200">{toast.message}</p>
        </div>
      </div>
    </div>
  );
}

export default Toast;