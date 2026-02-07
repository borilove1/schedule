import { useMemo } from 'react';
import { useThemeColors } from './useThemeColors';

const FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Pretendard", "Inter", sans-serif';
const FOCUS_RING = '0 0 0 3px rgba(59,130,246,0.4)';

export function useCommonStyles() {
  const colors = useThemeColors();

  return useMemo(() => ({
    fontFamily: FONT_FAMILY,
    focusRing: FOCUS_RING,

    inputStyle: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: `1px solid ${colors.borderColor}`,
      backgroundColor: colors.inputBg,
      color: colors.textColor,
      fontSize: '14px',
      outline: 'none',
      boxSizing: 'border-box',
      fontFamily: FONT_FAMILY,
      transition: 'border-color 0.2s, box-shadow 0.2s',
    },

    labelStyle: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: colors.textColor,
      marginBottom: '8px',
      fontFamily: FONT_FAMILY,
    },

    selectStyle: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: `1px solid ${colors.borderColor}`,
      backgroundColor: colors.inputBg,
      color: colors.textColor,
      fontSize: '14px',
      outline: 'none',
      boxSizing: 'border-box',
      fontFamily: FONT_FAMILY,
      cursor: 'pointer',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    },
  }), [colors]);
}
