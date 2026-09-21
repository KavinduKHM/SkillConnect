import React, { useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, ScrollView, SafeAreaView,
  StatusBar, TouchableOpacity, TextInput, ActivityIndicator,
  Alert, FlatList,
} from 'react-native';
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
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'write' | 'history'>('write');
  const [history, setHistory] = useState<any[]>([]);
  const [editingRec, setEditingRec] = useState<any | null>(null);

  useFocusEffect(useCallback(() => {
    loadMyCourses();
  }, []));

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
      // Only show approved requests (completed learners with certificates)
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
    if (!selectedLearner) {
      Alert.alert('Select a Learner', 'Please select a learner to recommend.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please provide a short title for the recommendation.');
      return;
    }
    if (!content.trim() || content.trim().length < 20) {
      Alert.alert('Content Required', 'Please write at least 20 characters for the recommendation.');
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
        await recommendationApi.update(editingRec.id, { title: data.title, content: data.content, isPublic });
        Alert.alert('Updated!', 'Recommendation updated successfully.');
      } else {
        await recommendationApi.create(data);
        Alert.alert('Sent!', `Your recommendation for ${selectedLearner.learner?.name || 'the learner'} has been submitted.`);
      }
      setTitle('');
      setContent('');
      setSelectedLearner(null);
      setEditingRec(null);
    } catch (err: any) {
      Alert.alert('Error', err?.error || err?.message || 'Failed to submit recommendation.');
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
          } catch (err: any) {
            Alert.alert('Error', err?.error || 'Failed to delete.');
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />

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

      <ScrollView contentContainerStyle={styles.content}>
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
            <ActivityIndicator color="#4F46E5" />
          ) : myCourses.length === 0 ? (
            <Text style={styles.noDataText}>No published courses found.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
              {myCourses.map((course: any) => (
                <TouchableOpacity
                  key={course.id}
                  style={[styles.courseChip, selectedCourse?.id === course.id && styles.courseChipActive]}
                  onPress={() => handleSelectCourse(course)}
                >
                  <Ionicons
                    name="book-outline"
                    size={14}
                    color={selectedCourse?.id === course.id ? '#fff' : '#4F46E5'}
                  />
                  <Text style={[styles.courseChipText, selectedCourse?.id === course.id && styles.courseChipTextActive]}>
                    {course.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Step 2: Select Learner */}
        {selectedCourse && (
          <View style={styles.card}>
            <Text style={styles.stepLabel}>Step 2: Select Learner</Text>
            <Text style={styles.stepSub}>Only learners who completed "{selectedCourse.title}" are shown.</Text>
            {loadingLearners ? (
              <ActivityIndicator color="#4F46E5" style={{ marginTop: 8 }} />
            ) : completedLearners.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="people-outline" size={32} color="#D1D5DB" />
                <Text style={styles.noDataText}>No completed learners yet for this course.</Text>
              </View>
            ) : (
              <View style={{ gap: 8, marginTop: 8 }}>
                {completedLearners.map((req: any) => {
                  const learner = req.learner;
                  const isSelected = selectedLearner?.learnerId === req.learnerId;
                  return (
                    <TouchableOpacity
                      key={req.id}
                      style={[styles.learnerRow, isSelected && styles.learnerRowActive]}
                      onPress={() => setSelectedLearner(req)}
                    >
                      <View style={[styles.learnerAvatar, isSelected && { backgroundColor: '#4F46E5' }]}>
                        <Text style={[styles.learnerAvatarText, isSelected && { color: '#fff' }]}>
                          {(learner?.name || learner?.email || '?')[0].toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.learnerName, isSelected && { color: '#4F46E5' }]}>
                          {learner?.name || 'Learner'}
                        </Text>
                        <Text style={styles.learnerEmail}>{learner?.email || ''}</Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color="#4F46E5" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Step 3: Write Recommendation */}
        {selectedLearner && (
          <View style={styles.card}>
            <Text style={styles.stepLabel}>Step 3: Write Recommendation</Text>
            <Text style={styles.stepSub}>
              Writing for: <Text style={{ fontWeight: '700', color: '#4F46E5' }}>{selectedLearner.learner?.name || 'Learner'}</Text>
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
              placeholder='Share what made this learner stand out. Be specific about their achievements, attitude, and skills demonstrated throughout the course...'
              placeholderTextColor="#9CA3AF"
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{content.length} characters (min 20)</Text>

            {/* Preview Card */}
            {title.trim() && content.trim() && (
              <View style={styles.previewCard}>
                <Text style={styles.previewLabel}>Preview</Text>
                <View style={styles.previewInner}>
                  <Text style={styles.previewTitle}>{title}</Text>
                  <Text style={styles.previewContent}>"{content}"</Text>
                  <View style={styles.previewFooter}>
                    <View style={styles.previewAvatar}>
                      <Text style={styles.previewAvatarText}>Y</Text>
                    </View>
                    <Text style={styles.previewAuthor}>You · {selectedCourse?.title}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Public toggle */}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#4F46E5', paddingHorizontal: 16, paddingVertical: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: '#C7D2FE', marginTop: 2 },

  content: { padding: 16, gap: 16, paddingBottom: 40 },

  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  infoText: { flex: 1, fontSize: 13, color: '#1D4ED8', lineHeight: 19 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  stepLabel: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  stepSub: { fontSize: 12, color: '#6B7280', marginBottom: 12 },

  courseChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  courseChipActive: { backgroundColor: '#4F46E5' },
  courseChipText: { fontSize: 13, fontWeight: '600', color: '#4F46E5' },
  courseChipTextActive: { color: '#fff' },

  learnerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  learnerRowActive: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  learnerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center',
  },
  learnerAvatarText: { fontSize: 16, fontWeight: '700', color: '#4F46E5' },
  learnerName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  learnerEmail: { fontSize: 12, color: '#6B7280', marginTop: 1 },

  titleInput: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827',
    marginBottom: 2, marginTop: 12,
  },
  contentInput: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10,
    padding: 14, fontSize: 14, color: '#111827',
    minHeight: 130, marginBottom: 2, marginTop: 12,
  },
  charCount: { fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginBottom: 12 },

  previewCard: {
    borderRadius: 12, overflow: 'hidden', marginBottom: 16,
    borderWidth: 1, borderColor: '#E0E7FF',
  },
  previewLabel: {
    backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 6,
    fontSize: 11, fontWeight: '700', color: '#6366F1',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  previewInner: { padding: 14, backgroundColor: '#fff', borderLeftWidth: 4, borderLeftColor: '#4F46E5' },
  previewTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 6 },
  previewContent: { fontSize: 13, color: '#374151', fontStyle: 'italic', lineHeight: 20, marginBottom: 12 },
  previewFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center',
  },
  previewAvatarText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  previewAuthor: { fontSize: 12, color: '#6B7280' },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9FAFB', borderRadius: 12,
    padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  toggle: {
    width: 44, height: 24, borderRadius: 12,
    backgroundColor: '#E5E7EB', padding: 2,
  },
  toggleOn: { backgroundColor: '#059669' },
  toggleThumb: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#fff',
  },
  toggleThumbOn: { transform: [{ translateX: 20 }] },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
  toggleSub: { fontSize: 11, color: '#6B7280', marginTop: 2 },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#4F46E5', paddingVertical: 14, borderRadius: 12,
  },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  noDataText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 8 },
  emptyBox: { alignItems: 'center', gap: 6, paddingVertical: 16 },
});
