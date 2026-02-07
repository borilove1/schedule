import { useState, useEffect } from 'react';
import { breakpoints } from '../styles/design-tokens';

export function useResponsive() {
  const [screen, setScreen] = useState(() => getScreen());

  function getScreen() {
    const w = window.innerWidth;
    if (w <= breakpoints.mobile) return 'mobile';
    if (w <= breakpoints.tablet) return 'tablet';
    return 'desktop';
  }

  useEffect(() => {
    const handleResize = () => setScreen(getScreen());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    screen,
    isMobile: screen === 'mobile',
    isTablet: screen === 'tablet',
    isDesktop: screen === 'desktop',
    isMobileOrTablet: screen !== 'desktop',
  };
}
