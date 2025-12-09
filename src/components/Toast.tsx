import React, { useEffect } from 'react';
import { Notification } from '../types';

interface ToastProps {
  notification: Notification | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ notification, onClose }) => {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const bgClass = notification.type === 'success' ? 'bg-green-600' : 'bg-red-600';

  return (
    <div className={`fixed bottom-4 right-4 ${bgClass} text-white px-6 py-4 rounded-lg shadow-xl z-50 flex items-center gap-3 animate-fade-in`}>
      <span className="material-symbols-outlined">
        {notification.type === 'success' ? 'check_circle' : 'error'}
      </span>
      <p className="font-medium">{notification.message}</p>
    </div>
  );
};