import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SHADOWS } from '../../theme/shadows';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  onPress,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return [styles.cardBase, SHADOWS.level2, styles.outlinedBorder];
      case 'outlined':
        return [styles.cardBase, styles.outlinedBorder];
      case 'flat':
        return [styles.cardBase, { backgroundColor: COLORS.surfaceMuted }];
      case 'default':
      default:
        return [styles.cardBase, SHADOWS.level1, styles.outlinedBorder];
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[getVariantStyles(), style]}
        onPress={onPress}
        activeOpacity={0.88}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[getVariantStyles(), style]}>{children}</View>;
};

const styles = StyleSheet.create({
  cardBase: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 12,
  },
  outlinedBorder: {
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
});