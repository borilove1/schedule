import React from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';

const FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Pretendard", "Inter", sans-serif';

export default function ConfirmDialog({ title, message, actions, onCancel }) {
  const { cardBg, textColor, secondaryTextColor, borderColor } = useThemeColors();

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1001,
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: cardBg,
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '400px',
        width: '100%',
        fontFamily: FONT_FAMILY,
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: '12px',
          color: textColor,
          margin: '0 0 12px 0',
        }}>
          {title}
        </h3>
        {message && (
          <p style={{
            fontSize: '14px',
            color: secondaryTextColor,
            marginBottom: '24px',
            lineHeight: '1.5',
            margin: '0 0 24px 0',
          }}>
            {message}
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              disabled={action.disabled}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: action.variant === 'primary' || action.variant === 'danger' || action.variant === 'success'
                  ? 'none'
                  : `1px solid ${borderColor}`,
                backgroundColor: action.variant === 'primary' ? '#3B82F6'
                  : action.variant === 'danger' ? '#ef4444'
                  : action.variant === 'success' ? '#10B981'
                  : 'transparent',
                color: (action.variant === 'primary' || action.variant === 'danger' || action.variant === 'success')
                  ? '#fff'
                  : textColor,
                cursor: action.disabled ? 'not-allowed' : 'pointer',
                opacity: action.disabled ? 0.5 : 1,
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: FONT_FAMILY,
              }}
            >
              {action.label}
            </button>
          ))}
          <button
            onClick={onCancel}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: `1px solid ${borderColor}`,
              backgroundColor: 'transparent',
              color: textColor,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: FONT_FAMILY,
            }}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
