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
} from 'react-native';
import { fetchLessonContent, completeLesson } from '../../api/learner.service';
import { COLORS } from '../../theme/colors';

export default function LessonPlayerScreen({ route, navigation }: any) {
  const courseId = route.params?.courseId;
  const lessonId = route.params?.lessonId;
  const initialTitle = route.params?.lessonTitle || 'React Native Development';

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
    setCompletedMaterials((prev) =>
      prev.includes(matId) ? prev.filter((id) => id !== matId) : [...prev, matId]
    );
  };

  const handleMarkComplete = async () => {
    try {
      setCompleting(true);
      const res = await completeLesson(courseId, lessonId, true);
      setCompleted(true);
      const pct = res.progress?.progressPercentage ?? res.progressPercentage ?? 80;
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
    title: 'Lesson 5: State Management with React Hooks',
    moduleTitle: 'Module 2: State & Navigation',
    description: 'Learn how to manage application state using React hooks (`useState`, `useEffect`, `useReducer`) and context API effectively in cross-platform mobile apps.',
    resources: [
      { id: 'r1', title: 'Interactive Video Lecture', sub: 'MP4 • 1080p • 24MB', icon: '🎥', type: 'VIDEO' },
      { id: 'r2', title: 'State Management Architecture.pdf', sub: 'PDF Document • 2.4MB', icon: '📄', type: 'PDF' },
      { id: 'r3', title: 'Lecture Presentation Slides', sub: 'PPTX Slides • 4.1MB', icon: '📊', type: 'SLIDE' },
      { id: 'r4', title: 'React Native Docs — Hooks API', sub: 'External Web Link', icon: '🔗', type: 'EXTERNAL' },
    ],
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />

      {/* Navigation Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.circleBtn} onPress={() => navigation?.goBack()}>
          <Text style={styles.circleBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {initialTitle}
        </Text>
        <TouchableOpacity style={styles.circleBtn}>
          <Text style={styles.circleBtnText}>☰</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading lesson content...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Video Player Box Container */}
          <View style={styles.videoPlayerBox}>
            <View style={styles.playCircle}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
            <View style={styles.videoMetaBar}>
              <Text style={styles.videoTimeText}>12:45 / 15:00</Text>
              <Text style={styles.videoQualityText}>HD 1080p</Text>
            </View>
          </View>

          {/* Lesson Details */}
          <View style={styles.bodyContent}>
            <Text style={styles.moduleSubhead}>{currentLesson.moduleTitle || 'Module 2: Core Concepts'}</Text>
            <Text style={styles.lessonTitle}>{currentLesson.title}</Text>
            <Text style={styles.descriptionText}>{currentLesson.description}</Text>

            {/* Learning Resources */}
            <Text style={styles.sectionHeading}>Learning Materials & Resources</Text>
            {(currentLesson.resources || []).map((res: any, idx: number) => {
              const resId = res.id || `r_${idx}`;
              const isChecked = completedMaterials.includes(resId);
              return (
                <TouchableOpacity
                  key={resId}
                  style={[styles.resourceCard, isChecked && styles.resourceCardChecked]}
                  activeOpacity={0.8}
                  onPress={() => toggleMaterialCheck(resId)}
                >
                  <Text style={styles.resourceIcon}>{res.icon || '📄'}</Text>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.resourceTitle, isChecked && styles.resourceTitleChecked]}>
                      {res.title}
                    </Text>
                    <Text style={styles.resourceSub}>{res.sub || 'Document Resource'}</Text>
                  </View>
                  <Text style={styles.downloadIcon}>{isChecked ? '☑️' : '📥'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Footer Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.prevBtn} onPress={() => navigation?.goBack()}>
          <Text style={styles.prevBtnText}>← Previous</Text>
        </TouchableOpacity>

        {completing ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : completed ? (
          <View style={styles.completedTag}>
            <Text style={styles.completedTagText}>Lesson Completed ✓</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.completeBtn} onPress={handleMarkComplete}>
            <Text style={styles.completeBtnText}>Mark as Completed</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgWarm },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  circleBtnText: { fontSize: 16, color: COLORS.neutralDark },
  headerTitle: { fontSize: 15, fontWeight: '800', color: COLORS.neutralDark, flex: 1, textAlign: 'center', marginHorizontal: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: COLORS.neutralMedium },
  scrollContent: { flex: 1 },
  videoPlayerBox: {
    height: 220,
    backgroundColor: COLORS.neutralDark,
    borderRadius: 20,
    marginHorizontal: 18,
    marginTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  playCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  playIcon: { fontSize: 22, color: COLORS.white, marginLeft: 4 },
  videoMetaBar: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  videoTimeText: { color: COLORS.white, fontSize: 11, fontWeight: '600' },
  videoQualityText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  bodyContent: { paddingHorizontal: 18, paddingTop: 16 },
  moduleSubhead: { fontSize: 12, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
  lessonTitle: { fontSize: 20, fontWeight: '800', color: COLORS.neutralDark, marginBottom: 8 },
  descriptionText: { fontSize: 14, color: COLORS.neutralMedium, lineHeight: 22, marginBottom: 20 },
  sectionHeading: { fontSize: 17, fontWeight: '800', color: COLORS.neutralDark, marginBottom: 12 },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    marginBottom: 10,
  },
  resourceCardChecked: { backgroundColor: COLORS.badgeOrangeBg, borderColor: COLORS.primary },
  resourceIcon: { fontSize: 24 },
  resourceTitle: { fontSize: 14, fontWeight: '800', color: COLORS.neutralDark },
  resourceTitleChecked: { textDecorationLine: 'line-through', color: COLORS.primary },
  resourceSub: { fontSize: 11, color: COLORS.neutralLight, marginTop: 2 },
  downloadIcon: { fontSize: 18, color: COLORS.neutralMedium },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderWarm,
  },
  prevBtn: { paddingVertical: 12, paddingHorizontal: 16 },
  prevBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.neutralMedium },
  completeBtn: { backgroundColor: COLORS.primaryDark, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 16 },
  completeBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
  completedTag: { backgroundColor: COLORS.badgeOrangeBg, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 16 },
  completedTagText: { color: COLORS.primary, fontSize: 14, fontWeight: '800' },
});
