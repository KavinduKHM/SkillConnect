import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService, Course } from '../../api/admin.service';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { Header } from '../../components/common/Header';

import { ConfirmModal } from '../../components/common/ConfirmModal';
import { Modal, TextInput } from 'react-native';

export const CourseApprovalScreen = () => {
  const queryClient = useQueryClient();

  // Confirm Modal state
  const [confirmConfig, setConfirmConfig] = React.useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Reject Modal state
  const [rejectModalVisible, setRejectModalVisible] = React.useState(false);
  const [rejectTarget, setRejectTarget] = React.useState<{ id: string; title: string } | null>(null);
  const [rejectReason, setRejectReason] = React.useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['pending-courses'],
    queryFn: async () => {
      const response = await adminService.getPendingCourses();
      return response.data;
    },
  });

  const handleApprove = (id: string, title: string) => {
    setConfirmConfig({
      visible: true,
      title: 'Approve Course',
      message: `Are you sure you want to approve and publish "${title}"?`,
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, visible: false }));
        queryClient.setQueryData(['pending-courses'], (old: any) => 
          Array.isArray(old) ? old.filter((c: any) => c.id !== id) : old
        );
        try {
          await adminService.approveCourse(id);
          Toast.show({ type: 'success', text1: 'Success', text2: 'Course approved and published' });
          queryClient.invalidateQueries({ queryKey: ['pending-courses'] });
          refetch();
        } catch (error: any) {
          Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.error || 'Failed to approve' });
        }
      },
    });
  };

  const handleRejectPress = (id: string, title: string) => {
    setRejectTarget({ id, title });
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const submitReject = async () => {
    if (!rejectReason.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter a rejection reason' });
      return;
    }
    const { id } = rejectTarget!;
    setRejectModalVisible(false);
    queryClient.setQueryData(['pending-courses'], (old: any) => 
      Array.isArray(old) ? old.filter((c: any) => c.id !== id) : old
    );
    try {
      await adminService.rejectCourse(id, rejectReason.trim());
      Toast.show({ type: 'success', text1: 'Success', text2: 'Course rejected' });
      queryClient.invalidateQueries({ queryKey: ['pending-courses'] });
      refetch();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.error || 'Failed to reject' });
    }
  };

  const courses: Course[] = Array.isArray(data) ? data : [];

  return (
    <View style={{ flex: 1 }}>
      <Header title="Course Approval" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >

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

            <Text style={styles.cardDescription} numberOfLines={3}>
              {course.description}
            </Text>

            <View style={styles.cardMeta}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Creator:</Text>
                <Text style={styles.metaValue}>{course.creator.name}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Category:</Text>
                <Text style={styles.metaValue}>{(course as any).category?.name || 'N/A'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Difficulty:</Text>
                <Text style={styles.metaValue}>{course.difficulty || 'N/A'}</Text>
              </View>
              {(course as any).deliveryMethod && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Delivery:</Text>
                  <Text style={styles.metaValue}>{(course as any).deliveryMethod.replace('_', ' ')}</Text>
                </View>
              )}
              {(course as any).estimatedHours != null && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Est. Hours:</Text>
                  <Text style={styles.metaValue}>{(course as any).estimatedHours} hrs</Text>
                </View>
              )}
              {(course as any).duration && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Duration:</Text>
                  <Text style={styles.metaValue}>{(course as any).duration}</Text>
                </View>
              )}
              {Array.isArray((course as any).learningOutcomes) && (course as any).learningOutcomes.length > 0 && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Outcomes:</Text>
                  <Text style={styles.metaValue}>{(course as any).learningOutcomes.length} learning outcomes</Text>
                </View>
              )}
              {(course as any).prerequisites && (
                <View style={[styles.metaItem, { alignItems: 'flex-start' }]}>
                  <Text style={styles.metaLabel}>Prereqs:</Text>
                  <Text style={[styles.metaValue, { flex: 1 }]} numberOfLines={2}>{(course as any).prerequisites}</Text>
                </View>
              )}
              {(course as any).submittedAt && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Submitted:</Text>
                  <Text style={styles.metaValue}>{new Date((course as any).submittedAt).toLocaleDateString()}</Text>
                </View>
              )}
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
                onPress={() => handleRejectPress(course.id, course.title)}
              >
                <Text style={styles.rejectButtonText}>✕ Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>

    <ConfirmModal
      visible={confirmConfig.visible}
      title={confirmConfig.title}
      message={confirmConfig.message}
      confirmText="Approve"
      confirmType="primary"
      onConfirm={confirmConfig.onConfirm}
      onCancel={() => setConfirmConfig((prev) => ({ ...prev, visible: false }))}
    />

    {/* Reject Reason Modal */}
    <Modal visible={rejectModalVisible} transparent animationType="fade" onRequestClose={() => setRejectModalVisible(false)}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.card}>
          <Text style={modalStyles.title}>Reject Course</Text>
          <Text style={modalStyles.subtitle}>
            Please enter a reason for rejecting "{rejectTarget?.title}":
          </Text>
          <TextInput
            style={modalStyles.input}
            placeholder="e.g. Incomplete syllabus or missing assets"
            value={rejectReason}
            onChangeText={setRejectReason}
            multiline
            numberOfLines={3}
          />
          <View style={modalStyles.btnRow}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={() => setRejectModalVisible(false)}>
              <Text style={modalStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={modalStyles.rejectBtn} onPress={submitReject}>
              <Text style={modalStyles.rejectText}>Confirm Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </View>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FAF9F5',
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 20,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 14,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  rejectText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

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