import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { courseService } from '../../api/skill-sharer.service';
import { Header } from '../../components/common/Header';

interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  status: string;
  enrolledCount: number;
  rating: number | null;
  thumbnail: string | null;
  createdAt: string;
}

const StatusColors: Record<string, string> = {
  DRAFT: '#F59E0B',
  SUBMITTED: '#3B82F6',
  UNDER_REVIEW: '#8B5CF6',
  CHANGES_REQUESTED: '#EF4444',
  APPROVED: '#10B981',
  PUBLISHED: '#10B981',
  REJECTED: '#EF4444',
  SUSPENDED: '#6B7280',
  ARCHIVED: '#6B7280',
};

const StatusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  CHANGES_REQUESTED: 'Changes Requested',
  APPROVED: 'Approved',
  PUBLISHED: 'Published',
  REJECTED: 'Rejected',
  SUSPENDED: 'Suspended',
  ARCHIVED: 'Archived',
};

export default function SkillSharerDashboardScreen({ navigation }: any) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCourses = async () => {
    try {
      const response = await courseService.getMyCourses();
      const responseData = response.data;

      let courseData: Course[] = [];

      if (responseData) {
        if (Array.isArray(responseData)) {
          courseData = responseData;
        } else if (responseData.data && Array.isArray(responseData.data)) {
          courseData = responseData.data;
        } else if (responseData.courses && Array.isArray(responseData.courses)) {
          courseData = responseData.courses;
        } else if (responseData.items && Array.isArray(responseData.items)) {
          courseData = responseData.items;
        } else if (responseData.result && Array.isArray(responseData.result)) {
          courseData = responseData.result;
        } else if (responseData.success && responseData.data && Array.isArray(responseData.data)) {
          courseData = responseData.data;
        } else {
          for (const key in responseData) {
            if (responseData[key] && Array.isArray(responseData[key])) {
              courseData = responseData[key];
              break;
            }
          }
        }
      }

      const formattedCourses = courseData.map((course: any) => ({
        id: course.id || '',
        title: course.title || '',
        description: course.description || '',
        difficulty: course.difficulty || 'BEGINNER',
        status: course.status || 'DRAFT',
        enrolledCount: course.enrolledCount || 0,
        rating: course.rating || null,
        thumbnail: course.thumbnail || null,
        createdAt: course.createdAt || new Date().toISOString(),
      }));

      setCourses(formattedCourses);
    } catch (error: any) {
      console.error('Error loading courses:', error);
      Alert.alert('Error', error.error || 'Failed to load courses');
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

  const onRefresh = () => {
    setRefreshing(true);
    loadCourses();
  };

  // ✅ COMPLETE FIX: Delete handler with maximum debugging
  const handleDeleteCourse = (courseId: string, title: string) => {
    console.log(`🗑️ Delete requested for: ${courseId} - ${title}`);

    Alert.alert(
      'Delete Course',
      `Are you sure you want to delete "${title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            console.log(`🗑️ Delete confirmed for: ${courseId}`);
            performDelete(courseId, title);
          },
        },
      ]
    );
  };

  // ✅ Separate function for the actual delete
  const performDelete = async (courseId: string, title: string) => {
    try {
      console.log(`📤 PERFORMING DELETE for: ${courseId}`);

      // ✅ Verify the course exists and is a draft
      const course = courses.find((c) => c.id === courseId);
      if (!course) {
        Alert.alert('Error', 'Course not found');
        return;
      }

      console.log(`📚 Course status: ${course.status}`);

      if (course.status !== 'DRAFT') {
        Alert.alert(
          'Error',
          `Only draft courses can be deleted. Current status: ${course.status}`
        );
        return;
      }

      // ✅ Call the delete API
      console.log(`📤 Calling DELETE /courses/${courseId}`);
      
      const response = await courseService.deleteCourse(courseId);
      
      console.log(`✅ DELETE response:`, JSON.stringify(response, null, 2));
      console.log(`✅ DELETE response data:`, response.data);

      // ✅ Check if successful
      if (response.status === 200 || response.status === 204) {
        setCourses((prevCourses) => prevCourses.filter((c) => c.id !== courseId));
        Alert.alert('Success', 'Course deleted successfully');
      } else {
        throw new Error(response.data?.error || 'Delete failed');
      }
    } catch (error: any) {
      console.error('❌ Delete error:', error);
      
      let errorMsg = 'Failed to delete course';
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
        errorMsg = error.response.data?.error || error.response.data?.message || errorMsg;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      Alert.alert('Error', errorMsg);
    }
  };

  const handleSubmitCourse = async (courseId: string) => {
    try {
      console.log(`📤 Submitting course: ${courseId}`);
      const response = await courseService.submitCourse(courseId);
      console.log('✅ Submit response:', response);
      Alert.alert('Success', 'Course submitted for approval');
      await loadCourses();
    } catch (error: any) {
      console.error('❌ Submit error:', error);
      Alert.alert('Error', error.error || 'Failed to submit course');
    }
  };

  const handleEditCourse = (courseId: string) => {
    console.log(`✏️ Editing course: ${courseId}`);
    navigation.navigate('CourseForm', { courseId });
  };

  const renderCourseItem = ({ item }: { item: Course }) => (
    <TouchableOpacity
      style={styles.courseCard}
      onPress={() => navigation.navigate('CourseContent', { courseId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.courseTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: StatusColors[item.status] || '#6B7280' },
          ]}
        >
          <Text style={styles.statusText}>
            {StatusLabels[item.status] || item.status}
          </Text>
        </View>
      </View>

      <Text style={styles.courseDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <Ionicons name="people-outline" size={16} color="#6B7280" />
          <Text style={styles.footerText}>{item.enrolledCount || 0}</Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="star-outline" size={16} color="#6B7280" />
          <Text style={styles.footerText}>
            {item.rating ? item.rating.toFixed(1) : 'N/A'}
          </Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text style={styles.footerText}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        {item.status === 'DRAFT' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => handleEditCourse(item.id)}
            >
              <Ionicons name="create-outline" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.submitButton]}
              onPress={() => handleSubmitCourse(item.id)}
            >
              <Ionicons name="send-outline" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteCourse(item.id, item.title)}
            >
              <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Delete</Text>
            </TouchableOpacity>
          </>
        )}
        {item.status === 'PUBLISHED' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.viewButton]}
              onPress={() =>
                navigation.navigate('LearnerProgress', { courseId: item.id })
              }
            >
              <Ionicons name="analytics-outline" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Progress</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.viewButton]}
              onPress={() =>
                navigation.navigate('CourseAnalytics', { courseId: item.id })
              }
            >
              <Ionicons name="bar-chart-outline" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Analytics</Text>
            </TouchableOpacity>
          </>
        )}
        {item.status === 'SUBMITTED' && (
          <View style={styles.pendingBadge}>
            <Ionicons name="time-outline" size={16} color="#FFFFFF" />
            <Text style={styles.pendingText}>Awaiting Review</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Header
        title="My Courses"
        rightComponent={
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="person-circle-outline" size={20} color="#4F46E5" />
              <Text style={styles.profileButtonText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('CourseForm')}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
              <Text style={styles.addButtonText}>New Course</Text>
            </TouchableOpacity>
          </View>
        }
      />
      <View style={styles.container}>

      {courses.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Courses Yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your first course and start sharing your knowledge
          </Text>
          <TouchableOpacity
            style={styles.emptyAddButton}
            onPress={() => navigation.navigate('CourseForm')}
          >
            <Text style={styles.emptyAddButtonText}>Create Course</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={courses}
          renderItem={renderCourseItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  profileButtonText: {
    color: '#4F46E5',
    fontWeight: '600',
    marginLeft: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  courseDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  editButton: {
    backgroundColor: '#4F46E5',
  },
  submitButton: {
    backgroundColor: '#10B981',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  viewButton: {
    backgroundColor: '#4F46E5',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  pendingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  emptyAddButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyAddButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});