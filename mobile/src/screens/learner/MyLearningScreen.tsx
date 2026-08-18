import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { fetchMyLearning } from '../../api/learner.service';

export default function MyLearningScreen({ navigation }: any) {
  const [inProgressCourses, setInProgressCourses] = useState<any[]>([]);
  const [completedCourses, setCompletedCourses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'IN_PROGRESS' | 'COMPLETED'>('IN_PROGRESS');
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

  useEffect(() => {
    loadMyLearning();
  }, []);

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
      </View>

      {/* Course List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading your learning dashboard...</Text>
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
});
