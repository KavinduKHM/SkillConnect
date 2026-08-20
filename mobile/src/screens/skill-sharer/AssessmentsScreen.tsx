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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { courseApi, quizApi } from '../../api/skill-sharer.service';

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
        if (enrichedCourses.length > 0 && !selectedCourseId) {
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
    const chosenCourseId = targetCourseId || (courses.length > 0 ? courses[0].id : '');
    setSelectedCourseId(chosenCourseId);
    
    const matchedCourse = courses.find((c) => c.id === chosenCourseId);
    const defaultTitle = matchedCourse ? `${matchedCourse.title} - Assessment` : 'Course Final Assessment';
    
    setTitle(defaultTitle);
    setFormLink('');
    setInstructions('Please answer all questions thoroughly. Ensure you submit before the deadline.');
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
    Alert.alert(
      'Delete Assessment',
      `Are you sure you want to delete "${quiz.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await quizApi.deleteQuizLink(quiz.id);
              Alert.alert('Deleted', 'Assessment removed successfully.');
              fetchCoursesAndAssessments();
            } catch (error: any) {
              Alert.alert('Error', error?.response?.data?.error || 'Failed to delete assessment.');
            }
          },
        },
      ]
    );
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
        Alert.alert('Success', 'Assessment updated successfully!');
      } else {
        await quizApi.createQuizLink(payload);
        Alert.alert('Success', 'New assessment created successfully!');
      }

      setModalVisible(false);
      fetchCoursesAndAssessments();
    } catch (error: any) {
      console.error('Error saving assessment:', error);
      Alert.alert('Error', error?.response?.data?.error || error?.message || 'Failed to save assessment');
    } finally {
      setIsSaving(false);
    }
  };

  const renderCourseCard = ({ item }: { item: CourseWithQuizzes }) => (
    <View style={styles.courseCard}>
      {/* Course Header */}
      <View style={styles.courseCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.courseCardTitle}>{item.title}</Text>
          <Text style={styles.courseCardCount}>
            {item.assessments.length} {item.assessments.length === 1 ? 'Assessment' : 'Assessments'} attached
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addAssessmentMiniBtn}
          onPress={() => handleOpenCreateModal(item.id)}
        >
          <Ionicons name="add-circle" size={16} color="#4F46E5" />
          <Text style={styles.addAssessmentMiniBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Assessments List */}
      {item.assessments.length > 0 ? (
        <View style={styles.quizList}>
          {item.assessments.map((quiz, index) => (
            <View key={quiz.id || String(index)} style={styles.quizItem}>
              <View style={styles.quizHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.quizTitle}>{quiz.title}</Text>
                  <View style={styles.badgeRow}>
                    <View style={[styles.requirementBadge, { backgroundColor: quiz.requireForCompletion ? '#DEF7EC' : '#F3F4F6' }]}>
                      <Text style={[styles.requirementBadgeText, { color: quiz.requireForCompletion ? '#03543F' : '#6B7280' }]}>
                        {quiz.requireForCompletion ? 'Mandatory' : 'Optional'}
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
                  >
                    <Ionicons name="create-outline" size={18} color="#4F46E5" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.iconBtn, { marginLeft: 6 }]}
                    onPress={() => handleDeleteQuiz(quiz)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Form Link */}
              <View style={styles.quizLinkBox}>
                <Ionicons name="logo-google" size={14} color="#EA4335" style={{ marginRight: 6 }} />
                <Text style={styles.quizLinkText} numberOfLines={1}>{quiz.url}</Text>
              </View>

              {/* Instructions preview */}
              {quiz.instructions ? (
                <Text style={styles.quizInstructions} numberOfLines={2}>
                  "{quiz.instructions}"
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.noQuizzesBox}>
          <Text style={styles.noQuizzesText}>No assessments created for this course yet.</Text>
          <TouchableOpacity
            style={styles.createFirstBtn}
            onPress={() => handleOpenCreateModal(item.id)}
          >
            <Text style={styles.createFirstBtnText}>+ Create Assessment</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Course Assessments</Text>
        <TouchableOpacity
          style={styles.headerCreateBtn}
          onPress={() => handleOpenCreateModal()}
        >
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.headerCreateBtnText}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Main List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={{ marginTop: 12, color: '#6B7280' }}>Loading assessments...</Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={renderCourseCard}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchCoursesAndAssessments();
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="school-outline" size={54} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Courses Found</Text>
              <Text style={styles.emptySub}>Create your first course to start attaching Google Forms assessments.</Text>
              <TouchableOpacity
                style={styles.createCourseBtn}
                onPress={() => navigation.navigate('CourseCreator')}
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
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{isEditing ? 'Edit Assessment' : 'Create New Assessment'}</Text>
                <Text style={styles.modalSub}>Attach a Google Form quiz with completion requirements</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* 1. Course Selector (if multiple courses exist) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Select Course *</Text>
                <View style={styles.courseSelectGrid}>
                  {courses.map((c) => {
                    const isSelected = selectedCourseId === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[styles.courseChip, isSelected && styles.courseChipActive]}
                        onPress={() => setSelectedCourseId(c.id)}
                      >
                        <Text style={[styles.courseChipText, isSelected && styles.courseChipTextActive]} numberOfLines={1}>
                          {c.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 2. Assessment Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Assessment Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Module 1 Quiz / Final Assessment"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              {/* 3. Google Form Link */}
              <View style={styles.inputGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Ionicons name="logo-google" size={16} color="#EA4335" style={{ marginRight: 6 }} />
                  <Text style={styles.label}>Google Form Link *</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="https://docs.google.com/forms/d/e/.../viewform"
                  value={formLink}
                  onChangeText={setFormLink}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.helperText}>Provide the public viewform link for your Google Form.</Text>
              </View>

              {/* 4. Assessment Requirements */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderTitle}>Requirements & Settings</Text>
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                  <Text style={styles.label}>Min Passing Score (%)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="80"
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
                    value={dueDays}
                    onChangeText={setDueDays}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.switchRow}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={styles.switchLabel}>Mandatory for Course Completion</Text>
                  <Text style={styles.switchSublabel}>Learners must pass this assessment to earn their completion certificate.</Text>
                </View>
                <Switch
                  value={requireForCompletion}
                  onValueChange={setRequireForCompletion}
                  trackColor={{ false: '#D1D5DB', true: '#818CF8' }}
                  thumbColor={requireForCompletion ? '#4F46E5' : '#F3F4F6'}
                />
              </View>

              {/* 5. Instructions */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderTitle}>Instructions for Learners</Text>
              </View>

              <View style={styles.inputGroup}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Provide instructions for learners taking this assessment..."
                  value={instructions}
                  onChangeText={setInstructions}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveBtnText}>{isEditing ? 'Save Changes' : 'Create Assessment'}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AssessmentsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingTop: 50,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  headerCreateBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 4,
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
  courseCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  courseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 12,
  },
  courseCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  courseCardCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  addAssessmentMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  addAssessmentMiniBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
    marginLeft: 4,
  },
  quizList: {
    gap: 12,
  },
  quizItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  quizTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  requirementBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  requirementBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scoreBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scoreBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 6,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quizLinkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 6,
  },
  quizLinkText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '500',
    flex: 1,
  },
  quizInstructions: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  noQuizzesBox: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noQuizzesText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 10,
  },
  createFirstBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  createFirstBtnText: {
    color: '#4F46E5',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 14,
  },
  emptySub: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginHorizontal: 30,
    marginTop: 6,
    marginBottom: 18,
  },
  createCourseBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  createCourseBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    padding: 22,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 20,
  },
  courseSelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  courseChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  courseChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  courseChipText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  courseChipTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  helperText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    height: 85,
  },
  sectionHeader: {
    marginTop: 10,
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  switchSublabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 35,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
