// 디자인 토큰 중앙화
// 모든 컴포넌트에서 일관된 값을 사용하기 위한 토큰 정의

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  xxl: '24px',
  xxxl: '32px',
};

export const fontSize = {
  xs: '11px',
  sm: '12px',
  md: '14px',
  lg: '16px',
  xl: '20px',
  xxl: '24px',
};

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
};

export const zIndex = {
  dropdown: 100,
  sticky: 200,
  modal: 1000,
  modalBackdrop: 999,
  tooltip: 1100,
  toast: 1200,
};

export const transition = {
  fast: '0.15s ease',
  normal: '0.2s ease',
  slow: '0.3s ease',
};

export const shadow = {
  sm: '0 1px 3px rgba(0,0,0,0.08)',
  md: '0 4px 12px rgba(0,0,0,0.1)',
  lg: '0 10px 40px rgba(0,0,0,0.08)',
  lgDark: '0 10px 40px rgba(0,0,0,0.3)',
  modal: '0 20px 60px rgba(0,0,0,0.15)',
  modalDark: '0 20px 60px rgba(0,0,0,0.4)',
};

export const breakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
};
