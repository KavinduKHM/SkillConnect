import React, { useState, useEffect, useCallback } from 'react';
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
  ScrollView,
  Image,
  Platform,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { fetchMyLearning, fetchMyQuizzes } from '../../api/learner.service';

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

      // Fetch assignments for all enrolled courses
      const allAssignments: any[] = [];
      const enrolledCourseIds = [...(res?.inProgress || []), ...(res?.completed || [])].map((c: any) => c.courseId);

      const { fetchCourseAssignments, fetchLearnerSubmissions, fetchMyCertificates, fetchMyCompletionRequests } = require('../../api/learner.service');

      const certsRes = await fetchMyCertificates();
      if (certsRes) setCertificates(certsRes.certificates || []);

      const reqsRes = await fetchMyCompletionRequests();
      if (reqsRes) {
        // Filter out APPROVED requests since they are shown as Certificates
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
      console.log('Error fetching my-learning from API, using fallback data:', err);
      setInProgressCourses([
        {
          id: 'e1',
          courseId: 'c1',
          progressPercentage: 80,
          course: {
            title: 'React Native Development',
            category: { name: 'Mobile Development' },
            creator: { name: 'John Perera', verifiedBadge: true },
            thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=600&q=80',
          },
          courseProgress: { completedLessons: 16, totalLessons: 20 },
        },
        {
          id: 'e2',
          courseId: 'c2',
          progressPercentage: 35,
          course: {
            title: 'UX Research Fundamentals',
            category: { name: 'Design & Arts' },
            creator: { name: 'Sarah Chen', verifiedBadge: true },
            thumbnail: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80',
          },
          courseProgress: { completedLessons: 7, totalLessons: 20 },
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

  const handleRequestCompletion = async (courseId: string) => {
    try {
      setLoading(true);
      const { requestCourseCompletion } = require('../../api/learner.service');
      await requestCourseCompletion(courseId);
      alert('Completion request submitted successfully!');
      loadMyLearning();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to request completion');
      setLoading(false);
    }
  };

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

  const handleBrowseCourses = () => {
    if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation?.navigate('CourseList');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>My Learning</Text>
          <View style={styles.headerButtonsRow}>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={handleBrowseCourses}
            >
              <Ionicons name="search" size={13} color="#064E3B" style={{ marginRight: 4 }} />
              <Text style={styles.browseBtnText}>Browse</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.recBtn}
              onPress={() => navigation?.navigate('MyRecommendations')}
            >
              <Ionicons name="ribbon-outline" size={14} color="#D97706" style={{ marginRight: 4 }} />
              <Text style={styles.recBtnText}>Recommendations</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>Continue your progression and earn certificates</Text>
      </View>

      {/* Filter Tabs (Horizontal Scroll) */}
      <View style={styles.tabSectionWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'IN_PROGRESS' && styles.tabPillActive]}
            onPress={() => setActiveTab('IN_PROGRESS')}
          >
            <Text style={[styles.tabPillText, activeTab === 'IN_PROGRESS' && styles.tabPillTextActive]}>
              In Progress ({inProgressCourses.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'COMPLETED' && styles.tabPillActive]}
            onPress={() => setActiveTab('COMPLETED')}
          >
            <Text style={[styles.tabPillText, activeTab === 'COMPLETED' && styles.tabPillTextActive]}>
              Completed ({completedCourses.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'ASSESSMENTS' && styles.tabPillActive]}
            onPress={() => setActiveTab('ASSESSMENTS')}
          >
            <Text style={[styles.tabPillText, activeTab === 'ASSESSMENTS' && styles.tabPillTextActive]}>
              Assessments ({assessments.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'ASSIGNMENTS' && styles.tabPillActive]}
            onPress={() => setActiveTab('ASSIGNMENTS')}
          >
            <Text style={[styles.tabPillText, activeTab === 'ASSIGNMENTS' && styles.tabPillTextActive]}>
              Assignments ({assignments.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'CERTIFICATES' && styles.tabPillActive]}
            onPress={() => setActiveTab('CERTIFICATES')}
          >
            <Text style={[styles.tabPillText, activeTab === 'CERTIFICATES' && styles.tabPillTextActive]}>
              Certificates 🏆 ({certificates.length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Content List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#064E3B" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      ) : activeTab === 'ASSESSMENTS' ? (
        <FlatList
          data={assessments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Assessments Available</Text>
              <Text style={styles.emptySubtitle}>You will see quizzes here once you enroll in courses with assessments.</Text>
              <TouchableOpacity style={styles.exploreBtn} onPress={handleBrowseCourses}>
                <Text style={styles.exploreBtnText}>Explore Courses</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                navigation?.navigate('AssessmentDetail', {
                  assessment: item,
                  courseName: item.course?.title,
                  status: item.completions?.[0]?.status || 'PENDING',
                  loadMyLearning,
                })
              }
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.courseTitle} numberOfLines={1}>{item.course?.title || 'Course Assessment'}</Text>
                <View
                  style={{
                    backgroundColor: item.completions?.[0]?.status === 'COMPLETED' ? '#DCFCE7' : '#FEF3C7',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color: item.completions?.[0]?.status === 'COMPLETED' ? '#15803D' : '#D97706',
                      fontSize: 11,
                      fontWeight: '700',
                    }}
                  >
                    {item.completions?.[0]?.status === 'COMPLETED' ? '✓ Completed' : 'Pending'}
                  </Text>
                </View>
              </View>
              <Text style={styles.creatorName}>{item.title || 'Course Quiz Assessment'}</Text>
              <Text style={{ fontSize: 13, color: '#15803D', fontWeight: '700', marginTop: 10 }}>
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Assignments Found</Text>
              <Text style={styles.emptySubtitle}>You do not have any assignments pending for your courses.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const hasSubmission = Boolean(item.mySubmission);
            const isGraded = Boolean(item.mySubmission && (item.mySubmission.status === 'COMPLETED' || item.mySubmission.status === 'GRADED' || (item.mySubmission.grade !== null && item.mySubmission.grade !== undefined)));
            const status = isGraded ? 'GRADED' : (hasSubmission ? (item.mySubmission.status || 'SUBMITTED') : 'PENDING');
            const courseName = item.course?.title || 'Course';
            const dueDate = item.deadline ? new Date(item.deadline).toLocaleDateString() : 'No deadline';

            return (
              <View style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={styles.courseTitle} numberOfLines={1}>{courseName}</Text>
                  <View style={{ backgroundColor: isGraded ? '#DCFCE7' : status === 'PENDING' ? '#FEF3C7' : '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                    <Text style={{ color: isGraded ? '#15803D' : status === 'PENDING' ? '#D97706' : '#4F46E5', fontSize: 11, fontWeight: '700' }}>
                      {status}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 4 }}>{item.title}</Text>

                {isGraded && item.mySubmission?.grade !== null && item.mySubmission?.grade !== undefined ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, backgroundColor: '#F0FDF4', padding: 8, borderRadius: 8 }}>
                    <Ionicons name="ribbon-outline" size={16} color="#059669" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#065F46' }}>
                      Grade: {item.mySubmission.grade} / {item.maxMarks || 100}
                    </Text>
                  </View>
                ) : null}

                <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 12 }}>Due Date: {dueDate}</Text>

                <TouchableOpacity
                  style={[styles.continueBtn, { backgroundColor: isGraded ? '#F0FDF4' : '#064E3B' }]}
                  onPress={() => navigation?.navigate('AssignmentDetail', { assignmentId: item.id })}
                >
                  <Text style={[styles.continueBtnText, { color: isGraded ? '#059669' : '#FFFFFF' }]}>
                    {isGraded ? 'View Grade & Feedback →' : hasSubmission ? 'View Submission →' : 'Submit Assignment →'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      ) : activeTab === 'CERTIFICATES' ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.listContainer}>
          {certificates.length === 0 && completionRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Certificates Yet 🏆</Text>
              <Text style={styles.emptySubtitle}>Complete a course 100% and request a certificate from your instructor.</Text>
            </View>
          ) : (
            <>
              {/* Issued Certificates */}
              {certificates.map((cert) => (
                <View key={cert.id} style={styles.card}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={styles.courseTitle} numberOfLines={1}>{cert.course?.title || 'Certificate of Completion'}</Text>
                    <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                      <Text style={{ color: '#15803D', fontSize: 11, fontWeight: '700' }}>✓ ISSUED</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 14 }}>
                    Issued on {new Date(cert.issueDate || cert.createdAt).toLocaleDateString()}
                  </Text>
                  <TouchableOpacity
                    style={[styles.continueBtn, { backgroundColor: '#064E3B' }]}
                    onPress={() => downloadCertificate(cert)}
                  >
                    <Text style={styles.continueBtnText}>Download PDF Certificate 📄</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Pending Requests */}
              {completionRequests.map((req) => (
                <View key={req.id} style={styles.card}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={styles.courseTitle} numberOfLines={1}>{req.course?.title || 'Course'}</Text>
                    <View style={{ backgroundColor: req.status === 'REJECTED' ? '#FEE2E2' : '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                      <Text style={{ color: req.status === 'REJECTED' ? '#DC2626' : '#D97706', fontSize: 11, fontWeight: '700' }}>{req.status}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>
                    Requested on {new Date(req.requestedAt || req.createdAt).toLocaleDateString()}
                  </Text>
                  {req.status === 'REJECTED' && req.rejectionReason && (
                    <View style={{ backgroundColor: '#FEF2F2', padding: 10, borderRadius: 8, marginBottom: 12 }}>
                      <Text style={{ fontSize: 13, color: '#991B1B' }}>
                        <Text style={{ fontWeight: 'bold' }}>Reason: </Text>
                        {req.rejectionReason}
                      </Text>
                    </View>
                  )}
                  {req.status === 'PENDING' && (
                    <Text style={{ fontSize: 13, color: '#94A3B8', fontStyle: 'italic' }}>
                      ⏳ Waiting for Skill Sharer approval. Once verified, your certificate PDF will appear here.
                    </Text>
                  )}
                </View>
              ))}
            </>
          )}
        </ScrollView>
      ) : (activeTab === 'IN_PROGRESS' ? inProgressCourses : completedCourses).length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>
            {activeTab === 'IN_PROGRESS' ? 'No Courses In Progress' : 'No Completed Courses Yet'}
          </Text>
          <Text style={styles.emptySubtitle}>Explore the course catalog to start learning new skills!</Text>
          <TouchableOpacity style={styles.exploreBtn} onPress={handleBrowseCourses}>
            <Text style={styles.exploreBtnText}>Explore Courses 🎓</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={activeTab === 'IN_PROGRESS' ? inProgressCourses : completedCourses}
          keyExtractor={(item) => item.id || item.courseId}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadMyLearning(); }} />
          }
          renderItem={({ item }) => {
            const course = item.course || {};
            const pct = item.progressPercentage ?? item.courseProgress?.progressPercentage ?? (activeTab === 'COMPLETED' ? 100 : 0);
            const completedLessons = item.courseProgress?.completedLessons ?? 0;
            const totalLessons = item.courseProgress?.totalLessons ?? (completedLessons || 1);

            const courseId = item.courseId || item.course?.id;
            const issuedCert = certificates.find((c) => c.courseId === courseId || c.course?.id === courseId);
            const pendingReq = completionRequests.find((r) => (r.courseId === courseId || r.course?.id === courseId) && r.status === 'PENDING');
            const rejectedReq = completionRequests.find((r) => (r.courseId === courseId || r.course?.id === courseId) && r.status === 'REJECTED');

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
                    <Text style={styles.courseTitle}>{course.title || 'Course'}</Text>
                    <View style={styles.creatorRow}>
                      <Text style={styles.creatorName}>{course.creator?.name || 'Skill Sharer'}</Text>
                      {course.creator?.verifiedBadge && (
                        <View style={styles.verifiedBadge}>
                          <Text style={styles.verifiedText}>✓</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.lastAccessedText}>Category: {course.category?.name || 'General'}</Text>
                  </View>
                </View>

                {/* Progress Track */}
                <View style={styles.progressSection}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, pct))}%` }]} />
                  </View>
                  <Text style={styles.progressText}>
                    {completedLessons > 0 ? `${completedLessons}/${totalLessons} lessons completed (${pct}%)` : `Progress: ${pct}%`}
                  </Text>
                </View>

                {/* Dynamic Actions */}
                {issuedCert ? (
                  <View style={{ gap: 8 }}>
                    <TouchableOpacity
                      style={[styles.continueBtn, { backgroundColor: '#064E3B' }]}
                      onPress={() => downloadCertificate(issuedCert)}
                    >
                      <Text style={styles.continueBtnText}>Download Certificate PDF 📄</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.continueBtn, { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A' }]}
                      onPress={() => navigation?.navigate('CourseReview', {
                        courseId,
                        courseTitle: course.title,
                        hasCompleted: true,
                      })}
                    >
                      <Text style={[styles.continueBtnText, { color: '#B45309' }]}>
                        ⭐ Rate & Review Course
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.continueBtn, { backgroundColor: '#F1F5F9' }]}
                      onPress={() => navigation?.navigate('CourseDetail', { courseId, course })}
                    >
                      <Text style={[styles.continueBtnText, { color: '#475569' }]}>
                        View Course Details
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : pendingReq ? (
                  <View style={{ gap: 8 }}>
                    <TouchableOpacity
                      style={[styles.continueBtn, { backgroundColor: '#FEF3C7' }]}
                      onPress={() => setActiveTab('CERTIFICATES')}
                    >
                      <Text style={[styles.continueBtnText, { color: '#D97706' }]}>
                        Certificate Request Pending ⏳
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.continueBtn, { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' }]}
                      onPress={() => navigation?.navigate('CourseReview', {
                        courseId,
                        courseTitle: course.title,
                        hasCompleted: true,
                      })}
                    >
                      <Text style={[styles.continueBtnText, { color: '#15803D' }]}>
                        ⭐ Rate & Review Course
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.continueBtn, { backgroundColor: '#F1F5F9' }]}
                      onPress={() => navigation?.navigate('CourseDetail', { courseId, course })}
                    >
                      <Text style={[styles.continueBtnText, { color: '#475569' }]}>
                        View Course Details
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : pct >= 100 ? (
                  <View style={{ gap: 8 }}>
                    <TouchableOpacity
                      style={[styles.continueBtn, { backgroundColor: '#064E3B' }]}
                      onPress={() => handleRequestCompletion(courseId)}
                    >
                      <Text style={styles.continueBtnText}>
                        {rejectedReq ? 'Resubmit Certificate Request 🏆' : 'Request Certificate 🏆'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.continueBtn, { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A' }]}
                      onPress={() => navigation?.navigate('CourseReview', {
                        courseId,
                        courseTitle: course.title,
                        hasCompleted: true,
                      })}
                    >
                      <Text style={[styles.continueBtnText, { color: '#B45309' }]}>
                        ⭐ Rate & Review Course
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.continueBtn, { backgroundColor: '#F1F5F9' }]}
                      onPress={() => navigation?.navigate('CourseDetail', { courseId, course })}
                    >
                      <Text style={[styles.continueBtnText, { color: '#475569' }]}>
                        View Course Details
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.continueBtn}
                    onPress={() => navigation?.navigate('CourseDetail', { courseId, course })}
                  >
                    <Text style={styles.continueBtnText}>Continue Learning →</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: '#64748B' },
  headerButtonsRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  browseBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1, borderColor: '#BBF7D0',
  },
  browseBtnText: { fontSize: 12, fontWeight: '700', color: '#166534' },
  recBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1, borderColor: '#FDE68A',
  },
  recBtnText: { fontSize: 12, fontWeight: '700', color: '#B45309' },
  tabSectionWrapper: { marginBottom: 16 },
  tabScrollContent: { paddingHorizontal: 20, gap: 8 },
  tabPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabPillActive: { backgroundColor: '#064E3B', borderColor: '#064E3B' },
  tabPillText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  tabPillTextActive: { color: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#64748B' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center' },
  cardThumbnail: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#E2E8F0' },
  courseTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  creatorName: { fontSize: 12, color: '#64748B' },
  verifiedBadge: { backgroundColor: '#DCFCE7', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  verifiedText: { fontSize: 10, fontWeight: '800', color: '#15803D' },
  lastAccessedText: { fontSize: 11, color: '#94A3B8' },
  progressSection: { marginTop: 14, marginBottom: 14 },
  progressTrack: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: '#064E3B', borderRadius: 4 },
  progressText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  continueBtn: {
    backgroundColor: '#064E3B',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#334155', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 16 },
  exploreBtn: { backgroundColor: '#064E3B', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  exploreBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
