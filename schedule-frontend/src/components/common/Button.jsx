import React, { useState } from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { borderRadius, transition } from '../../styles/design-tokens';

const FOCUS_RING = '0 0 0 3px rgba(59,130,246,0.4)';

const VARIANTS = {
  primary: {
    bg: '#3B82F6',
    bgHover: '#2563EB',
    bgDisabled: '#1e40af',
    color: '#fff',
  },
  secondary: (isDark) => ({
    bg: isDark ? '#334155' : '#e2e8f0',
    bgHover: isDark ? '#475569' : '#cbd5e1',
    bgDisabled: isDark ? '#1e293b' : '#f1f5f9',
    color: isDark ? '#e2e8f0' : '#1e293b',
  }),
  danger: {
    bg: '#ef4444',
    bgHover: '#dc2626',
    bgDisabled: '#991b1b',
    color: '#fff',
  },
  success: {
    bg: '#10b981',
    bgHover: '#059669',
    bgDisabled: '#065f46',
    color: '#fff',
  },
  ghost: (isDark) => ({
    bg: 'transparent',
    bgHover: isDark ? '#334155' : '#f1f5f9',
    bgDisabled: 'transparent',
    color: isDark ? '#e2e8f0' : '#1e293b',
  }),
};

const SIZES = {
  sm: { padding: '8px 12px', fontSize: '13px' },
  md: { padding: '12px 16px', fontSize: '14px' },
  lg: { padding: '14px 20px', fontSize: '16px' },
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style = {},
  ...props
}) {
  const { isDarkMode } = useThemeColors();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const variantConfig = typeof VARIANTS[variant] === 'function'
    ? VARIANTS[variant](isDarkMode)
    : VARIANTS[variant];
  const sizeConfig = SIZES[size];

  const isDisabled = disabled || loading;

  const buttonStyle = {
    ...sizeConfig,
    borderRadius: borderRadius.md,
    border: 'none',
    backgroundColor: isDisabled
      ? variantConfig.bgDisabled
      : hovered
        ? variantConfig.bgHover
        : variantConfig.bg,
    color: variantConfig.color,
    fontWeight: '600',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transition: `background-color ${transition.normal}, box-shadow ${transition.normal}`,
    outline: 'none',
    boxShadow: focused ? FOCUS_RING : 'none',
    opacity: isDisabled ? 0.7 : 1,
    width: fullWidth ? '100%' : undefined,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'inherit',
    ...style,
  };

  return (
    <button
      style={buttonStyle}
      disabled={isDisabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      {...props}
    >
      {loading ? (
        <>
          <span style={{
            display: 'inline-block',
            width: '14px',
            height: '14px',
            border: '2px solid transparent',
            borderTopColor: 'currentColor',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
          }} />
          {children}
        </>
      ) : children}
    </button>
  );
}
