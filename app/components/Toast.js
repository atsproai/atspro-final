'use client';
import React, { useState, useEffect, createContext, useContext } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ toast, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return <CheckCircle className="text-green-400" size={20} />;
      case 'error': return <AlertCircle className="text-red-400" size={20} />;
      case 'info': return <Info className="text-blue-400" size={20} />;
      default: return <CheckCircle className="text-green-400" size={20} />;
    }
  };

  const getBgColor = () => {
    switch (toast.type) {
      case 'success': return 'bg-green-500/10 border-green-500';
      case 'error': return 'bg-red-500/10 border-red-500';
      case 'info': return 'bg-blue-500/10 border-blue-500';
      default: return 'bg-green-500/10 border-green-500';
    }
  };

  return (
    <div
      className={`transform transition-all duration-300 pointer-events-auto ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`flex items-center gap-3 ${getBgColor()} backdrop-blur-lg border-2 rounded-lg p-4 pr-2 shadow-lg min-w-[280px] max-w-md`}>
        {getIcon()}
        <span className="text-white flex-1 text-sm font-medium">{toast.message}</span>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition ml-2"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
