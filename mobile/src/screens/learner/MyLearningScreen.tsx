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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Linking } from 'react-native';
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
      
      // I'll import fetchCourseAssignments dynamically or at top
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
            // attach course info if missing
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

  const displayList = activeTab === 'IN_PROGRESS' ? inProgressCourses : completedCourses;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Learning</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          <Text style={styles.backBtnText}>← Back to Browse</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.headerTitle}>My Learning Dashboard 📊</Text>
          <TouchableOpacity
            style={styles.recBtn}
            onPress={() => navigation?.navigate('MyRecommendations')}
          >
            <Ionicons name="ribbon-outline" size={14} color="#F59E0B" />
            <Text style={styles.recBtnText}>Recommendations</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabSection}>
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
            style={[styles.tabButton, activeTab === 'ASSESSMENTS' && styles.tabButtonActive]}
            onPress={() => setActiveTab('ASSESSMENTS')}
          >
            <Text style={[styles.tabText, activeTab === 'ASSESSMENTS' && styles.tabTextActive]}>
              Quizzes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'ASSIGNMENTS' && styles.tabButtonActive]}
            onPress={() => setActiveTab('ASSIGNMENTS')}
          >
            <Text style={[styles.tabText, activeTab === 'ASSIGNMENTS' && styles.tabTextActive]}>
              Assignments
            </Text>
          </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'ASSESSMENTS' && styles.tabPillActive]}
          onPress={() => setActiveTab('ASSESSMENTS')}
        >
          <Text style={[styles.tabPillText, activeTab === 'ASSESSMENTS' && styles.tabPillTextActive]}>
            Assessments
          </Text>
        </TouchableOpacity>
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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.courseTitle}>{item.course?.title || 'React Native Mobile App Development'}</Text>
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
              <Text style={styles.creatorName}>{item.title || 'React Native Development Final Assessment'}</Text>
              <Text style={{ fontSize: 12, color: '#064E3B', fontWeight: '600', marginTop: 8 }}>
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
            const courseName = item.course?.title || 'Unknown Course';
            const dueDate = item.deadline ? new Date(item.deadline).toLocaleDateString() : 'No deadline';
            
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.courseTitle}>{courseName}</Text>
                  <View style={{ backgroundColor: isGraded ? '#D1FAE5' : status === 'PENDING' ? '#FEF3C7' : '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                    <Text style={{ color: isGraded ? '#059669' : status === 'PENDING' ? '#D97706' : '#4F46E5', fontSize: 11, fontWeight: '700' }}>
                      {status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.courseTitle}>{item.title}</Text>
                
                {isGraded && item.mySubmission.grade !== null && item.mySubmission.grade !== undefined ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, backgroundColor: '#F0FDF4', padding: 8, borderRadius: 6 }}>
                    <Ionicons name="ribbon-outline" size={16} color="#059669" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#065F46' }}>
                      Grade: {item.mySubmission.grade} / {item.maxMarks}
                    </Text>
                  </View>
                ) : null}

                <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>Due Date: {dueDate}</Text>
                
                <TouchableOpacity
                  style={[styles.continueBtn, { backgroundColor: isGraded ? '#F0FDF4' : '#EEF2FF' }]}
                  onPress={() => navigation?.navigate('AssignmentDetail', { assignmentId: item.id })}
                >
                  <Text style={[styles.continueBtnText, { color: isGraded ? '#059669' : '#4F46E5' }]}>
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
              <Text style={styles.emptyTitle}>No Certificates Yet</Text>
              <Text style={styles.emptySubtitle}>Complete a course 100% and request a certificate to see it here.</Text>
            </View>
          ) : (
            <>
              {/* Issued Certificates */}
              {certificates.map((cert) => (
                <View key={cert.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.courseTitle}>{cert.course?.title}</Text>
                    <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                      <Text style={{ color: '#059669', fontSize: 11, fontWeight: '700' }}>ISSUED</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
                    Issued on {new Date(cert.issueDate).toLocaleDateString()}
                  </Text>
                  <TouchableOpacity
                    style={[styles.continueBtn, { backgroundColor: '#EEF2FF' }]}
                    onPress={() => downloadCertificate(cert)}
                  >
                    <Text style={[styles.continueBtnText, { color: '#4F46E5' }]}>Download PDF 📄</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Pending Requests */}
              {completionRequests.map((req) => (
                <View key={req.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.courseTitle}>{req.course?.title}</Text>
                    <View style={{ backgroundColor: req.status === 'REJECTED' ? '#FEE2E2' : '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                      <Text style={{ color: req.status === 'REJECTED' ? '#DC2626' : '#D97706', fontSize: 11, fontWeight: '700' }}>{req.status}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
                    Requested on {new Date(req.requestedAt).toLocaleDateString()}
                  </Text>
                  {req.status === 'REJECTED' && req.rejectionReason && (
                    <View style={{ backgroundColor: '#FEF2F2', padding: 8, borderRadius: 6, marginBottom: 12 }}>
                      <Text style={{ fontSize: 13, color: '#991B1B' }}>
                        <Text style={{ fontWeight: 'bold' }}>Reason: </Text>
                        {req.rejectionReason}
                      </Text>
                    </View>
                  )}
                  {req.status === 'PENDING' && (
                    <Text style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' }}>Waiting for skill sharer to approve.</Text>
                  )}
                </View>
              ))}
            </>
          )}
        </ScrollView>
      ) : displayList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No courses found in this view</Text>
          <Text style={styles.emptySubtitle}>Explore the course catalog to enroll in new skills!</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => navigation?.navigate('CourseList')}>
            <Text style={styles.browseBtnText}>Explore Courses</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={activeTab === 'IN_PROGRESS' ? inProgressCourses : completedCourses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadMyLearning(); }} />
          }
          renderItem={({ item }) => {
            const course = item.course || {};
            const pct = item.progressPercentage ?? item.courseProgress?.progressPercentage ?? 80;
            const completedLessons = item.courseProgress?.completedLessons ?? 16;
            const totalLessons = item.courseProgress?.totalLessons ?? 20;

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
                    <Text style={styles.courseTitle}>{course.title || 'React Native Development'}</Text>
                    <View style={styles.creatorRow}>
                      <Text style={styles.creatorName}>{course.creator?.name || 'John Perera'}</Text>
                      {course.creator?.verifiedBadge && (
                        <View style={styles.verifiedBadge}>
                          <Text style={styles.verifiedText}>✓</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.lastAccessedText}>Last accessed: 2 hours ago</Text>
                  </View>
                </View>

                {/* Green Progress Track */}
                <View style={styles.progressSection}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.progressText}>
                    {completedLessons}/{totalLessons} lessons completed ({pct}%)
                  </Text>
                </View>

                {/* Continue Learning Button */}
                <TouchableOpacity
                  style={styles.continueBtn}
                  onPress={() =>
                    navigation?.navigate('CourseDetail', { courseId: item.courseId || course.id, course })
                  }
                >
                  <Text style={styles.continueBtnText}>Continue Learning</Text>
                </TouchableOpacity>
                {/* Action Buttons */}
                {issuedCert ? (
                  <View>
                    <TouchableOpacity
                      style={[styles.continueBtn, { backgroundColor: '#F0FDF4', marginBottom: 8 }]}
                      onPress={() => downloadCertificate(issuedCert)}
                    >
                      <Text style={[styles.continueBtnText, { color: '#059669', fontWeight: 'bold' }]}>
                        Download PDF 📄
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.continueBtn, { backgroundColor: '#F3F4F6' }]}
                      onPress={() => navigation?.navigate('CourseDetail', { courseId })}
                    >
                      <Text style={[styles.continueBtnText, { color: '#4B5563' }]}>
                        Review Course ✓
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : pendingReq ? (
                  <View>
                    <TouchableOpacity
                      style={[styles.continueBtn, { backgroundColor: '#FEF3C7', marginBottom: 8 }]}
                      onPress={() => setActiveTab('CERTIFICATES')}
                    >
                      <Text style={[styles.continueBtnText, { color: '#D97706', fontWeight: 'bold' }]}>
                        Certificate Request Pending ⏳
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.continueBtn, { backgroundColor: '#F3F4F6' }]}
                      onPress={() => navigation?.navigate('CourseDetail', { courseId })}
                    >
                      <Text style={[styles.continueBtnText, { color: '#4B5563' }]}>
                        Review Course ✓
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : percent >= 100 ? (
                  <View>
                    <TouchableOpacity
                      style={[styles.continueBtn, { backgroundColor: '#EEF2FF', marginBottom: 8 }]}
                      onPress={() => handleRequestCompletion(courseId)}
                    >
                      <Text style={[styles.continueBtnText, { color: '#4F46E5', fontWeight: 'bold' }]}>
                        {rejectedReq ? 'Resubmit Certificate Request 🏆' : 'Request Certificate 🏆'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.continueBtn, { backgroundColor: '#F3F4F6' }]}
                      onPress={() => navigation?.navigate('CourseDetail', { courseId })}
                    >
                      <Text style={[styles.continueBtnText, { color: '#4B5563' }]}>
                        Review Course ✓
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.continueBtn}
                    onPress={() => navigation?.navigate('CourseDetail', { courseId })}
                  >
                    <Text style={styles.continueBtnText}>
                      Continue Learning →
                    </Text>
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
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  tabSection: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
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
  cardThumbnail: { width: 56, height: 56, borderRadius: 14 },
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
  },
  continueBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  creatorText: { fontSize: 11, color: '#6B7280' },
  courseTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressText: { fontSize: 12, color: '#6B7280' },
  percentText: { fontSize: 13, fontWeight: 'bold', color: '#4F46E5' },
  progressBarBackground: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden', marginBottom: 16 },
  progressBarFill: { height: '100%', backgroundColor: '#4F46E5', borderRadius: 4 },
  continueBtn: { backgroundColor: '#F3F4F6', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  continueBtnText: { color: '#4F46E5', fontSize: 13, fontWeight: '700' },
  tabScrollContainer: { flexGrow: 0, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  recBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: '#F59E0B',
  },
  recBtnText: { fontSize: 11, fontWeight: '700', color: '#F59E0B' },
});
