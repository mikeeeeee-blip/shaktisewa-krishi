'use client';

import { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function Toast({ message, isVisible, onClose }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] animate-slide-up">
      <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]">
        <CheckCircle size={24} className="flex-shrink-0" />
        <span className="flex-1">{message}</span>
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:bg-green-700 rounded p-1 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

