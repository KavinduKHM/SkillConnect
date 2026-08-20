import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { fetchCourseDetails, enrollCourse, cancelEnrollment, completeLesson } from '../../api/learner.service';

export default function CourseDetailScreen({ route, navigation }: any) {
  const courseId = route.params?.courseId || 'c1';
  const initialCourseData = route.params?.course;

  const [courseData, setCourseData] = useState<any>(initialCourseData || null);
  const [userEnrollment, setUserEnrollment] = useState<any>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const res = await fetchCourseDetails(courseId);
      if (res?.course) {
        setCourseData(res.course);
        setUserEnrollment(res.userEnrollment);
      }
    } catch (err) {
      console.log('Error loading course details from API, using fallback data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [courseId]);

  const handleToggleLesson = async (lessonId: string) => {
    try {
      setActionLoading(true);
      const res = await completeLesson(courseId, lessonId);
      if (completedLessonIds.includes(lessonId)) {
        setCompletedLessonIds(completedLessonIds.filter((id) => id !== lessonId));
      } else {
        setCompletedLessonIds([...completedLessonIds, lessonId]);
      }
      loadDetails();
    } catch (err: any) {
      Alert.alert('Notice', err.response?.data?.error || err.message || 'Updated lesson progress');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      setActionLoading(true);
      await enrollCourse(courseId);
      Alert.alert('Enrolled Successfully! 🎉', 'You are now enrolled in this course.', [
        { text: 'Go to My Learning', onPress: () => navigation?.navigate('MyLearning') },
        { text: 'OK', onPress: () => loadDetails() },
      ]);
    } catch (error: any) {
      const errMsg = error.response?.data?.error || error.message || 'Could not enroll';
      Alert.alert('Enrollment Notice', errMsg, [
        { text: 'View My Learning', onPress: () => navigation?.navigate('MyLearning') },
        { text: 'OK' },
      ]);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelEnrollment = async () => {
    Alert.alert('Cancel Enrollment', 'Are you sure you want to cancel your enrollment?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            setActionLoading(true);
            await cancelEnrollment(courseId);
            setUserEnrollment(null);
            Alert.alert('Success', 'Enrollment cancelled');
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.error || 'Could not cancel enrollment');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const course = courseData || {
    title: 'React Native & Mobile App Development',
    description: 'Build cross-platform iOS & Android mobile apps with modern React Native and TypeScript.',
    category: { name: 'Software Engineering' },
    difficulty: 'BEGINNER',
    duration: '12 Hours',
    rating: 4.8,
    enrolledCount: 142,
    creator: { name: 'Senior Dev John', verifiedBadge: true },
    modules: [
      {
        id: 'm1',
        title: 'Module 1: Getting Started & Navigation',
        lessons: [
          { id: 'l1', title: 'Lesson 1.1: Project Setup & Environment', estimatedMinutes: 15 },
          { id: 'l2', title: 'Lesson 1.2: React Navigation & Stack Routing', estimatedMinutes: 25 },
        ],
      },
      {
        id: 'm2',
        title: 'Module 2: API Integration & Progress Tracking',
        lessons: [
          { id: 'l3', title: 'Lesson 2.1: Axios HTTP Client & Auth Headers', estimatedMinutes: 30 },
          { id: 'l4', title: 'Lesson 2.2: Marking Lessons Complete & Updating Progress', estimatedMinutes: 40 },
        ],
      },
    ],
  };

  const isEnrolled = !!userEnrollment && userEnrollment.status !== 'CANCELLED';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading course details...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Hero Banner */}
          <View style={styles.heroBanner}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.badgeCategory}>{course.category?.name || 'General'}</Text>
            <Text style={styles.heroTitle}>{course.title}</Text>
            <Text style={styles.heroRating}>
              ⭐ {course.rating || 4.8} • ⏱️ {course.duration || '10 Hours'} • 👥 {course.enrolledCount || 0} enrolled
            </Text>
          </View>

          {/* Content Body */}
          <View style={styles.bodyContent}>
            {/* Live Progress Bar for Enrolled Learner */}
            {isEnrolled && (
              <View style={styles.progressCardContainer}>
                <View style={styles.progressHeaderRow}>
                  <Text style={styles.progressCardTitle}>Your Learning Progress</Text>
                  <Text style={styles.progressCardPct}>{progressPct}%</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(0, progressPct))}%` }]} />
                </View>
                <Text style={styles.progressCardSubtext}>
                  {completedCount} / {totalCount} lessons completed
                </Text>
              </View>
            )}

            {/* Instructor Card */}
            <TouchableOpacity
              style={styles.instructorCard}
              activeOpacity={0.8}
              onPress={() =>
                navigation?.navigate('SkillSharerProfile', {
                  sharerId: course.creator?.id,
                  sharerName: course.creator?.name,
                })
              }
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.instructorRole}>Course Instructor</Text>
                <Text style={styles.instructorName}>{course.creator?.name || 'Instructor'}</Text>
                <Text style={styles.viewProfileHint}>Tap to view bio, skills & qualifications →</Text>
              </View>
              {course.creator?.verifiedBadge && (
                <View style={styles.verifiedBadgeContainer}>
                  <Text style={styles.verifiedBadge}>✓ Verified Skill Sharer</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Overview */}
            <Text style={styles.sectionHeading}>Course Overview</Text>
            <Text style={styles.descriptionText}>{course.description}</Text>

            {/* Learning Outcomes */}
            <Text style={styles.sectionHeading}>What You Will Learn</Text>
            <View style={styles.outcomeList}>
              <Text style={styles.outcomeItem}>✓ Build production-grade React Native mobile apps</Text>
              <Text style={styles.outcomeItem}>✓ Connect APIs & manage global application state</Text>
              <Text style={styles.outcomeItem}>✓ Implement authentication and JWT token security</Text>
              <Text style={styles.outcomeItem}>✓ Deploy to App Store & Google Play Store</Text>
            </View>

            {/* Course Modules (Syllabus) */}
            <Text style={styles.sectionHeading}>Course Modules & Lessons</Text>
            {course.modules && course.modules.length > 0 ? (
              course.modules.map((mod: any, idx: number) => (
                <View key={mod.id || idx} style={styles.moduleCard}>
                  <Text style={styles.moduleTitle}>{mod.title}</Text>
                  {mod.lessons?.map((les: any, lIdx: number) => {
                    const isDone = completedLessonIds.includes(les.id);
                    return (
                      <View key={les.id || lIdx} style={styles.lessonRowWrapper}>
                        {isEnrolled && (
                          <TouchableOpacity
                            style={styles.checkboxBtn}
                            onPress={() => handleToggleLesson(les.id)}
                          >
                            <Text style={styles.checkboxIcon}>{isDone ? '☑️' : '⬜'}</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={styles.lessonRow}
                          onPress={() => {
                            if (isEnrolled) {
                              navigation?.navigate('LessonPlayer', { courseId, lessonId: les.id, lessonTitle: les.title });
                            } else {
                              Alert.alert('Enrollment Required', 'Please enroll in the course to view lesson contents.');
                            }
                          }}
                        >
                          <Text style={[styles.lessonItem, isDone && styles.lessonItemDone]}>
                            {les.title} ({les.estimatedMinutes || 15} mins)
                          </Text>
                          {isEnrolled && <Text style={styles.playTag}>Play ▶</Text>}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              ))
            ) : (
              <View style={styles.moduleCard}>
                <Text style={styles.moduleTitle}>Module 1: Foundations</Text>
                <Text style={styles.lessonItem}>• Introduction & Course Setup (20 mins)</Text>
              </View>
            )}

            {/* Reviews Section */}
            {course.courseReviews && course.courseReviews.length > 0 && (
              <View>
                <Text style={styles.sectionHeading}>Learner Reviews</Text>
                {course.courseReviews.map((rev: any, rIdx: number) => (
                  <View key={rev.id || rIdx} style={styles.reviewCard}>
                    <Text style={styles.reviewAuthor}>{rev.learner?.name || 'Learner'} ⭐ {rev.rating}/5</Text>
                    <Text style={styles.reviewComment}>{rev.comment}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        {actionLoading ? (
          <ActivityIndicator color="#4F46E5" />
        ) : isEnrolled ? (
          <View style={styles.enrolledActionRow}>
            <TouchableOpacity style={styles.continueBtn} onPress={() => navigation?.navigate('MyLearning')}>
              <Text style={styles.actionBtnText}>Continue Learning →</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelEnrollment}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.enrollBtn} onPress={handleEnroll}>
            <Text style={styles.actionBtnText}>Enroll in Course Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#6B7280' },
  scrollContent: { flex: 1 },
  heroBanner: { backgroundColor: '#4F46E5', padding: 20, paddingTop: 10 },
  backBtn: { marginBottom: 12 },
  backBtnText: { color: '#EEF2FF', fontSize: 14, fontWeight: '600' },
  badgeCategory: {
    alignSelf: 'flex-start',
    backgroundColor: '#6366F1',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  heroTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  heroRating: { fontSize: 13, color: '#E0E7FF' },
  bodyContent: { padding: 20, gap: 16 },
  instructorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  instructorRole: { fontSize: 11, color: '#6B7280', textTransform: 'uppercase', fontWeight: '600' },
  instructorName: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginTop: 2 },
  viewProfileHint: { fontSize: 12, color: '#4F46E5', fontWeight: '600', marginTop: 4 },
  verifiedBadgeContainer: { justifyContent: 'center' },
  verifiedBadge: {
    backgroundColor: '#D1FAE5',
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sectionHeading: { fontSize: 17, fontWeight: 'bold', color: '#111827', marginTop: 8 },
  descriptionText: { fontSize: 14, color: '#4B5563', lineHeight: 22 },
  outcomeList: { gap: 8, backgroundColor: '#F0FDF4', padding: 14, borderRadius: 12 },
  outcomeItem: { fontSize: 13, color: '#166534', fontWeight: '500' },
  moduleCard: { backgroundColor: '#F9FAFB', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  moduleTitle: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  progressCardContainer: {
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressCardTitle: { fontSize: 15, fontWeight: 'bold', color: '#312E81' },
  progressCardPct: { fontSize: 16, fontWeight: 'bold', color: '#4F46E5' },
  progressBarTrack: {
    height: 10,
    backgroundColor: '#E0E7FF',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 5,
  },
  progressCardSubtext: { fontSize: 12, color: '#4338CA', fontWeight: '600' },
  lessonRowWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  checkboxBtn: { paddingRight: 8 },
  checkboxIcon: { fontSize: 18 },
  lessonRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lessonItem: { fontSize: 13, color: '#4B5563', flex: 1 },
  lessonItemDone: { textDecorationLine: 'line-through', color: '#059669', fontWeight: '600' },
  playTag: { fontSize: 12, color: '#4F46E5', fontWeight: '700' },
  reviewCard: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, marginTop: 8 },
  reviewAuthor: { fontSize: 13, fontWeight: '700', color: '#111827' },
  reviewComment: { fontSize: 13, color: '#4B5563', marginTop: 4 },
  bottomBar: { padding: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  enrollBtn: { backgroundColor: '#4F46E5', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  enrolledActionRow: { flexDirection: 'row', gap: 10 },
  continueBtn: { flex: 1, backgroundColor: '#059669', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#EF4444', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  actionBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
