import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { courseApi, certificateApi } from '../../api/skill-sharer.service';
import { COLORS } from '../../theme/colors';

export const CompletionRequestsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  const showNotification = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadRequests(selectedCourse);
    } else {
      setRequests([]);
    }
  }, [selectedCourse]);

  const loadCourses = async () => {
    try {
      setLoadingCourses(true);
      const res: any = await courseApi.getMyCourses();
      const courseList = res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(courseList)) {
        setCourses(courseList);
        if (courseList.length > 0 && courseList[0]?.id) {
          setSelectedCourse(courseList[0].id);
        }
      }
    } catch (err) {
      console.log('Error loading courses:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadRequests = async (courseId: string) => {
    setLoading(true);
    try {
      const res: any = await certificateApi.getCourseCompletionRequests(courseId);
      if (res.success || res.requests || res.data) {
        setRequests(res.requests || res.data?.requests || res.data || []);
      }
    } catch (err) {
      console.log('Error loading requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      setActionLoading(requestId);
      const res: any = await certificateApi.approveCompletionRequest(requestId);
      if (res.success || res.data) {
        showNotification('Certificate Issued! 🎓', 'Completion request approved and official e-certificate generated.');
        if (selectedCourse) loadRequests(selectedCourse);
      }
    } catch (err: any) {
      showNotification('Error', err?.response?.data?.error || err?.message || 'Failed to approve completion request.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!rejectReason.trim()) {
      showNotification('Validation Error', 'Please enter a constructive reason for rejection (e.g. resubmit assignment).');
      return;
    }
    try {
      setActionLoading(requestId);
      const res: any = await certificateApi.rejectCompletionRequest(requestId, rejectReason.trim());
      if (res.success || res.data) {
        showNotification('Request Rejected', 'The learner has been notified with your reason.');
        setRejectingId(null);
        setRejectReason('');
        if (selectedCourse) loadRequests(selectedCourse);
      }
    } catch (err: any) {
      showNotification('Error', err?.response?.data?.error || err?.message || 'Failed to reject request.');
    } finally {
      setActionLoading(null);
    }
  };

  const renderRequest = ({ item }: { item: any }) => {
    const isRejecting = rejectingId === item.id;
    const isPending = item.status === 'PENDING';
    const isApproved = item.status === 'APPROVED';
    const isRejected = item.status === 'REJECTED';
    const learnerName = item.learner?.name || item.learner?.email || 'Enrolled Learner';
    const initial = learnerName[0]?.toUpperCase() || 'L';
    const requestDate = item.requestedAt
      ? new Date(item.requestedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : '';
    const isProcessing = actionLoading === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.learnerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.learnerName}>{learnerName}</Text>
              <Text style={styles.learnerEmail}>{item.learner?.email || ''}</Text>
            </View>
          </View>

          <View
            style={[
              styles.badge,
              isApproved && styles.badgeApproved,
              isPending && styles.badgePending,
              isRejected && styles.badgeRejected,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                isApproved && styles.badgeTextApproved,
                isPending && styles.badgeTextPending,
                isRejected && styles.badgeTextRejected,
              ]}
            >
              {isApproved ? '✓ APPROVED' : isPending ? 'PENDING' : 'REJECTED'}
            </Text>
          </View>
        </View>

        {/* Date and Details */}
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={13} color={COLORS.neutralMedium} style={{ marginRight: 4 }} />
          <Text style={styles.dateText}>Requested on {requestDate}</Text>
        </View>

        {/* If Rejected: Show rejection reason */}
        {isRejected && item.rejectReason ? (
          <View style={styles.rejectedReasonBox}>
            <Text style={styles.rejectedReasonLabel}>Reason Provided:</Text>
            <Text style={styles.rejectedReasonText}>"{item.rejectReason}"</Text>
          </View>
        ) : null}

        {/* Actions for Pending Requests */}
        {isPending && (
          <View style={styles.actionContainer}>
            {isRejecting ? (
              <View style={styles.rejectForm}>
                <Text style={styles.rejectFormTitle}>Reason for Rejection</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Explain what requirements are missing (e.g. need 80% on assignment)..."
                  placeholderTextColor={COLORS.neutralLight}
                  value={rejectReason}
                  onChangeText={setRejectReason}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                <View style={styles.rejectActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => {
                      setRejectingId(null);
                      setRejectReason('');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmRejectBtn, isProcessing && { opacity: 0.7 }]}
                    onPress={() => handleReject(item.id)}
                    disabled={isProcessing}
                    activeOpacity={0.85}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <Text style={styles.confirmRejectBtnText}>Send Rejection</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.buttonsRow}>
                <TouchableOpacity
                  style={[styles.approveBtn, isProcessing && { opacity: 0.7 }]}
                  onPress={() => handleApprove(item.id)}
                  disabled={isProcessing}
                  activeOpacity={0.85}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.white} style={{ marginRight: 6 }} />
                      <Text style={styles.approveBtnText}>Approve & Issue Certificate</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => setRejectingId(item.id)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="close-circle-outline" size={15} color={COLORS.error} style={{ marginRight: 4 }} />
                  <Text style={styles.rejectBtnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const selectedCourseTitle = courses.find((c) => c.id === selectedCourse)?.title || 'Course';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={COLORS.neutralDark} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Completion Requests</Text>
          <Text style={styles.headerSubtitle}>Verify requirements & issue certificates</Text>
        </View>
      </View>

      {/* Verification Guideline Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.honeyText} style={{ marginRight: 8, marginTop: 2 }} />
        <Text style={styles.infoBannerText}>
          Issuing an approval officially issues an authentic, verified e-certificate to the learner.
        </Text>
      </View>

      {/* Course Selector Tabs */}
      <View style={styles.courseSelector}>
        <Text style={styles.selectorLabel}>SELECT COURSE</Text>
        {loadingCourses ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ alignSelf: 'flex-start', marginVertical: 8 }} />
        ) : courses.length === 0 ? (
          <Text style={styles.noCoursesText}>No courses found.</Text>
        ) : (
          <FlatList
            horizontal
            data={courses}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.courseChipsList}
            renderItem={({ item }) => {
              const isSelected = selectedCourse === item.id;
              return (
                <TouchableOpacity
                  style={[styles.courseChip, isSelected && styles.courseChipActive]}
                  onPress={() => setSelectedCourse(item.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.courseChipText, isSelected && styles.courseChipTextActive]} numberOfLines={1}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      {/* Main Requests Feed */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading completion requests...</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          style={styles.flatList}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          renderItem={renderRequest}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="file-tray-outline" size={36} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Requests for This Course</Text>
              <Text style={styles.emptyText}>
                When learners reach 100% completion in "{selectedCourseTitle}", their completion verification requests will appear here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default CompletionRequestsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgWarm,
    ...Platform.select({
      web: {
        height: '100vh' as any,
        maxHeight: '100vh' as any,
        overflow: 'hidden' as any,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: COLORS.bgWarm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    elevation: 2,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.neutralDark,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.neutralMedium,
    fontWeight: '500',
    marginTop: 1,
  },

  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.honeyBg,
    marginHorizontal: 18,
    marginTop: 4,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FBE8C4',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.honeyText,
    lineHeight: 16,
    fontWeight: '600',
  },

  // Course Selector
  courseSelector: {
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  selectorLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.neutralMedium,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  courseChipsList: {
    gap: 8,
    paddingVertical: 2,
  },
  courseChip: {
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    maxWidth: 240,
  },
  courseChipActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
  },
  courseChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.neutralDark,
  },
  courseChipTextActive: {
    color: COLORS.white,
  },
  noCoursesText: {
    fontSize: 12,
    color: COLORS.neutralMedium,
    fontStyle: 'italic',
  },

  flatList: {
    flex: 1,
    ...Platform.select({
      web: {
        overflowY: 'auto' as any,
        WebkitOverflowScrolling: 'touch' as any,
      },
    }),
  },
  listContainer: {
    paddingHorizontal: 18,
    paddingBottom: 40,
    gap: 12,
  },

  // Card
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    elevation: 2,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  learnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.badgeOrangeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  learnerName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.neutralDark,
  },
  learnerEmail: {
    fontSize: 11,
    color: COLORS.neutralMedium,
    marginTop: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgePending: {
    backgroundColor: COLORS.badgeOrangeBg,
  },
  badgeApproved: {
    backgroundColor: COLORS.badgeGreenBg,
  },
  badgeRejected: {
    backgroundColor: COLORS.errorBg,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  badgeTextPending: {
    color: COLORS.primary,
  },
  badgeTextApproved: {
    color: COLORS.badgeGreenText,
  },
  badgeTextRejected: {
    color: COLORS.error,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.neutralMedium,
  },

  // Rejected display
  rejectedReasonBox: {
    backgroundColor: COLORS.cardBgSoft,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    marginTop: 4,
  },
  rejectedReasonLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.error,
    textTransform: 'uppercase',
  },
  rejectedReasonText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: COLORS.neutralDark,
    marginTop: 2,
  },

  // Actions
  actionContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderWarm,
    paddingTop: 12,
    marginTop: 4,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryDark,
    paddingVertical: 10,
    borderRadius: 14,
    elevation: 2,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  approveBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceMuted,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  rejectBtnText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '700',
  },

  // Reject Form
  rejectForm: {
    gap: 8,
  },
  rejectFormTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.neutralDark,
  },
  input: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 12,
    padding: 10,
    fontSize: 12,
    color: COLORS.neutralDark,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    minHeight: 64,
  },
  rejectActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.neutralDark,
  },
  confirmRejectBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmRejectBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },

  // Empty & Loading
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: COLORS.neutralMedium,
    fontWeight: '600',
  },
  emptyContainer: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.badgeOrangeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    lineHeight: 18,
  },
});
