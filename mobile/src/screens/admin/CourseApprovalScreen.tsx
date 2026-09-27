import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService, Course } from '../../api/admin.service';
import { StatusBadge } from '../../components/admin/StatusBadge';

export const CourseApprovalScreen = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['pending-courses'],
    queryFn: async () => {
      const response = await adminService.getPendingCourses();
      return response.data;
    },
  });

  const handleApprove = async (id: string, title: string) => {
    Alert.alert(
      'Approve Course',
      `Are you sure you want to approve "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await adminService.approveCourse(id);
              Alert.alert('Success', 'Course approved and published');
              queryClient.invalidateQueries({ queryKey: ['pending-courses'] });
              refetch();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to approve');
            }
          },
        },
      ]
    );
  };

  const handleReject = async (id: string, title: string) => {
    Alert.prompt(
      'Reject Course',
      `Please enter a reason for rejecting "${title}":`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          onPress: async (reason?: string) => {
            if (!reason) {
              Alert.alert('Error', 'Please provide a reason');
              return;
            }
            try {
              await adminService.rejectCourse(id, reason);
              Alert.alert('Success', 'Course rejected');
              queryClient.invalidateQueries({ queryKey: ['pending-courses'] });
              refetch();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to reject');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const courses: Course[] = Array.isArray(data) ? data : [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Course Approval</Text>
        <Text style={styles.subtitle}>
          {courses.length} courses awaiting approval
        </Text>
      </View>

      {courses.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyTitle}>No Pending Courses</Text>
          <Text style={styles.emptyText}>All courses have been reviewed</Text>
        </View>
      ) : (
        courses.map((course) => (
          <View key={course.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{course.title}</Text>
              <StatusBadge status={course.status} />
            </View>

            <Text style={styles.cardDescription} numberOfLines={2}>
              {course.description}
            </Text>

            <View style={styles.cardMeta}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Creator:</Text>
                <Text style={styles.metaValue}>{course.creator.name}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Category:</Text>
                <Text style={styles.metaValue}>{course.category?.name || 'N/A'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Difficulty:</Text>
                <Text style={styles.metaValue}>{course.difficulty || 'N/A'}</Text>
              </View>
            </View>

            {course.creator.verifiedBadge && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✅ Verified Instructor</Text>
              </View>
            )}

            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleApprove(course.id, course.title)}
              >
                <Text style={styles.approveButtonText}>✓ Approve</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleReject(course.id, course.title)}
              >
                <Text style={styles.rejectButtonText}>✕ Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  cardMeta: {
    gap: 4,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 13,
    color: '#9ca3af',
    width: 70,
  },
  metaValue: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '500',
  },
  verifiedBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  verifiedText: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '600',
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#dcfce7',
  },
  approveButtonText: {
    color: '#16a34a',
    fontWeight: '600',
    fontSize: 14,
  },
  rejectButton: {
    backgroundColor: '#fee2e2',
  },
  rejectButtonText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
});