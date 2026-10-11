import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card } from '../common/Card';
import { StatusBadge } from './StatusBadge';
import { RoleBadge } from './RoleBadge';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { RADIUS } from '../../theme/shadows';

interface UserCardProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status?: string;
    verifiedBadge?: boolean;
    createdAt?: string;
  };
  onPress?: () => void;
  onStatusToggle?: () => void;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onPress,
  onStatusToggle,
}) => {
  return (
    <Card variant="elevated" style={styles.cardContainer} onPress={onPress}>
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>

        <View style={styles.userMeta}>
          <View style={styles.nameRow}>
            <Text style={styles.nameText} numberOfLines={1}>
              {user.name}
            </Text>
            {user.verifiedBadge ? (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={COLORS.primary}
                style={styles.verifiedIcon}
              />
            ) : null}
          </View>
          <Text style={styles.emailText} numberOfLines={1}>
            {user.email}
          </Text>
        </View>

        {onStatusToggle ? (
          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={onStatusToggle}
            activeOpacity={0.7}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={18}
              color={COLORS.neutralMedium}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.footerRow}>
        <RoleBadge role={user.role} />
        <StatusBadge status={user.status || 'ACTIVE'} />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceCard,
    borderColor: COLORS.borderSubtle,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.badgeOrangeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    ...TYPOGRAPHY.headlineSm,
    color: COLORS.primary,
    fontWeight: '800',
  },
  userMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameText: {
    ...TYPOGRAPHY.headlineSm,
    fontSize: 16,
    color: COLORS.neutralDark,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  emailText: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.neutralMedium,
    marginTop: 2,
  },
  toggleBtn: {
    padding: 8,
    borderRadius: RADIUS.full,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderWarm,
  },
});
