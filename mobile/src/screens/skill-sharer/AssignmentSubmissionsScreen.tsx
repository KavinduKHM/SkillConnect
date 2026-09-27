import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { assignmentApi } from '../../api/skill-sharer.service';
import { AssignmentSubmission } from '../../types';
import { COLORS } from '../../theme/colors';

export const AssignmentSubmissionsScreen = ({ route, navigation }: any) => {
  const { assignmentId, assignmentTitle } = route.params || {};
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Grading Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (assignmentId) {
      fetchSubmissions();
    }
  }, [assignmentId]);

  const showNotification = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res: any = await assignmentApi.getAssignmentSubmissions(assignmentId);
      const data = res?.submissions || res?.data?.submissions || res?.data || [];
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
      showNotification('Error', error?.error || error?.response?.data?.error || 'Failed to load submissions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOpenGradeModal = (sub: AssignmentSubmission) => {
    setSelectedSubmission(sub);
    setGrade(sub.grade !== null && sub.grade !== undefined ? String(sub.grade) : '');
    setFeedback(sub.feedback || '');
    setModalVisible(true);
  };

  const handleSaveGrade = async () => {
    if (!selectedSubmission) return;
    if (!grade.trim()) {
      showNotification('Validation Error', 'Grade is required.');
      return;
    }

    const numericGrade = parseFloat(grade);
    if (isNaN(numericGrade)) {
      showNotification('Validation Error', 'Please enter a valid numeric grade.');
      return;
    }

    try {
      setIsSaving(true);
      await assignmentApi.gradeSubmission(selectedSubmission.id, {
        grade: numericGrade,
        feedback: feedback.trim(),
      });

      showNotification('Success', 'Grade saved successfully!');
      setModalVisible(false);
      fetchSubmissions();
    } catch (error: any) {
      console.error('Error saving grade:', error);
      showNotification('Error', error?.error || error?.response?.data?.error || 'Failed to save grade.');
    } finally {
      setIsSaving(false);
    }
  };

  const getFileUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const totalCount = submissions.length;
  const gradedCount = submissions.filter(
    (s) => s.status === 'GRADED' || s.status === 'COMPLETED' || (s.grade !== null && s.grade !== undefined)
  ).length;
  const pendingCount = totalCount - gradedCount;

  const renderSubmission = ({ item }: { item: AssignmentSubmission }) => {
    const isGraded =
      item.status === 'GRADED' || item.status === 'COMPLETED' || (item.grade !== null && item.grade !== undefined);
    const submissionDateFormatted = item.submissionDate
      ? new Date(item.submissionDate).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'Unknown date';

    const learnerInitials = item.learner?.name
      ? item.learner.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'L';

    return (
      <View style={styles.card}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.learnerRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{learnerInitials}</Text>
            </View>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.learnerName} numberOfLines={1}>
                {item.learner?.name || 'Enrolled Learner'}
              </Text>
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={12} color={COLORS.neutralMedium} style={{ marginRight: 4 }} />
                <Text style={styles.metaText}>{submissionDateFormatted}</Text>
                {item.isLate && (
                  <View style={styles.lateBadge}>
                    <Text style={styles.lateBadgeText}>Late</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={[styles.statusPill, isGraded ? styles.statusPillGraded : styles.statusPillPending]}>
            <Text style={[styles.statusPillText, isGraded ? styles.statusTextGraded : styles.statusTextPending]}>
              {isGraded ? '✓ GRADED' : 'NEEDS REVIEW'}
            </Text>
          </View>
        </View>

        {/* Deliverables Section */}
        <View style={styles.deliverablesSection}>
          {/* Text Notes */}
          {item.textSubmission ? (
            <View style={styles.notesBox}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="document-text-outline" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                <Text style={styles.deliverableLabel}>Learner Notes</Text>
              </View>
              <Text style={styles.notesText}>{item.textSubmission}</Text>
            </View>
          ) : null}

          {/* GitHub Project Link */}
          {item.githubLink ? (
            <View style={styles.deliverableItem}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="logo-github" size={14} color={COLORS.neutralDark} style={{ marginRight: 4 }} />
                <Text style={styles.deliverableLabel}>Repository / Project Link</Text>
              </View>
              <TouchableOpacity
                style={styles.linkPill}
                onPress={() => Linking.openURL(item.githubLink!)}
                activeOpacity={0.8}
              >
                <Ionicons name="link-outline" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={styles.linkPillText} numberOfLines={1}>
                  {item.githubLink}
                </Text>
                <Ionicons name="open-outline" size={14} color={COLORS.primary} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Attached Files */}
          {item.fileUrls && item.fileUrls.length > 0 ? (
            <View style={styles.deliverableItem}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="attach" size={14} color={COLORS.neutralDark} style={{ marginRight: 4 }} />
                <Text style={styles.deliverableLabel}>Attached Deliverables ({item.fileUrls.length})</Text>
              </View>
              <View style={styles.filesGrid}>
                {item.fileUrls.map((url, idx) => {
                  const fullUrl = getFileUrl(url);
                  const fileName = url.split('/').pop() || `Deliverable_${idx + 1}`;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={styles.fileCard}
                      onPress={() => Linking.openURL(fullUrl)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.fileIconWrap}>
                        <Ionicons name="document-outline" size={16} color={COLORS.primary} />
                      </View>
                      <Text style={styles.fileCardName} numberOfLines={1}>
                        {fileName}
                      </Text>
                      <Ionicons name="cloud-download-outline" size={16} color={COLORS.neutralMedium} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* Instructor Feedback Given */}
          {isGraded ? (
            <View style={styles.gradedBanner}>
              <View style={styles.scoreRow}>
                <View style={styles.scoreBadge}>
                  <Ionicons name="ribbon-outline" size={16} color={COLORS.honeyText} style={{ marginRight: 4 }} />
                  <Text style={styles.scoreBadgeLabel}>Awarded Score:</Text>
                  <Text style={styles.scoreBadgeValue}>{item.grade} pts</Text>
                </View>
              </View>
              {item.feedback ? (
                <View style={styles.feedbackContainer}>
                  <Text style={styles.feedbackTitle}>Feedback given to learner:</Text>
                  <Text style={styles.feedbackContent}>"{item.feedback}"</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Card Footer / Action */}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={[styles.gradeActionBtn, isGraded ? styles.gradeActionBtnSecondary : styles.gradeActionBtnPrimary]}
            onPress={() => handleOpenGradeModal(item)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isGraded ? 'create-outline' : 'checkmark-circle-outline'}
              size={16}
              color={isGraded ? COLORS.primaryDark : COLORS.white}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.gradeActionBtnText,
                isGraded ? styles.gradeActionBtnTextSecondary : styles.gradeActionBtnTextPrimary,
              ]}
            >
              {isGraded ? 'Update Grade & Feedback' : 'Grade Submission →'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={COLORS.neutralDark} />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Review Submissions</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {assignmentTitle || 'Course Practical Assignment'}
          </Text>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={fetchSubmissions} activeOpacity={0.8}>
          <Ionicons name="refresh-outline" size={18} color={COLORS.neutralDark} />
        </TouchableOpacity>
      </View>

      {/* Stats Summary Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryPill}>
          <Text style={styles.summaryPillNum}>{totalCount}</Text>
          <Text style={styles.summaryPillLabel}>Total</Text>
        </View>
        <View style={[styles.summaryPill, { backgroundColor: COLORS.honeyBg }]}>
          <Text style={[styles.summaryPillNum, { color: COLORS.honeyText }]}>{pendingCount}</Text>
          <Text style={[styles.summaryPillLabel, { color: COLORS.honeyText }]}>Awaiting Grade</Text>
        </View>
        <View style={[styles.summaryPill, { backgroundColor: COLORS.badgeGreenBg }]}>
          <Text style={[styles.summaryPillNum, { color: COLORS.badgeGreenText }]}>{gradedCount}</Text>
          <Text style={[styles.summaryPillLabel, { color: COLORS.badgeGreenText }]}>Graded</Text>
        </View>
      </View>

      {/* Main Content */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Fetching learner submissions...</Text>
        </View>
      ) : submissions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="file-tray-full-outline" size={38} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Submissions Yet</Text>
          <Text style={styles.emptySub}>
            Learner submissions, code links, and files will appear here once submitted for grading.
          </Text>
          <TouchableOpacity style={styles.backToAssignmentsBtn} onPress={() => navigation?.goBack()} activeOpacity={0.85}>
            <Text style={styles.backToAssignmentsBtnText}>Return to Assignments</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={submissions}
          renderItem={renderSubmission}
          keyExtractor={(item) => item.id}
          style={styles.flatList}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchSubmissions();
          }}
        />
      )}

      {/* Grading Bottom-Sheet Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Drag Handle */}
            <View style={styles.modalHandle} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Grade Submission</Text>
                <Text style={styles.modalSub}>
                  Learner: <Text style={{ fontWeight: '800', color: COLORS.neutralDark }}>{selectedSubmission?.learner?.name || 'Learner'}</Text>
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color={COLORS.neutralDark} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {/* Score Input */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Numeric Score (Marks) *</Text>
                <TextInput
                  style={styles.input}
                  value={grade}
                  onChangeText={setGrade}
                  keyboardType="numeric"
                  placeholder="e.g. 85"
                  placeholderTextColor={COLORS.neutralLight}
                />
                <View style={styles.quickScoresRow}>
                  {['100', '95', '90', '85', '80', '75'].map((quickScore) => (
                    <TouchableOpacity
                      key={quickScore}
                      style={[styles.quickScorePill, grade === quickScore && styles.quickScorePillActive]}
                      onPress={() => setGrade(quickScore)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[styles.quickScoreText, grade === quickScore && styles.quickScoreTextActive]}
                      >
                        {quickScore}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Feedback Input */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Mentor Feedback & Rubric Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={feedback}
                  onChangeText={setFeedback}
                  placeholder="Provide constructive feedback, highlight strengths, or point out areas for improvement..."
                  placeholderTextColor={COLORS.neutralLight}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.cancelModalBtn}
                  onPress={() => setModalVisible(false)}
                  disabled={isSaving}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelModalBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveModalBtn, isSaving && { opacity: 0.7 }]}
                  onPress={handleSaveGrade}
                  disabled={isSaving}
                  activeOpacity={0.9}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.saveModalBtnText}>Save Grade</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AssignmentSubmissionsScreen;

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
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
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

  // Summary Bar
  summaryBar: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    gap: 8,
    marginBottom: 12,
  },
  summaryPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  summaryPillNum: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.neutralDark,
    marginRight: 4,
  },
  summaryPillLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.neutralMedium,
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
    gap: 14,
  },

  // Card
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    elevation: 2,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  learnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.badgeOrangeBg,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.neutralDark,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.neutralMedium,
    fontWeight: '500',
  },
  lateBadge: {
    backgroundColor: COLORS.errorBg,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 6,
  },
  lateBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.error,
  },

  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusPillGraded: {
    backgroundColor: COLORS.badgeGreenBg,
  },
  statusPillPending: {
    backgroundColor: COLORS.badgeOrangeBg,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  statusTextGraded: {
    color: COLORS.badgeGreenText,
  },
  statusTextPending: {
    color: COLORS.primary,
  },

  // Deliverables
  deliverablesSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderWarm,
    paddingTop: 12,
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  deliverableLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.neutralMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  notesBox: {
    backgroundColor: COLORS.cardBgSoft,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  notesText: {
    fontSize: 13,
    color: COLORS.neutralDark,
    lineHeight: 18,
    marginTop: 2,
  },
  deliverableItem: {
    marginTop: 2,
  },
  linkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  linkPillText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  filesGrid: {
    gap: 6,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  fileIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.badgeOrangeBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  fileCardName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.neutralDark,
    marginRight: 8,
  },

  // Graded Banner
  gradedBanner: {
    backgroundColor: COLORS.honeyBg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FBE8C4',
    marginTop: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreBadgeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.honeyText,
    marginRight: 4,
  },
  scoreBadgeValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.honeyText,
  },
  feedbackContainer: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F7DCAB',
  },
  feedbackTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.honeyText,
    textTransform: 'uppercase',
  },
  feedbackContent: {
    fontSize: 12,
    fontStyle: 'italic',
    color: COLORS.neutralDark,
    marginTop: 2,
    lineHeight: 17,
  },

  // Footer Action
  cardFooter: {
    marginTop: 14,
  },
  gradeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 16,
  },
  gradeActionBtnPrimary: {
    backgroundColor: COLORS.primaryDark,
    elevation: 2,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  gradeActionBtnSecondary: {
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  gradeActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  gradeActionBtnTextPrimary: {
    color: COLORS.white,
  },
  gradeActionBtnTextSecondary: {
    color: COLORS.primaryDark,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 40,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.badgeOrangeBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.neutralDark,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  backToAssignmentsBtn: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 20,
  },
  backToAssignmentsBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.neutralMedium,
    fontWeight: '600',
    fontSize: 13,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(35, 25, 23, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingHorizontal: 20,
    paddingTop: 10,
    elevation: 8,
    shadowColor: COLORS.neutralDark,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  modalHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.borderSubtle,
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.neutralDark,
    letterSpacing: -0.3,
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.neutralMedium,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    paddingBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.neutralDark,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.neutralDark,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  quickScoresRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  quickScorePill: {
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  quickScorePillActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
  },
  quickScoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.neutralDark,
  },
  quickScoreTextActive: {
    color: COLORS.white,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  cancelModalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.neutralDark,
  },
  saveModalBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryDark,
    elevation: 3,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  saveModalBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.2,
  },
});
