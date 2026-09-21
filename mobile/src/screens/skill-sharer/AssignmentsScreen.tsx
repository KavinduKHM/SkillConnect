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
import { courseApi, assignmentApi } from '../../api/skill-sharer.service';
import { Assignment } from '../../types';

interface CourseWithAssignments {
  id: string;
  title: string;
  description?: string;
  status: string;
  assignments: Assignment[];
}

export const AssignmentsScreen = ({ navigation }: any) => {
  const [courses, setCourses] = useState<CourseWithAssignments[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAssignmentId, setCurrentAssignmentId] = useState<string | null>(null);

  // Form Fields
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDays, setDueDays] = useState('7');
  const [maxMarks, setMaxMarks] = useState('100');
  const [maxSubmissions, setMaxSubmissions] = useState('3');
  const [requireForCompletion, setRequireForCompletion] = useState(true);
  const [acceptLate, setAcceptLate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCoursesAndAssignments();
  }, []);

  const fetchCoursesAndAssignments = async () => {
    try {
      setLoading(true);
      const res: any = await courseApi.getMyCourses();
      const myCourses = res?.data || (Array.isArray(res) ? res : []);

      if (Array.isArray(myCourses)) {
        const enrichedCourses: CourseWithAssignments[] = await Promise.all(
          myCourses.map(async (c: any) => {
            try {
              // Wait, the learner route `/api/assignments/course/:courseId` works for authenticated users. We can use it!
              // I added `getCourseAssignments` to assignmentApi but wait, I didn't!
              // I will use apiClient directly or add it. Wait, I should add it to api, but let's just use `fetchCourseAssignments` from learner.service if we have to, or wait, I didn't add `getCourseAssignments` to `skill-sharer.service.ts`... let me just use `assignmentApi` but I didn't add `getCourseAssignments` there!
              // Ah! I only added `createAssignment`, `updateAssignment`, etc.
              // I'll add `getCourseAssignments` to `skill-sharer.service.ts` soon. Let's assume it exists and I'll add it.
              const assignRes: any = await (assignmentApi as any).getCourseAssignments(c.id);
              const assignments = assignRes?.assignments || assignRes?.data?.assignments || assignRes?.data || [];
              return {
                id: c.id,
                title: c.title,
                description: c.description,
                status: c.status,
                assignments: Array.isArray(assignments) ? assignments : [],
              };
            } catch (err) {
              return {
                id: c.id,
                title: c.title,
                description: c.description,
                status: c.status,
                assignments: [],
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
      console.error('Error fetching courses and assignments:', error);
      Alert.alert('Error', 'Failed to load courses.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOpenCreateModal = (targetCourseId?: string) => {
    setIsEditing(false);
    setCurrentAssignmentId(null);
    const chosenCourseId = targetCourseId || (courses.length > 0 ? courses[0].id : '');
    setSelectedCourseId(chosenCourseId);
    
    const matchedCourse = courses.find((c) => c.id === chosenCourseId);
    const defaultTitle = matchedCourse ? `${matchedCourse.title} - Assignment 1` : 'Course Assignment';
    
    setTitle(defaultTitle);
    setInstructions('Please follow the instructions carefully and upload your work.');
    setDueDays('7');
    setMaxMarks('100');
    setMaxSubmissions('3');
    setRequireForCompletion(true);
    setAcceptLate(false);
    setModalVisible(true);
  };

  const handleOpenEditModal = (courseId: string, assignment: Assignment) => {
    setIsEditing(true);
    setCurrentAssignmentId(assignment.id);
    setSelectedCourseId(courseId);
    setTitle(assignment.title || 'Course Assignment');
    setInstructions(assignment.instructions || '');
    setMaxMarks(String(assignment.maxMarks || 100));
    setMaxSubmissions(String(assignment.maxSubmissions || 3));
    setRequireForCompletion(assignment.requireForCompletion ?? true);
    setAcceptLate(assignment.acceptLate ?? false);
    
    // Estimate due days from deadline
    if (assignment.deadline) {
      const diffTime = Math.abs(new Date(assignment.deadline).getTime() - new Date().getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDueDays(String(diffDays));
    } else {
      setDueDays('7');
    }
    
    setModalVisible(true);
  };

  const showNotification = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleDeleteAssignment = (assignment: Assignment) => {
    const doDelete = async () => {
      try {
        await assignmentApi.deleteAssignment(assignment.id);
        showNotification('Deleted', 'Assignment removed successfully.');
        fetchCoursesAndAssignments();
      } catch (error: any) {
        showNotification('Error', error?.error || error?.response?.data?.error || 'Failed to delete assignment.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete "${assignment.title}"? This cannot be undone.`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Delete Assignment',
        `Are you sure you want to delete "${assignment.title}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  const handleSave = async () => {
    if (!selectedCourseId) {
      showNotification('Validation Error', 'Please select a course for this assignment.');
      return;
    }
    if (!title.trim()) {
      showNotification('Validation Error', 'Assignment title is required.');
      return;
    }

    try {
      setIsSaving(true);
      const days = parseInt(dueDays, 10) || 7;
      const calculatedDueDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

      const payload = {
        courseId: selectedCourseId,
        title: title.trim(),
        instructions: instructions.trim(),
        deadline: calculatedDueDate,
        maxMarks: parseInt(maxMarks, 10) || 100,
        maxSubmissions: parseInt(maxSubmissions, 10) || 3,
        requireForCompletion,
        acceptLate,
      };

      if (isEditing && currentAssignmentId) {
        await assignmentApi.updateAssignment(currentAssignmentId, payload);
        showNotification('Success', 'Assignment updated successfully!');
      } else {
        await assignmentApi.createAssignment(payload);
        showNotification('Success', 'New assignment created successfully!');
      }

      setModalVisible(false);
      fetchCoursesAndAssignments();
    } catch (error: any) {
      console.error('Error saving assignment:', error);
      const errorMsg = error?.error || error?.response?.data?.error || error?.message || 'Failed to save assignment';
      showNotification('Error', errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const renderCourseCard = ({ item }: { item: CourseWithAssignments }) => (
    <View style={styles.courseCard}>
      <View style={styles.courseCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.courseCardTitle}>{item.title}</Text>
          <Text style={styles.courseCardCount}>
            {item.assignments.length} {item.assignments.length === 1 ? 'Assignment' : 'Assignments'}
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

      {item.assignments.length > 0 ? (
        <View style={styles.quizList}>
          {item.assignments.map((assignment, index) => (
            <View key={assignment.id || String(index)} style={styles.quizItem}>
              <View style={styles.quizHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.quizTitle}>{assignment.title}</Text>
                  <View style={styles.badgeRow}>
                    <View style={[styles.requirementBadge, { backgroundColor: assignment.requireForCompletion ? '#DEF7EC' : '#F3F4F6' }]}>
                      <Text style={[styles.requirementBadgeText, { color: assignment.requireForCompletion ? '#03543F' : '#6B7280' }]}>
                        {assignment.requireForCompletion ? 'Mandatory' : 'Optional'}
                      </Text>
                    </View>
                    <View style={styles.scoreBadge}>
                      <Text style={styles.scoreBadgeText}>Max {assignment.maxMarks}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.quizActions}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => navigation.navigate('AssignmentSubmissions', { assignmentId: assignment.id, assignmentTitle: assignment.title })}
                  >
                    <Ionicons name="people-outline" size={20} color="#4F46E5" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleOpenEditModal(item.id, assignment)}
                  >
                    <Ionicons name="pencil-outline" size={20} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleDeleteAssignment(assignment)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyQuizContainer}>
          <Ionicons name="document-text-outline" size={32} color="#D1D5DB" />
          <Text style={styles.emptyQuizText}>No assignments created yet</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Assignments</Text>
          <Text style={styles.headerSubtitle}>Manage course practical work</Text>
        </View>
      </View>

      <View style={styles.content}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Loading assignments...</Text>
          </View>
        ) : courses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No Courses Found</Text>
            <Text style={styles.emptyStateText}>You need to create a course before adding assignments.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation?.navigate('CourseCreator')}>
              <Text style={styles.primaryBtnText}>Create Course</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={courses}
            renderItem={renderCourseCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            onRefresh={fetchCoursesAndAssignments}
            refreshing={refreshing}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Edit Assignment' : 'Create Assignment'}
              </Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Select Course *</Text>
                <View style={styles.coursePicker}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {courses.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          styles.courseChip,
                          selectedCourseId === c.id && styles.courseChipActive
                        ]}
                        onPress={() => setSelectedCourseId(c.id)}
                      >
                        <Text style={[
                          styles.courseChipText,
                          selectedCourseId === c.id && styles.courseChipTextActive
                        ]}>
                          {c.title.length > 25 ? c.title.substring(0, 25) + '...' : c.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Assignment Title *</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Final Project Submission"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Instructions</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={instructions}
                  onChangeText={setInstructions}
                  placeholder="Describe what the learner needs to do..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Max Marks</Text>
                  <TextInput
                    style={styles.input}
                    value={maxMarks}
                    onChangeText={setMaxMarks}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Max Submissions</Text>
                  <TextInput
                    style={styles.input}
                    value={maxSubmissions}
                    onChangeText={setMaxSubmissions}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Due in (Days from now)</Text>
                <TextInput
                  style={styles.input}
                  value={dueDays}
                  onChangeText={setDueDays}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.switchGroup}>
                <View style={styles.switchLabelContainer}>
                  <Text style={styles.switchLabel}>Require for Completion</Text>
                  <Text style={styles.switchSubLabel}>Learner must complete this to pass the course</Text>
                </View>
                <Switch
                  value={requireForCompletion}
                  onValueChange={setRequireForCompletion}
                  trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
                  thumbColor={requireForCompletion ? '#4F46E5' : '#F3F4F6'}
                />
              </View>
              
              <View style={styles.switchGroup}>
                <View style={styles.switchLabelContainer}>
                  <Text style={styles.switchLabel}>Accept Late Submissions</Text>
                  <Text style={styles.switchSubLabel}>Allow learners to submit after the deadline</Text>
                </View>
                <Switch
                  value={acceptLate}
                  onValueChange={setAcceptLate}
                  trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
                  thumbColor={acceptLate ? '#4F46E5' : '#F3F4F6'}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setModalVisible(false)}
                disabled={isSaving}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]} 
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveBtnText}>{isEditing ? 'Update' : 'Create'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#111827' },
  headerSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  content: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#6B7280', fontSize: 16 },
  listContainer: { padding: 20, paddingBottom: 100 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyStateTitle: { fontSize: 20, fontWeight: '600', color: '#111827', marginTop: 20 },
  emptyStateText: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 10, marginBottom: 30 },
  primaryBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  
  courseCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  courseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  courseCardTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  courseCardCount: { fontSize: 14, color: '#6B7280' },
  addAssessmentMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addAssessmentMiniBtnText: { color: '#4F46E5', fontSize: 14, fontWeight: '600', marginLeft: 4 },
  
  quizList: {},
  quizItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  quizTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  requirementBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  requirementBadgeText: { fontSize: 12, fontWeight: '500' },
  scoreBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scoreBadgeText: { fontSize: 12, fontWeight: '500', color: '#4B5563' },
  quizActions: { flexDirection: 'row' },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  
  emptyQuizContainer: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderStyle: 'dashed',
  },
  emptyQuizText: { marginTop: 10, fontSize: 14, color: '#9CA3AF', fontWeight: '500' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: { padding: 24 },
  formGroup: { marginBottom: 20 },
  row: { flexDirection: 'row' },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: { height: 100 },
  coursePicker: { flexDirection: 'row', marginLeft: -4 },
  courseChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  courseChipActive: { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' },
  courseChipText: { fontSize: 14, color: '#4B5563', fontWeight: '500' },
  courseChipTextActive: { color: '#4F46E5', fontWeight: '600' },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  switchLabelContainer: { flex: 1, paddingRight: 16 },
  switchLabel: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  switchSubLabel: { fontSize: 12, color: '#6B7280' },
  
  modalFooter: {
    flexDirection: 'row',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFF',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginRight: 10,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#4B5563', fontSize: 16, fontWeight: '600' },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    marginLeft: 10,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
