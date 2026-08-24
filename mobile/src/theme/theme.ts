export const theme = {
  colors: {
    // Primary Brand Colors (Forest Green & Mint Accent)
    primary: '#164E37',
    primaryDark: '#0D3826',
    primaryLight: '#2D6F53',
    primarySoft: '#E8F5E9',
    primaryMint: '#DCFCE7',
    primaryMintText: '#166534',

    // Canvas & Backgrounds
    background: '#FAF9F5',
    cardBackground: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceSecondary: '#F8FAFC',

    // Text Colors
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    textLight: '#FFFFFF',

    // Borders & Lines
    border: '#E2E8F0',
    borderLight: '#F1F5F9',

    // Status Colors
    success: '#15803D',
    successBg: '#DCFCE7',
    warning: '#D97706',
    warningBg: '#FEF3C7',
    error: '#DC2626',
    errorBg: '#FEE2E2',
    info: '#2563EB',
    infoBg: '#DBEAFE',

    // Rating
    star: '#F59E0B',

    // Bottom Navigation
    tabActive: '#164E37',
    tabInactive: '#94A3B8',
    tabBg: '#FFFFFF',
  },

  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },

  shadows: {
    soft: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    card: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },
  },

  typography: {
    headingLg: {
      fontSize: 24,
      fontWeight: '800' as const,
      color: '#0F172A',
    },
    headingMd: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: '#0F172A',
    },
    headingSm: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: '#0F172A',
    },
    body: {
      fontSize: 14,
      color: '#0F172A',
    },
    bodySecondary: {
      fontSize: 14,
      color: '#64748B',
    },
    caption: {
      fontSize: 12,
      color: '#94A3B8',
    },
  },
};

export default theme;
