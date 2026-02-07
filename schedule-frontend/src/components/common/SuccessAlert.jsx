import React from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';

export default function SuccessAlert({ message }) {
  const { successBg, successColor } = useThemeColors();

  if (!message) return null;

  return (
    <div style={{
      padding: '12px',
      borderRadius: '8px',
      backgroundColor: successBg,
      color: successColor,
      fontSize: '14px',
      marginBottom: '16px',
    }}>
      {message}
    </div>
  );
}
