import React, { useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, ScrollView, SafeAreaView,
  StatusBar, TouchableOpacity, TextInput, ActivityIndicator,
  Alert, FlatList,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { certificateApi, recommendationApi } from '../../api/skill-sharer.service';
import { courseApi } from '../../api/skill-sharer.service';

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
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [learnerDropdownOpen, setLearnerDropdownOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [editingRec, setEditingRec] = useState<any | null>(null);

  useFocusEffect(useCallback(() => {
    loadMyCourses();
    loadHistory();
  }, []));

  const loadMyCourses = async () => {
    try {
      setLoadingCourses(true);
      const res: any = await courseApi.getMyCourses();
      const courses =
        res?.data?.data ??
        res?.data?.courses ??
        res?.courses ??
        (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
      setMyCourses(Array.isArray(courses) ? courses : []);
    } catch (err) {
      console.log('Failed to load courses', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const res: any = await recommendationApi.getCreated();
      const recommendations =
        res?.data?.data ??
        res?.data?.recommendations ??
        res?.recommendations ??
        (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
      setHistory(Array.isArray(recommendations) ? recommendations : []);
    } catch (err) {
      console.log('Failed to load recommendation history', err);
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadCourseLearners = async (courseId: string) => {
    try {
      setLoadingLearners(true);
      setCompletedLearners([]);
      const res: any = await recommendationApi.getMyCourseLearners(courseId);
      const learners =
        res?.data?.data ??
        res?.data?.learners ??
        res?.learners ??
        (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
      if (Array.isArray(learners) && learners.length > 0) {
        setCompletedLearners(learners);
      } else {
        // Fallback to completion requests
        const reqRes: any = await certificateApi.getCourseCompletionRequests(courseId);
        const requests = reqRes?.data || reqRes?.requests || [];
        setCompletedLearners(requests);
      }
    } catch (err) {
      console.log('Failed to load learners', err);
      try {
        const reqRes: any = await certificateApi.getCourseCompletionRequests(courseId);
        const requests = reqRes?.data || reqRes?.requests || [];
        setCompletedLearners(requests);
      } catch (e) {
        console.log('Fallback failed too', e);
      }
    } finally {
      setLoadingLearners(false);
    }
  };

  const handleSelectCourse = (course: any) => {
    setSelectedCourse(course);
    setSelectedLearner(null);
    setCourseDropdownOpen(false);
    setLearnerDropdownOpen(false);
    loadCourseLearners(course.id);
  };

  const handleSelectLearner = (item: any) => {
    const learner = item.learner || item;
    const learnerId = item.learnerId || learner.id || item.id;
    setSelectedLearner({ ...item, learnerId, learner });
    setLearnerDropdownOpen(false);
  };

  const handleSubmit = async () => {
    if (!selectedLearner) {
      Toast.show({ type: 'error', text1: 'Select a Learner', text2: 'Please select a learner to recommend.' });
      return;
    }
    if (!title.trim()) {
      Toast.show({ type: 'error', text1: 'Title Required', text2: 'Please provide a short title for the recommendation.' });
      return;
    }
    if (!content.trim() || content.trim().length < 5) {
      Toast.show({ type: 'error', text1: 'Content Required', text2: 'Please write at least 5 characters for the recommendation.' });
      return;
    }
    try {
      setSubmitting(true);
      const learnerId = selectedLearner.learnerId || selectedLearner.learner?.id || selectedLearner.id;
      const data = {
        learnerId,
        courseId: selectedCourse.id,
        title: title.trim(),
        content: content.trim(),
        message: content.trim(),
        skillDemonstrated: title.trim(),
        isPublic,
      };
      if (editingRec) {
        await recommendationApi.update(editingRec.id, { title: data.title, content: data.content, message: data.message, isPublic } as any);
        Toast.show({ type: 'success', text1: 'Updated!', text2: 'Recommendation updated successfully.' });
      } else {
        await recommendationApi.create(data);
        Toast.show({ type: 'success', text1: 'Sent!', text2: `Your recommendation for ${selectedLearner.learner?.name || 'the learner'} has been submitted.` });
      }
      setTitle('');
      setContent('');
      setSelectedLearner(null);
      setEditingRec(null);
      await loadHistory();
      setShowForm(false);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.error || err?.message || 'Failed to submit recommendation.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Recommendation', 'Are you sure you want to delete this recommendation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await recommendationApi.delete(id);
            setHistory(prev => prev.filter(r => r.id !== id));
            Toast.show({ type: 'success', text1: 'Deleted', text2: 'Recommendation deleted.' });
          } catch (err: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: err?.error || 'Failed to delete.' });
          }
        }
      }
    ]);
  };

  const handleEdit = (recommendation: any) => {
    const course = myCourses.find((item) => item.id === recommendation.course?.id) || recommendation.course;
    const learner = recommendation.learner || {};

    setEditingRec(recommendation);
    setSelectedCourse(course);
    setSelectedLearner({ learnerId: learner.id, learner });
    setTitle(recommendation.title || recommendation.skillDemonstrated || '');
    setContent(recommendation.content || recommendation.message || '');
    setIsPublic(recommendation.isPublic !== false);
    setShowForm(true);
  };

  const handleCreateNew = () => {
    setEditingRec(null);
    setSelectedCourse(null);
    setSelectedLearner(null);
    setCourseDropdownOpen(false);
    setLearnerDropdownOpen(false);
    setTitle('');
    setContent('');
    setIsPublic(true);
    setShowForm(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#B3310D" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Learner Recommendations</Text>
          <Text style={styles.headerSub}>Recognize outstanding learners</Text>
        </View>
      </View>

      {!showForm && (
        <TouchableOpacity style={styles.createButton} onPress={handleCreateNew}>
          <Ionicons name="add-circle-outline" size={19} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Create New Recommendation</Text>
        </TouchableOpacity>
      )}

      <ScrollView contentContainerStyle={[styles.content, { flexGrow: 1 }]}>
        {showForm ? (
          <>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            Recommendations help learners showcase their skills to future employers. Only learners who have completed your course are eligible.
          </Text>
        </View>

        {/* Step 1: Select Course */}
        <View style={styles.card}>
          <Text style={styles.stepLabel}>Step 1: Select a Course</Text>
          {loadingCourses ? (
            <ActivityIndicator color="#B3310D" />
          ) : myCourses.length === 0 ? (
            <Text style={styles.noDataText}>No courses found for your account.</Text>
          ) : (
            <View>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => {
                  setCourseDropdownOpen((current) => !current);
                  setLearnerDropdownOpen(false);
                }}
              >
                <View style={styles.dropdownButtonContent}>
                  <Ionicons name="book-outline" size={18} color="#B3310D" />
                  <Text style={selectedCourse ? styles.dropdownValue : styles.dropdownPlaceholder} numberOfLines={1}>
                    {selectedCourse?.title || 'Select a course'}
                  </Text>
                </View>
                <Ionicons name={courseDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7280" />
              </TouchableOpacity>
              {courseDropdownOpen && (
                <View style={styles.dropdownMenu}>
                  {myCourses.map((course: any) => (
                    <TouchableOpacity
                      key={course.id}
                      style={styles.dropdownOption}
                      onPress={() => handleSelectCourse(course)}
                    >
                      <View style={styles.dropdownOptionText}>
                        <Text style={styles.dropdownOptionTitle}>{course.title}</Text>
                        <Text style={styles.dropdownOptionMeta}>{course.status || 'Course'}</Text>
                      </View>
                      {selectedCourse?.id === course.id && (
                        <Ionicons name="checkmark-circle" size={19} color="#B3310D" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Step 2: Select Learner */}
        {selectedCourse && (
          <View style={styles.card}>
            <Text style={styles.stepLabel}>Step 2: Select Learner</Text>
            <Text style={styles.stepSub}>Learners enrolled in "{selectedCourse.title}" are shown.</Text>
            {loadingLearners ? (
              <ActivityIndicator color="#B3310D" style={{ marginTop: 8 }} />
            ) : completedLearners.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="people-outline" size={32} color="#D1D5DB" />
                <Text style={styles.noDataText}>No enrolled learners found for this course.</Text>
              </View>
            ) : (
              <View>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => {
                    setLearnerDropdownOpen((current) => !current);
                    setCourseDropdownOpen(false);
                  }}
                >
                  <View style={styles.dropdownButtonContent}>
                    <Ionicons name="person-outline" size={18} color="#B3310D" />
                    <Text style={selectedLearner ? styles.dropdownValue : styles.dropdownPlaceholder} numberOfLines={1}>
                      {selectedLearner?.learner?.name || 'Select an enrolled learner'}
                    </Text>
                  </View>
                  <Ionicons name={learnerDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7280" />
                </TouchableOpacity>
                {learnerDropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    {completedLearners.map((item: any) => {
                      const learner = item.learner || item;
                      const itemLearnerId = item.learnerId || learner.id || item.id;
                      const selectedId = selectedLearner?.learnerId || selectedLearner?.learner?.id;
                      const isSelected = selectedId === itemLearnerId;
                      const progress = item.progressPercentage;
                      return (
                    <TouchableOpacity
                      key={item.id || itemLearnerId}
                      style={styles.dropdownOption}
                      onPress={() => handleSelectLearner(item)}
                    >
                      <View style={styles.dropdownOptionText}>
                        <Text style={styles.dropdownOptionTitle}>{learner?.name || 'Learner'}</Text>
                        <Text style={styles.dropdownOptionMeta}>
                          {learner?.email || 'Enrolled'}{progress != null ? ` · ${Math.round(progress)}% progress` : ''}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color="#B3310D" />
                      )}
                    </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Step 3: Write Recommendation */}
        {selectedLearner && (
          <View style={styles.card}>
            <Text style={styles.stepLabel}>Step 3: Write Recommendation</Text>
            <Text style={styles.stepSub}>
              Writing for: <Text style={{ fontWeight: '700', color: '#B3310D' }}>{selectedLearner.learner?.name || 'Learner'}</Text>
            </Text>

            <TextInput
              style={styles.titleInput}
              placeholder='e.g. "Exceptional dedication and skill"'
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
            <Text style={styles.charCount}>{title.length}/100</Text>

            <TextInput
              style={styles.contentInput}
              placeholder="Share what made this learner stand out. Be specific about their achievements, attitude, and skills demonstrated throughout the course..."
              placeholderTextColor="#9CA3AF"
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{content.length} characters (min 20)</Text>

            {Boolean(title.trim() && content.trim()) && (
              <View style={styles.previewCard}>
                <Text style={styles.previewLabel}>Preview</Text>
                <View style={styles.previewInner}>
                  <Text style={styles.previewTitle}>{title}</Text>
                  <Text style={styles.previewContent}>"{content}"</Text>
                  <View style={styles.previewFooter}>
                    <View style={styles.previewAvatar}>
                      <Text style={styles.previewAvatarText}>Y</Text>
                    </View>
                    <Text style={styles.previewAuthor}>You · {selectedCourse?.title || 'Course'}</Text>
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.toggleRow} onPress={() => setIsPublic(prev => !prev)}>
              <View style={[styles.toggle, isPublic && styles.toggleOn]}>
                <View style={[styles.toggleThumb, isPublic && styles.toggleThumbOn]} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.toggleLabel}>Make Public</Text>
                <Text style={styles.toggleSub}>
                  {isPublic
                    ? 'This recommendation will be visible to potential employers.'
                    : 'This recommendation will only be visible to the learner.'}
                </Text>
              </View>
              <Ionicons name={isPublic ? 'globe-outline' : 'lock-closed-outline'} size={20} color={isPublic ? '#059669' : '#9CA3AF'} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="ribbon-outline" size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>
                    {editingRec ? 'Update Recommendation' : 'Send Recommendation'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
          </>
        ) : (
          <View style={styles.historySection}>
            {loadingHistory ? (
              <View style={styles.historyLoading}>
                <ActivityIndicator color="#B3310D" />
                <Text style={styles.noDataText}>Loading created recommendations...</Text>
              </View>
            ) : history.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="ribbon-outline" size={42} color="#D1D5DB" />
                <Text style={styles.emptyHistoryTitle}>No recommendations created yet</Text>
                <Text style={styles.noDataText}>Your saved recommendations will appear here.</Text>
              </View>
            ) : (
              history.map((recommendation: any) => {
                const learnerName = recommendation.learner?.name || 'Learner';
                const courseName = recommendation.course?.title || 'Course';
                const date = recommendation.updatedAt || recommendation.createdAt;

                return (
                  <View key={recommendation.id} style={styles.historyCard}>
                    <View style={styles.historyCardHeader}>
                      <View style={styles.historyIcon}>
                        <Ionicons name="ribbon-outline" size={19} color="#B3310D" />
                      </View>
                      <View style={styles.historyTitleWrap}>
                        <Text style={styles.historyTitle}>{recommendation.title || 'Recommendation'}</Text>
                        <Text style={styles.historyMeta}>{learnerName} · {courseName}</Text>
                      </View>
                      <View style={recommendation.isPublic !== false ? styles.publicBadge : styles.privateBadge}>
                        <Text style={recommendation.isPublic !== false ? styles.publicText : styles.privateText}>
                          {recommendation.isPublic !== false ? 'Public' : 'Private'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.historyContent} numberOfLines={4}>
                      {recommendation.content || recommendation.message || 'No content provided.'}
                    </Text>
                    <View style={styles.historyFooter}>
                      <Text style={styles.historyDate}>
                        {date ? new Date(date).toLocaleDateString() : ''}
                      </Text>
                      <View style={styles.historyActions}>
                        <TouchableOpacity style={styles.historyAction} onPress={() => handleEdit(recommendation)}>
                          <Ionicons name="create-outline" size={16} color="#B3310D" />
                          <Text style={styles.historyActionText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.historyAction} onPress={() => handleDelete(recommendation.id)}>
                          <Ionicons name="trash-outline" size={16} color="#B91C1C" />
                          <Text style={styles.deleteActionText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F7' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#B3310D', paddingHorizontal: 16, paddingVertical: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: '#FFE5DE', marginTop: 2 },

  createButton: {
    marginHorizontal: 16, marginTop: 14, backgroundColor: '#B3310D',
    borderRadius: 12, paddingVertical: 13, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  createButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  content: { padding: 16, gap: 16, paddingBottom: 40 },

  historySection: { gap: 12 },
  historyLoading: { alignItems: 'center', paddingVertical: 30, gap: 10 },
  historyCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#F1C6B9',
    shadowColor: '#8B3F2B', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  historyCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  historyIcon: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFF0EC',
    alignItems: 'center', justifyContent: 'center',
  },
  historyTitleWrap: { flex: 1 },
  historyTitle: { fontSize: 15, fontWeight: '700', color: '#1D1412' },
  historyMeta: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  publicBadge: { backgroundColor: '#D1FAE5', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4 },
  privateBadge: { backgroundColor: '#F3F4F6', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4 },
  publicText: { fontSize: 10, fontWeight: '700', color: '#047857' },
  privateText: { fontSize: 10, fontWeight: '700', color: '#6B7280' },
  historyContent: { fontSize: 14, lineHeight: 21, color: '#374151', marginTop: 14 },
  historyFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: '#F3F4F6', marginTop: 14, paddingTop: 12,
  },
  historyDate: { fontSize: 11, color: '#9CA3AF' },
  historyActions: { flexDirection: 'row', gap: 14 },
  historyAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  historyActionText: { fontSize: 12, fontWeight: '700', color: '#B3310D' },
  deleteActionText: { fontSize: 12, fontWeight: '700', color: '#B91C1C' },
  emptyHistoryTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 8 },

  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#FFF0EC', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#F1C6B9',
  },
  infoText: { flex: 1, fontSize: 13, color: '#5D2B1E', lineHeight: 19 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  stepLabel: { fontSize: 15, fontWeight: '700', color: '#1D1412', marginBottom: 4 },
  stepSub: { fontSize: 12, color: '#6B7280', marginBottom: 12 },

  dropdownButton: {
    minHeight: 50, borderWidth: 1.5, borderColor: '#D1D5DB', borderRadius: 11,
    backgroundColor: '#FFFFFF', paddingHorizontal: 13, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between', marginTop: 8,
  },
  dropdownButtonContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  dropdownValue: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1D1412' },
  dropdownPlaceholder: { flex: 1, fontSize: 14, color: '#9CA3AF' },
  dropdownMenu: {
    marginTop: 6, borderWidth: 1, borderColor: '#F1C6B9', borderRadius: 11,
    backgroundColor: '#FFFFFF', overflow: 'hidden',
  },
  dropdownOption: {
    minHeight: 56, paddingHorizontal: 13, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownOptionText: { flex: 1 },
  dropdownOptionTitle: { fontSize: 14, fontWeight: '600', color: '#1D1412' },
  dropdownOptionMeta: { fontSize: 11, color: '#6B7280', marginTop: 3 },

  courseChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#B3310D',
    backgroundColor: '#FFF0EC',
  },
  courseChipActive: { backgroundColor: '#B3310D' },
  courseChipText: { fontSize: 13, fontWeight: '600', color: '#B3310D' },
  courseChipTextActive: { color: '#fff' },

  learnerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#F1C6B9',
    backgroundColor: '#FFF9F7',
  },
  learnerRowActive: { borderColor: '#B3310D', backgroundColor: '#FFF0EC' },
  learnerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FFE5DE', alignItems: 'center', justifyContent: 'center',
  },
  learnerAvatarText: { fontSize: 16, fontWeight: '700', color: '#B3310D' },
  learnerName: { fontSize: 14, fontWeight: '600', color: '#1D1412' },
  learnerEmail: { fontSize: 12, color: '#6B7280', marginTop: 1 },

  titleInput: {
    borderWidth: 1.5, borderColor: '#F1C6B9', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#1D1412',
    marginBottom: 2, marginTop: 12,
  },
  contentInput: {
    borderWidth: 1.5, borderColor: '#F1C6B9', borderRadius: 10,
    padding: 14, fontSize: 14, color: '#1D1412',
    minHeight: 130, marginBottom: 2, marginTop: 12,
  },
  charCount: { fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginBottom: 12 },

  previewCard: {
    borderRadius: 12, overflow: 'hidden', marginBottom: 16,
    borderWidth: 1, borderColor: '#F1C6B9',
  },
  previewLabel: {
    backgroundColor: '#FFF0EC', paddingHorizontal: 12, paddingVertical: 6,
    fontSize: 11, fontWeight: '700', color: '#B3310D',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  previewInner: { padding: 14, backgroundColor: '#fff', borderLeftWidth: 4, borderLeftColor: '#B3310D' },
  previewTitle: { fontSize: 14, fontWeight: '700', color: '#1D1412', marginBottom: 6 },
  previewContent: { fontSize: 13, color: '#374151', fontStyle: 'italic', lineHeight: 20, marginBottom: 12 },
  previewFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#B3310D', alignItems: 'center', justifyContent: 'center',
  },
  previewAvatarText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  previewAuthor: { fontSize: 12, color: '#6B7280' },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF9F7', borderRadius: 12,
    padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: '#F1C6B9',
  },
  toggle: {
    width: 44, height: 24, borderRadius: 12,
    backgroundColor: '#F1C6B9', padding: 2,
  },
  toggleOn: { backgroundColor: '#059669' },
  toggleThumb: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#fff',
  },
  toggleThumbOn: { transform: [{ translateX: 20 }] },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: '#1D1412' },
  toggleSub: { fontSize: 11, color: '#6B7280', marginTop: 2 },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#B3310D', paddingVertical: 14, borderRadius: 12,
  },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  noDataText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 8 },
  emptyBox: { alignItems: 'center', gap: 6, paddingVertical: 16 },
});
