import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import NotificationModal from './NotificationModal';
import api from '../../utils/api';

export default function NotificationBell({ darkMode, textColor }) {
  const [showModal, setShowModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load unread count on mount and periodically
  const loadUnreadCount = async () => {
    try {
      const { count } = await api.getUnreadNotificationCount();
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  useEffect(() => {
    loadUnreadCount();

    // Poll for unread count every 60 seconds
    const interval = setInterval(loadUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  // Refresh unread count when modal closes
  const handleModalClose = () => {
    setShowModal(false);
    loadUnreadCount();
  };

  return (
    <>
      <button
        onClick={() => setShowModal(!showModal)}
        style={{
          background: 'none',
          border: 'none',
          color: textColor,
          cursor: 'pointer',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          position: 'relative'
        }}
        title="알림"
        aria-label={`알림 ${unreadCount > 0 ? `(읽지 않음 ${unreadCount}개)` : ''}`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '0px',
              backgroundColor: '#ef4444',
              color: '#fff',
              borderRadius: '8px',
              padding: '1px 4px',
              fontSize: '9px',
              fontWeight: '600',
              minWidth: '14px',
              height: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              lineHeight: '1'
            }}
            aria-live="polite"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationModal
        isOpen={showModal}
        onClose={handleModalClose}
        darkMode={darkMode}
      />
    </>
  );
}
