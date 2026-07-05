import { useWindowDimensions } from 'react-native';

const TABLET_BREAKPOINT = 700;

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= TABLET_BREAKPOINT;
  const isLandscape = width > height;

  return { width, height, isTablet, isLandscape };
}
