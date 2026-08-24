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
import { authService } from '../../api/auth.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Course } from '../../types';
import { ConfirmModal } from '../../components/common/ConfirmModal';

export const MyCoursesScreen: React.FC = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [verifiedBadge, setVerifiedBadge] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    confirmText?: string;
    confirmType?: 'danger' | 'primary' | 'warning';
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const checkVerificationStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setVerifiedBadge(user.verifiedBadge || false);
      }
      
      const res = await authService.getMe();
      const freshUser = res.data?.data ?? res.data;
      if (freshUser) {
        setVerifiedBadge(freshUser.verifiedBadge || false);
        await AsyncStorage.setItem('user', JSON.stringify(freshUser));
      }
    } catch (e) {
      console.error('Error checking verification inside MyCoursesScreen:', e);
    }
  };

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
      checkVerificationStatus();
    }, [])
  );

  const handleCoursePress = (course: Course) => {
    // Navigate to course content editor
    navigation.navigate('CourseContent', { courseId: course.id });
  };

  const handleEdit = (course: Course) => {
    // Navigate to course editor form
    navigation.navigate('CourseForm', { courseId: course.id });
  };

  const handleDelete = (course: Course) => {
    if (course.status !== 'DRAFT' && course.status !== 'REJECTED') {
      Toast.show({ type: 'error', text1: 'Cannot Delete', text2: 'Only draft or rejected courses can be deleted.' });
      return;
    }

    setConfirmConfig({
      visible: true,
      title: 'Delete Course',
      message: `Are you sure you want to delete "${course.title}"?`,
      confirmText: 'Delete',
      confirmType: 'danger',
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, visible: false }));
        try {
          await courseApi.deleteCourse(course.id);
          setCourses((prev) => prev.filter((c) => c.id !== course.id));
          Toast.show({ type: 'success', text1: 'Deleted', text2: 'Course deleted successfully' });
        } catch (error: any) {
          console.error('Error deleting course:', error);
          Toast.show({ type: 'error', text1: 'Error', text2: error?.error || error?.message || 'Failed to delete course' });
        }
      },
    });
  };

  const handleSubmit = (course: Course) => {
    if (course.status !== 'DRAFT') {
      Toast.show({ type: 'info', text1: 'Already Submitted', text2: 'This course has already been submitted.' });
      return;
    }

    setConfirmConfig({
      visible: true,
      title: 'Submit for Approval',
      message: `Are you sure you want to submit "${course.title}" for admin review?`,
      confirmText: 'Submit',
      confirmType: 'primary',
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, visible: false }));
        try {
          await courseApi.submitCourse(course.id);
          setCourses((prev) =>
            prev.map((c) => (c.id === course.id ? { ...c, status: 'SUBMITTED' } : c))
          );
          Toast.show({ type: 'success', text1: 'Submitted! ✅', text2: 'Course submitted for admin review.' });
        } catch (error: any) {
          console.error('Error submitting course:', error);
          Toast.show({ type: 'error', text1: 'Error', text2: error?.error || error?.message || 'Failed to submit course' });
        }
      },
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCourses();
    setRefreshing(false);
  };

  const handleCreatePress = () => {
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
            onPress={handleCreatePress}
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

      <ConfirmModal
        visible={confirmConfig.visible}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        confirmType={confirmConfig.confirmType}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, visible: false }))}
      />
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