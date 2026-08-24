import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService, User } from '../../api/admin.service';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { Header } from '../../components/common/Header';

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
    const action = async () => {
      queryClient.setQueryData(['users', search, roleFilter, statusFilter], (old: any) => {
        if (!old?.data?.users) return old;
        return { ...old, data: { ...old.data, users: old.data.users.map((u: any) => u.id === user.id ? { ...u, status: 'SUSPENDED' } : u) } };
      });
      const reason = 'Violation of platform guidelines';
      try {
        await adminService.suspendUser(user.id, reason);
        Toast.show({ type: 'success', text1: 'Success', text2: 'User suspended' });
        queryClient.invalidateQueries({ queryKey: ['users'] });
      } catch (error: any) {
        Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.error || 'Failed to suspend user' });
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to suspend ${user.name}?`)) {
        action();
      }
    } else {
      Alert.alert(
        'Suspend User',
        `Are you sure you want to suspend ${user.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Suspend', style: 'destructive', onPress: action },
        ]
      );
    }
  };

  const handleRestore = async (user: User) => {
    const action = async () => {
      queryClient.setQueryData(['users', search, roleFilter, statusFilter], (old: any) => {
        if (!old?.data?.users) return old;
        return { ...old, data: { ...old.data, users: old.data.users.map((u: any) => u.id === user.id ? { ...u, status: 'ACTIVE' } : u) } };
      });
      try {
        await adminService.restoreUser(user.id);
        Toast.show({ type: 'success', text1: 'Success', text2: 'User restored' });
        queryClient.invalidateQueries({ queryKey: ['users'] });
      } catch (error: any) {
        Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.error || 'Failed to restore user' });
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to restore ${user.name}?`)) {
        action();
      }
    } else {
      Alert.alert(
        'Restore User',
        `Are you sure you want to restore ${user.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Restore', onPress: action },
        ]
      );
    }
  };

  const users = data?.data?.users || [];

  return (
    <View style={{ flex: 1 }}>
      <Header title="Users" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >

      {/* Search & Filters */}
      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          value={search}
          onChangeText={setSearch}
        />

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterButton, roleFilter === '' && styles.filterActive]}
            onPress={() => setRoleFilter('')}
          >
            <Text style={[styles.filterText, roleFilter === '' && styles.filterTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, roleFilter === 'ADMIN' && styles.filterActive]}
            onPress={() => setRoleFilter('ADMIN')}
          >
            <Text style={[styles.filterText, roleFilter === 'ADMIN' && styles.filterTextActive]}>
              Admin
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, roleFilter === 'SKILL_SHARER' && styles.filterActive]}
            onPress={() => setRoleFilter('SKILL_SHARER')}
          >
            <Text style={[styles.filterText, roleFilter === 'SKILL_SHARER' && styles.filterTextActive]}>
              Skill Sharer
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, roleFilter === 'LEARNER' && styles.filterActive]}
            onPress={() => setRoleFilter('LEARNER')}
          >
            <Text style={[styles.filterText, roleFilter === 'LEARNER' && styles.filterTextActive]}>
              Learner
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterButton, statusFilter === '' && styles.filterActive]}
            onPress={() => setStatusFilter('')}
          >
            <Text style={[styles.filterText, statusFilter === '' && styles.filterTextActive]}>
              All Status
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, statusFilter === 'ACTIVE' && styles.filterActive]}
            onPress={() => setStatusFilter('ACTIVE')}
          >
            <Text style={[styles.filterText, statusFilter === 'ACTIVE' && styles.filterTextActive]}>
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, statusFilter === 'SUSPENDED' && styles.filterActive]}
            onPress={() => setStatusFilter('SUSPENDED')}
          >
            <Text style={[styles.filterText, statusFilter === 'SUSPENDED' && styles.filterTextActive]}>
              Suspended
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Users List */}
      {users.map((user: User) => (
        <TouchableOpacity
          key={user.id}
          style={styles.userCard}
          onPress={() => navigation.navigate('UserDetail', { userId: user.id })}
        >
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.badgeContainer}>
                <StatusBadge status={user.role} type="role" />
                <StatusBadge status={user.status} type="status" />
                {user.verifiedBadge && (
                  <StatusBadge status="Verified" type="badge" />
                )}
              </View>
            </View>
          </View>

          <View style={styles.userActions}>
            {user.role !== 'ADMIN' && (
              <>
                {user.status === 'ACTIVE' ? (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.suspendButton]}
                    onPress={() => handleSuspend(user)}
                  >
                    <Text style={styles.actionButtonText}>Suspend</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.restoreButton]}
                    onPress={() => handleRestore(user)}
                  >
                    <Text style={styles.actionButtonText}>Restore</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </TouchableOpacity>
      ))}

      {users.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No users found</Text>
        </View>
      )}
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterActive: {
    backgroundColor: '#3b82f6',
  },
  filterText: {
    fontSize: 12,
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#fff',
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3b82f6',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  userEmail: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  suspendButton: {
    backgroundColor: '#fee2e2',
  },
  restoreButton: {
    backgroundColor: '#dcfce7',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 16,
  },
});