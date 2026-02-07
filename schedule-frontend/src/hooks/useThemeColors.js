import { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export function useThemeColors() {
  const { isDarkMode } = useTheme();

  return useMemo(() => ({
    isDarkMode,
    bgColor:             isDarkMode ? '#0f172a' : '#f8fafc',
    cardBg:              isDarkMode ? '#283548' : '#ffffff',
    textColor:           isDarkMode ? '#e2e8f0' : '#1e293b',
    secondaryTextColor:  isDarkMode ? '#94a3b8' : '#64748b',
    borderColor:         isDarkMode ? '#475569' : '#cbd5e1',
    inputBg:             isDarkMode ? '#1e293b' : '#f8fafc',
    hoverBg:             isDarkMode ? '#334155' : '#f1f5f9',
    errorBg:             isDarkMode ? '#7f1d1d' : '#fef2f2',
    errorColor:          isDarkMode ? '#fca5a5' : '#dc2626',
    successBg:           isDarkMode ? '#1c3b2a' : '#f0fdf4',
    successColor:        '#10b981',
  }), [isDarkMode]);
}
