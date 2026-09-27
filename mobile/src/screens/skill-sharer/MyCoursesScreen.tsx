import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';
import { Header } from '../../components/common/Header';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { CourseCard } from '../../components/skill-sharer/CourseCard';
import { Button } from '../../components/common/Button';
import { courseApi } from '../../api/skill-sharer.service';
import { Course } from '../../types';

export const MyCoursesScreen: React.FC = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);

  const loadCourses = async () => {
    try {
      setLoading(true);
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

  useFocusEffect(
    useCallback(() => {
      loadCourses();
    }, [])
  );

  const handleCoursePress = (course: Course) => {
    navigation.navigate('CourseContent', { courseId: course.id });
  };

  const handleEdit = (course: Course) => {
    navigation.navigate('CourseCreator', { courseId: course.id });
  };

  const handleDelete = async (course: Course) => {
    if (course.status !== 'DRAFT') {
      Toast.show({ type: 'error', text1: 'Cannot Delete', text2: 'Only draft courses can be deleted.' });
      return;
    }

    const doDelete = async () => {
      try {
        const response = await courseApi.deleteCourse(course.id);
        if (response.success) {
          setCourses(prev => prev.filter((c) => c.id !== course.id));
          Toast.show({ type: 'success', text1: 'Success', text2: 'Course deleted successfully' });
        } else {
          Toast.show({ type: 'error', text1: 'Error', text2: response.error || 'Failed to delete course' });
        }
      } catch (error) {
        console.error('Error deleting course:', error);
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to delete course' });
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete "${course.title}"?`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Delete Course',
        `Are you sure you want to delete "${course.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: doDelete,
          },
        ]
      );
    }
  };

  const handleSubmit = async (course: Course) => {
    if (course.status !== 'DRAFT') {
      Toast.show({ type: 'info', text1: 'Already Submitted', text2: 'This course has already been submitted.' });
      return;
    }

    const doSubmit = async () => {
      try {
        const response = await courseApi.submitCourse(course.id);
        if (response.success) {
          // Update the course in the list
          setCourses(prev =>
            prev.map((c) =>
              c.id === course.id ? { ...c, status: 'SUBMITTED' } : c
            )
          );
          Toast.show({ type: 'success', text1: 'Success', text2: 'Course submitted for approval!' });
        } else {
          Toast.show({ type: 'error', text1: 'Error', text2: response.error || 'Failed to submit course' });
        }
      } catch (error) {
        console.error('Error submitting course:', error);
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to submit course' });
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to submit "${course.title}" for admin review?`)) {
        doSubmit();
      }
    } else {
      Alert.alert(
        'Submit for Approval',
        `Are you sure you want to submit "${course.title}" for admin review?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Submit',
            onPress: doSubmit,
          },
        ]
      );
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCourses();
    setRefreshing(false);
  };

  if (loading) {
    return <LoadingSpinner message="Loading your courses..." />;
  }

  return (
    <View style={styles.container}>
      <Header
        title="My Courses"
        rightComponent={
          <Button
            title="Create"
            onPress={() => navigation.navigate('CourseCreator')}
            size="small"
          />
        }
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryTitle}>Creator Studio</Text>
            <Text style={styles.summarySubtitle}>Curriculum Hub</Text>
          </View>
          <View style={styles.totalPill}><Text style={styles.totalValue}>{courses.length}</Text><Text style={styles.totalLabel}> Total</Text></View>
        </View>
        <View style={styles.filterBar}>
          <Ionicons name="search-outline" size={18} color="#8B6B60" />
          <Text style={styles.searchPlaceholder}>Search course title, keyword...</Text>
          <View style={styles.filterButton}><Ionicons name="options-outline" size={18} color="#3B2924" /></View>
        </View>
        <View style={styles.statusRow}>
          <View style={styles.activeStatus}><Text style={styles.activeStatusText}>All</Text><Text style={styles.activeStatusCount}>{courses.length}</Text></View>
          <View style={styles.statusPill}><Text style={styles.statusPillText}>Published</Text><Text style={styles.publishedCount}>{courses.filter((course) => course.status === 'PUBLISHED').length}</Text></View>
          <View style={styles.statusPill}><Text style={styles.statusPillText}>Drafts</Text><Text style={styles.draftCount}>{courses.filter((course) => course.status === 'DRAFT').length}</Text></View>
          <View style={styles.statusPill}><Text style={styles.statusPillText}>Pending Review</Text></View>
        </View>
        {courses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No courses yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the "Create" button to start your first course
            </Text>
          </View>
        ) : (
          courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onPress={() => handleCoursePress(course)}
              onEdit={() => handleEdit(course)}
              onDelete={() => handleDelete(course)}
              onSubmit={() => handleSubmit(course)}
              onViewReviews={() => navigation.navigate('CourseReview', {
                courseId: course.id,
                courseTitle: course.title,
              })}
              onViewAnalytics={() => navigation.navigate('CourseAnalytics', {
                courseId: course.id,
              })}
            />
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
    backgroundColor: '#FFF9F7',
  },
  scrollView: {
    backgroundColor: '#FFF9F7',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 5,
    paddingBottom: 40,
  },
  summaryRow: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTitle: { color: '#5D2B1E', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  summarySubtitle: { color: '#8A6B61', fontSize: 12, marginTop: 2 },
  totalPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0EC', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  totalValue: { color: '#B3310D', fontSize: 13, fontWeight: '700' },
  totalLabel: { color: '#8A6B61', fontSize: 11 },
  filterBar: { marginHorizontal: 16, height: 42, borderRadius: 12, borderWidth: 1, borderColor: '#E8D2CC', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', paddingLeft: 12, marginBottom: 12 },
  searchPlaceholder: { flex: 1, color: '#A58C84', fontSize: 12, marginLeft: 8 },
  filterButton: { width: 42, height: 42, borderLeftWidth: 1, borderLeftColor: '#E8D2CC', alignItems: 'center', justifyContent: 'center' },
  statusRow: { flexDirection: 'row', gap: 7, paddingHorizontal: 16, marginBottom: 14 },
  activeStatus: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#B3310D', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7 },
  activeStatusText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  activeStatusCount: { color: '#B3310D', backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1, fontSize: 10, fontWeight: '700' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: '#E8D2CC', backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 7 },
  statusPillText: { color: '#4C3934', fontSize: 11 },
  publishedCount: { color: '#16804B', fontSize: 10, fontWeight: '700' },
  draftCount: { color: '#B56A00', fontSize: 10, fontWeight: '700' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  footer: {
    height: 20,
  },
});