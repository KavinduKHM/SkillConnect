import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return styles.elevated;
      case 'outlined':
        return styles.outlined;
      default:
        return styles.default;
    }
  };

  return <View style={[styles.card, getVariantStyles(), style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  default: {},
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  outlined: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});