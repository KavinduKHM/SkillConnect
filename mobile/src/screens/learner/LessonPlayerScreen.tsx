import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { fetchLessonContent, completeLesson } from '../../api/learner.service';

export default function LessonPlayerScreen({ route, navigation }: any) {
  const courseId = route.params?.courseId;
  const lessonId = route.params?.lessonId;
  const initialTitle = route.params?.lessonTitle;

  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [completedMaterials, setCompletedMaterials] = useState<string[]>([]);

  const loadLesson = async () => {
    if (!lessonId) return;
    try {
      setLoading(true);
      const res = await fetchLessonContent(lessonId);
      if (res?.lesson) {
        setLesson(res.lesson);
      }
    } catch (err) {
      console.log('Error fetching lesson content, using fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  const toggleMaterialCheck = (matId: string) => {
    if (completedMaterials.includes(matId)) {
      setCompletedMaterials(completedMaterials.filter((id) => id !== matId));
    } else {
      setCompletedMaterials([...completedMaterials, matId]);
    }
  };

  const handleMarkComplete = async () => {
    try {
      setCompleting(true);
      const res = await completeLesson(courseId, lessonId);
      setCompleted(true);
      const pct = res.progress?.progressPercentage ?? res.progressPercentage ?? 100;
      Alert.alert(
        'Lesson Completed! 🎉',
        `Course completion progress is now ${pct}%.`,
        [{ text: 'Back to Course Details', onPress: () => navigation?.goBack() }, { text: 'OK' }]
      );
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Could not mark lesson complete';
      Alert.alert('Notice', msg);
    } finally {
      setCompleting(false);
    }
  };

  const currentLesson = lesson || {
    title: initialTitle || 'Lesson Content',
    description: 'Learn the core concepts and implementation patterns in this interactive lesson.',
    materials: [
      { id: 'm1', title: 'Video Lecture: Core Architecture', type: 'VIDEO', duration: 15 },
      { id: 'm2', title: 'Slide Deck & Reference Notes (PDF)', type: 'DOCUMENT' },
    ],
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          <Text style={styles.backBtnText}>← Back to Course</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{currentLesson.title}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading lesson content...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Main Video / Content Player Placeholder */}
          <View style={styles.playerContainer}>
            <Text style={styles.playerIcon}>▶️</Text>
            <Text style={styles.playerTitle}>Interactive Content Player</Text>
            <Text style={styles.playerSubtitle}>Video & Material Viewer Ready</Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lesson Details</Text>
            <Text style={styles.description}>
              {currentLesson.description || 'No detailed description provided for this lesson.'}
            </Text>
          </View>

          {/* Materials List with Interactive Checkbox Checklist */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Learning Materials & Interactive Checklist</Text>
            {currentLesson.materials && currentLesson.materials.length > 0 ? (
              currentLesson.materials.map((mat: any, idx: number) => {
                const matId = mat.id || `mat_${idx}`;
                const isChecked = completedMaterials.includes(matId);
                return (
                  <TouchableOpacity
                    key={matId}
                    style={[styles.materialItem, isChecked && styles.materialItemChecked]}
                    onPress={() => toggleMaterialCheck(matId)}
                  >
                    <Text style={styles.checkboxIcon}>{isChecked ? '☑️' : '⬜'}</Text>
                    <Text style={styles.materialTypeIcon}>
                      {mat.type === 'VIDEO' ? '🎥' : mat.type === 'SLIDES' || mat.type === 'SLIDE' ? '📊' : '📄'}
                    </Text>
                    <View style={styles.materialInfo}>
                      <Text style={[styles.materialTitle, isChecked && styles.materialTitleChecked]}>{mat.title}</Text>
                      <Text style={styles.materialType}>{mat.type} • Tap to mark as consumed</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={styles.noMaterials}>No extra material attachments for this lesson.</Text>
            )}
          </View>
        </ScrollView>
      )}

      {/* Footer Action Bar */}
      <View style={styles.footer}>
        {completing ? (
          <ActivityIndicator color="#4F46E5" />
        ) : completed ? (
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>Lesson Completed ✓</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.completeBtn} onPress={handleMarkComplete}>
            <Text style={styles.completeBtnText}>Mark Lesson as Completed ✓</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 16, backgroundColor: '#4F46E5' },
  backBtn: { marginBottom: 6 },
  backBtnText: { color: '#EEF2FF', fontSize: 13, fontWeight: '600' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#6B7280' },
  content: { flex: 1, padding: 16 },
  playerContainer: {
    height: 200,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  playerIcon: { fontSize: 44, marginBottom: 8 },
  playerTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  playerSubtitle: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  section: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  description: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    borderRadius: 8,
  },
  materialItemChecked: {
    backgroundColor: '#F0FDF4',
  },
  checkboxIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  materialTypeIcon: { fontSize: 24, marginRight: 12 },
  materialInfo: { flex: 1 },
  materialTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  materialTitleChecked: {
    textDecorationLine: 'line-through',
    color: '#059669',
  },
  materialType: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  noMaterials: { fontSize: 13, color: '#9CA3AF' },
  footer: { padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  completeBtn: { backgroundColor: '#059669', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  completeBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  completedBadge: { backgroundColor: '#D1FAE5', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  completedBadgeText: { color: '#059669', fontSize: 16, fontWeight: 'bold' },
});
