import React, { useState, useRef } from 'react';
import { X, Clock, CheckCircle, Edit, Trash2, Info, Bell } from 'lucide-react';
import { getRelativeTime, NOTIFICATION_TYPES } from '../../utils/mockNotifications';

export default function NotificationModal({
  isOpen,
  onClose,
  darkMode,
  notifications,
  onNotificationsUpdate
}) {
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'
  const actionInProgressRef = useRef(false);

  // Color scheme
  const bgColor = darkMode ? '#0f172a' : '#f1f5f9';
  const cardBg = darkMode ? '#1e293b' : '#fff';
  const textColor = darkMode ? '#e2e8f0' : '#1e293b';
  const secondaryTextColor = darkMode ? '#94a3b8' : '#64748b';
  const borderColor = darkMode ? '#334155' : '#e2e8f0';
  const unreadBg = darkMode ? '#1e3a5f' : '#eff6ff';
  const hoverBg = darkMode ? '#334155' : '#f8fafc';

  if (!isOpen) return null;

  // Filter notifications
  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  // Get icon component based on type
  const getIcon = (type) => {
    const iconProps = { size: 20 };
    switch (type) {
      case NOTIFICATION_TYPES.EVENT_REMINDER:
        return <Clock {...iconProps} />;
      case NOTIFICATION_TYPES.EVENT_COMPLETED:
        return <CheckCircle {...iconProps} />;
      case NOTIFICATION_TYPES.EVENT_UPDATED:
        return <Edit {...iconProps} />;
      case NOTIFICATION_TYPES.EVENT_DELETED:
        return <Trash2 {...iconProps} />;
      case NOTIFICATION_TYPES.SYSTEM:
        return <Info {...iconProps} />;
      default:
        return <Bell {...iconProps} />;
    }
  };

  // Mark single notification as read
  const handleMarkAsRead = (notificationId) => {
    if (actionInProgressRef.current) return;
    actionInProgressRef.current = true;

    const updatedNotifications = notifications.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    );

    onNotificationsUpdate(updatedNotifications);
    actionInProgressRef.current = false;
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = () => {
    if (actionInProgressRef.current) return;
    actionInProgressRef.current = true;

    const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }));
    onNotificationsUpdate(updatedNotifications);
    actionInProgressRef.current = false;
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    // TODO Phase 2: Navigate to related event if relatedEventId exists
    // if (notification.relatedEventId) {
    //   // Navigate to event detail
    // }
  };

  // Handle backdrop click to close
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: cardBg,
          borderRadius: '16px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: darkMode
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: `1px solid ${borderColor}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {/* Title and Close Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: textColor }}>
              알림
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: secondaryTextColor,
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="닫기"
            >
              <X size={24} />
            </button>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: filter === 'all' ? '#3B82F6' : 'transparent',
                color: filter === 'all' ? '#fff' : textColor,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              전체 ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: filter === 'unread' ? '#3B82F6' : 'transparent',
                color: filter === 'unread' ? '#fff' : textColor,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              읽지않음 ({notifications.filter(n => !n.isRead).length})
            </button>
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0'
          }}
        >
          {filteredNotifications.length === 0 ? (
            // Empty State
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                color: secondaryTextColor
              }}
            >
              <Bell
                size={48}
                style={{ margin: '0 auto 16px', opacity: 0.5 }}
              />
              <p style={{ margin: 0, fontSize: '16px' }}>
                {filter === 'unread' ? '읽지 않은 알림이 없습니다.' : '알림이 없습니다.'}
              </p>
            </div>
          ) : (
            // Notification List
            <div style={{ padding: '0' }}>
              {filteredNotifications.map((notification, index) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    padding: '16px 24px',
                    borderBottom: index < filteredNotifications.length - 1 ? `1px solid ${borderColor}` : 'none',
                    backgroundColor: notification.isRead ? 'transparent' : unreadBg,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    position: 'relative',
                    paddingLeft: notification.isRead ? '24px' : '44px'
                  }}
                  onMouseEnter={(e) => {
                    if (notification.isRead) {
                      e.currentTarget.style.backgroundColor = hoverBg;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (notification.isRead) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {/* Unread Indicator */}
                  {!notification.isRead && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#3B82F6',
                        borderRadius: '50%'
                      }}
                    />
                  )}

                  {/* Notification Content */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    {/* Icon */}
                    <div
                      style={{
                        color: '#3B82F6',
                        flexShrink: 0,
                        marginTop: '2px'
                      }}
                    >
                      {getIcon(notification.type)}
                    </div>

                    {/* Text Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: textColor,
                          marginBottom: '4px'
                        }}
                      >
                        {notification.title}
                      </div>
                      <div
                        style={{
                          fontSize: '14px',
                          color: secondaryTextColor,
                          marginBottom: '8px',
                          lineHeight: '1.5'
                        }}
                      >
                        {notification.message}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: secondaryTextColor,
                          opacity: 0.8
                        }}
                      >
                        {getRelativeTime(notification.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.filter(n => !n.isRead).length > 0 && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: `1px solid ${borderColor}`,
              display: 'flex',
              justifyContent: 'flex-end'
            }}
          >
            <button
              onClick={handleMarkAllAsRead}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: `1px solid ${borderColor}`,
                backgroundColor: 'transparent',
                color: textColor,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = hoverBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              모두 읽음 처리
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
