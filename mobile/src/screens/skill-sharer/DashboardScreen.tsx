import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import Toast from 'react-native-toast-message';
// ✅ Use your existing API service instead
import { courseApi, profileService } from '../../api/skill-sharer.service';
import { authService } from '../../api/auth.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Header } from '../../components/common/Header';

interface Course {
  id: string;
  title: string;
  description: string;
  status: string;
  difficulty: string;
  createdAt: string;
}

export const DashboardScreen = ({ navigation }: any) => {
  const [userName, setUserName] = useState('User');
  const [verifiedBadge, setVerifiedBadge] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
      loadCourses();
    }, [])
  );

  const loadUserData = async () => {
    try {
      // 1. Get cached user from storage
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setUserName(user.name || 'User');
        setVerifiedBadge(user.verifiedBadge || false);
      }

      // 2. Fetch profile from API to check if skills are setup
      const profileRes = await profileService.getMyProfile();
      const profile = profileRes?.data?.data ?? profileRes?.data;
      if (profile) {
        if (!profile.skills || profile.skills.length === 0) {
          Toast.show({
            type: 'info',
            text1: 'Add Your Skills',
            text2: 'Please specify your skills so that the admin can verify your account.',
          });
          navigation.navigate('Profile');
          return;
        }
      }

      // 3. Fetch fresh user data from API to sync verifiedBadge status
      const res = await authService.getMe();
      const freshUser = res.data?.data ?? res.data;
      if (freshUser) {
        setUserName(freshUser.name || 'User');
        setVerifiedBadge(freshUser.verifiedBadge || false);
        await AsyncStorage.setItem('user', JSON.stringify(freshUser));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await courseApi.getMyCourses();
      if (response && response.success && Array.isArray(response.data)) {
        setCourses(response.data);
      } else if (Array.isArray(response)) {
        setCourses(response);
      } else if (response && Array.isArray((response as any).data?.data)) {
        setCourses((response as any).data.data);
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCourses();
  };

  const handleCreateCoursePress = () => {
    if (!verifiedBadge) {
      Toast.show({
        type: 'info',
        text1: 'Verification Required',
        text2: 'Your profile must be approved by an Admin before creating courses. Add your qualifications and skills.',
      });
      navigation.navigate('Profile');
      return;
    }
    navigation.navigate('CourseCreator');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return '#FF9800';
      case 'SUBMITTED':
        return '#2196F3';
      case 'APPROVED':
        return '#4CAF50';
      case 'REJECTED':
        return '#F44336';
      case 'PUBLISHED':
        return '#2E7D32';
      default:
        return '#999';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER':
        return '#4CAF50';
      case 'INTERMEDIATE':
        return '#FF9800';
      case 'ADVANCED':
        return '#F44336';
      default:
        return '#999';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Header title="Skill Sharer Dashboard" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      {/* User Info */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Welcome back,</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>
        {verifiedBadge && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ Verified</Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{courses.length}</Text>
          <Text style={styles.statLabel}>Total Courses</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {courses.filter((c) => c.status === 'PUBLISHED').length}
          </Text>
          <Text style={styles.statLabel}>Published</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {courses.filter((c) => c.status === 'DRAFT').length}
          </Text>
          <Text style={styles.statLabel}>Drafts</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleCreateCoursePress}
          >
            <Text style={styles.actionIcon}>➕</Text>
            <Text style={styles.actionLabel}>Create Course</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('CompletionRequests')}
          >
            <Text style={styles.actionIcon}>🎓</Text>
            <Text style={styles.actionLabel}>Certificates</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('MyCourses')}
          >
            <Text style={styles.actionIcon}>📚</Text>
            <Text style={styles.actionLabel}>My Courses</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Assessments')}
          >
            <Text style={styles.actionIcon}>📝</Text>
            <Text style={styles.actionLabel}>Assessments</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Assignments')}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionLabel}>Assignments</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionLabel}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.actionIcon}>🎓</Text>
            <Text style={styles.actionLabel}>Qualifications</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, { borderWidth: 1.5, borderColor: '#F59E0B', backgroundColor: '#FFFBEB' }]}
            onPress={() => navigation.navigate('Recommendations')}
          >
            <Text style={styles.actionIcon}>🏅</Text>
            <Text style={[styles.actionLabel, { color: '#92400E', fontWeight: '700' }]}>Recommend</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Courses */}
      {courses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Courses</Text>
          {courses.slice(0, 5).map((course) => (
            <TouchableOpacity
              key={course.id}
              style={styles.courseCard}
              onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
            >
              <View style={styles.courseHeader}>
                <Text style={styles.courseTitle}>{course.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(course.status) }]}>
                  <Text style={styles.statusText}>{course.status}</Text>
                </View>
              </View>
              <Text style={styles.courseDescription} numberOfLines={2}>
                {course.description}
              </Text>
              <View style={styles.courseFooter}>
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(course.difficulty) }]}>
                  <Text style={styles.difficultyText}>{course.difficulty}</Text>
                </View>
                <Text style={styles.courseDate}>
                  {new Date(course.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF9F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  welcome: {
    fontSize: 13,
    color: '#64748B',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  verifiedText: {
    color: '#166534',
    fontWeight: '700',
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#164E37',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  courseDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 10,
    lineHeight: 20,
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  courseDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
});