import React from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';

export default function Skeleton({ width = '100%', height = '20px', borderRadius = '8px', style = {} }) {
  const { isDarkMode } = useThemeColors();

  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: isDarkMode ? '#334155' : '#e2e8f0',
        animation: 'skeletonPulse 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

// CSS keyframes를 한 번만 주입
if (typeof document !== 'undefined' && !document.getElementById('skeleton-keyframes')) {
  const styleEl = document.createElement('style');
  styleEl.id = 'skeleton-keyframes';
  styleEl.textContent = `
    @keyframes skeletonPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleEl);
}
