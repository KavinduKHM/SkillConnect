import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { adminService, User } from '../../api/admin.service';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { RoleBadge } from '../../components/admin/RoleBadge';
import { Card } from '../../components/common/Card';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { RADIUS, SHADOWS } from '../../theme/shadows';

export const UsersScreen = ({ navigation }: any) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['users', search, roleFilter, statusFilter],
    queryFn: () =>
      adminService.getUsers({
        search,
        role: roleFilter,
        status: statusFilter,
      }),
  });

  const handleSuspend = async (user: User) => {
    Alert.alert(
      'Suspend User Account',
      `Are you sure you want to suspend ${user.name} (${user.email})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend User',
          style: 'destructive',
          onPress: async () => {
            const reason = 'Violation of platform guidelines';
            try {
              await adminService.suspendUser(user.id, reason);
              Alert.alert('Success', `${user.name} has been suspended.`);
              queryClient.invalidateQueries({ queryKey: ['users'] });
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to suspend user');
            }
          },
        },
      ]
    );
  };

  const handleRestore = async (user: User) => {
    Alert.alert(
      'Restore User Account',
      `Are you sure you want to restore active status for ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore User',
          onPress: async () => {
            try {
              await adminService.restoreUser(user.id);
              Alert.alert('Success', `${user.name} has been restored.`);
              queryClient.invalidateQueries({ queryKey: ['users'] });
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to restore user');
            }
          },
        },
      ]
    );
  };

  const handleToggleBadge = async (user: User) => {
    try {
      if (user.verifiedBadge) {
        await adminService.removeBadge(user.id);
        Alert.alert('Badge Removed', `Verified badge removed from ${user.name}`);
      } else {
        await adminService.assignBadge(user.id);
        Alert.alert('Badge Assigned', `Verified badge assigned to ${user.name}`);
      }
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update badge status');
    }
  };

  const users = data?.data?.users || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentPadding}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <Text style={styles.subtitle}>
          Total Registered Users: {data?.data?.pagination?.total || users.length}
        </Text>
      </View>

      {/* Search & Filters */}
      <Card variant="elevated" style={styles.filtersCard}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.neutralMedium} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users by name or email..."
            placeholderTextColor={COLORS.neutralLight}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.neutralLight} />
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.filterSectionLabel}>Filter by Role:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {[
            { label: 'All Roles', value: '' },
            { label: 'Admin', value: 'ADMIN' },
            { label: 'Skill Sharer', value: 'SKILL_SHARER' },
            { label: 'Learner', value: 'LEARNER' },
          ].map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.filterPill,
                roleFilter === item.value && styles.filterPillActive,
              ]}
              onPress={() => setRoleFilter(item.value)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  roleFilter === item.value && styles.filterPillTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.filterSectionLabel, { marginTop: 10 }]}>Filter by Status:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {[
            { label: 'All Status', value: '' },
            { label: 'Active', value: 'ACTIVE' },
            { label: 'Suspended', value: 'SUSPENDED' },
          ].map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.filterPill,
                statusFilter === item.value && styles.filterPillActive,
              ]}
              onPress={() => setStatusFilter(item.value)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  statusFilter === item.value && styles.filterPillTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Card>

      {/* Users List */}
      {users.map((user: User) => (
        <Card key={user.id} variant="elevated" style={styles.userCard}>
          <TouchableOpacity
            style={styles.userHeaderRow}
            onPress={() => navigation.navigate('UserDetail', { userId: user.id })}
            activeOpacity={0.8}
          >
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>

            <View style={styles.userDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user.name}
                </Text>
                {user.verifiedBadge ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={COLORS.primary}
                    style={{ marginLeft: 4 }}
                  />
                ) : null}
              </View>

              <Text style={styles.userEmail} numberOfLines={1}>
                {user.email}
              </Text>

              <View style={styles.badgesRow}>
                <RoleBadge role={user.role} />
                <StatusBadge status={user.status || 'ACTIVE'} />
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.userActionsRow}>
            {user.role === 'SKILL_SHARER' && (
              <TouchableOpacity
                style={styles.badgeToggleBtn}
                onPress={() => handleToggleBadge(user)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={user.verifiedBadge ? 'ribbon' : 'ribbon-outline'}
                  size={14}
                  color={COLORS.primary}
                />
                <Text style={styles.badgeToggleText}>
                  {user.verifiedBadge ? 'Remove Badge' : 'Verify Sharer'}
                </Text>
              </TouchableOpacity>
            )}

            {user.role !== 'ADMIN' && (
              <>
                {user.status === 'ACTIVE' ? (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.suspendBtn]}
                    onPress={() => handleSuspend(user)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="ban-outline" size={14} color={COLORS.error} />
                    <Text style={styles.suspendText}>Suspend</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.restoreBtn]}
                    onPress={() => handleRestore(user)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="refresh-outline" size={14} color={COLORS.badgeGreenText} />
                    <Text style={styles.restoreText}>Restore</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </Card>
      ))}

      {users.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={40} color={COLORS.neutralLight} />
          <Text style={styles.emptyTitle}>No matching users</Text>
          <Text style={styles.emptyText}>Try adjusting search or role filters.</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgWarm,
  },
  contentPadding: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    ...TYPOGRAPHY.displayLg,
    fontSize: 26,
    color: COLORS.neutralDark,
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.neutralMedium,
    marginTop: 2,
  },
  filtersCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surfaceCard,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.neutralDark,
    marginLeft: 8,
    paddingVertical: 0,
  },
  filterSectionLabel: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.neutralMedium,
    marginBottom: 6,
  },
  filterRow: {
    flexDirection: 'row',
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceMuted,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  filterPillActive: {
    backgroundColor: COLORS.badgeOrangeBg,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.neutralMedium,
  },
  filterPillTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  userCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceCard,
  },
  userHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 46,
    height: 46,
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
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    ...TYPOGRAPHY.headlineSm,
    fontSize: 16,
    color: COLORS.neutralDark,
  },
  userEmail: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.neutralMedium,
    marginTop: 2,
    marginBottom: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderWarm,
  },
  badgeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.badgeOrangeBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    marginRight: 'auto',
  },
  badgeToggleText: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.primary,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  suspendBtn: {
    backgroundColor: COLORS.errorBg,
  },
  suspendText: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.error,
    fontWeight: '700',
  },
  restoreBtn: {
    backgroundColor: COLORS.badgeGreenBg,
  },
  restoreText: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.badgeGreenText,
    fontWeight: '700',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...TYPOGRAPHY.headlineSm,
    color: COLORS.neutralDark,
    marginTop: 12,
  },
  emptyText: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.neutralMedium,
    marginTop: 4,
  },
});