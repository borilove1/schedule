import React from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';

export default function ErrorAlert({ message }) {
  const { errorBg, errorColor } = useThemeColors();

  if (!message) return null;

  return (
    <div style={{
      padding: '12px',
      borderRadius: '8px',
      backgroundColor: errorBg,
      color: errorColor,
      fontSize: '14px',
      marginBottom: '16px',
    }}>
      {message}
    </div>
  );
}
