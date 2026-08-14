import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusBadgeProps {
  status: string | boolean;
  type?: 'status' | 'role' | 'badge';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'status' }) => {
  const getStyles = () => {
    if (type === 'role') {
      switch (status) {
        case 'ADMIN': return styles.admin;
        case 'SKILL_SHARER': return styles.skillSharer;
        case 'LEARNER': return styles.learner;
        default: return styles.default;
      }
    }

    if (type === 'badge') {
      return status ? styles.verified : styles.unverified;
    }

    switch (status) {
      case 'ACTIVE': return styles.active;
      case 'SUSPENDED': return styles.suspended;
      default: return styles.default;
    }
  };

  const getLabel = () => {
    if (type === 'role') return String(status);
    if (type === 'badge') return status ? 'Verified' : 'Unverified';
    return String(status);
  };

  return (
    <View style={[styles.badge, getStyles()]}>
      <Text style={styles.text}>{getLabel()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  active: { backgroundColor: '#22c55e' },
  suspended: { backgroundColor: '#ef4444' },
  admin: { backgroundColor: '#8b5cf6' },
  skillSharer: { backgroundColor: '#3b82f6' },
  learner: { backgroundColor: '#22c55e' },
  verified: { backgroundColor: '#f59e0b' },
  unverified: { backgroundColor: '#9ca3af' },
  default: { backgroundColor: '#6b7280' },
});