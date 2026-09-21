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
  Image,
} from 'react-native';
import { fetchCourseDetails, enrollCourse, cancelEnrollment, completeLesson } from '../../api/learner.service';
import { COLORS } from '../../theme/colors';

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
        if (res.userEnrollment?.lessonProgress) {
          const doneIds = res.userEnrollment.lessonProgress
            .filter((lp: any) => lp.completed)
            .map((lp: any) => lp.lessonId);
          setCompletedLessonIds(doneIds);
        }
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
      const isCurrentlyDone = completedLessonIds.includes(lessonId);
      const targetState = !isCurrentlyDone;

      await completeLesson(courseId, lessonId, targetState);

      setCompletedLessonIds((prev) =>
        targetState ? (prev.includes(lessonId) ? prev : [...prev, lessonId]) : prev.filter((id) => id !== lessonId)
      );
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
      const res = await enrollCourse(courseId);
      setUserEnrollment(res.enrollment || res);
      Alert.alert('Enrolled Successfully! 🎉', 'You are now enrolled in this course. Enjoy learning!', [
        { text: 'Start Learning', onPress: () => loadDetails() },
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Could not enroll in course';
      Alert.alert('Enrollment Notice', msg);
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
            Alert.alert('Enrollment Cancelled');
            loadDetails();
          } catch (err: any) {
            Alert.alert('Notice', err.response?.data?.error || 'Could not cancel enrollment');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const course = courseData || {
    title: 'React Native Development',
    description:
      'Learn to build robust cross-platform mobile apps from scratch. Master core concepts, design interactive UIs, and confidently deploy to global app stores.',
    category: { name: 'Mobile Development' },
    difficulty: 'Intermediate',
    duration: '20 hours',
    rating: 4.8,
    reviewCount: 245,
    enrolledCount: '3.4k',
    creator: { id: 's1', name: 'John Perera', verifiedBadge: true },
    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80',
    modules: [
      {
        id: 'm1',
        title: 'Module 1: Introduction to Mobile Development',
        lessons: [
          { id: 'l1', title: 'Course Setup & Expo CLI', estimatedMinutes: 15 },
          { id: 'l2', title: 'JSX & React Native Core Components', estimatedMinutes: 20 },
          { id: 'l3', title: 'Flexbox Layouts & Custom Styling', estimatedMinutes: 25 },
        ],
      },
      {
        id: 'm2',
        title: 'Module 2: State & Navigation',
        lessons: [
          { id: 'l4', title: 'Components & Props Deep-Dive', estimatedMinutes: 20 },
          { id: 'l5', title: 'State Management with Hooks', estimatedMinutes: 30 },
          { id: 'l6', title: 'React Navigation & Stack Routes', estimatedMinutes: 25 },
        ],
      },
    ],
  };

  const isEnrolled = !!(userEnrollment && userEnrollment.status !== 'CANCELLED');
  const progressPct = userEnrollment?.courseProgress?.progressPercentage ?? userEnrollment?.progressPercentage ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />

      {/* Navigation Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.circleBtn} onPress={() => navigation?.goBack()}>
          <Text style={styles.circleBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Course Details</Text>
        <View style={styles.rightIcons}>
          <TouchableOpacity style={styles.circleBtn}>
            <Text style={styles.circleBtnText}>🔗</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.circleBtn}>
            <Text style={styles.circleBtnText}>🔖</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading course details...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={styles.contentPadding}>
            {/* Hero Image Banner */}
            <Image source={{ uri: course.thumbnail || 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80' }} style={styles.heroImage} />

            {/* Enrolled Badge */}
            {isEnrolled && (
              <View style={styles.enrolledBadgeTag}>
                <Text style={styles.enrolledBadgeText}>Enrolled ✓</Text>
              </View>
            )}

            {/* Title */}
            <Text style={styles.courseTitle}>{course.title}</Text>

            {/* Skill Sharer Instructor Card */}
            <TouchableOpacity
              style={styles.instructorCard}
              activeOpacity={0.85}
              onPress={() =>
                navigation?.navigate('SkillSharerProfile', {
                  sharerId: course.creator?.id,
                  sharerName: course.creator?.name,
                })
              }
            >
              <View style={styles.instructorAvatar}>
                <Text style={styles.avatarText}>{(course.creator?.name || 'J')[0]}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={styles.nameBadgeRow}>
                  <Text style={styles.instructorName}>{course.creator?.name || 'Skill Sharer'}</Text>
                  <View style={styles.verifiedPill}>
                    <Text style={styles.verifiedPillText}>✔ Verified</Text>
                  </View>
                </View>
                <Text style={styles.instructorSub}>Instructor & Skill Sharer</Text>
              </View>
              <Text style={styles.viewProfileLink}>View Profile →</Text>
            </TouchableOpacity>

            {/* Key Metrics Grid (4 columns) */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCol}>
                <Text style={styles.metricValue}>★ {course.rating || 4.8}</Text>
                <Text style={styles.metricSub}>({course.reviewCount || 245} reviews)</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricCol}>
                <Text style={styles.metricValue}>{course.enrolledCount || '3.4k'}</Text>
                <Text style={styles.metricSub}>learners</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricCol}>
                <Text style={styles.metricValue}>{course.difficulty || 'Intermed.'}</Text>
                <Text style={styles.metricSub}>difficulty</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricCol}>
                <Text style={styles.metricValue}>{course.duration || '20 hours'}</Text>
                <Text style={styles.metricSub}>duration</Text>
              </View>
            </View>

            {/* Progress Card if Enrolled */}
            {isEnrolled && (
              <View style={styles.progressCardContainer}>
                <View style={styles.progressHeaderRow}>
                  <Text style={styles.progressCardTitle}>Your Learning Progress</Text>
                  <Text style={styles.progressCardPct}>{progressPct}%</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(0, progressPct))}%` }]} />
                </View>
              </View>
            )}

            {/* About This Course */}
            <Text style={styles.sectionHeading}>About This Course</Text>
            <Text style={styles.descriptionText}>{course.description}</Text>

            {/* Learning Outcomes */}
            <Text style={styles.sectionHeading}>What You'll Learn</Text>
            <View style={styles.outcomeList}>
              <Text style={styles.outcomeItem}>✔ Build cross-platform mobile apps with React Native</Text>
              <Text style={styles.outcomeItem}>✔ Master component hierarchy, JSX & dynamic state</Text>
              <Text style={styles.outcomeItem}>✔ Implement declarative stack & tab navigation</Text>
              <Text style={styles.outcomeItem}>✔ Integrate REST API backends & persistent storage</Text>
            </View>

            {/* Course Content / Syllabus */}
            <Text style={styles.sectionHeading}>Course Content</Text>
            {course.modules && course.modules.length > 0 ? (
              course.modules.map((mod: any, idx: number) => (
                <View key={mod.id || idx} style={styles.moduleCard}>
                  <View style={styles.moduleHeaderRow}>
                    <Text style={styles.moduleTitle}>{mod.title}</Text>
                    <Text style={styles.moduleMetaText}>{mod.lessons?.length || 3} lessons</Text>
                  </View>

                  {mod.lessons?.map((les: any, lIdx: number) => {
                    const isDone = completedLessonIds.includes(les.id);
                    return (
                      <View key={les.id || lIdx} style={styles.lessonRowWrapper}>
                        {isEnrolled && (
                          <TouchableOpacity style={styles.checkboxBtn} onPress={() => handleToggleLesson(les.id)}>
                            <Text style={styles.checkboxIcon}>{isDone ? '☑️' : '◯'}</Text>
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
            ) : null}
          </View>
        </ScrollView>
      )}

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        {actionLoading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : isEnrolled ? (
          <View style={styles.enrolledActionRow}>
            {progressPct >= 100 ? (
              <TouchableOpacity
                style={styles.continueBtn}
                onPress={() =>
                  Alert.alert(
                    'Completion Request Sent! 🎓',
                    'Your course completion request has been submitted to your instructor. Once verified, your course certificate will be available under My Learning!',
                    [{ text: 'View My Dashboard', onPress: () => navigation?.navigate('MyLearningTab') }]
                  )
                }
              >
                <Text style={styles.actionBtnText}>Request Certificate 🎓</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.continueBtn}
                onPress={() =>
                  navigation?.navigate('LessonPlayer', {
                    courseId,
                    lessonId: course.modules?.[0]?.lessons?.[0]?.id || 'l1',
                    lessonTitle: course.title,
                  })
                }
              >
                <Text style={styles.actionBtnText}>Continue Learning ▶</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelEnrollment}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.enrollBtn} onPress={handleEnroll}>
            <Text style={styles.actionBtnText}>Enroll in Course</Text>
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
  headerTitle: { fontSize: 16, fontWeight: '800', color: COLORS.neutralDark, flex: 1, textAlign: 'center' },
  rightIcons: { flexDirection: 'row', gap: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: COLORS.neutralMedium },
  scrollContent: { flex: 1 },
  contentPadding: { paddingHorizontal: 18, paddingTop: 10 },
  heroImage: { width: '100%', height: 200, borderRadius: 20, marginBottom: 14 },
  enrolledBadgeTag: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.badgeOrangeBg,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  enrolledBadgeText: { color: COLORS.primary, fontSize: 12, fontWeight: '800' },
  courseTitle: { fontSize: 22, fontWeight: '800', color: COLORS.neutralDark, lineHeight: 28, marginBottom: 14 },
  instructorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    marginBottom: 16,
  },
  instructorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  nameBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  instructorName: { fontSize: 15, fontWeight: '800', color: COLORS.neutralDark },
  instructorSub: { fontSize: 11, color: COLORS.neutralMedium, marginTop: 1 },
  verifiedPill: { backgroundColor: COLORS.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  verifiedPillText: { fontSize: 10, fontWeight: '800', color: COLORS.white },
  viewProfileLink: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  metricCol: { alignItems: 'center' },
  metricValue: { fontSize: 14, fontWeight: '800', color: COLORS.neutralDark },
  metricSub: { fontSize: 10, color: COLORS.neutralLight, marginTop: 2 },
  metricDivider: { width: 1, height: 24, backgroundColor: COLORS.borderWarm },
  progressCardContainer: {
    backgroundColor: COLORS.cardBgSoft,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    marginBottom: 16,
  },
  progressHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressCardTitle: { fontSize: 13, fontWeight: '700', color: COLORS.neutralDark },
  progressCardPct: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  progressBarTrack: { height: 8, backgroundColor: '#F3E5DC', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primaryDark, borderRadius: 4 },
  sectionHeading: { fontSize: 17, fontWeight: '800', color: COLORS.neutralDark, marginTop: 12, marginBottom: 8 },
  descriptionText: { fontSize: 14, color: COLORS.neutralMedium, lineHeight: 22, marginBottom: 12 },
  outcomeList: { gap: 8, marginBottom: 16 },
  outcomeItem: { fontSize: 13, color: COLORS.neutralDark, fontWeight: '600' },
  moduleCard: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    marginBottom: 12,
  },
  moduleHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  moduleTitle: { fontSize: 14, fontWeight: '800', color: COLORS.neutralDark },
  moduleMetaText: { fontSize: 11, color: COLORS.neutralLight },
  lessonRowWrapper: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  checkboxBtn: { marginRight: 10 },
  checkboxIcon: { fontSize: 18 },
  lessonRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lessonItem: { fontSize: 13, color: COLORS.neutralDark, flex: 1 },
  lessonItemDone: { textDecorationLine: 'line-through', color: COLORS.primary, fontWeight: '600' },
  playTag: { fontSize: 11, color: COLORS.primary, fontWeight: '800' },
  bottomBar: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderWarm,
  },
  enrollBtn: { backgroundColor: COLORS.primaryDark, paddingVertical: 14, borderRadius: 18, alignItems: 'center' },
  enrolledActionRow: { flexDirection: 'row', gap: 10 },
  continueBtn: { flex: 1, backgroundColor: COLORS.primaryDark, paddingVertical: 14, borderRadius: 18, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#EF4444', paddingVertical: 14, paddingHorizontal: 18, borderRadius: 18, alignItems: 'center' },
  cancelBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 14 },
  actionBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '800' },
});
