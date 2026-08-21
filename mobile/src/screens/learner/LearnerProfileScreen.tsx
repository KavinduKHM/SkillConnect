import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchMyLearning } from '../../api/learner.service';

export default function LearnerProfileScreen({ navigation }: any) {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [myLearningData, setMyLearningData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userJson = await AsyncStorage.getItem('@user');
      if (userJson) {
        setUserInfo(JSON.parse(userJson));
      }
      const learning = await fetchMyLearning().catch(() => null);
      if (learning) {
        setMyLearningData(learning);
      }
    } catch (err) {
      console.log('Error loading learner profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of SkillConnect?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['@token', '@user']);
          navigation?.reset({ index: 0, routes: [{ name: 'Auth' }] });
        },
      },
    ]);
  };

  const user = userInfo || {
    name: 'Asheni Learner',
    email: 'learner@skillconnect.com',
    role: 'LEARNER',
  };

  const enrolledCount = myLearningData?.totalEnrolled ?? 2;
  const inProgressList = myLearningData?.inProgress || [
    {
      id: 'e1',
      progressPercentage: 80,
      course: {
        title: 'React Native Mobile App Development',
        category: { name: 'Mobile Development' },
        creator: { name: 'John Perera' },
      },
      courseProgress: { completedLessons: 16, totalLessons: 20 },
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>My Profile 👤</Text>
        <TouchableOpacity style={styles.logoutHeaderBtn} onPress={handleLogout}>
          <Text style={styles.logoutHeaderBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#064E3B" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.contentPadding}>
            {/* Learner Card */}
            <View style={styles.profileCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{(user.name || 'A')[0]}</Text>
              </View>
              <Text style={styles.userName}>{user.name || 'Asheni Learner'}</Text>
              <Text style={styles.userEmail}>{user.email || 'learner@skillconnect.com'}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>🎓 Verified Learner</Text>
              </View>
            </View>

            {/* My Learning Quick Stats */}
            <View style={styles.statsGrid}>
              <View style={styles.statCol}>
                <Text style={styles.statNumber}>{enrolledCount}</Text>
                <Text style={styles.statLabel}>Enrolled Courses</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={styles.statNumber}>{myLearningData?.completed?.length || 0}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={styles.statNumber}>1</Text>
                <Text style={styles.statLabel}>Assessments</Text>
              </View>
            </View>

            {/* In Progress Courses List */}
            <Text style={styles.sectionHeading}>My Active Learning</Text>
            {inProgressList.map((item: any) => {
              const c = item.course || {};
              const pct = item.progressPercentage ?? item.courseProgress?.progressPercentage ?? 80;
              return (
                <View key={item.id} style={styles.courseItemCard}>
                  <Text style={styles.courseTitle}>{c.title || 'React Native Mobile App Development'}</Text>
                  <Text style={styles.instructorSub}>Instructor: {c.creator?.name || 'John Perera'}</Text>
                  <View style={styles.progressRow}>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={styles.progressPctText}>{pct}%</Text>
                  </View>
                </View>
              );
            })}

            {/* Account Settings */}
            <Text style={styles.sectionHeading}>Account Settings</Text>
            <View style={styles.settingsGroup}>
              <TouchableOpacity style={styles.settingsRow}>
                <Text style={styles.settingsIcon}>✏️</Text>
                <Text style={styles.settingsLabel}>Edit Personal Details</Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
              <View style={styles.rowDivider} />
              <TouchableOpacity style={styles.settingsRow}>
                <Text style={styles.settingsIcon}>🔔</Text>
                <Text style={styles.settingsLabel}>Notification Preferences</Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
              <View style={styles.rowDivider} />
              <TouchableOpacity style={styles.settingsRow} onPress={handleLogout}>
                <Text style={styles.settingsIcon}>🚪</Text>
                <Text style={[styles.settingsLabel, { color: '#EF4444' }]}>Sign Out</Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  logoutHeaderBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  logoutHeaderBtnText: { color: '#EF4444', fontSize: 12, fontWeight: '700' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#64748B' },
  scrollContent: { flex: 1 },
  contentPadding: { paddingHorizontal: 20, paddingTop: 12 },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#064E3B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold' },
  userName: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  userEmail: { fontSize: 13, color: '#64748B', marginBottom: 8 },
  roleBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  roleBadgeText: { color: '#15803D', fontSize: 11, fontWeight: '700' },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  statCol: { alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  statLabel: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  statDivider: { width: 1, height: 24, backgroundColor: '#E2E8F0' },
  sectionHeading: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 8, marginBottom: 10 },
  courseItemCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 10,
  },
  courseTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  instructorSub: { fontSize: 12, color: '#64748B', marginTop: 2, marginBottom: 8 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: { flex: 1, height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#064E3B', borderRadius: 3 },
  progressPctText: { fontSize: 12, fontWeight: '700', color: '#064E3B' },
  settingsGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 20,
  },
  settingsRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  settingsIcon: { fontSize: 16, marginRight: 12 },
  settingsLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#334155' },
  chevron: { fontSize: 18, color: '#94A3B8' },
  rowDivider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 14 },
});
