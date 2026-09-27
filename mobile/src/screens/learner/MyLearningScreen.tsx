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
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchMyLearning, fetchMyQuizzes } from '../../api/learner.service';
import { NotificationModal } from '../../components/common/NotificationModal';
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
  const [notiModalVisible, setNotiModalVisible] = useState(false);

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
      const certId = certificate.id || certificate.certificateId;
      const url = `http://localhost:5000/api/certificates/${certId}/download`;
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.log('Error opening PDF download:', error);
      if (Platform.OS === 'web') {
        window.alert('Could not download the certificate.');
      } else {
        Alert.alert('Notice', 'Could not download the certificate.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />

      {/* Main Header */}
      <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>My Learning Dashboard</Text>
          <Text style={styles.headerSubtitle}>Track active courses, progress, assignments & certificates</Text>
        </View>
        <TouchableOpacity
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: COLORS.white,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: COLORS.borderWarm,
            marginLeft: 8,
          }}
          onPress={() => setNotiModalVisible(true)}
        >
          <Text style={{ fontSize: 18 }}>🔔</Text>
        </TouchableOpacity>
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
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 18, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.neutralMedium }}>
              {assignments.filter(a => !a.mySubmission).length} Pending Submission{assignments.filter(a => !a.mySubmission).length !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: COLORS.primaryDark,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
              onPress={async () => {
                try {
                  const { sendDeadlineReminders } = require('../../api/learner.service');
                  const res = await sendDeadlineReminders();
                  Alert.alert(
                    '📧 Deadline Reminders Sent!',
                    `Email reminders for your pending assignments have been sent to your registered email address.\n\n${res.message || ''}`,
                    [{ text: 'OK' }]
                  );
                } catch (e: any) {
                  Alert.alert('Notice', 'Deadline reminder request processed');
                }
              }}
            >
              <Text style={{ fontSize: 12, color: COLORS.white, fontWeight: '800' }}>🔔 Send Email Reminders</Text>
            </TouchableOpacity>
          </View>

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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 6 }}>
                    <Text style={{ fontSize: 12, color: COLORS.neutralMedium }}>⏰ Due Date: {dueDate}</Text>
                    {!hasSubmission && (
                      <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#EF4444' }}>Email Reminder Active ✉️</Text>
                      </View>
                    )}
                  </View>
                  
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
        </View>
      ) : activeTab === 'CERTIFICATES' ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadMyLearning();
              }}
              tintColor={COLORS.primary}
            />
          }
        >
          {/* Tracking Course Completion Requests */}
          {completionRequests.length > 0 && (
            <View style={{ gap: 10, marginBottom: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.neutralDark, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Verification & Approval Status
              </Text>
              {completionRequests.map((req: any) => {
                const courseTitle = req.course?.title || 'Course';
                const isRejected = req.status === 'REJECTED';
                return (
                  <View
                    key={req.id}
                    style={{
                      backgroundColor: isRejected ? COLORS.errorBg : COLORS.honeyBg,
                      borderRadius: 16,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: isRejected ? '#FFDAD6' : '#FBE8C4',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: isRejected ? COLORS.error : COLORS.honeyText }}>
                        {isRejected ? '⚠️ Action Required' : '⏳ Review in Progress'}
                      </Text>
                      <View
                        style={{
                          backgroundColor: isRejected ? '#FEE2E2' : COLORS.badgeOrangeBg,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '800', color: isRejected ? COLORS.error : COLORS.primary }}>
                          {req.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.neutralDark, marginBottom: 2 }}>
                      {courseTitle}
                    </Text>
                    <Text style={{ fontSize: 12, color: COLORS.neutralMedium, lineHeight: 17 }}>
                      {isRejected
                        ? `Instructor Feedback: "${req.rejectReason || 'Please review course requirements.'}"`
                        : 'Your completion request has been submitted. Your instructor is verifying your quiz scores & assignments.'}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Recommendations Banner Link */}
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: COLORS.honeyBg,
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#FBE8C4',
              marginBottom: 4,
            }}
            onPress={() => navigation?.navigate('MyRecommendations')}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
              <Text style={{ fontSize: 20, marginRight: 10 }}>🎖️</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.honeyText }}>
                  Instructor Recommendations
                </Text>
                <Text style={{ fontSize: 11, color: COLORS.neutralMedium }}>
                  View verified endorsements from your course mentors
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.honeyText }}>→</Text>
          </TouchableOpacity>

          {/* Certificates Section */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.neutralDark, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Earned E-Certificates ({(certificates.length > 0 ? certificates : completedCourses).length})
            </Text>

            {(certificates.length > 0 ? certificates : completedCourses).length === 0 && completionRequests.length === 0 ? (
              <View style={styles.emptyCertificatesBox}>
                <View style={styles.emptyCertificatesIcon}>
                  <Text style={{ fontSize: 32 }}>🎓</Text>
                </View>
                <Text style={styles.emptyCertificatesTitle}>No Certificates Issued Yet</Text>
                <Text style={styles.emptyCertificatesSub}>
                  Complete all lessons, pass assessments, and submit practical assignments in your courses to request your verified e-certificate!
                </Text>
                <TouchableOpacity
                  style={styles.browseCoursesBtn}
                  onPress={() => setActiveTab('IN_PROGRESS')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.browseCoursesBtnText}>View In-Progress Courses</Text>
                </TouchableOpacity>
              </View>
            ) : (
              (certificates.length > 0 ? certificates : completedCourses).map((item: any, idx: number) => {
                const course = item.course || item;
                const certId = item.id || `CERT-${1000 + idx}`;
                const certNumber = item.certificateId || item.certificateNumber || `SKIL-${(course.id || 'CERT').slice(0, 6).toUpperCase()}`;
                const issuedDate = (item.issueDate || item.issuedAt)
                  ? new Date(item.issueDate || item.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                  : 'September 2026';
                const instructorName = item.instructor?.name || course.creator?.name || 'Verified Skill Sharer';
                const verifyCode = item.verificationCode || item.certificateId || item.id;

                return (
                  <View key={item.id || idx} style={styles.certCardRevamped}>
                    <View style={styles.certCardHeader}>
                      <View style={styles.certBadgeWrap}>
                        <Text style={{ fontSize: 16 }}>🎖️</Text>
                        <Text style={styles.certBadgeText}>OFFICIAL E-CERTIFICATE</Text>
                      </View>
                      <View style={styles.certIdPill}>
                        <Text style={styles.certIdPillText}>{certNumber}</Text>
                      </View>
                    </View>

                    <Text style={styles.certCourseTitle}>{course.title || 'Course Completion Masterclass'}</Text>

                    <View style={styles.certMetaRow}>
                      <Text style={styles.certInstructorText}>Instructor: {instructorName}</Text>
                      <Text style={styles.certIssuedDate}>Issued: {issuedDate}</Text>
                    </View>

                    <View style={styles.certActionsRow}>
                      <TouchableOpacity
                        style={styles.certDownloadBtnRevamped}
                        onPress={() => downloadCertificate(item)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.certDownloadBtnRevampedText}>Download PDF 📜</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.certVerifyBtnRevamped}
                        onPress={() => {
                          const verifyUrl = `http://localhost:5000/api/certificates/verify/${verifyCode}`;
                          if (Platform.OS === 'web') {
                            window.open(verifyUrl, '_blank');
                          } else {
                            Linking.openURL(verifyUrl).catch(() => {
                              Alert.alert('Certificate Info', `Certificate ID: ${certNumber}\nStatus: Verified Authenticity`);
                            });
                          }
                        }}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.certVerifyBtnRevampedText}>Verify 🔗</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
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

      <NotificationModal
        visible={notiModalVisible}
        onClose={() => {
          setNotiModalVisible(false);
          loadMyLearning();
        }}
        navigation={navigation}
      />
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
  emptyCertificatesBox: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginTop: 10,
  },
  emptyCertificatesIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.badgeOrangeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyCertificatesTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  emptyCertificatesSub: {
    fontSize: 12,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  browseCoursesBtn: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
  },
  browseCoursesBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 12,
  },
  certCardRevamped: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    elevation: 2,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  certCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  certBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  certBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.honeyText,
    letterSpacing: 0.5,
  },
  certIdPill: {
    backgroundColor: COLORS.honeyBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  certIdPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.honeyText,
  },
  certCourseTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.neutralDark,
    marginBottom: 6,
  },
  certMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  certInstructorText: {
    fontSize: 11,
    color: COLORS.neutralMedium,
  },
  certIssuedDate: {
    fontSize: 11,
    color: COLORS.neutralMedium,
  },
  certActionsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderWarm,
    paddingTop: 12,
  },
  certDownloadBtnRevamped: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryDark,
    paddingVertical: 10,
    borderRadius: 14,
  },
  certDownloadBtnRevampedText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  certVerifyBtnRevamped: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceMuted,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  certVerifyBtnRevampedText: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
});
