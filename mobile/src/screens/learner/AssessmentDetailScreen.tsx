import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Linking,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { completeQuiz } from '../../api/learner.service';
import { COLORS } from '../../theme/colors';

export const AssessmentDetailScreen = ({ route, navigation }: any) => {
  const { assessment } = route.params || {};
  const [status, setStatus] = useState(route.params?.status || assessment?.status || 'PENDING');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!assessment) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />
        <View style={styles.missingCard}>
          <Text style={{ fontSize: 36, marginBottom: 12 }}>⚠️</Text>
          <Text style={styles.missingTitle}>Assessment Not Found</Text>
          <Text style={styles.missingSub}>
            Assessment details could not be loaded. Please return to your course and try again.
          </Text>
          <TouchableOpacity
            onPress={() => navigation?.goBack()}
            style={styles.primaryPillBtn}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryPillBtnText}>Return to Course</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const courseTitle = route.params?.courseName || assessment.course?.title || 'Course Assessment';
  const assessmentTitle = assessment.title || `${courseTitle} - Final Assessment`;
  const dueDate = route.params?.dueDate || (assessment.dueDate ? new Date(assessment.dueDate).toLocaleDateString() : 'No due date');
  const googleFormUrl = assessment.url || assessment.formUrl;
  const isCompleted = status === 'COMPLETED';

  const handleOpenForm = async () => {
    try {
      if (!googleFormUrl) {
        if (Platform.OS === 'web') {
          window.alert('Notice: No Google Form link provided for this assessment.');
        } else {
          Alert.alert('Notice', 'No Google Form link provided for this assessment.');
        }
        return;
      }
      const canOpen = await Linking.canOpenURL(googleFormUrl);
      if (canOpen) {
        await Linking.openURL(googleFormUrl);
      } else {
        if (Platform.OS === 'web') {
          window.open(googleFormUrl, '_blank');
        } else {
          Alert.alert('Error', 'Cannot open the provided form URL.');
        }
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        window.open(googleFormUrl, '_blank');
      } else {
        Alert.alert('Error', 'Failed to open assessment form link.');
      }
    }
  };

  const doSubmitCompletion = async () => {
    try {
      setIsSubmitting(true);
      await completeQuiz(assessment.id);
      setStatus('COMPLETED');

      if (Platform.OS === 'web') {
        window.alert('Assessment Completed! Your completion has been recorded successfully.');
      } else {
        Alert.alert('Assessment Completed!', 'Your completion has been recorded successfully.');
      }

      if (route.params?.loadMyLearning) {
        route.params.loadMyLearning();
      }
    } catch (error: any) {
      const errMsg = error?.response?.data?.error || error?.error || error?.message || 'Failed to update assessment status';
      if (Platform.OS === 'web') {
        window.alert('Notice: ' + errMsg);
      } else {
        Alert.alert('Notice', errMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkCompleted = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Have you completely finished and submitted the Google Form assessment?');
      if (confirmed) {
        doSubmitCompletion();
      }
    } else {
      Alert.alert(
        'Confirm Submission',
        'Have you completely finished and submitted the Google Form assessment?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, Mark Completed',
            onPress: doSubmitCompletion,
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />

      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.circleBackBtn}
          onPress={() => navigation?.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.neutralDark} />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Course Assessment</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {courseTitle}
          </Text>
        </View>

        <View style={styles.googleFormBadge}>
          <Ionicons name="logo-google" size={13} color="#EA4335" />
          <Text style={styles.googleFormBadgeText}>Form</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroPillRow}>
            <View style={styles.tagPill}>
              <Text style={styles.tagPillText}>⚡ FINAL ASSESSMENT</Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isCompleted ? COLORS.badgeGreenBg : COLORS.badgeOrangeBg,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color: isCompleted ? COLORS.badgeGreenText : COLORS.primaryDark,
                  },
                ]}
              >
                {isCompleted ? '✓ Completed & Verified' : '⏳ Action Required'}
              </Text>
            </View>
          </View>

          <Text style={styles.assessmentTitle}>{assessmentTitle}</Text>

          <View style={styles.courseRow}>
            <Ionicons name="book-outline" size={15} color={COLORS.primary} />
            <Text style={styles.courseNameText} numberOfLines={1}>
              {courseTitle}
            </Text>
          </View>
        </View>

        {/* Google Form Action Card */}
        <View style={styles.formActionCard}>
          <View style={styles.formActionHeader}>
            <View style={styles.formIconCircle}>
              <Ionicons name="document-text" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.formActionTitle}>Official Google Form</Text>
              <Text style={styles.formActionSub}>
                Opens directly in your browser. Answer all required questions.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.openFormBtn}
            onPress={handleOpenForm}
            activeOpacity={0.88}
          >
            <Ionicons name="open-outline" size={18} color={COLORS.white} style={{ marginRight: 8 }} />
            <Text style={styles.openFormBtnText}>Open Google Form Assessment</Text>
          </TouchableOpacity>
        </View>

        {/* Requirements & Criteria Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>🎖️</Text>
            <Text style={styles.sectionTitle}>Completion Criteria</Text>
          </View>

          <View style={styles.requirementRow}>
            <View style={styles.reqIconLabel}>
              <Ionicons name="ribbon-outline" size={16} color={COLORS.primary} />
              <Text style={styles.requirementLabel}>Passing Score</Text>
            </View>
            <View style={styles.reqValueChip}>
              <Text style={styles.reqValueChipText}>
                {assessment.passingScore ? `Min ${assessment.passingScore}%` : 'Complete all items'}
              </Text>
            </View>
          </View>

          <View style={styles.requirementRow}>
            <View style={styles.reqIconLabel}>
              <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.primary} />
              <Text style={styles.requirementLabel}>Certificate Rule</Text>
            </View>
            <View
              style={[
                styles.reqValueChip,
                { backgroundColor: assessment.requireForCompletion ? COLORS.badgeGreenBg : COLORS.surfaceMuted },
              ]}
            >
              <Text
                style={[
                  styles.reqValueChipText,
                  { color: assessment.requireForCompletion ? COLORS.badgeGreenText : COLORS.neutralMedium },
                ]}
              >
                {assessment.requireForCompletion ? 'Mandatory for Certificate' : 'Optional Practice'}
              </Text>
            </View>
          </View>

          <View style={[styles.requirementRow, { borderBottomWidth: 0 }]}>
            <View style={styles.reqIconLabel}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
              <Text style={styles.requirementLabel}>Deadline</Text>
            </View>
            <Text style={styles.dueDateText}>{dueDate}</Text>
          </View>
        </View>

        {/* Instructions Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>📋</Text>
            <Text style={styles.sectionTitle}>Skill Sharer Instructions</Text>
          </View>
          <Text style={styles.instructionsText}>
            {assessment.instructions ||
              'Please complete the Google Form linked above. Once submitted, return here and mark your assessment as completed.'}
          </Text>
        </View>

        {/* Status & Confirmation Actions */}
        <View style={styles.actionSection}>
          {isCompleted ? (
            <View style={styles.completedCelebrationCard}>
              <View style={styles.celebrationIconCircle}>
                <Ionicons name="checkmark-circle" size={28} color={COLORS.badgeGreenText} />
              </View>
              <Text style={styles.celebrationTitle}>Assessment Completed!</Text>
              <Text style={styles.celebrationSub}>
                Your assessment submission is recorded. You have fulfilled this requirement toward earning your course completion certificate.
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.markCompletedBtn}
              onPress={handleMarkCompleted}
              disabled={isSubmitting}
              activeOpacity={0.88}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.primaryDark} />
              ) : (
                <>
                  <Ionicons name="checkbox-outline" size={18} color={COLORS.primaryDark} style={{ marginRight: 6 }} />
                  <Text style={styles.markCompletedBtnText}>Mark as Submitted & Completed ✓</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.returnBtn}
            onPress={() => navigation?.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back-outline" size={15} color={COLORS.neutralMedium} style={{ marginRight: 4 }} />
            <Text style={styles.returnBtnText}>Return to Course Details</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AssessmentDetailScreen;

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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.bgWarm,
  },
  missingCard: {
    backgroundColor: COLORS.surfaceCard,
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  missingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.neutralDark,
    marginBottom: 6,
  },
  missingSub: {
    fontSize: 13,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  primaryPillBtn: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 22,
  },
  primaryPillBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
  },

  // Top Header
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: COLORS.bgWarm,
  },
  circleBackBtn: {
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
  googleFormBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  googleFormBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.neutralDark,
    marginLeft: 4,
  },

  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 6,
    ...Platform.select({
      web: {
        overflowY: 'auto' as any,
        WebkitOverflowScrolling: 'touch' as any,
      },
    }),
  },

  // Hero Card
  heroCard: {
    backgroundColor: COLORS.surfaceCard,
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: 16,
    elevation: 2,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  heroPillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagPill: {
    backgroundColor: COLORS.badgeOrangeBg,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  assessmentTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.neutralDark,
    letterSpacing: -0.3,
    lineHeight: 26,
    marginBottom: 10,
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  courseNameText: {
    fontSize: 13,
    color: COLORS.neutralMedium,
    fontWeight: '600',
    flex: 1,
  },

  // Google Form Action Card
  formActionCard: {
    backgroundColor: COLORS.cardBgSoft,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    marginBottom: 16,
  },
  formActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  formIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  formActionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.neutralDark,
    marginBottom: 2,
  },
  formActionSub: {
    fontSize: 12,
    color: COLORS.neutralMedium,
    lineHeight: 17,
  },
  openFormBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryDark,
    paddingVertical: 14,
    borderRadius: 24,
    elevation: 2,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  openFormBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  // Section Cards
  sectionCard: {
    backgroundColor: COLORS.surfaceCard,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionEmoji: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.neutralDark,
  },
  requirementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderWarm,
  },
  reqIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementLabel: {
    fontSize: 13,
    color: COLORS.neutralMedium,
    fontWeight: '600',
  },
  reqValueChip: {
    backgroundColor: COLORS.honeyBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reqValueChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.honeyText,
  },
  dueDateText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.neutralDark,
  },
  instructionsText: {
    fontSize: 13,
    color: COLORS.neutralMedium,
    lineHeight: 21,
  },

  // Actions
  actionSection: {
    gap: 12,
    marginTop: 4,
  },
  markCompletedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.badgeOrangeBg,
    paddingVertical: 14,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  markCompletedBtnText: {
    color: COLORS.primaryDark,
    fontSize: 14,
    fontWeight: '800',
  },
  completedCelebrationCard: {
    backgroundColor: '#EDFAF1',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#B9ECC9',
    alignItems: 'center',
  },
  celebrationIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  celebrationTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.badgeGreenText,
    marginBottom: 4,
  },
  celebrationSub: {
    fontSize: 12,
    color: '#285437',
    textAlign: 'center',
    lineHeight: 18,
  },
  returnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  returnBtnText: {
    color: COLORS.neutralMedium,
    fontSize: 13,
    fontWeight: '600',
  },
});
