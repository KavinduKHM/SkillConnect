import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { RADIUS } from '../../theme/shadows';

interface StatusBadgeProps {
  status: string | boolean;
  type?: 'status' | 'role' | 'badge';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'status' }) => {
  const getBadgeStyle = () => {
    if (type === 'role') {
      switch (String(status).toUpperCase()) {
        case 'ADMIN': return { bg: '#F3E8FF', text: '#7E22CE' };
        case 'SKILL_SHARER': return { bg: COLORS.honeyBg, text: COLORS.honeyText };
        case 'LEARNER': return { bg: COLORS.badgeOrangeBg, text: COLORS.primary };
        default: return { bg: COLORS.surfaceMuted, text: COLORS.neutralMedium };
      }
    }

    if (type === 'badge') {
      return status
        ? { bg: COLORS.badgeGreenBg, text: COLORS.badgeGreenText }
        : { bg: COLORS.surfaceMuted, text: COLORS.neutralLight };
    }

    switch (String(status).toUpperCase()) {
      case 'ACTIVE':
      case 'APPROVED':
      case 'PUBLISHED':
        return { bg: COLORS.badgeGreenBg, text: COLORS.badgeGreenText };
      case 'SUSPENDED':
      case 'REJECTED':
        return { bg: COLORS.errorBg, text: COLORS.error };
      case 'PENDING':
      case 'DRAFT':
        return { bg: COLORS.honeyBg, text: COLORS.honeyText };
      default:
        return { bg: COLORS.surfaceMuted, text: COLORS.neutralMedium };
    }
  };

  const getLabel = () => {
    if (type === 'role') return String(status);
    if (type === 'badge') return status ? 'Verified' : 'Unverified';
    return String(status);
  };

  const config = getBadgeStyle();

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{getLabel()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  text: {
    ...TYPOGRAPHY.labelSm,
  },
});