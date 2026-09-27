import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
  SafeAreaView,
  StatusBar,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { courseApi, quizApi } from '../../api/skill-sharer.service';
import { COLORS } from '../../theme/colors';

interface Quiz {
  id: string;
  courseId: string;
  title: string;
  url: string;
  instructions?: string;
  passingScore?: number;
  requireForCompletion?: boolean;
  dueDate?: string;
  completionCount?: number;
}

interface CourseWithQuizzes {
  id: string;
  title: string;
  description?: string;
  status: string;
  assessments: Quiz[];
}

export const AssessmentsScreen = ({ navigation }: any) => {
  const [courses, setCourses] = useState<CourseWithQuizzes[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentQuizId, setCurrentQuizId] = useState<string | null>(null);

  // Form Fields
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [formLink, setFormLink] = useState('');
  const [instructions, setInstructions] = useState('');
  const [passingScore, setPassingScore] = useState('80');
  const [requireForCompletion, setRequireForCompletion] = useState(true);
  const [dueDays, setDueDays] = useState('7');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCoursesAndAssessments();
  }, []);

  const fetchCoursesAndAssessments = async () => {
    try {
      setLoading(true);
      const res: any = await courseApi.getMyCourses();
      const myCourses = res?.data || (Array.isArray(res) ? res : []);

      if (Array.isArray(myCourses)) {
        const enrichedCourses: CourseWithQuizzes[] = await Promise.all(
          myCourses.map(async (c: any) => {
            try {
              const quizRes: any = await quizApi.getCourseQuizzes(c.id);
              const quizzes = quizRes?.quizzes || quizRes?.data || [];
              return {
                id: c.id,
                title: c.title,
                description: c.description,
                status: c.status,
                assessments: Array.isArray(quizzes) ? quizzes : [],
              };
            } catch (err) {
              return {
                id: c.id,
                title: c.title,
                description: c.description,
                status: c.status,
                assessments: [],
              };
            }
          })
        );
        setCourses(enrichedCourses);
        if (enrichedCourses[0]?.id && !selectedCourseId) {
          setSelectedCourseId(enrichedCourses[0].id);
        }
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error('Error fetching courses and assessments:', error);
      Alert.alert('Error', 'Failed to load courses.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOpenCreateModal = (targetCourseId?: string) => {
    setIsEditing(false);
    setCurrentQuizId(null);
    const chosenCourseId = targetCourseId || courses[0]?.id || '';
    setSelectedCourseId(chosenCourseId);

    const matchedCourse = courses.find((c) => c.id === chosenCourseId);
    const defaultTitle = matchedCourse ? `${matchedCourse.title} - Final Assessment` : 'Course Final Assessment';

    setTitle(defaultTitle);
    setFormLink('');
    setInstructions('Please answer all questions thoroughly. Ensure you submit the Google Form before the deadline to record your completion.');
    setPassingScore('80');
    setRequireForCompletion(true);
    setDueDays('7');
    setModalVisible(true);
  };

  const handleOpenEditModal = (courseId: string, quiz: Quiz) => {
    setIsEditing(true);
    setCurrentQuizId(quiz.id);
    setSelectedCourseId(courseId);
    setTitle(quiz.title || 'Course Assessment');
    setFormLink(quiz.url || '');
    setInstructions(quiz.instructions || '');
    setPassingScore(quiz.passingScore !== undefined && quiz.passingScore !== null ? String(quiz.passingScore) : '80');
    setRequireForCompletion(quiz.requireForCompletion ?? true);
    setDueDays('7');
    setModalVisible(true);
  };

  const handleDeleteQuiz = (quiz: Quiz) => {
    const performDelete = async () => {
      try {
        await quizApi.deleteQuizLink(quiz.id);
        if (Platform.OS === 'web') {
          window.alert('Assessment removed successfully.');
        } else {
          Alert.alert('Deleted', 'Assessment removed successfully.');
        }
        fetchCoursesAndAssessments();
      } catch (error: any) {
        const msg = error?.response?.data?.error || 'Failed to delete assessment.';
        if (Platform.OS === 'web') {
          window.alert('Error: ' + msg);
        } else {
          Alert.alert('Error', msg);
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete "${quiz.title}"? This cannot be undone.`)) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete Assessment',
        `Are you sure you want to delete "${quiz.title}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete },
        ]
      );
    }
  };

  const handleSave = async () => {
    if (!selectedCourseId) {
      Alert.alert('Validation Error', 'Please select a course for this assessment.');
      return;
    }

    if (!formLink.trim()) {
      Alert.alert('Validation Error', 'Google Form link is required.');
      return;
    }

    if (!formLink.startsWith('http://') && !formLink.startsWith('https://')) {
      Alert.alert('Validation Error', 'Google Form link must start with https:// or http://');
      return;
    }

    try {
      setIsSaving(true);
      const parsedScore = parseFloat(passingScore) || 0;
      const days = parseInt(dueDays, 10) || 7;
      const calculatedDueDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

      const payload = {
        courseId: selectedCourseId,
        title: title.trim() || 'Course Assessment',
        url: formLink.trim(),
        instructions: instructions.trim(),
        passingScore: parsedScore,
        requireForCompletion: requireForCompletion,
        dueDate: calculatedDueDate,
      };

      if (isEditing && currentQuizId) {
        await quizApi.updateQuizLink(currentQuizId, payload);
        if (Platform.OS === 'web') {
          window.alert('Assessment updated successfully!');
        } else {
          Alert.alert('Success', 'Assessment updated successfully!');
        }
      } else {
        await quizApi.createQuizLink(payload);
        if (Platform.OS === 'web') {
          window.alert('New assessment created successfully!');
        } else {
          Alert.alert('Success', 'New assessment created successfully!');
        }
      }

      setModalVisible(false);
      fetchCoursesAndAssessments();
    } catch (error: any) {
      console.error('Error saving assessment:', error);
      const msg = error?.response?.data?.error || error?.message || 'Failed to save assessment';
      if (Platform.OS === 'web') {
        window.alert('Error: ' + msg);
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviewLink = async (url: string) => {
    try {
      if (!url) return;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Notice', 'Cannot open the form URL directly.');
      }
    } catch (e) {
      Alert.alert('Notice', 'Could not open link.');
    }
  };

  const totalAssessmentsCount = courses.reduce((acc, c) => acc + (c.assessments?.length || 0), 0);

  const renderCourseCard = ({ item }: { item: CourseWithQuizzes }) => (
    <View style={styles.courseCard}>
      {/* Course Header */}
      <View style={styles.courseCardHeader}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <View style={styles.courseBadgeRow}>
            <View style={styles.coursePill}>
              <Text style={styles.coursePillText}>COURSE</Text>
            </View>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>
                {item.assessments.length} {item.assessments.length === 1 ? 'Assessment' : 'Assessments'}
              </Text>
            </View>
          </View>
          <Text style={styles.courseCardTitle}>{item.title}</Text>
        </View>

        <TouchableOpacity
          style={styles.addMiniBtn}
          onPress={() => handleOpenCreateModal(item.id)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color={COLORS.primary} />
          <Text style={styles.addMiniBtnText}>Add Form</Text>
        </TouchableOpacity>
      </View>

      {/* Assessments List */}
      {item.assessments.length > 0 ? (
        <View style={styles.quizList}>
          {item.assessments.map((quiz, index) => (
            <View key={quiz.id || String(index)} style={styles.quizItem}>
              {/* Item Top Row */}
              <View style={styles.quizHeader}>
                <View style={styles.quizIconBubble}>
                  <Text style={{ fontSize: 16 }}>📋</Text>
                </View>

                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.quizTitle}>{quiz.title}</Text>
                  <View style={styles.badgeRow}>
                    <View
                      style={[
                        styles.requirementBadge,
                        {
                          backgroundColor: quiz.requireForCompletion ? COLORS.badgeGreenBg : COLORS.surfaceMuted,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.requirementBadgeText,
                          {
                            color: quiz.requireForCompletion ? COLORS.badgeGreenText : COLORS.neutralMedium,
                          },
                        ]}
                      >
                        {quiz.requireForCompletion ? '✓ Mandatory' : 'Optional Practice'}
                      </Text>
                    </View>

                    {quiz.passingScore !== null && quiz.passingScore !== undefined && (
                      <View style={styles.scoreBadge}>
                        <Text style={styles.scoreBadgeText}>Min {quiz.passingScore}%</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleOpenEditModal(item.id, quiz)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="pencil-outline" size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.iconBtn, styles.deleteBtn]}
                    onPress={() => handleDeleteQuiz(quiz)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Form Link Pill */}
              <TouchableOpacity
                style={styles.quizLinkBox}
                onPress={() => handlePreviewLink(quiz.url)}
                activeOpacity={0.8}
              >
                <View style={styles.googleIconWrapper}>
                  <Ionicons name="logo-google" size={12} color="#EA4335" />
                </View>
                <Text style={styles.quizLinkText} numberOfLines={1}>
                  {quiz.url}
                </Text>
                <Ionicons name="open-outline" size={14} color={COLORS.neutralMedium} style={{ marginLeft: 6 }} />
              </TouchableOpacity>

              {/* Instructions preview */}
              {quiz.instructions ? (
                <View style={styles.instructionsContainer}>
                  <Text style={styles.instructionsLabel}>Instructions:</Text>
                  <Text style={styles.quizInstructions} numberOfLines={2}>
                    {quiz.instructions}
                  </Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.noQuizzesBox}>
          <Text style={styles.noQuizzesTitle}>No assessments added yet</Text>
          <Text style={styles.noQuizzesText}>
            Attach a Google Form assessment to evaluate learners for course completion.
          </Text>
          <TouchableOpacity
            style={styles.createFirstBtn}
            onPress={() => handleOpenCreateModal(item.id)}
            activeOpacity={0.85}
          >
            <Text style={styles.createFirstBtnText}>+ Attach Google Form</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={COLORS.neutralDark} />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Course Assessments</Text>
          <Text style={styles.headerSubtitle}>Google Forms & Completion Rules</Text>
        </View>

        <TouchableOpacity
          style={styles.headerCreateBtn}
          onPress={() => handleOpenCreateModal()}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color={COLORS.white} />
          <Text style={styles.headerCreateBtnText}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Summary Pill Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryChip}>
          <Text style={styles.summaryChipIcon}>📋</Text>
          <Text style={styles.summaryChipText}>
            <Text style={{ fontWeight: '800', color: COLORS.neutralDark }}>{totalAssessmentsCount}</Text> Forms Active
          </Text>
        </View>
      </View>

      {/* Main List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 12, color: COLORS.neutralMedium, fontWeight: '600', fontSize: 13 }}>
            Loading course assessments...
          </Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id}
          style={styles.flatList}
          contentContainerStyle={styles.listContainer}
          renderItem={renderCourseCard}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchCoursesAndAssessments();
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="document-text-outline" size={36} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Courses Found</Text>
              <Text style={styles.emptySub}>
                Create your first course to attach Google Form assessments and establish completion requirements.
              </Text>
              <TouchableOpacity
                style={styles.createCourseBtn}
                onPress={() => navigation?.navigate('CourseCreator')}
                activeOpacity={0.85}
              >
                <Text style={styles.createCourseBtnText}>Create a Course</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Create / Edit Assessment Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Pull Bar */}
            <View style={styles.modalHandle} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{isEditing ? 'Edit Assessment' : 'New Assessment'}</Text>
                <Text style={styles.modalSub}>Link a Google Form quiz to evaluate learner completion</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={COLORS.neutralDark} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {/* 1. Course Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Select Course *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.courseSelectRow}>
                  {courses.map((c) => {
                    const isSelected = selectedCourseId === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[styles.courseChip, isSelected && styles.courseChipActive]}
                        onPress={() => setSelectedCourseId(c.id)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[styles.courseChipText, isSelected && styles.courseChipTextActive]}
                          numberOfLines={1}
                        >
                          {c.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* 2. Assessment Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Assessment Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Full-Stack Bootcamp - Final Assessment"
                  placeholderTextColor={COLORS.neutralLight}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              {/* 3. Google Form Link */}
              <View style={styles.inputGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <View style={styles.googleMiniIcon}>
                    <Ionicons name="logo-google" size={13} color="#EA4335" />
                  </View>
                  <Text style={styles.label}>Google Form URL *</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="https://docs.google.com/forms/d/e/.../viewform"
                  placeholderTextColor={COLORS.neutralLight}
                  value={formLink}
                  onChangeText={setFormLink}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.helperText}>
                  💡 Paste the public "viewform" link created on Google Forms.
                </Text>
              </View>

              {/* 4. Requirements & Settings */}
              <View style={styles.sectionDivider}>
                <Text style={styles.sectionDividerText}>Settings & Completion Criteria</Text>
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Passing Score (%)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="80"
                    placeholderTextColor={COLORS.neutralLight}
                    value={passingScore}
                    onChangeText={setPassingScore}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Due In (Days)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="7"
                    placeholderTextColor={COLORS.neutralLight}
                    value={dueDays}
                    onChangeText={setDueDays}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.switchCard}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={styles.switchLabel}>Required for E-Certificate</Text>
                  <Text style={styles.switchSublabel}>
                    Learners must submit this assessment to satisfy course completion rules.
                  </Text>
                </View>
                <Switch
                  value={requireForCompletion}
                  onValueChange={setRequireForCompletion}
                  trackColor={{ false: COLORS.borderSubtle, true: '#FC9174' }}
                  thumbColor={requireForCompletion ? COLORS.primaryDark : COLORS.white}
                />
              </View>

              {/* 5. Instructions */}
              <View style={styles.sectionDivider}>
                <Text style={styles.sectionDividerText}>Learner Instructions</Text>
              </View>

              <View style={styles.inputGroup}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Provide instructions, hints, or requirements for learners taking this assessment..."
                  placeholderTextColor={COLORS.neutralLight}
                  value={instructions}
                  onChangeText={setInstructions}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                disabled={isSaving}
                activeOpacity={0.9}
              >
                {isSaving ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {isEditing ? 'Save Changes' : 'Publish Assessment →'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AssessmentsScreen;

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
  flatList: {
    flex: 1,
    ...Platform.select({
      web: {
        overflowY: 'auto' as any,
        WebkitOverflowScrolling: 'touch' as any,
      },
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    elevation: 2,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerCreateBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 12,
    marginLeft: 3,
  },

  // Summary Pill Bar
  summaryBar: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    gap: 10,
    marginBottom: 12,
  },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  summaryChipIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  summaryChipText: {
    fontSize: 12,
    color: COLORS.neutralMedium,
    fontWeight: '600',
  },

  listContainer: {
    paddingHorizontal: 18,
    paddingBottom: 40,
    gap: 16,
  },

  // Course Card
  courseCard: {
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
  courseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  courseBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  coursePill: {
    backgroundColor: COLORS.badgeOrangeBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  coursePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  countPill: {
    backgroundColor: COLORS.honeyBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.honeyText,
  },
  courseCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.neutralDark,
    letterSpacing: -0.2,
  },
  addMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.badgeOrangeBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  addMiniBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 3,
  },

  // Assessments List Inside Card
  quizList: {
    gap: 12,
  },
  quizItem: {
    backgroundColor: COLORS.cardBgSoft,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  quizIconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  quizTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  requirementBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  requirementBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  scoreBadge: {
    backgroundColor: COLORS.honeyBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  scoreBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.honeyText,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  deleteBtn: {
    marginLeft: 6,
    backgroundColor: COLORS.errorBg,
    borderColor: '#FFDAD6',
  },

  // Google Form Link Preview Box
  quizLinkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    marginBottom: 8,
  },
  googleIconWrapper: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FDEAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  quizLinkText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.primaryDark,
    fontWeight: '600',
  },

  instructionsContainer: {
    marginTop: 2,
    paddingLeft: 4,
  },
  instructionsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.neutralLight,
    marginBottom: 1,
  },
  quizInstructions: {
    fontSize: 12,
    color: COLORS.neutralMedium,
    lineHeight: 17,
  },

  // No Quizzes in Course
  noQuizzesBox: {
    backgroundColor: COLORS.cardBgSoft,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  noQuizzesTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.neutralDark,
    marginBottom: 3,
  },
  noQuizzesText: {
    fontSize: 12,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 17,
  },
  createFirstBtn: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  createFirstBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },

  // Empty Global State
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.badgeOrangeBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
  createCourseBtn: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 22,
  },
  createCourseBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(35, 25, 23, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
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

  // Inputs
  inputGroup: {
    marginBottom: 14,
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
    minHeight: 88,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 11,
    color: COLORS.neutralMedium,
    marginTop: 4,
    paddingLeft: 2,
  },
  googleMiniIcon: {
    marginRight: 6,
  },

  // Course Selector Horizontal Chips
  courseSelectRow: {
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

  // Section Dividers in Modal
  sectionDivider: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderWarm,
    paddingTop: 12,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionDividerText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowInputs: {
    flexDirection: 'row',
  },

  // Switch Card
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBgSoft,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    marginBottom: 14,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.neutralDark,
    marginBottom: 2,
  },
  switchSublabel: {
    fontSize: 11,
    color: COLORS.neutralMedium,
    lineHeight: 16,
  },

  // Save Button
  saveBtn: {
    backgroundColor: COLORS.primaryDark,
    paddingVertical: 15,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    elevation: 3,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
