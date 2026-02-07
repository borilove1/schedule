import { useMemo } from 'react';
import { useThemeColors } from './useThemeColors';

const FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Pretendard", "Inter", sans-serif';

export function useCommonStyles() {
  const colors = useThemeColors();

  return useMemo(() => ({
    fontFamily: FONT_FAMILY,

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
    },
  }), [colors]);
}
