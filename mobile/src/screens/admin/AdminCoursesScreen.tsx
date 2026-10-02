import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { adminService } from '../../api/admin.service';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { RADIUS } from '../../theme/shadows';

export const AdminCoursesScreen = ({ navigation }: any) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Action Modal State
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [modalType, setModalType] = useState<'SUSPEND' | 'HOLD' | 'REJECT' | null>(null);
  const [actionReason, setActionReason] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-courses', search, statusFilter],
    queryFn: () =>
      adminService.getAllCourses({
        search,
        status: statusFilter,
      }),
  });

  const courses = data?.data?.courses || [];

  const handleApprove = (course: any) => {
    Alert.alert(
      'Approve Course',
      `Are you sure you want to approve and publish "${course.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve & Publish',
          onPress: async () => {
            try {
              await adminService.approveCourse(course.id);
              Alert.alert('Success', `Course "${course.title}" has been approved.`);
              queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to approve course');
            }
          },
        },
      ]
    );
  };

  const handleRestore = (course: any) => {
    Alert.alert(
      'Restore Course',
      `Are you sure you want to restore "${course.title}" to Published status?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            try {
              await adminService.restoreCourse(course.id);
              Alert.alert('Success', `Course "${course.title}" restored to Published.`);
              queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to restore course');
            }
          },
        },
      ]
    );
  };

  const openActionModal = (course: any, type: 'SUSPEND' | 'HOLD' | 'REJECT') => {
    setSelectedCourse(course);
    setModalType(type);
    setActionReason('');
  };

  const submitActionModal = async () => {
    if (!selectedCourse || !modalType) return;
    if (!actionReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a clear reason for this administrative action.');
      return;
    }

    try {
      if (modalType === 'SUSPEND') {
        await adminService.suspendCourse(selectedCourse.id, actionReason.trim());
        Alert.alert('Course Suspended', `"${selectedCourse.title}" has been suspended.`);
      } else if (modalType === 'HOLD') {
        await adminService.holdCourse(selectedCourse.id, actionReason.trim());
        Alert.alert('Course On Hold', `"${selectedCourse.title}" has been placed under review.`);
      } else if (modalType === 'REJECT') {
        await adminService.rejectCourse(selectedCourse.id, actionReason.trim());
        Alert.alert('Course Rejected', `"${selectedCourse.title}" has been rejected.`);
      }

      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      setModalType(null);
      setSelectedCourse(null);
      setActionReason('');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to perform course action');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentPadding}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Manage Platform Courses</Text>
        <Text style={styles.subtitle}>
          Total Courses: {data?.data?.pagination?.total || courses.length}
        </Text>
      </View>

      {/* Search & Status Filters */}
      <Card variant="elevated" style={styles.filtersCard}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.neutralMedium} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses by title..."
            placeholderTextColor={COLORS.neutralLight}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.neutralLight} />
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.filterSectionLabel}>Filter by Status:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {[
            { label: 'All Statuses', value: '' },
            { label: 'Published', value: 'PUBLISHED' },
            { label: 'Pending (Submitted)', value: 'SUBMITTED' },
            { label: 'Suspended', value: 'SUSPENDED' },
            { label: 'Under Review / Hold', value: 'UNDER_REVIEW' },
            { label: 'Rejected', value: 'REJECTED' },
          ].map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.filterPill,
                statusFilter === item.value && styles.filterPillActive,
              ]}
              onPress={() => setStatusFilter(item.value)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  statusFilter === item.value && styles.filterPillTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Card>

      {/* Courses List */}
      {courses.map((course: any) => (
        <Card key={course.id} variant="elevated" style={styles.courseCard}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.courseTitle} numberOfLines={2}>
                {course.title}
              </Text>
              <Text style={styles.creatorText}>
                By {course.creator?.name || 'Unknown'} ({course.creator?.email})
              </Text>
            </View>
            <StatusBadge status={course.status} />
          </View>

          <Text style={styles.courseDescription} numberOfLines={2}>
            {course.description}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="folder-open-outline" size={14} color={COLORS.neutralMedium} />
              <Text style={styles.metaText}>{course.category?.name || 'General'}</Text>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={14} color={COLORS.neutralMedium} />
              <Text style={styles.metaText}>{course._count?.enrollments || 0} Enrolled</Text>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="star-outline" size={14} color={COLORS.terracottaGold} />
              <Text style={styles.metaText}>{course.rating ? course.rating.toFixed(1) : 'New'}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {course.status === 'SUBMITTED' && (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => handleApprove(course)}
                >
                  <Ionicons name="checkmark-circle-outline" size={15} color={COLORS.badgeGreenText} />
                  <Text style={styles.approveBtnText}>Approve</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.holdBtn]}
                  onPress={() => openActionModal(course, 'HOLD')}
                >
                  <Ionicons name="pause-circle-outline" size={15} color={COLORS.terracottaSand} />
                  <Text style={styles.holdBtnText}>Place on Hold</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={() => openActionModal(course, 'REJECT')}
                >
                  <Ionicons name="close-circle-outline" size={15} color={COLORS.error} />
                  <Text style={styles.rejectBtnText}>Reject</Text>
                </TouchableOpacity>
              </>
            )}

            {course.status === 'PUBLISHED' && (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.holdBtn]}
                  onPress={() => openActionModal(course, 'HOLD')}
                >
                  <Ionicons name="pause-circle-outline" size={15} color={COLORS.terracottaSand} />
                  <Text style={styles.holdBtnText}>Hold Course</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.suspendBtn]}
                  onPress={() => openActionModal(course, 'SUSPEND')}
                >
                  <Ionicons name="ban-outline" size={15} color={COLORS.error} />
                  <Text style={styles.suspendBtnText}>Suspend Course</Text>
                </TouchableOpacity>
              </>
            )}

            {(course.status === 'SUSPENDED' || course.status === 'UNDER_REVIEW') && (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => handleRestore(course)}
                >
                  <Ionicons name="refresh-outline" size={15} color={COLORS.badgeGreenText} />
                  <Text style={styles.approveBtnText}>Restore Course</Text>
                </TouchableOpacity>

                {course.status !== 'SUSPENDED' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.suspendBtn]}
                    onPress={() => openActionModal(course, 'SUSPEND')}
                  >
                    <Ionicons name="ban-outline" size={15} color={COLORS.error} />
                    <Text style={styles.suspendBtnText}>Suspend</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </Card>
      ))}

      {courses.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={40} color={COLORS.neutralLight} />
          <Text style={styles.emptyTitle}>No courses found</Text>
          <Text style={styles.emptyText}>Adjust search terms or status filters.</Text>
        </View>
      )}

      {/* Administrative Action Modal */}
      <Modal
        visible={modalType !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setModalType(null)}
      >
        <View style={styles.modalOverlay}>
          <Card variant="elevated" style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === 'SUSPEND' && 'Suspend Course'}
                {modalType === 'HOLD' && 'Place Course on Hold'}
                {modalType === 'REJECT' && 'Reject Course'}
              </Text>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close" size={22} color={COLORS.neutralMedium} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtext}>
              Target: <Text style={{ fontWeight: 'bold' }}>{selectedCourse?.title}</Text>
            </Text>

            <Text style={styles.inputLabel}>Reason / Administrative Feedback:</Text>
            <TextInput
              style={styles.modalReasonInput}
              multiline
              numberOfLines={4}
              placeholder="Provide a clear, detailed reason for this decision..."
              placeholderTextColor={COLORS.neutralLight}
              value={actionReason}
              onChangeText={setActionReason}
            />

            <View style={styles.modalActionsRow}>
              <Button
                title="Cancel"
                variant="outline"
                size="medium"
                onPress={() => setModalType(null)}
                style={{ flex: 1 }}
              />
              <Button
                title={modalType === 'SUSPEND' ? 'Suspend' : modalType === 'HOLD' ? 'Place on Hold' : 'Reject'}
                variant={modalType === 'SUSPEND' || modalType === 'REJECT' ? 'danger' : 'primary'}
                size="medium"
                onPress={submitActionModal}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgWarm,
  },
  contentPadding: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    ...TYPOGRAPHY.displayLg,
    fontSize: 26,
    color: COLORS.neutralDark,
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.neutralMedium,
    marginTop: 2,
  },
  filtersCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surfaceCard,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.neutralDark,
    marginLeft: 8,
    paddingVertical: 0,
  },
  filterSectionLabel: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.neutralMedium,
    marginBottom: 6,
  },
  filterRow: {
    flexDirection: 'row',
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceMuted,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  filterPillActive: {
    backgroundColor: COLORS.badgeOrangeBg,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.neutralMedium,
  },
  filterPillTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  courseCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceCard,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  courseTitle: {
    ...TYPOGRAPHY.headlineSm,
    fontSize: 16,
    color: COLORS.neutralDark,
  },
  creatorText: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.neutralMedium,
    marginTop: 2,
  },
  courseDescription: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.neutralDark,
    marginBottom: 12,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderWarm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.neutralMedium,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  approveBtn: {
    backgroundColor: COLORS.badgeGreenBg,
  },
  approveBtnText: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.badgeGreenText,
    fontWeight: '700',
  },
  holdBtn: {
    backgroundColor: '#FFF3E0',
  },
  holdBtnText: {
    ...TYPOGRAPHY.labelSm,
    color: '#E65100',
    fontWeight: '700',
  },
  suspendBtn: {
    backgroundColor: COLORS.errorBg,
  },
  suspendBtnText: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.error,
    fontWeight: '700',
  },
  rejectBtn: {
    backgroundColor: COLORS.errorBg,
  },
  rejectBtnText: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.error,
    fontWeight: '700',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...TYPOGRAPHY.headlineSm,
    color: COLORS.neutralDark,
    marginTop: 12,
  },
  emptyText: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.neutralMedium,
    marginTop: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.xl,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    ...TYPOGRAPHY.headlineMd,
    color: COLORS.neutralDark,
  },
  modalSubtext: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.neutralMedium,
    marginBottom: 16,
  },
  inputLabel: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.neutralDark,
    marginBottom: 6,
  },
  modalReasonInput: {
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: RADIUS.md,
    padding: 12,
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.neutralDark,
    textAlignVertical: 'top',
    height: 100,
    marginBottom: 20,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
