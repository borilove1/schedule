import React from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';

export default function LoadingSpinner({ message = '로딩 중...', size = 'medium' }) {
  const { secondaryTextColor, borderColor } = useThemeColors();

  const spinnerSize = size === 'small' ? 24 : 40;
  const borderWidth = size === 'small' ? 3 : 4;

  return (
    <div style={{
      padding: size === 'small' ? '16px' : '48px 24px',
      textAlign: 'center',
      color: secondaryTextColor,
    }}>
      <div style={{
        width: `${spinnerSize}px`,
        height: `${spinnerSize}px`,
        border: `${borderWidth}px solid ${borderColor}`,
        borderTop: `${borderWidth}px solid #3B82F6`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 16px',
      }} />
      {message && <p style={{ margin: 0, fontSize: '14px' }}>{message}</p>}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
