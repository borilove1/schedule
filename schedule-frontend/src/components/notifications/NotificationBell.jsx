import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import NotificationModal from './NotificationModal';
import { generateMockNotifications } from '../../utils/mockNotifications';

export default function NotificationBell({ darkMode, textColor }) {
  const [showModal, setShowModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load mock notifications on mount
  useEffect(() => {
    const mockNotifications = generateMockNotifications();
    setNotifications(mockNotifications);

    // Calculate unread count
    const count = mockNotifications.filter(n => !n.isRead).length;
    setUnreadCount(count);
  }, []);

  // Handle notification updates from modal
  const handleNotificationsUpdate = (updatedNotifications) => {
    setNotifications(updatedNotifications);

    // Recalculate unread count
    const count = updatedNotifications.filter(n => !n.isRead).length;
    setUnreadCount(count);
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
              top: '4px',
              right: '4px',
              backgroundColor: '#ef4444',
              color: '#fff',
              borderRadius: '10px',
              padding: '2px 6px',
              fontSize: '11px',
              fontWeight: '600',
              minWidth: '18px',
              height: '18px',
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
        onClose={() => setShowModal(false)}
        darkMode={darkMode}
        notifications={notifications}
        onNotificationsUpdate={handleNotificationsUpdate}
      />
    </>
  );
}
