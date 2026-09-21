import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchMyLearning, fetchMyQuizzes } from '../../api/learner.service';
import { COLORS } from '../../theme/colors';

export default function MyLearningScreen({ navigation }: any) {
  const [inProgressCourses, setInProgressCourses] = useState<any[]>([]);
  const [completedCourses, setCompletedCourses] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [completionRequests, setCompletionRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'IN_PROGRESS' | 'COMPLETED' | 'ASSESSMENTS' | 'ASSIGNMENTS' | 'CERTIFICATES'>('IN_PROGRESS');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMyLearning = async () => {
    try {
      setLoading(true);
      const res = await fetchMyLearning();
      if (res) {
        setInProgressCourses(res.inProgress || []);
        setCompletedCourses(res.completed || []);
      }

      const quizRes: any = await fetchMyQuizzes();
      const quizzes = quizRes?.quizzes || quizRes?.data || (Array.isArray(quizRes) ? quizRes : []);
      setAssessments(quizzes);

      // Fetch assignments & certificates dynamically
      const allAssignments: any[] = [];
      const enrolledCourseIds = [...(res?.inProgress || []), ...(res?.completed || [])].map((c: any) => c.courseId);
      
      const { fetchCourseAssignments, fetchLearnerSubmissions, fetchMyCertificates, fetchMyCompletionRequests } = require('../../api/learner.service');

      const certsRes = await fetchMyCertificates().catch(() => null);
      if (certsRes) setCertificates(certsRes.certificates || []);

      const reqsRes = await fetchMyCompletionRequests().catch(() => null);
      if (reqsRes) {
        const pendingOrRejected = (reqsRes.requests || []).filter((req: any) => req.status !== 'APPROVED');
        setCompletionRequests(pendingOrRejected);
      }
      
      for (const cId of Array.from(new Set(enrolledCourseIds))) {
        try {
          const assignRes: any = await fetchCourseAssignments(cId as string);
          const courseAssignments = assignRes?.assignments || assignRes?.data?.assignments || [];
          
          for (const assignment of courseAssignments) {
            try {
              const subRes: any = await fetchLearnerSubmissions(assignment.id);
              const subs = subRes?.submissions || subRes?.data || [];
              assignment.mySubmission = subs.length > 0 ? subs[0] : null;
            } catch (e) {
              assignment.mySubmission = null;
            }
            const matchedCourse = [...(res?.inProgress || []), ...(res?.completed || [])].find((c: any) => c.courseId === cId)?.course;
            if (matchedCourse && !assignment.course) assignment.course = matchedCourse;
            
            allAssignments.push(assignment);
          }
        } catch (e) {
          console.log(`Failed to fetch assignments for course ${cId}`);
        }
      }
      setAssignments(allAssignments);
    } catch (err) {
      console.log('Error fetching my-learning from API, using demo data:', err);
      setInProgressCourses([
        {
          id: 'e1',
          courseId: 'c1',
          progressPercentage: 80,
          course: {
            title: 'React Native Development',
            category: { name: 'Mobile Development' },
            creator: { name: 'Skill Sharer', verifiedBadge: true },
            thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=600&q=80',
          },
          courseProgress: { completedLessons: 16, totalLessons: 20, lastLessonTitle: 'Lesson 5: State Management' },
        },
        {
          id: 'e2',
          courseId: 'c2',
          progressPercentage: 35,
          course: {
            title: 'UX Micro-interactions',
            category: { name: 'Arts & Design' },
            creator: { name: 'Elena Rostova', verifiedBadge: true },
            thumbnail: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=600&q=80',
          },
          courseProgress: { completedLessons: 7, totalLessons: 20, lastLessonTitle: 'Lesson 3: Animated Transitions' },
        },
      ]);

      setCompletedCourses([
        {
          id: 'ec1',
          courseId: 'c3',
          progressPercentage: 100,
          completedAt: '2026-09-10',
          course: {
            title: 'UI/UX Design Masterclass',
            category: { name: 'Arts & Design' },
            creator: { name: 'Elena Rostova', verifiedBadge: true },
            thumbnail: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=600&q=80',
          },
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMyLearning();
    }, [])
  );

  const downloadCertificate = async (certificate: any) => {
    try {
      const url = `http://localhost:5000/api/certificates/${certificate.id}/download`;
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.log('Error opening PDF download:', error);
      alert('Could not download the certificate.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />

      {/* Main Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Learning Dashboard</Text>
        <Text style={styles.headerSubtitle}>Track active courses, progress, assignments & certificates</Text>
      </View>

      {/* Navigation Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabSection}>
        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'IN_PROGRESS' && styles.tabPillActive]}
          onPress={() => setActiveTab('IN_PROGRESS')}
        >
          <Text style={[styles.tabPillText, activeTab === 'IN_PROGRESS' && styles.tabPillTextActive]}>
            In Progress
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'COMPLETED' && styles.tabPillActive]}
          onPress={() => setActiveTab('COMPLETED')}
        >
          <Text style={[styles.tabPillText, activeTab === 'COMPLETED' && styles.tabPillTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'ASSESSMENTS' && styles.tabPillActive]}
          onPress={() => setActiveTab('ASSESSMENTS')}
        >
          <Text style={[styles.tabPillText, activeTab === 'ASSESSMENTS' && styles.tabPillTextActive]}>
            Quizzes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'ASSIGNMENTS' && styles.tabPillActive]}
          onPress={() => setActiveTab('ASSIGNMENTS')}
        >
          <Text style={[styles.tabPillText, activeTab === 'ASSIGNMENTS' && styles.tabPillTextActive]}>
            Assignments
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'CERTIFICATES' && styles.tabPillActive]}
          onPress={() => setActiveTab('CERTIFICATES')}
        >
          <Text style={[styles.tabPillText, activeTab === 'CERTIFICATES' && styles.tabPillTextActive]}>
            Certificates
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Content List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading my learning...</Text>
        </View>
      ) : activeTab === 'ASSESSMENTS' ? (
        <FlatList
          data={assessments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.9}
              onPress={() =>
                navigation?.navigate('AssessmentDetail', {
                  assessment: item,
                  courseName: item.course?.title,
                  status: item.completions?.[0]?.status || 'PENDING',
                  loadMyLearning,
                })
              }
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.courseTitle}>{item.course?.title || 'React Native Mobile App Development'}</Text>
                <View
                  style={{
                    backgroundColor: item.completions?.[0]?.status === 'COMPLETED' ? COLORS.badgeGreenBg : COLORS.badgeOrangeBg,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color: item.completions?.[0]?.status === 'COMPLETED' ? COLORS.badgeGreenText : COLORS.primary,
                      fontSize: 11,
                      fontWeight: '800',
                    }}
                  >
                    {item.completions?.[0]?.status === 'COMPLETED' ? '✓ Completed' : 'Pending'}
                  </Text>
                </View>
              </View>
              <Text style={styles.creatorName}>{item.title || 'React Native Final Assessment'}</Text>
              <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: '800', marginTop: 8 }}>
                Take Assessment / View Details →
              </Text>
            </TouchableOpacity>
          )}
        />
      ) : activeTab === 'ASSIGNMENTS' ? (
        <FlatList
          data={assignments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const hasSubmission = Boolean(item.mySubmission);
            const isGraded = Boolean(item.mySubmission && (item.mySubmission.status === 'COMPLETED' || item.mySubmission.status === 'GRADED' || (item.mySubmission.grade !== null && item.mySubmission.grade !== undefined)));
            const status = isGraded ? 'GRADED' : (hasSubmission ? (item.mySubmission.status || 'SUBMITTED') : 'PENDING');
            const courseName = item.course?.title || 'Course Assignment';
            const dueDate = item.deadline ? new Date(item.deadline).toLocaleDateString() : 'No deadline';
            
            return (
              <View style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={styles.courseTitle}>{courseName}</Text>
                  <View style={{ backgroundColor: isGraded ? COLORS.badgeGreenBg : COLORS.badgeOrangeBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                    <Text style={{ color: isGraded ? COLORS.badgeGreenText : COLORS.primary, fontSize: 11, fontWeight: '800' }}>
                      {status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.creatorName}>{item.title}</Text>
                <Text style={{ fontSize: 12, color: COLORS.neutralMedium, marginVertical: 6 }}>Due Date: {dueDate}</Text>
                
                <TouchableOpacity
                  style={styles.continueBtn}
                  onPress={() => navigation?.navigate('AssignmentDetail', { assignmentId: item.id })}
                >
                  <Text style={styles.continueBtnText}>
                    {isGraded ? 'View Grade & Feedback →' : hasSubmission ? 'View Submission →' : 'Submit Assignment →'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      ) : activeTab === 'CERTIFICATES' ? (
        <FlatList
          data={completedCourses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const course = item.course || {};
            return (
              <View style={styles.certCard}>
                <Text style={styles.certIcon}>🎖️</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.certTitle}>Certificate of Completion</Text>
                  <Text style={styles.certCourseName}>{course.title || 'UI/UX Design Masterclass'}</Text>
                  <Text style={styles.certDate}>Issued: September 2026 • Verified SkillConnect</Text>
                </View>
                <TouchableOpacity style={styles.certDownloadBtn}>
                  <Text style={styles.certDownloadBtnText}>View 📜</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      ) : (
        <FlatList
          data={activeTab === 'IN_PROGRESS' ? inProgressCourses : completedCourses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadMyLearning(); }} tintColor={COLORS.primary} />
          }
          renderItem={({ item }) => {
            const course = item.course || {};
            const pct = item.progressPercentage ?? item.courseProgress?.progressPercentage ?? 80;
            const completedLessons = item.courseProgress?.completedLessons ?? 16;
            const totalLessons = item.courseProgress?.totalLessons ?? 20;

            return (
              <View style={styles.card}>
                <View style={styles.cardTopRow}>
                  <Image
                    source={{
                      uri:
                        course.thumbnail ||
                        'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=600&q=80',
                    }}
                    style={styles.cardThumbnail}
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.courseTitle}>{course.title || 'React Native Development'}</Text>
                    <View style={styles.creatorRow}>
                      <Text style={styles.creatorName}>{course.creator?.name || 'Skill Sharer'}</Text>
                      {course.creator?.verifiedBadge && (
                        <View style={styles.verifiedBadge}>
                          <Text style={styles.verifiedText}>✔</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.lastAccessedText}>Continue from: {item.courseProgress?.lastLessonTitle || 'Last completed lesson'}</Text>
                  </View>
                </View>

                {/* Progress Bar & Percentage */}
                <View style={styles.progressSection}>
                  <View style={styles.progressTextRow}>
                    <Text style={styles.progressText}>
                      {completedLessons} / {totalLessons} lessons completed
                    </Text>
                    <Text style={styles.progressPctText}>{pct}%</Text>
                  </View>

                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${pct}%` }]} />
                  </View>
                </View>

                {/* Action Button */}
                <TouchableOpacity
                  style={styles.continueBtn}
                  activeOpacity={0.9}
                  onPress={() =>
                    navigation?.navigate('CourseDetail', { courseId: item.courseId || course.id, course })
                  }
                >
                  <Text style={styles.continueBtnText}>
                    {activeTab === 'COMPLETED' ? 'Review Course Material' : 'Continue Learning ▶'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgWarm },
  header: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 6 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.neutralDark, letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 13, color: COLORS.neutralMedium, marginTop: 2 },
  tabSection: { paddingHorizontal: 18, marginVertical: 12, flexGrow: 0 },
  tabPill: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    marginRight: 8,
  },
  tabPillActive: { backgroundColor: COLORS.primaryDark, borderColor: COLORS.primaryDark },
  tabPillText: { fontSize: 12, fontWeight: '700', color: COLORS.neutralDark },
  tabPillTextActive: { color: COLORS.white },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: COLORS.neutralMedium },
  listContainer: { paddingHorizontal: 18, paddingBottom: 40, gap: 14 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    elevation: 2,
    shadowColor: COLORS.neutralDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center' },
  cardThumbnail: { width: 60, height: 60, borderRadius: 14 },
  courseTitle: { fontSize: 15, fontWeight: '800', color: COLORS.neutralDark, marginBottom: 4 },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  creatorName: { fontSize: 12, color: COLORS.neutralMedium },
  verifiedBadge: { backgroundColor: COLORS.primary, width: 14, height: 14, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
  verifiedText: { fontSize: 9, fontWeight: '900', color: COLORS.white },
  lastAccessedText: { fontSize: 11, color: COLORS.neutralLight },
  progressSection: { marginTop: 14, marginBottom: 14 },
  progressTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressText: { fontSize: 12, color: COLORS.neutralDark, fontWeight: '600' },
  progressPctText: { fontSize: 12, color: COLORS.primary, fontWeight: '800' },
  progressTrack: { height: 8, backgroundColor: '#F3E5DC', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primaryDark, borderRadius: 4 },
  continueBtn: {
    backgroundColor: COLORS.primaryDark,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  continueBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
  certCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  certIcon: { fontSize: 32 },
  certTitle: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  certCourseName: { fontSize: 15, fontWeight: '800', color: COLORS.neutralDark, marginTop: 2 },
  certDate: { fontSize: 11, color: COLORS.neutralMedium, marginTop: 2 },
  certDownloadBtn: { backgroundColor: COLORS.badgeOrangeBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  certDownloadBtnText: { color: COLORS.primary, fontSize: 12, fontWeight: '800' },
});
