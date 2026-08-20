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
      setCourses(response.data || []);
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

  const handleDeleteCourse = (courseId: string, title: string) => {
    Alert.alert(
      'Delete Course',
      `Are you sure you want to delete "${title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await courseService.deleteCourse(courseId);
              setCourses(courses.filter((c) => c.id !== courseId));
              Alert.alert('Success', 'Course deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.error || 'Failed to delete course');
            }
          },
        },
      ]
    );
  };

  const handleSubmitCourse = async (courseId: string) => {
    try {
      await courseService.submitCourse(courseId);
      Alert.alert('Success', 'Course submitted for approval');
      loadCourses();
    } catch (error: any) {
      Alert.alert('Error', error.error || 'Failed to submit course');
    }
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
              onPress={() =>
                navigation.navigate('CourseForm', { courseId: item.id })
              }
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Courses</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CourseForm')}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
          <Text style={styles.addButtonText}>New Course</Text>
        </TouchableOpacity>
      </View>

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