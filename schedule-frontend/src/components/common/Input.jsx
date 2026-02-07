import React, { useState } from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import { transition } from '../../styles/design-tokens';

const FOCUS_RING = '0 0 0 3px rgba(59,130,246,0.4)';

export default function Input({
  label,
  error,
  required,
  style = {},
  containerStyle = {},
  ...props
}) {
  const { textColor, errorColor } = useThemeColors();
  const { inputStyle, labelStyle } = useCommonStyles();
  const [focused, setFocused] = useState(false);

  return (
    <div style={containerStyle}>
      {label && (
        <label style={labelStyle}>
          {label}{required && ' *'}
        </label>
      )}
      <input
        required={required}
        style={{
          ...inputStyle,
          transition: `border-color ${transition.normal}, box-shadow ${transition.normal}`,
          boxShadow: focused ? FOCUS_RING : 'none',
          borderColor: error ? errorColor : inputStyle.borderColor,
          ...style,
        }}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />
      {error && (
        <div style={{ fontSize: '12px', color: errorColor, marginTop: '4px' }}>
          {error}
        </div>
      )}
    </div>
  );
}
