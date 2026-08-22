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
    // Navigate to course detail
    navigation.navigate('CourseDetail', { courseId: course.id });
  };

  const handleEdit = (course: Course) => {
    // Navigate to course editor (coming in Sprint 2)
    Toast.show({ type: 'info', text1: 'Edit Course', text2: `Editing: ${course.title}` });
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
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 40,
  },
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