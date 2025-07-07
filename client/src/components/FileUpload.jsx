import React, { useReducer, useCallback, useRef, useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, File as FileIcon, X, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

const MAX_FILE_SIZE = 350 * 1024 * 1024; // 350MB
const ALLOWED_FILE_TYPES = ['application/sql', 'text/plain', 'application/x-sql'];

// --- STATE MACHINE (useReducer) ---
const initialState = {
  status: 'idle', // idle | selected | uploading | success | error
  file: null,
  progress: 0,
  uploadedFile: null,
  error: null,
  speed: 0,
  isDragOver: false,
};

function fileUploadReducer(state, action) {
  switch (action.type) {
    case 'SELECT_FILE':
      return { ...initialState, status: 'selected', file: action.payload };
    case 'CLEAR_SELECTION':
      return { ...initialState };
    case 'START_UPLOAD':
      return { ...state, status: 'uploading', progress: 0, speed: 0 };
    case 'SET_PROGRESS':
      return { ...state, progress: action.payload.progress, speed: action.payload.speed };
    case 'UPLOAD_SUCCESS':
      return { ...state, status: 'success', uploadedFile: action.payload, file: null };
    case 'UPLOAD_ERROR':
      return { ...state, status: 'error', error: action.payload, file: null };
    case 'SET_DRAG_OVER':
      return { ...state, isDragOver: action.payload };
    default:
      return state;
  }
}

// --- VIEW COMPONENTS ---
const IdleView = ({ dispatch }) => {
  const onDrop = useCallback((event) => {
    event.preventDefault();
    dispatch({ type: 'SET_DRAG_OVER', payload: false });
    if (event.dataTransfer.files?.[0]) {
      dispatch({ type: 'SELECT_FILE', payload: event.dataTransfer.files[0] });
    }
  }, [dispatch]);

  return (
    <motion.div
      key="idle"
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      onDrop={onDrop}
      onDragOver={(e) => { e.preventDefault(); dispatch({ type: 'SET_DRAG_OVER', payload: true }); }}
      onDragLeave={() => dispatch({ type: 'SET_DRAG_OVER', payload: false })}
      className="h-full"
    >
      <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
        <div className="flex flex-col items-center justify-center text-center p-4">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            <UploadCloud className="w-12 h-12 mb-4 text-neutral-400" />
          </motion.div>
          <p className="mb-2 text-lg text-neutral-300"><span className="font-semibold text-blue-400">Click to upload</span> or drag and drop</p>
          <p className="text-xs text-gray-500 dark:text-neutral-500">SQL or TXT files (MAX. 350MB)</p>
        </div>
        <input id="file-upload" type="file" className="hidden" onChange={(e) => dispatch({ type: 'SELECT_FILE', payload: e.target.files[0] })} accept=".sql,.txt,application/sql,text/plain,application/x-sql" />
      </label>
    </motion.div>
  );
};

const UploadingView = ({ file, progress, speed, onCancel }) => {
    const radius = 34;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
      <motion.div key="uploading" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex flex-col items-center justify-center h-full w-full text-center">
        <div className="relative w-24 h-24">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle className="text-white/10" stroke="currentColor" strokeWidth="4" fill="transparent" r={radius} cx="40" cy="40" />
                <motion.circle className="text-blue-500" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="transparent" r={radius} cx="40" cy="40"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                 <FileIcon className="w-10 h-10 text-neutral-300" />
            </div>
        </div>
        <p className="mt-4 font-medium text-neutral-200 truncate w-full px-4">{file.name}</p>
        <p className="text-sm text-blue-400 font-mono">{progress}% - {(speed / 1024).toFixed(1)} KB/s</p>
        <button onClick={onCancel} className="mt-4 text-xs text-neutral-400 hover:text-white transition-colors">Cancel</button>
      </motion.div>
    );
};

const SuccessView = ({ uploadedFile, onExecute, onReset }) => (
    <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex flex-col items-center justify-center h-full w-full text-center p-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        </motion.div>
        <p className="font-medium text-lg text-neutral-100">Upload Complete</p>
        <p className="text-sm text-neutral-400 mb-6 truncate w-full">{uploadedFile.name}</p>
        <div className="flex items-center gap-4">
            <button onClick={onReset} className="px-4 py-2 text-sm font-medium rounded-md bg-white/10 hover:bg-white/20 transition-colors">Upload Another</button>
            <button onClick={onExecute} className="px-4 py-2 text-sm font-medium rounded-md bg-red-600 hover:bg-red-700 transition-colors text-white shadow-lg shadow-red-600/30">Execute Script</button>
        </div>
    </motion.div>
);

const ConfirmationModal = ({ isOpen, onClose, onConfirm, fileName }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl p-6 w-full max-w-md"
        >
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-900/50 border border-red-500/30 sm:mx-0 sm:h-10 sm:w-10">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-neutral-100">Execute Script Confirmation</h3>
              <div className="mt-2">
                <p className="text-sm text-neutral-400">
                  Are you sure you want to execute <span className="font-bold text-neutral-200">{fileName}</span>? This action is irreversible.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse gap-3">
            <button type="button" onClick={onConfirm} className="w-full justify-center rounded-md px-4 py-2 bg-red-600 text-sm font-semibold text-white hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 sm:w-auto">Execute</button>
            <button type="button" onClick={onClose} className="mt-3 w-full justify-center rounded-md px-4 py-2 bg-white/10 text-sm font-semibold text-neutral-200 hover:bg-white/20 transition-colors focus:outline-none sm:mt-0 sm:w-auto">Cancel</button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);


// --- MAIN COMPONENT ---
const AdvancedFileUpload = ({ showToast, onUploadSuccess }) => {
  const [state, dispatch] = useReducer(fileUploadReducer, initialState);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const cancelTokenSource = useRef(null);
  const lastUploadTime = useRef(Date.now());
  const lastUploadedBytes = useRef(0);

  useEffect(() => {
    if (state.status === 'selected') {
      validateFile(state.file);
    }
  }, [state.status, state.file]);

  const validateFile = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      showToast('File is too large (Max 350MB).', 'error');
      dispatch({ type: 'CLEAR_SELECTION' });
      return false;
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type) && !file.name.endsWith('.sql') && !file.name.endsWith('.txt')) {
      showToast('Invalid file type (SQL or TXT only).', 'error');
      dispatch({ type: 'CLEAR_SELECTION' });
      return false;
    }
    return true;
  };

  const handleUpload = async () => {
    if (state.status !== 'selected') return;
    dispatch({ type: 'START_UPLOAD' });
    cancelTokenSource.current = axios.CancelToken.source();
    lastUploadTime.current = Date.now();
    lastUploadedBytes.current = 0;

    try {
      // ADVANCED PATTERN: In a real app, you'd first get a pre-signed URL from your server
      // const { data: { uploadUrl, filePath } } = await axios.post('/api/get-presigned-url', { fileName: state.file.name });
      // Then upload directly to cloud storage (e.g., S3)
      // await axios.put(uploadUrl, state.file, { ... });

      const formData = new FormData();
      formData.append('sqlfile', state.file);
      
      const response = await axios.post('/api/upload-script', formData, {
        onUploadProgress: (progressEvent) => {
            const now = Date.now();
            const timeDiff = (now - lastUploadTime.current) / 1000; // in seconds
            const bytesDiff = progressEvent.loaded - lastUploadedBytes.current;
            const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0; // bytes per second
            lastUploadTime.current = now;
            lastUploadedBytes.current = progressEvent.loaded;
            
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            dispatch({ type: 'SET_PROGRESS', payload: { progress: percentCompleted, speed } });
        },
        cancelToken: cancelTokenSource.current.token,
      });

      showToast('Upload successful!', 'success');
      dispatch({ type: 'UPLOAD_SUCCESS', payload: { name: state.file.name, path: response.data.filePath } });
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      if (!axios.isCancel(error)) {
        showToast(error.response?.data?.message || 'File upload failed', 'error');
        dispatch({ type: 'UPLOAD_ERROR', payload: 'Upload failed' });
      }
    }
  };
  
  const handleCancelUpload = () => {
    if (cancelTokenSource.current) {
      cancelTokenSource.current.cancel('Upload canceled.');
      showToast('Upload canceled', 'info');
      dispatch({ type: 'CLEAR_SELECTION' });
    }
  };

  const handleExecute = async () => {
    if (state.status !== 'success' || !state.uploadedFile) return;
    try {
      const response = await axios.post('/api/execute-uploaded-script', { scriptPath: state.uploadedFile.path });
      showToast(response.data.message, 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Script execution failed', 'error');
    } finally {
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <ConfirmationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleExecute} fileName={state.uploadedFile?.name} />
      <div className="p-4 sm:p-6 bg-white dark:bg-slate-700 h-full">
        <div className="bg-gray-50 dark:bg-slate-800/60 backdrop-blur-xl border border-gray-200 dark:border-slate-600/50 rounded-2xl p-6 h-full flex flex-col">
          <div className="flex-shrink-0 mb-4">
             <h2 className="text-xl font-bold text-gray-800 dark:text-neutral-100">Upload & Execute SQL</h2>
             <p className="text-sm text-gray-500 dark:text-neutral-400">Select a script to upload and run against the database.</p>
          </div>
          
          <div className="flex-grow bg-gray-100 dark:bg-black/20 rounded-lg p-2 h-80 min-h-[320px]">
            <AnimatePresence mode="wait">
                {state.status === 'idle' && <IdleView dispatch={dispatch} />}
                {state.status === 'selected' && state.file && (
                    <motion.div key="selected" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center justify-center h-full text-center">
                        <FileIcon className="w-16 h-16 text-neutral-300 mb-4" />
                        <p className="font-medium text-neutral-200 truncate w-full px-4">{state.file.name}</p>
                        <p className="text-sm text-neutral-500 font-mono">{(state.file.size / 1024 / 1024).toFixed(2)} MB</p>
                        <div className="flex items-center gap-4 mt-6">
                            <button onClick={() => dispatch({ type: 'CLEAR_SELECTION' })} className="px-4 py-2 text-sm font-medium rounded-md bg-white/10 hover:bg-white/20 transition-colors">Change File</button>
                            <button onClick={handleUpload} className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 transition-colors text-white shadow-lg shadow-blue-600/30">Upload Now</button>
                        </div>
                    </motion.div>
                )}
                {state.status === 'uploading' && <UploadingView file={state.file} progress={state.progress} speed={state.speed} onCancel={handleCancelUpload} />}
                {state.status === 'success' && <SuccessView uploadedFile={state.uploadedFile} onExecute={() => setIsModalOpen(true)} onReset={() => dispatch({ type: 'CLEAR_SELECTION' })} />}
                {state.status === 'error' && (
                     <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full text-center">
                        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                        <p className="font-medium text-red-400">{state.error}</p>
                        <button onClick={() => dispatch({ type: 'CLEAR_SELECTION' })} className="mt-6 px-4 py-2 text-sm font-medium rounded-md bg-white/10 hover:bg-white/20 transition-colors">Try Again</button>
                     </motion.div>
                )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdvancedFileUpload;