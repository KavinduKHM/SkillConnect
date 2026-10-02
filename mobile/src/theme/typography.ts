import { TextStyle } from 'react-native';

export const TYPOGRAPHY = {
  displayLg: {
    fontSize: 32,
    fontWeight: '800' as const,
    lineHeight: 40,
    letterSpacing: -0.8,
  } as TextStyle,
  headlineLg: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
    letterSpacing: -0.5,
  } as TextStyle,
  headlineMd: {
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 26,
    letterSpacing: -0.3,
  } as TextStyle,
  headlineSm: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: -0.2,
  } as TextStyle,
  bodyLg: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  } as TextStyle,
  bodyMd: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  } as TextStyle,
  bodySm: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
  } as TextStyle,
  labelLg: {
    fontSize: 14,
    fontWeight: '700' as const,
    lineHeight: 18,
    letterSpacing: 0.2,
  } as TextStyle,
  labelMd: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 0.3,
  } as TextStyle,
  labelSm: {
    fontSize: 11,
    fontWeight: '700' as const,
    lineHeight: 14,
    letterSpacing: 0.4,
  } as TextStyle,
};
