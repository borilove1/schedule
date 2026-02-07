import { useState, useEffect } from 'react';
import { X, Clock, CheckCircle, Edit, Trash2, Info, Bell } from 'lucide-react';
import { getRelativeTime, NOTIFICATION_TYPES } from '../../utils/mockNotifications';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useActionGuard } from '../../hooks/useActionGuard';
import ErrorAlert from '../common/ErrorAlert';
import LoadingSpinner from '../common/LoadingSpinner';
import api from '../../utils/api';

export default function NotificationModal({ isOpen, onClose }) {
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { isDarkMode, cardBg, textColor, secondaryTextColor, borderColor, hoverBg } = useThemeColors();
  const { inProgress, execute } = useActionGuard();

  const unreadBg = isDarkMode ? '#1e3a5f' : '#dbeafe';

  const loadNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const { notifications: loadedNotifications } = await api.getNotifications();
      setNotifications(loadedNotifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError(err.message || '알림을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

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

  const handleMarkAsRead = async (notificationId) => {
    await execute(async () => {
      try {
        await api.markNotificationAsRead(notificationId);
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
          )
        );
      } catch (err) {
        console.error('Failed to mark as read:', err);
        setError(err.message || '알림 읽음 처리에 실패했습니다.');
      }
    });
  };

  const handleMarkAllAsRead = async () => {
    await execute(async () => {
      try {
        await api.markAllNotificationsAsRead();
        setNotifications(prev =>
          prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        );
      } catch (err) {
        console.error('Failed to mark all as read:', err);
        setError(err.message || '모두 읽음 처리에 실패했습니다.');
      }
    });
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
  };

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
        top: 0, left: 0, right: 0, bottom: 0,
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
          boxShadow: isDarkMode
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: `1px solid ${borderColor}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: textColor }}>알림</h2>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', color: secondaryTextColor,
                cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center'
              }}
              title="닫기"
            >
              <X size={24} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'unread'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '8px 16px', borderRadius: '8px', border: 'none',
                  backgroundColor: filter === f ? '#3B82F6' : 'transparent',
                  color: filter === f ? '#fff' : textColor,
                  cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'all 0.2s'
                }}
              >
                {f === 'all' ? `전체 (${notifications.length})` : `읽지않음 (${notifications.filter(n => !n.isRead).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
          {error && (
            <div style={{ padding: '12px 24px' }}>
              <ErrorAlert message={error} />
            </div>
          )}

          {loading ? (
            <LoadingSpinner message="로딩 중..." />
          ) : filteredNotifications.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: secondaryTextColor }}>
              <Bell size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '16px' }}>
                {filter === 'unread' ? '읽지 않은 알림이 없습니다.' : '알림이 없습니다.'}
              </p>
            </div>
          ) : (
            <div>
              {filteredNotifications.map((notification, index) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    padding: '16px 24px',
                    borderBottom: index < filteredNotifications.length - 1 ? `1px solid ${borderColor}` : 'none',
                    backgroundColor: notification.isRead ? 'transparent' : unreadBg,
                    cursor: 'pointer', transition: 'background-color 0.2s',
                    position: 'relative',
                    paddingLeft: notification.isRead ? '24px' : '44px'
                  }}
                  onMouseEnter={(e) => { if (notification.isRead) e.currentTarget.style.backgroundColor = hoverBg; }}
                  onMouseLeave={(e) => { if (notification.isRead) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {!notification.isRead && (
                    <div style={{
                      position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                      width: '8px', height: '8px', backgroundColor: '#3B82F6', borderRadius: '50%'
                    }} />
                  )}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ color: '#3B82F6', flexShrink: 0, marginTop: '2px' }}>
                      {getIcon(notification.type)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: textColor, marginBottom: '4px' }}>
                        {notification.title}
                      </div>
                      <div style={{ fontSize: '14px', color: secondaryTextColor, marginBottom: '8px', lineHeight: '1.5' }}>
                        {notification.message}
                      </div>
                      <div style={{ fontSize: '12px', color: secondaryTextColor, opacity: 0.8 }}>
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
        {!loading && notifications.filter(n => !n.isRead).length > 0 && (
          <div style={{
            padding: '16px 24px',
            borderTop: `1px solid ${borderColor}`,
            display: 'flex', justifyContent: 'flex-end'
          }}>
            <button
              onClick={handleMarkAllAsRead}
              disabled={inProgress}
              style={{
                padding: '10px 20px', borderRadius: '8px',
                border: `1px solid ${borderColor}`, backgroundColor: 'transparent',
                color: textColor, cursor: inProgress ? 'not-allowed' : 'pointer',
                fontSize: '14px', fontWeight: '500', transition: 'all 0.2s',
                opacity: inProgress ? 0.6 : 1
              }}
              onMouseEnter={(e) => { if (!inProgress) e.currentTarget.style.backgroundColor = hoverBg; }}
              onMouseLeave={(e) => { if (!inProgress) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              모두 읽음 처리
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
