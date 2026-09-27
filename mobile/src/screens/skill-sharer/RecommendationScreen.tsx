import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { certificateApi, recommendationApi, courseApi } from '../../api/skill-sharer.service';
import { COLORS } from '../../theme/colors';

export function RecommendationScreen({ navigation }: any) {
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [completedLearners, setCompletedLearners] = useState<any[]>([]);
  const [selectedLearner, setSelectedLearner] = useState<any | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingLearners, setLoadingLearners] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingRec, setEditingRec] = useState<any | null>(null);

  const showNotification = (msgTitle: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${msgTitle}: ${message}`);
    } else {
      Alert.alert(msgTitle, message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMyCourses();
    }, [])
  );

  const loadMyCourses = async () => {
    try {
      setLoadingCourses(true);
      const res: any = await courseApi.getMyCourses();
      const courses = res?.data || res?.courses || (Array.isArray(res) ? res : []);
      const published = courses.filter((c: any) => c.status === 'PUBLISHED' || c.status === 'APPROVED');
      setMyCourses(published);
    } catch (err) {
      console.log('Failed to load courses', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadCourseLearners = async (courseId: string) => {
    try {
      setLoadingLearners(true);
      setCompletedLearners([]);
      const res: any = await certificateApi.getCourseCompletionRequests(courseId);
      const requests = res?.data || res?.requests || [];
      // Only show approved requests (graduates with verified completion)
      const approved = requests.filter((r: any) => r.status === 'APPROVED');
      setCompletedLearners(approved);
    } catch (err) {
      console.log('Failed to load learners', err);
    } finally {
      setLoadingLearners(false);
    }
  };

  const handleSelectCourse = (course: any) => {
    setSelectedCourse(course);
    setSelectedLearner(null);
    loadCourseLearners(course.id);
  };

  const handleSubmit = async () => {
    if (!selectedCourse) {
      showNotification('Select a Course', 'Please select a course first.');
      return;
    }
    if (!selectedLearner) {
      showNotification('Select a Learner', 'Please select a certified graduate to endorse.');
      return;
    }
    if (!title.trim()) {
      showNotification('Title Required', 'Please provide a short headline or title for the recommendation.');
      return;
    }
    if (!content.trim() || content.trim().length < 20) {
      showNotification('Content Required', 'Please write at least 20 characters for the endorsement.');
      return;
    }

    try {
      setSubmitting(true);
      const data = {
        learnerId: selectedLearner.learnerId,
        courseId: selectedCourse.id,
        title: title.trim(),
        content: content.trim(),
        isPublic,
      };

      if (editingRec) {
        await recommendationApi.update(editingRec.id, {
          title: data.title,
          content: data.content,
          isPublic,
        });
        showNotification('Updated!', 'Recommendation updated successfully.');
      } else {
        await recommendationApi.create(data);
        showNotification(
          'Sent!',
          `Your endorsement for ${selectedLearner.learner?.name || 'the learner'} has been published successfully.`
        );
      }

      setTitle('');
      setContent('');
      setSelectedLearner(null);
      setEditingRec(null);
    } catch (err: any) {
      showNotification('Error', err?.error || err?.message || 'Failed to submit recommendation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={COLORS.neutralDark} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Learner Recommendations</Text>
          <Text style={styles.headerSub}>Endorse Standout Course Graduates</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Philosophy Banner */}
        <View style={styles.infoBanner}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="ribbon" size={20} color={COLORS.honeyText} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.infoTitle}>Mentor Endorsements</Text>
            <Text style={styles.infoText}>
              Formal recommendations help top learners showcase practical mastery to employers and peers.
              Only verified graduates with approved completion can be endorsed.
            </Text>
          </View>
        </View>

        {/* Step 1: Select Course */}
        <View style={styles.card}>
          <View style={styles.stepHeaderRow}>
            <View style={styles.stepNumberBadge}>
              <Text style={styles.stepNumberBadgeText}>STEP 1</Text>
            </View>
            <Text style={styles.stepLabel}>Select a Course</Text>
          </View>

          {loadingCourses ? (
            <View style={styles.loadingBoxMini}>
              <ActivityIndicator color={COLORS.primary} size="small" />
              <Text style={styles.loadingTextMini}>Loading courses...</Text>
            </View>
          ) : myCourses.length === 0 ? (
            <View style={styles.noCoursesBox}>
              <Text style={styles.noDataText}>No published courses found.</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.courseChipsContainer}
            >
              {myCourses.map((course: any) => {
                const isSelected = selectedCourse?.id === course.id;
                return (
                  <TouchableOpacity
                    key={course.id}
                    style={[styles.courseChip, isSelected && styles.courseChipActive]}
                    onPress={() => handleSelectCourse(course)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="book-outline"
                      size={14}
                      color={isSelected ? COLORS.white : COLORS.primary}
                    />
                    <Text style={[styles.courseChipText, isSelected && styles.courseChipTextActive]}>
                      {course.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Step 2: Select Graduate */}
        {selectedCourse && (
          <View style={styles.card}>
            <View style={styles.stepHeaderRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberBadgeText}>STEP 2</Text>
              </View>
              <Text style={styles.stepLabel}>Select Eligible Graduate</Text>
            </View>
            <Text style={styles.stepSub}>
              Showing learners who successfully completed "{selectedCourse.title}".
            </Text>

            {loadingLearners ? (
              <View style={styles.loadingBoxMini}>
                <ActivityIndicator color={COLORS.primary} size="small" />
                <Text style={styles.loadingTextMini}>Checking course graduates...</Text>
              </View>
            ) : completedLearners.length === 0 ? (
              <View style={styles.emptyGraduatesBox}>
                <View style={styles.emptyGraduatesIcon}>
                  <Ionicons name="school-outline" size={28} color={COLORS.neutralMedium} />
                </View>
                <Text style={styles.emptyGraduatesTitle}>No Certified Graduates Yet</Text>
                <Text style={styles.emptyGraduatesSub}>
                  Once learners finish all course assessments and have their completion approved, they will appear here.
                </Text>
              </View>
            ) : (
              <View style={styles.learnersGrid}>
                {completedLearners.map((req: any) => {
                  const learner = req.learner;
                  const isSelected = selectedLearner?.learnerId === req.learnerId;
                  const initial = (learner?.name || learner?.email || '?')[0]?.toUpperCase() || 'L';

                  return (
                    <TouchableOpacity
                      key={req.id}
                      style={[styles.learnerRow, isSelected && styles.learnerRowActive]}
                      onPress={() => setSelectedLearner(req)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.learnerAvatar, isSelected && styles.learnerAvatarActive]}>
                        <Text style={[styles.learnerAvatarText, isSelected && styles.learnerAvatarTextActive]}>
                          {initial}
                        </Text>
                      </View>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.learnerName, isSelected && styles.learnerNameActive]}>
                          {learner?.name || 'Course Graduate'}
                        </Text>
                        <Text style={styles.learnerEmail} numberOfLines={1}>
                          {learner?.email || ''}
                        </Text>
                      </View>
                      {isSelected ? (
                        <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                      ) : (
                        <View style={styles.unselectedCircle} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Step 3: Write Recommendation & Live Preview */}
        {selectedLearner && (
          <View style={styles.card}>
            <View style={styles.stepHeaderRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberBadgeText}>STEP 3</Text>
              </View>
              <Text style={styles.stepLabel}>Write Recommendation</Text>
            </View>
            <View style={styles.recommendingBanner}>
              <Text style={styles.recommendingText}>
                Endorsement for:{' '}
                <Text style={{ fontWeight: '800', color: COLORS.neutralDark }}>
                  {selectedLearner.learner?.name || 'Learner'}
                </Text>
              </Text>
            </View>

            {/* Headline / Title Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Headline / Key Quality *</Text>
              <TextInput
                style={styles.textInput}
                placeholder='e.g. "Exceptional problem solver & dedicated engineer"'
                placeholderTextColor={COLORS.neutralLight}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
              <Text style={styles.charCount}>{title.length}/100</Text>
            </View>

            {/* Content / Narrative Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Recommendation Narrative * (min 20 chars)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Highlight the learner's dedication, project quality, collaboration skills, and technical strengths demonstrated during this course..."
                placeholderTextColor={COLORS.neutralLight}
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
              <Text
                style={[
                  styles.charCount,
                  content.length < 20 && content.length > 0 ? { color: COLORS.error } : null,
                ]}
              >
                {content.length} characters (min 20)
              </Text>
            </View>

            {/* Live Endorsement Preview */}
            {title.trim().length > 0 && content.trim().length > 0 && (
              <View style={styles.previewContainer}>
                <View style={styles.previewHeader}>
                  <Ionicons name="eye-outline" size={14} color={COLORS.honeyText} style={{ marginRight: 4 }} />
                  <Text style={styles.previewHeaderLabel}>LIVE PREVIEW</Text>
                </View>
                <View style={styles.previewCard}>
                  <Text style={styles.previewTitle}>"{title}"</Text>
                  <Text style={styles.previewQuote}>{content}</Text>
                  <View style={styles.previewFooter}>
                    <View style={styles.previewBadge}>
                      <Ionicons name="ribbon" size={14} color={COLORS.primary} />
                      <Text style={styles.previewBadgeText}>
                        Endorsed by Instructor · {selectedCourse?.title}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Public Switch Toggle Card */}
            <View style={styles.toggleCard}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.toggleLabel}>Public Endorsement</Text>
                  <View
                    style={[
                      styles.visibilityPill,
                      { backgroundColor: isPublic ? COLORS.badgeGreenBg : COLORS.surfaceMuted },
                    ]}
                  >
                    <Text
                      style={[
                        styles.visibilityPillText,
                        { color: isPublic ? COLORS.badgeGreenText : COLORS.neutralMedium },
                      ]}
                    >
                      {isPublic ? 'Public' : 'Private'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.toggleSub}>
                  {isPublic
                    ? 'Visible on learner profile to future employers and peers.'
                    : 'Visible only directly to the learner.'}
                </Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: COLORS.borderSubtle, true: '#FC9174' }}
                thumbColor={isPublic ? COLORS.primaryDark : COLORS.white}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.9}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="ribbon-outline" size={18} color={COLORS.white} />
                  <Text style={styles.submitBtnText}>
                    {editingRec ? 'Update Recommendation' : 'Publish Endorsement →'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default RecommendationScreen;

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
    alignItems: 'center',
    justifyContent: 'center',
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
  headerSub: {
    fontSize: 12,
    color: COLORS.neutralMedium,
    fontWeight: '500',
    marginTop: 1,
  },
  scrollArea: {
    flex: 1,
    ...Platform.select({
      web: {
        overflowY: 'auto' as any,
        WebkitOverflowScrolling: 'touch' as any,
      },
    }),
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 40,
    gap: 16,
  },

  // Info Philosophy Banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.honeyBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FBE8C4',
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F7DCAB',
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.honeyText,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.neutralDark,
    lineHeight: 18,
  },

  // Step Card
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    elevation: 2,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  stepNumberBadge: {
    backgroundColor: COLORS.badgeOrangeBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stepNumberBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.neutralDark,
    letterSpacing: -0.2,
  },
  stepSub: {
    fontSize: 12,
    color: COLORS.neutralMedium,
    marginBottom: 12,
    marginTop: 2,
  },

  // Course Selector
  courseChipsContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  courseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  courseChipActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
  },
  courseChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.neutralDark,
  },
  courseChipTextActive: {
    color: COLORS.white,
  },
  loadingBoxMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  loadingTextMini: {
    fontSize: 12,
    color: COLORS.neutralMedium,
    fontWeight: '600',
  },
  noCoursesBox: {
    paddingVertical: 12,
  },
  noDataText: {
    fontSize: 13,
    color: COLORS.neutralMedium,
    fontStyle: 'italic',
  },

  // Graduate Selection
  emptyGraduatesBox: {
    backgroundColor: COLORS.cardBgSoft,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    borderStyle: 'dashed',
    marginTop: 6,
  },
  emptyGraduatesIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyGraduatesTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.neutralDark,
    marginBottom: 3,
  },
  emptyGraduatesSub: {
    fontSize: 11,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    lineHeight: 16,
  },
  learnersGrid: {
    gap: 8,
    marginTop: 6,
  },
  learnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: COLORS.cardBgSoft,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  learnerRowActive: {
    backgroundColor: COLORS.badgeOrangeBg,
    borderColor: COLORS.primary,
  },
  learnerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  learnerAvatarActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
  },
  learnerAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  learnerAvatarTextActive: {
    color: COLORS.white,
  },
  learnerName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.neutralDark,
  },
  learnerNameActive: {
    color: COLORS.primaryDark,
  },
  learnerEmail: {
    fontSize: 11,
    color: COLORS.neutralMedium,
    marginTop: 1,
  },
  unselectedCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: COLORS.borderSubtle,
  },

  // Form Fields
  recommendingBanner: {
    backgroundColor: COLORS.cardBgSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  recommendingText: {
    fontSize: 12,
    color: COLORS.neutralMedium,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.neutralDark,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    color: COLORS.neutralDark,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 10,
    color: COLORS.neutralMedium,
    textAlign: 'right',
    marginTop: 4,
  },

  // Preview
  previewContainer: {
    marginBottom: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  previewHeaderLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.honeyText,
    letterSpacing: 0.6,
  },
  previewCard: {
    backgroundColor: COLORS.cardBgSoft,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.neutralDark,
    marginBottom: 6,
  },
  previewQuote: {
    fontSize: 13,
    color: COLORS.neutralDark,
    fontStyle: 'italic',
    lineHeight: 19,
    marginBottom: 10,
  },
  previewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.neutralMedium,
  },

  // Toggle
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBgSoft,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.neutralDark,
    marginRight: 8,
  },
  visibilityPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  visibilityPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  toggleSub: {
    fontSize: 11,
    color: COLORS.neutralMedium,
    marginTop: 3,
    lineHeight: 16,
  },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryDark,
    paddingVertical: 14,
    borderRadius: 22,
    elevation: 3,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.2,
  },
});
