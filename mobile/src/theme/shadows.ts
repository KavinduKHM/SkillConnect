import { ViewStyle } from 'react-native';

export const SHADOWS = {
  // Level 1: Resting card elevation with warm diffuse glow
  level1: {
    shadowColor: '#693E2A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  } as ViewStyle,

  // Level 2: Active / Lifted / Popover elevation
  level2: {
    shadowColor: '#693E2A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  } as ViewStyle,

  // Level 3: Sticky bottom tray elevation
  level3: {
    shadowColor: '#693E2A',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 10,
  } as ViewStyle,

  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } as ViewStyle,
};

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
