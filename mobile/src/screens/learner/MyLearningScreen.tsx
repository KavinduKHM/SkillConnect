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
import { fetchMyLearning, fetchMyQuizzes } from '../../api/learner.service';

export default function MyLearningScreen({ navigation }: any) {
  const [inProgressCourses, setInProgressCourses] = useState<any[]>([]);
  const [completedCourses, setCompletedCourses] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'IN_PROGRESS' | 'COMPLETED' | 'ASSESSMENTS' | 'CERTIFICATES'>('IN_PROGRESS');
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Learning</Text>
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
});
