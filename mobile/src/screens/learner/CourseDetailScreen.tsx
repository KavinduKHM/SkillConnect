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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchCourseDetails, enrollCourse, cancelEnrollment, completeLesson } from '../../api/learner.service';

export default function CourseDetailScreen({ route, navigation }: any) {
  const courseId = route.params?.courseId || 'c1';
  const initialCourseData = route.params?.course;

  const [courseData, setCourseData] = useState<any>(initialCourseData || null);
  const [userEnrollment, setUserEnrollment] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const [res, userStr] = await Promise.all([
        fetchCourseDetails(courseId),
        AsyncStorage.getItem('user'),
      ]);
      if (userStr) {
        try { setCurrentUser(JSON.parse(userStr)); } catch (e) {}
      }
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

  const handleBack = () => {
    if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation?.navigate('CourseList');
    }
  };

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
      Alert.alert('Enrolled Successfully! 🎉', 'You are now enrolled. Enjoy learning!', [
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
    difficulty: 'Intermed.',
    duration: '20 hours',
    rating: 4.8,
    reviewCount: 245,
    enrolledCount: '3.4k',
    creator: { id: 's1', name: 'John Perera', verifiedBadge: true },
    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80',
    modules: [
      {
        id: 'm1',
        title: 'Module 1: Introduction',
        lessons: [
          { id: 'l1', title: 'Course Setup & Expo CLI', estimatedMinutes: 15 },
          { id: 'l2', title: 'JSX & React Native Components', estimatedMinutes: 15 },
          { id: 'l3', title: 'Flexbox Layouts & Styling', estimatedMinutes: 15 },
        ],
      },
      {
        id: 'm2',
        title: 'Module 2: Core Concepts',
        lessons: [
          { id: 'l4', title: 'Lesson 4: Components & Props', estimatedMinutes: 20 },
          { id: 'l5', title: 'Lesson 5: State Management', estimatedMinutes: 25 },
          { id: 'l6', title: 'Lesson 6: Navigation', estimatedMinutes: 20 },
        ],
      },
    ],
  };

  const isEnrolled = !!(userEnrollment && userEnrollment.status !== 'CANCELLED');
  const progressPct = userEnrollment?.courseProgress?.progressPercentage ?? userEnrollment?.progressPercentage ?? 0;
  const isOwner = currentUser && (
    currentUser.id === course.creatorId ||
    currentUser.id === course.creator?.id ||
    currentUser.role === 'SKILL_SHARER' ||
    currentUser.role === 'INSTRUCTOR'
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />

      {/* Navigation Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.circleBtn} onPress={handleBack}>
          <Text style={styles.circleBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.rightIcons}>
          <TouchableOpacity
            style={styles.reviewQuickBtn}
            onPress={() => {
              const isDone = userEnrollment?.status === 'COMPLETED' || (userEnrollment?.progressPercentage != null && userEnrollment.progressPercentage >= 100);
              navigation?.navigate('CourseReview', {
                courseId,
                courseTitle: course.title,
                hasCompleted: isDone,
              });
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#15803D' }}>⭐ Reviews</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#064E3B" />
          <Text style={styles.loadingText}>Loading course details...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 110 }}>
          <View style={styles.contentPadding}>
            {/* Hero Image Banner */}
            <Image
              source={{
                uri:
                  course.thumbnail ||
                  'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80',
              }}
              style={styles.heroImage}
            />

            {/* Enrolled Badge */}
            {isEnrolled && (
              <View style={styles.enrolledBadgeTag}>
                <Text style={styles.enrolledBadgeText}>Enrolled ✓</Text>
              </View>
            )}

            {/* Title */}
            <Text style={styles.courseTitle}>{course.title}</Text>

            {/* Instructor Card */}
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
                  <Text style={styles.instructorName}>{course.creator?.name || 'John Perera'}</Text>
                  {course.creator?.verifiedBadge && (
                    <View style={styles.verifiedPill}>
                      <Text style={styles.verifiedPillText}>✓ Verified</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={styles.viewProfileLink}>View Profile</Text>
            </TouchableOpacity>

            {/* Metrics Box (4 columns) */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCol}>
                <Text style={styles.metricValue}>⭐ {course.rating || 4.8}</Text>
                <Text style={styles.metricSub}>({course.reviewCount || course.courseReviews?.length || 0} reviews)</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricCol}>
                <Text style={styles.metricValue}>{course.enrolledCount || '0'}</Text>
                <Text style={styles.metricSub}>learners</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricCol}>
                <Text style={styles.metricValue}>{course.difficulty || 'All Levels'}</Text>
                <Text style={styles.metricSub}>difficulty</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricCol}>
                <Text style={styles.metricValue}>{course.duration || 'Flexible'}</Text>
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

            {/* What You'll Learn */}
            <Text style={styles.sectionHeading}>What You'll Learn</Text>
            <View style={styles.outcomeList}>
              <Text style={styles.outcomeItem}>✓ Build cross-platform mobile apps with modern tools</Text>
              <Text style={styles.outcomeItem}>✓ Master core components, styling & layout systems</Text>
              <Text style={styles.outcomeItem}>✓ Implement navigation, authentication & global state</Text>
              <Text style={styles.outcomeItem}>✓ Confidently build, test & deploy production features</Text>
            </View>

            {/* Course Content / Syllabus */}
            <Text style={styles.sectionHeading}>Course Content</Text>
            {course.modules && course.modules.length > 0 ? (
              course.modules.map((mod: any, idx: number) => (
                <View key={mod.id || idx} style={styles.moduleCard}>
                  <View style={styles.moduleHeaderRow}>
                    <Text style={styles.moduleTitle}>{mod.title}</Text>
                    <Text style={styles.moduleMetaText}>{mod.lessons?.length || 0} lessons</Text>
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
            ) : (
              <View style={styles.moduleCard}>
                <Text style={styles.moduleTitle}>Module 1: Introduction</Text>
                <Text style={styles.lessonItem}>• Course Overview & Fundamentals (20 mins)</Text>
              </View>
            )}

            {/* Public Reviews Section */}
            <View style={styles.reviewsSection}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={styles.sectionHeading}>Learner Reviews ⭐</Text>
                <TouchableOpacity
                  onPress={() => {
                    const isDone = userEnrollment?.status === 'COMPLETED' || (userEnrollment?.progressPercentage != null && userEnrollment.progressPercentage >= 100);
                    navigation?.navigate('CourseReview', {
                      courseId,
                      courseTitle: course.title,
                      hasCompleted: isDone,
                    });
                  }}
                >
                  <Text style={{ fontSize: 13, color: '#15803D', fontWeight: '700' }}>View All →</Text>
                </TouchableOpacity>
              </View>

              {course.courseReviews && course.courseReviews.length > 0 ? (
                course.courseReviews.map((rev: any, rIdx: number) => (
                  <View key={rev.id || rIdx} style={styles.publicReviewCard}>
                    <View style={styles.publicReviewHeader}>
                      <View style={styles.publicReviewAvatar}>
                        <Text style={styles.publicReviewAvatarText}>
                          {(rev.learner?.name || rev.learner?.email || '?')[0].toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reviewAuthor}>{rev.learner?.name || 'Learner'}</Text>
                        <Text style={styles.starText}>{'⭐'.repeat(rev.rating || 5)}</Text>
                      </View>
                    </View>
                    {(rev.review || rev.comment) ? (
                      <Text style={styles.reviewComment}>{rev.review || rev.comment}</Text>
                    ) : null}
                  </View>
                ))
              ) : (
                <View style={styles.noReviewsBox}>
                  <Text style={styles.noReviewsText}>No reviews yet. Complete the course and be the first to share your experience!</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.reviewsCtaRow}
                onPress={() => {
                  const isDone = userEnrollment?.status === 'COMPLETED' || (userEnrollment?.progressPercentage != null && userEnrollment.progressPercentage >= 100);
                  navigation?.navigate('CourseReview', {
                    courseId,
                    courseTitle: course.title,
                    hasCompleted: isDone,
                  });
                }}
              >
                <View>
                  <Text style={styles.reviewsCtaTitle}>⭐ Write / Read All Reviews</Text>
                  <Text style={styles.reviewsCtaSub}>See complete rating breakdowns and feedback</Text>
                </View>
                <Text style={{ fontSize: 18, color: '#15803D', fontWeight: 'bold' }}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        {actionLoading ? (
          <ActivityIndicator color="#064E3B" />
        ) : isOwner ? (
          <View style={styles.enrolledActionRow}>
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => navigation?.navigate('CourseCreator', { courseId })}
            >
              <Text style={styles.actionBtnText}>✏️ Edit Course</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reviewBtn}
              onPress={() => {
                navigation?.navigate('CourseReview', {
                  courseId,
                  courseTitle: course.title,
                  hasCompleted: false,
                });
              }}
            >
              <Text style={styles.reviewBtnText}>⭐ Reviews</Text>
            </TouchableOpacity>
          </View>
        ) : isEnrolled ? (
          <View style={styles.enrolledActionRow}>
            {progressPct >= 100 ? (
              <TouchableOpacity
                style={styles.continueBtn}
                onPress={() => navigation?.navigate('MainTabs', { screen: 'CertificatesTab' })}
              >
                <Text style={styles.actionBtnText}>Go to Certificates 🎓</Text>
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
            <TouchableOpacity
              style={styles.reviewBtn}
              onPress={() => {
                const isDone = userEnrollment?.status === 'COMPLETED' || (userEnrollment?.progressPercentage != null && userEnrollment.progressPercentage >= 100);
                navigation?.navigate('CourseReview', {
                  courseId,
                  courseTitle: course.title,
                  hasCompleted: isDone,
                });
              }}
            >
              <Text style={styles.reviewBtnText}>⭐ Review</Text>
            </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  circleBtnText: { fontSize: 18, color: '#0F172A', fontWeight: 'bold' },
  rightIcons: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  reviewQuickBtn: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#64748B' },
  scrollContent: { flex: 1 },
  contentPadding: { paddingHorizontal: 20, paddingTop: 12 },
  heroImage: { width: '100%', height: 200, borderRadius: 20, marginBottom: 14 },
  enrolledBadgeTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  enrolledBadgeText: { color: '#15803D', fontSize: 12, fontWeight: '700' },
  courseTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A', lineHeight: 30, marginBottom: 14 },
  instructorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
  },
  instructorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0F766E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  nameBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  instructorName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  verifiedPill: { backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  verifiedPillText: { fontSize: 11, fontWeight: '700', color: '#15803D' },
  viewProfileLink: { fontSize: 13, fontWeight: '700', color: '#15803D' },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  metricCol: { alignItems: 'center' },
  metricValue: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  metricSub: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  metricDivider: { width: 1, height: 24, backgroundColor: '#E2E8F0' },
  progressCardContainer: {
    backgroundColor: '#DCFCE7',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  progressHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressCardTitle: { fontSize: 13, fontWeight: '700', color: '#166534' },
  progressCardPct: { fontSize: 13, fontWeight: '700', color: '#166534' },
  progressBarTrack: { height: 8, backgroundColor: '#BBF7D0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#15803D', borderRadius: 4 },
  sectionHeading: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 12, marginBottom: 8 },
  descriptionText: { fontSize: 14, color: '#475569', lineHeight: 22, marginBottom: 12 },
  outcomeList: { gap: 8, marginBottom: 16 },
  outcomeItem: { fontSize: 14, color: '#166534', fontWeight: '600' },
  moduleCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
  },
  moduleHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  moduleTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  moduleMetaText: { fontSize: 12, color: '#94A3B8' },
  lessonRowWrapper: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  checkboxBtn: { marginRight: 10 },
  checkboxIcon: { fontSize: 18 },
  lessonRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lessonItem: { fontSize: 14, color: '#334155', flex: 1 },
  lessonItemDone: { textDecorationLine: 'line-through', color: '#15803D', fontWeight: '600' },
  playTag: { fontSize: 12, color: '#15803D', fontWeight: '700' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  enrollBtn: { backgroundColor: '#064E3B', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  enrolledActionRow: { flexDirection: 'row', gap: 10 },
  continueBtn: { flex: 1, backgroundColor: '#064E3B', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#EF4444', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, alignItems: 'center' },
  cancelBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  actionBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  reviewBtn: {
    backgroundColor: '#F0FDF4', paddingVertical: 14, paddingHorizontal: 14,
    borderRadius: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#15803D',
  },
  reviewBtnText: { color: '#15803D', fontWeight: '700', fontSize: 13 },
  reviewsSection: { marginTop: 12 },
  publicReviewCard: {
    backgroundColor: '#FFFFFF', padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 10,
  },
  publicReviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  publicReviewAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center',
  },
  publicReviewAvatarText: { fontSize: 13, fontWeight: '700', color: '#15803D' },
  reviewAuthor: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  starText: { fontSize: 12, marginTop: 2 },
  reviewComment: { fontSize: 13, color: '#475569', marginTop: 4, lineHeight: 19 },
  noReviewsBox: {
    backgroundColor: '#FFFFFF', padding: 16, borderRadius: 14,
    alignItems: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed',
  },
  noReviewsText: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },
  reviewsCtaRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#DCFCE7', padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  reviewsCtaTitle: { fontSize: 15, fontWeight: '700', color: '#166534' },
  reviewsCtaSub: { fontSize: 12, color: '#15803D', marginTop: 2 },
});
