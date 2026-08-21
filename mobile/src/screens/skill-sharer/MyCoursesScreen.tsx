import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
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
      } else if (response && Array.isArray(response.data?.data)) {
        setCourses(response.data.data);
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
    // Navigate to course detail (coming in Sprint 2)
    Alert.alert('Course Details', `Viewing: ${course.title}`);
  };

  const handleEdit = (course: Course) => {
    // Navigate to course editor (coming in Sprint 2)
    Alert.alert('Edit Course', `Editing: ${course.title}`);
  };

  const handleDelete = async (course: Course) => {
    if (course.status !== 'DRAFT') {
      Alert.alert('Cannot Delete', 'Only draft courses can be deleted.');
      return;
    }

    Alert.alert(
      'Delete Course',
      `Are you sure you want to delete "${course.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await courseApi.deleteCourse(course.id);
              if (response.success) {
                setCourses(courses.filter((c) => c.id !== course.id));
                Alert.alert('Success', 'Course deleted successfully');
              } else {
                Alert.alert('Error', response.error || 'Failed to delete course');
              }
            } catch (error) {
              console.error('Error deleting course:', error);
              Alert.alert('Error', 'Failed to delete course');
            }
          },
        },
      ]
    );
  };

  const handleSubmit = async (course: Course) => {
    if (course.status !== 'DRAFT') {
      Alert.alert('Already Submitted', 'This course has already been submitted.');
      return;
    }

    Alert.alert(
      'Submit for Approval',
      `Are you sure you want to submit "${course.title}" for admin review?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            try {
              const response = await courseApi.submitCourse(course.id);
              if (response.success) {
                // Update the course in the list
                setCourses(
                  courses.map((c) =>
                    c.id === course.id ? { ...c, status: 'SUBMITTED' } : c
                  )
                );
                Alert.alert('Success', 'Course submitted for approval!');
              } else {
                Alert.alert('Error', response.error || 'Failed to submit course');
              }
            } catch (error) {
              console.error('Error submitting course:', error);
              Alert.alert('Error', 'Failed to submit course');
            }
          },
        },
      ]
    );
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