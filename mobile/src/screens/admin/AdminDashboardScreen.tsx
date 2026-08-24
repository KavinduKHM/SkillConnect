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
import { Header } from '../../components/common/Header';

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
    queryFn: async () => {
      const response = await adminService.getPendingCourses();
      return response.data;
    },
  });

  const { data: pendingQualificationsData } = useQuery({
    queryKey: ['pending-qualifications'],
    queryFn: async () => {
      const response = await adminService.getPendingQualifications();
      return response.data;
    },
  });

  const totalUsers = usersData?.data?.pagination?.total || 0;
  const pendingCourses = pendingCoursesData?.length || 0;
  const pendingQualifications = pendingQualificationsData?.length || 0;

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
    <View style={{ flex: 1 }}>
      <Header title="Admin Dashboard" />
      <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F5',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
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
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  actionsContainer: {
    marginBottom: 24,
  },
  profileSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionDescription: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  actionArrow: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
});