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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { courseApi, assignmentApi } from '../../api/skill-sharer.service';
import { Assignment } from '../../types';
import { COLORS } from '../../theme/colors';

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
        if (enrichedCourses[0]?.id && !selectedCourseId) {
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
    const chosenCourseId = targetCourseId || courses[0]?.id || '';
    setSelectedCourseId(chosenCourseId);

    const matchedCourse = courses.find((c) => c.id === chosenCourseId);
    const defaultTitle = matchedCourse ? `${matchedCourse.title} - Practical Assignment` : 'Practical Assignment';

    setTitle(defaultTitle);
    setInstructions('Please review the requirements, write clean code, and submit your project files or repository link before the deadline.');
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

  const totalAssignmentsCount = courses.reduce((acc, c) => acc + (c.assignments?.length || 0), 0);

  const renderCourseCard = ({ item }: { item: CourseWithAssignments }) => (
    <View style={styles.courseCard}>
      {/* Course Card Header */}
      <View style={styles.courseCardHeader}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <View style={styles.courseBadgeRow}>
            <View style={styles.coursePill}>
              <Text style={styles.coursePillText}>COURSE</Text>
            </View>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>
                {item.assignments.length} {item.assignments.length === 1 ? 'Assignment' : 'Assignments'}
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
          <Text style={styles.addMiniBtnText}>New Task</Text>
        </TouchableOpacity>
      </View>

      {/* Assignments List */}
      {item.assignments.length > 0 ? (
        <View style={styles.assignmentList}>
          {item.assignments.map((assignment, index) => {
            const daysLeft = assignment.deadline
              ? Math.ceil((new Date(assignment.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null;

            return (
              <View key={assignment.id || String(index)} style={styles.assignmentItem}>
                <View style={styles.itemTopRow}>
                  <View style={styles.iconBubble}>
                    <Text style={{ fontSize: 16 }}>💻</Text>
                  </View>

                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.assignmentTitle}>{assignment.title}</Text>
                    <View style={styles.badgeRow}>
                      <View
                        style={[
                          styles.requirementBadge,
                          {
                            backgroundColor: assignment.requireForCompletion ? COLORS.badgeGreenBg : COLORS.surfaceMuted,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.requirementBadgeText,
                            {
                              color: assignment.requireForCompletion ? COLORS.badgeGreenText : COLORS.neutralMedium,
                            },
                          ]}
                        >
                          {assignment.requireForCompletion ? '✓ Mandatory' : 'Optional Work'}
                        </Text>
                      </View>

                      <View style={styles.scoreBadge}>
                        <Text style={styles.scoreBadgeText}>Max {assignment.maxMarks} pts</Text>
                      </View>

                      {daysLeft !== null && (
                        <View style={styles.daysBadge}>
                          <Ionicons name="time-outline" size={11} color={COLORS.neutralMedium} style={{ marginRight: 3 }} />
                          <Text style={styles.daysBadgeText}>
                            {daysLeft > 0 ? `${daysLeft}d left` : 'Past due'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => handleOpenEditModal(item.id, assignment)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="pencil-outline" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.iconBtn, styles.deleteBtn]}
                      onPress={() => handleDeleteAssignment(assignment)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Instructions snippet */}
                {assignment.instructions ? (
                  <View style={styles.instructionsContainer}>
                    <Text style={styles.instructionsText} numberOfLines={2}>
                      "{assignment.instructions}"
                    </Text>
                  </View>
                ) : null}

                {/* Submissions Action Row */}
                <TouchableOpacity
                  style={styles.submissionsBarBtn}
                  onPress={() =>
                    navigation.navigate('AssignmentSubmissions', {
                      assignmentId: assignment.id,
                      assignmentTitle: assignment.title,
                    })
                  }
                  activeOpacity={0.85}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="people" size={15} color={COLORS.primaryDark} style={{ marginRight: 6 }} />
                    <Text style={styles.submissionsBarText}>Review Submissions & Grade</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.primaryDark} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.noAssignmentsBox}>
          <Text style={styles.noAssignmentsTitle}>No assignments created yet</Text>
          <Text style={styles.noAssignmentsText}>
            Add coding exercises, projects, or practical tasks for learners to submit.
          </Text>
          <TouchableOpacity
            style={styles.createFirstBtn}
            onPress={() => handleOpenCreateModal(item.id)}
            activeOpacity={0.85}
          >
            <Text style={styles.createFirstBtnText}>+ Create Assignment</Text>
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
          <Text style={styles.headerTitle}>Assignments</Text>
          <Text style={styles.headerSubtitle}>Course Practical Work & Grading</Text>
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

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryChip}>
          <Text style={styles.summaryChipIcon}>💼</Text>
          <Text style={styles.summaryChipText}>
            <Text style={{ fontWeight: '800', color: COLORS.neutralDark }}>{totalAssignmentsCount}</Text> Tasks Active
          </Text>
        </View>
        <View style={styles.summaryChip}>
          <Text style={styles.summaryChipIcon}>📝</Text>
          <Text style={styles.summaryChipText}>Peer & Mentor Grading</Text>
        </View>
      </View>

      {/* Main List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 12, color: COLORS.neutralMedium, fontWeight: '600', fontSize: 13 }}>
            Loading assignments...
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
            fetchCoursesAndAssignments();
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="briefcase-outline" size={36} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyStateTitle}>No Courses Found</Text>
              <Text style={styles.emptyStateText}>
                You need to create a course before adding practical assignments for learners.
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

      {/* Create / Edit Assignment Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Handle */}
            <View style={styles.modalHandle} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{isEditing ? 'Edit Assignment' : 'New Assignment'}</Text>
                <Text style={styles.modalSub}>Set deadlines, maximum marks, and submission rules</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={COLORS.neutralDark} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {/* Course Selector */}
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

              {/* Assignment Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Assignment Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Build a REST API with Authentication"
                  placeholderTextColor={COLORS.neutralLight}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              {/* Requirements & Criteria */}
              <View style={styles.sectionDivider}>
                <Text style={styles.sectionDividerText}>Grading & Deadline Rules</Text>
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Max Marks</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="100"
                    placeholderTextColor={COLORS.neutralLight}
                    value={maxMarks}
                    onChangeText={setMaxMarks}
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

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Max Submissions Allowed</Text>
                <TextInput
                  style={styles.input}
                  placeholder="3"
                  placeholderTextColor={COLORS.neutralLight}
                  value={maxSubmissions}
                  onChangeText={setMaxSubmissions}
                  keyboardType="numeric"
                />
              </View>

              {/* Switches */}
              <View style={styles.switchCard}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={styles.switchLabel}>Required for Course Completion</Text>
                  <Text style={styles.switchSublabel}>
                    Learners must submit this assignment to unlock their course certificate.
                  </Text>
                </View>
                <Switch
                  value={requireForCompletion}
                  onValueChange={setRequireForCompletion}
                  trackColor={{ false: COLORS.borderSubtle, true: '#FC9174' }}
                  thumbColor={requireForCompletion ? COLORS.primaryDark : COLORS.white}
                />
              </View>

              <View style={styles.switchCard}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={styles.switchLabel}>Accept Late Submissions</Text>
                  <Text style={styles.switchSublabel}>
                    Allow submissions after deadline with a late indicator tag.
                  </Text>
                </View>
                <Switch
                  value={acceptLate}
                  onValueChange={setAcceptLate}
                  trackColor={{ false: COLORS.borderSubtle, true: '#FC9174' }}
                  thumbColor={acceptLate ? COLORS.primaryDark : COLORS.white}
                />
              </View>

              {/* Instructions */}
              <View style={styles.sectionDivider}>
                <Text style={styles.sectionDividerText}>Assignment Instructions</Text>
              </View>

              <View style={styles.inputGroup}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Provide detailed instructions, repository links, deliverables, and rubric for learners..."
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
                    {isEditing ? 'Save Changes' : 'Publish Assignment →'}
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

export default AssignmentsScreen;

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

  // Summary Bar
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

  // Assignments List
  assignmentList: {
    gap: 12,
  },
  assignmentItem: {
    backgroundColor: COLORS.cardBgSoft,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconBubble: {
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
  assignmentTitle: {
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
  daysBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  daysBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.neutralMedium,
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

  instructionsContainer: {
    marginBottom: 10,
    paddingLeft: 2,
  },
  instructionsText: {
    fontSize: 12,
    color: COLORS.neutralMedium,
    lineHeight: 17,
  },

  // Submissions Link Bar Button
  submissionsBarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  submissionsBarText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },

  // No assignments
  noAssignmentsBox: {
    backgroundColor: COLORS.cardBgSoft,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  noAssignmentsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.neutralDark,
    marginBottom: 3,
  },
  noAssignmentsText: {
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

  // Empty Global
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
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.neutralDark,
    marginBottom: 6,
  },
  emptyStateText: {
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
