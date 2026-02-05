import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const NotificationContext = createContext();

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    try {
      const { count } = await api.getUnreadNotificationCount();
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  }, []);

  // Load on mount and set up polling
  useEffect(() => {
    loadUnreadCount();

    // Poll every 60 seconds
    const interval = setInterval(loadUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  const value = {
    unreadCount,
    loadUnreadCount,
    refreshNotifications: loadUnreadCount // Alias for clarity
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
