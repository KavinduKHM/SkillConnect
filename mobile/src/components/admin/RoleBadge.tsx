import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { RADIUS } from '../../theme/shadows';

interface RoleBadgeProps {
  role: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const getBadgeStyle = () => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return { bg: '#F3E8FF', text: '#7E22CE' };
      case 'SKILL_SHARER':
      case 'TEACHER':
        return { bg: COLORS.honeyBg, text: COLORS.honeyText };
      case 'LEARNER':
      case 'STUDENT':
      default:
        return { bg: COLORS.badgeOrangeBg, text: COLORS.primary };
    }
  };

  const styleConfig = getBadgeStyle();

  return (
    <View style={[styles.badge, { backgroundColor: styleConfig.bg }]}>
      <Text style={[styles.text, { color: styleConfig.text }]}>
        {role ? role.replace('_', ' ') : 'LEARNER'}
      </Text>
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
    textTransform: 'uppercase',
  },
});
