import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { adminService } from '../../api/admin.service';
import { Card } from '../../components/common/Card';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { RADIUS, SHADOWS } from '../../theme/shadows';

const StatCard = ({ label, value, icon, color }: any) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={styles.statHeader}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={styles.statValue}>{value}</Text>
    </View>
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

  const { data: allCoursesData } = useQuery({
    queryKey: ['all-admin-courses-count'],
    queryFn: () => adminService.getAllCourses({ limit: 1 }),
  });

  const { data: pendingQualificationsData } = useQuery({
    queryKey: ['pending-qualifications'],
    queryFn: () => adminService.getPendingQualifications(),
  });

  const totalUsers = usersData?.data?.pagination?.total || 0;
  const totalCourses = allCoursesData?.data?.pagination?.total || 0;
  const pendingCourses = pendingCoursesData?.data?.length || 0;
  const pendingQualifications = pendingQualificationsData?.data?.length || 0;

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to sign out of the Admin Panel?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentPadding} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Control Center</Text>
        <Text style={styles.subtitle}>Overview of platform safety, users, and content quality</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          label="Total Users"
          value={totalUsers}
          icon="people"
          color={COLORS.primary}
        />
        <StatCard
          label="Total Courses"
          value={totalCourses}
          icon="book"
          color={COLORS.terracottaGold}
        />
        <StatCard
          label="Pending Approvals"
          value={pendingCourses}
          icon="time"
          color={COLORS.terracottaSand}
        />
        <StatCard
          label="Pending Quals"
          value={pendingQualifications}
          icon="ribbon"
          color="#8B5CF6"
        />
      </View>

      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>User & Content Governance</Text>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Users')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBg, { backgroundColor: COLORS.badgeOrangeBg }]}>
            <Ionicons name="people-outline" size={22} color={COLORS.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Manage Users</Text>
            <Text style={styles.actionDescription}>View, suspend, restore users & assign badges</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.neutralLight} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('AdminCourses')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBg, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#E65100" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Manage Courses (Suspend / Hold)</Text>
            <Text style={styles.actionDescription}>Moderate, approve, suspend or hold courses</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.neutralLight} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Qualifications')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBg, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="ribbon-outline" size={22} color="#7C3AED" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Review Qualifications</Text>
            <Text style={styles.actionDescription}>
              {pendingQualifications > 0
                ? `${pendingQualifications} pending verification`
                : 'All qualifications reviewed'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.neutralLight} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Categories')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBg, { backgroundColor: '#E0F2FE' }]}>
            <Ionicons name="folder-open-outline" size={22} color="#0284C7" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Categories</Text>
            <Text style={styles.actionDescription}>Organize course category structure</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.neutralLight} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Skills')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBg, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="sparkles-outline" size={22} color="#15803D" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Skills Management</Text>
            <Text style={styles.actionDescription}>Manage skill tags and taxonomy</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.neutralLight} />
        </TouchableOpacity>
      </View>

      {/* Account Section */}
      <View style={styles.profileSection}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBg, { backgroundColor: COLORS.surfaceMuted }]}>
            <Ionicons name="person-outline" size={22} color={COLORS.neutralDark} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>My Profile</Text>
            <Text style={styles.actionDescription}>View administrator details</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.neutralLight} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutCard}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBg, { backgroundColor: COLORS.errorBg }]}>
            <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
          </View>
          <View style={styles.actionContent}>
            <Text style={[styles.actionTitle, { color: COLORS.error }]}>Sign Out</Text>
            <Text style={styles.actionDescription}>Log out of Admin panel</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.error} />
        </TouchableOpacity>
      </View>
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
    marginBottom: 20,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surfaceCard,
    padding: 16,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 4,
    ...SHADOWS.card,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statValue: {
    ...TYPOGRAPHY.displayLg,
    fontSize: 24,
    color: COLORS.neutralDark,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.neutralMedium,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  profileSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...TYPOGRAPHY.headlineSm,
    color: COLORS.neutralDark,
    marginBottom: 12,
  },
  actionCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.card,
  },
  logoutCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.errorBg,
    ...SHADOWS.card,
  },
  actionIconBg: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    ...TYPOGRAPHY.headlineSm,
    fontSize: 15,
    color: COLORS.neutralDark,
  },
  actionDescription: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.neutralMedium,
    marginTop: 2,
  },
});