import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { profileApi, courseApi } from '../../api/skill-sharer.service';
import { Profile, Course } from '../../types';

export const DashboardScreen: React.FC = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    draftCourses: 0,
    publishedCourses: 0,
    totalEnrollments: 0,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get profile
      const profileRes = await profileApi.getMyProfile();
      if (profileRes.success) {
        setProfile(profileRes.data!);
      }

      // Get courses
      const coursesRes: any = await courseApi.getMyCourses();
      let courseData: Course[] = [];
      if (coursesRes && coursesRes.success && Array.isArray(coursesRes.data)) {
        courseData = coursesRes.data;
      } else if (coursesRes && Array.isArray(coursesRes.data?.data)) {
        courseData = coursesRes.data.data;
      } else if (Array.isArray(coursesRes)) {
        courseData = coursesRes;
      } else if (coursesRes && Array.isArray(coursesRes.data)) {
        courseData = coursesRes.data;
      }

      const hasValidData = courseData.length > 0 || (coursesRes && (coursesRes.success || coursesRes.data?.success));

      if (hasValidData) {
        setCourses(courseData);
        
        // Calculate stats
        const draft = courseData.filter((c: Course) => c.status === 'DRAFT');
        const published = courseData.filter((c: Course) => c.status === 'PUBLISHED');
        const totalEnrollments = courseData.reduce((sum: number, c: Course) => sum + c.enrolledCount, 0);
        
        setStats({
          totalCourses: courseData.length,
          draftCourses: draft.length,
          publishedCourses: published.length,
          totalEnrollments,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <View style={styles.container}>
      <Header title="Dashboard" />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Welcome back, {profile?.userId ? 'Skill Sharer' : 'User'}!
          </Text>
          <Text style={styles.subText}>
            Manage your courses and profile from here
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalCourses}</Text>
            <Text style={styles.statLabel}>Total Courses</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.draftCourses}</Text>
            <Text style={styles.statLabel}>Drafts</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.publishedCourses}</Text>
            <Text style={styles.statLabel}>Published</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalEnrollments}</Text>
            <Text style={styles.statLabel}>Total Enrollments</Text>
          </Card>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('CourseCreator')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="add-circle-outline" size={32} color="#4F46E5" />
            </View>
            <Text style={styles.actionLabel}>Create Course</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('MyCourses')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="book-outline" size={32} color="#4F46E5" />
            </View>
            <Text style={styles.actionLabel}>My Courses</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="person-outline" size={32} color="#4F46E5" />
            </View>
            <Text style={styles.actionLabel}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Courses */}
        <Text style={styles.sectionTitle}>Recent Courses</Text>
        {courses.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No courses yet.</Text>
            <Text style={styles.emptySubtext}>
              Tap "Create Course" to get started
            </Text>
          </Card>
        ) : (
          courses.slice(0, 3).map((course) => (
            <Card key={course.id} variant="elevated" style={styles.recentCourseCard}>
              <View style={styles.recentCourseHeader}>
                <Text style={styles.recentCourseTitle} numberOfLines={1}>
                  {course.title}
                </Text>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        course.status === 'PUBLISHED'
                          ? '#10B981'
                          : course.status === 'DRAFT'
                          ? '#6B7280'
                          : '#F59E0B',
                    },
                  ]}
                />
              </View>
              <Text style={styles.recentCourseStatus}>{course.status}</Text>
            </Card>
          ))
        )}

        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  welcomeSection: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  subText: {
    fontSize: 14,
    color: '#6B7280',
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
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 0,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4F46E5',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionIcon: {
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  recentCourseCard: {
    marginBottom: 8,
  },
  recentCourseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentCourseTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },
  recentCourseStatus: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  footer: {
    height: 20,
  },
});