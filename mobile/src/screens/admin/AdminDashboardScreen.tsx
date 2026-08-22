import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../api/admin.service';

const StatCard = ({ label, value, icon, color }: any) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export const AdminDashboardScreen = ({ navigation }: any) => {
  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminService.getUsers({ limit: 100 }),
  });

  const { data: pendingCoursesData } = useQuery({
    queryKey: ['pending-courses'],
    queryFn: () => adminService.getPendingCourses(),
  });

  const { data: pendingQualificationsData } = useQuery({
    queryKey: ['pending-qualifications'],
    queryFn: () => adminService.getPendingQualifications(),
  });

  const totalUsers = usersData?.data?.pagination?.total || 0;
  const pendingCourses = pendingCoursesData?.data?.length || 0;
  const pendingQualifications = pendingQualificationsData?.data?.length || 0;

  const handleLogout = async () => {
    const doLogout = async () => {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      if (Platform.OS === 'web') {
        window.location.replace('/');
      } else {
        try {
          if (typeof (navigation as any).replace === 'function') {
            (navigation as any).replace('Auth');
          } else {
            (navigation as any).navigate('Auth');
          }
        } catch (e) {
          (navigation as any).navigate('Auth');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        doLogout();
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: doLogout,
          },
        ]
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Platform overview</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          label="Total Users"
          value={totalUsers}
          color="#3b82f6"
        />
        <StatCard
          label="Pending Courses"
          value={pendingCourses}
          color="#f59e0b"
        />
        <StatCard
          label="Pending Qualifications"
          value={pendingQualifications}
          color="#8b5cf6"
        />
      </View>

      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Users')}
        >
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Manage Users</Text>
            <Text style={styles.actionDescription}>View, suspend, and restore users</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Qualifications')}
        >
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Review Qualifications</Text>
            <Text style={styles.actionDescription}>
              {pendingQualifications > 0
                ? `${pendingQualifications} pending verification`
                : 'No pending qualifications'}
            </Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('CourseApproval')}
        >
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Course Approval</Text>
            <Text style={styles.actionDescription}>
              {pendingCourses > 0
                ? `${pendingCourses} courses awaiting approval`
                : 'No pending courses'}
            </Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Categories')}
        >
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Categories</Text>
            <Text style={styles.actionDescription}>Manage course categories</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Skills')}
        >
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Skills</Text>
            <Text style={styles.actionDescription}>Manage platform skills</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Profile & Logout Section */}
      <View style={styles.profileSection}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>👤 My Profile</Text>
            <Text style={styles.actionDescription}>View and edit your profile</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        
        <TouchableOpacity
        style={styles.logoutCard}
        onPress={handleLogout}
        >
        <View style={styles.actionContent}>
            <Text style={[styles.actionTitle, { color: '#dc2626' }]}>🚪 Logout</Text>
            <Text style={styles.actionDescription}>Sign out of your account</Text>
        </View>
        <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  profileSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  actionDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  actionArrow: {
    fontSize: 20,
    color: '#9ca3af',
  },
});