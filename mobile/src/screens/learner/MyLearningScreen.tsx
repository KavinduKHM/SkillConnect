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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { fetchMyLearning, fetchMyQuizzes } from '../../api/learner.service';

export default function MyLearningScreen({ navigation }: any) {
  const [inProgressCourses, setInProgressCourses] = useState<any[]>([]);
  const [completedCourses, setCompletedCourses] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
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
      const { fetchCourseAssignments, fetchLearnerSubmissions } = require('../../api/learner.service');
      
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
      // Fallback demo data if backend is offline
      setInProgressCourses([
        {
          id: 'e1',
          courseId: 'c1',
          progressPercentage: 80,
          course: {
            title: 'React Native & Mobile App Development',
            category: { name: 'Software Engineering' },
            creator: { name: 'Senior Dev John' },
          },
          courseProgress: { completedLessons: 16, totalLessons: 20 },
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

  const displayList = activeTab === 'IN_PROGRESS' ? inProgressCourses : completedCourses;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          <Text style={styles.backBtnText}>← Back to Browse</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Learning Dashboard 📊</Text>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScrollContainer}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'IN_PROGRESS' && styles.tabButtonActive]}
            onPress={() => setActiveTab('IN_PROGRESS')}
          >
            <Text style={[styles.tabText, activeTab === 'IN_PROGRESS' && styles.tabTextActive]}>
              In Progress ({inProgressCourses.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'COMPLETED' && styles.tabButtonActive]}
            onPress={() => setActiveTab('COMPLETED')}
          >
            <Text style={[styles.tabText, activeTab === 'COMPLETED' && styles.tabTextActive]}>
              Completed ({completedCourses.length})
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
            style={[styles.tabButton, activeTab === 'CERTIFICATES' && styles.tabButtonActive]}
            onPress={() => setActiveTab('CERTIFICATES')}
          >
            <Text style={[styles.tabText, activeTab === 'CERTIFICATES' && styles.tabTextActive]}>
              Certificates
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Course List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading your learning dashboard...</Text>
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
              <TouchableOpacity style={styles.browseBtn} onPress={() => navigation?.navigate('CourseList')}>
                <Text style={styles.browseBtnText}>Explore Courses</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const status = item.completions && item.completions.length > 0 ? item.completions[0].status : 'PENDING';
            const courseName = item.course?.title || 'Unknown Course';
            const dueDate = item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'No due date';

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.courseTitle}>{courseName}</Text>
                  <View style={{ backgroundColor: status === 'PENDING' ? '#FEF3C7' : '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                    <Text style={{ color: status === 'PENDING' ? '#D97706' : '#059669', fontSize: 11, fontWeight: '700' }}>
                      {status}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>Due Date: {dueDate}</Text>
                
                <TouchableOpacity
                  style={[styles.continueBtn, { backgroundColor: status === 'COMPLETED' ? '#F3F4F6' : '#EEF2FF' }]}
                  onPress={() => navigation?.navigate('AssessmentDetail', { assessment: item, status, courseName, dueDate, loadMyLearning })}
                >
                  <Text style={[styles.continueBtnText, { color: item.status === 'COMPLETED' ? '#6B7280' : '#4F46E5' }]}>
                    {item.status === 'COMPLETED' ? 'View Details' : 'Take Assessment →'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
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
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>My Certificates</Text>
          <Text style={styles.emptySubtitle}>Under construction by Member 3.</Text>
        </View>
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
          data={displayList}
          keyExtractor={(item) => item.id || item.courseId}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadMyLearning(); }} />
          }
          renderItem={({ item }) => {
            const course = item.course || {};
            const progress = item.courseProgress || { completedLessons: 0, totalLessons: 10 };
            const percent = Math.round(item.progressPercentage || 0);

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.categoryBadge}>{course.category?.name || 'General'}</Text>
                  <Text style={styles.creatorText}>Instructor: {course.creator?.name || 'Instructor'}</Text>
                </View>

                <Text style={styles.courseTitle}>{course.title || 'Course Title'}</Text>

                {/* Progress Stats */}
                <View style={styles.progressRow}>
                  <Text style={styles.progressText}>
                    {progress.completedLessons} / {progress.totalLessons || 10} lessons completed
                  </Text>
                  <Text style={styles.percentText}>{percent}%</Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
                </View>

                <TouchableOpacity
                  style={styles.continueBtn}
                  onPress={() =>
                    navigation?.navigate('CourseDetail', { courseId: item.courseId || item.course?.id })
                  }
                >
                  <Text style={styles.continueBtnText}>
                    {percent >= 100 ? 'Review Course ✓' : 'Continue Learning →'}
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
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 20, backgroundColor: '#4F46E5' },
  backBtn: { marginBottom: 8 },
  backBtnText: { color: '#EEF2FF', fontSize: 13, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabButtonActive: { backgroundColor: '#EEF2FF' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#4F46E5', fontWeight: '700' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#6B7280', fontSize: 14 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 16 },
  browseBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  browseBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  listContainer: { padding: 16, gap: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoryBadge: {
    backgroundColor: '#E0E7FF',
    color: '#3730A3',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
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
});
