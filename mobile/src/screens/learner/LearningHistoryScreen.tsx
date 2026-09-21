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
  RefreshControl,
  Platform,
} from 'react-native';
import { fetchLearningHistory } from '../../api/learner.service';
import { COLORS } from '../../theme/colors';

export default function LearningHistoryScreen({ navigation }: any) {
  const [historyData, setHistoryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'LESSONS' | 'COURSES' | 'CERTIFICATES'>('ALL');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchLearningHistory();
      if (res) {
        setHistoryData(res);
      }
    } catch (err) {
      console.log('Error fetching learning history from API, using demo data:', err);
      setHistoryData({
        stats: {
          totalCoursesEnrolled: 3,
          completedCoursesCount: 1,
          inProgressCoursesCount: 2,
          completedLessonsCount: 23,
          totalHoursLearned: 14.5,
          learningStreakDays: 7,
        },
        history: [
          {
            id: 'h1',
            activityType: 'COMPLETED_LESSON',
            description: 'Completed lesson: State Management with Hooks in React Native',
            createdAt: '2026-09-20T14:30:00Z',
            category: 'Mobile Development',
          },
          {
            id: 'h2',
            activityType: 'PASSED_QUIZ',
            description: 'Passed assessment: React Native Fundamentals Quiz (90%)',
            createdAt: '2026-09-18T10:15:00Z',
            category: 'Mobile Development',
          },
          {
            id: 'h3',
            activityType: 'ENROLLED_COURSE',
            description: 'Enrolled in: UX Micro-interactions & Motion Design',
            createdAt: '2026-09-15T09:00:00Z',
            category: 'Arts & Design',
          },
          {
            id: 'h4',
            activityType: 'COMPLETED_COURSE',
            description: 'Earned Certificate: UI/UX Design Masterclass',
            createdAt: '2026-09-10T16:45:00Z',
            category: 'Arts & Design',
          },
        ],
        completedCourses: [
          {
            id: 'c3',
            title: 'UI/UX Design Masterclass',
            category: { name: 'Arts & Design' },
            creator: { name: 'Elena Rostova' },
          },
        ],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = historyData?.stats || {
    totalCoursesEnrolled: 3,
    completedCoursesCount: 1,
    inProgressCoursesCount: 2,
    completedLessonsCount: 23,
    totalHoursLearned: 14.5,
    learningStreakDays: 7,
  };

  const logs = historyData?.history || [];

  const filteredLogs = logs.filter((item: any) => {
    if (activeFilter === 'LESSONS') return item.activityType === 'COMPLETED_LESSON' || item.activityType === 'VIEWED_LESSON';
    if (activeFilter === 'COURSES') return item.activityType === 'ENROLLED_COURSE' || item.activityType === 'COMPLETED_COURSE';
    if (activeFilter === 'CERTIFICATES') return item.activityType === 'COMPLETED_COURSE' || item.description?.includes('Certificate');
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />

      {/* Top Header Navigation */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.circleBtn} onPress={() => navigation?.goBack()}>
          <Text style={styles.circleBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Learning History & Growth</Text>
        <TouchableOpacity style={styles.circleBtn} onPress={loadData}>
          <Text style={styles.circleBtnText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Fetching your learning logs...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={true}
          persistentScrollbar={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadData();
              }}
              tintColor={COLORS.primary}
            />
          }
        >
          <View style={styles.contentPadding}>
            {/* Growth Overview Banner */}
            <View style={styles.growthBanner}>
              <View style={styles.growthBannerTop}>
                <View>
                  <Text style={styles.growthBannerTitle}>Learning Streak 🔥</Text>
                  <Text style={styles.growthBannerSub}>You are on a {stats.learningStreakDays}-day learning streak!</Text>
                </View>
                <View style={styles.streakBadgePill}>
                  <Text style={styles.streakBadgeText}>🔥 {stats.learningStreakDays} Days</Text>
                </View>
              </View>

              {/* 4 Stats Metric Box */}
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{stats.completedCoursesCount}</Text>
                  <Text style={styles.statLbl}>Completed</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{stats.inProgressCoursesCount}</Text>
                  <Text style={styles.statLbl}>In Progress</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{stats.completedLessonsCount}</Text>
                  <Text style={styles.statLbl}>Lessons</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{stats.totalHoursLearned}h</Text>
                  <Text style={styles.statLbl}>Total Time</Text>
                </View>
              </View>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterRow}>
              {(['ALL', 'LESSONS', 'COURSES', 'CERTIFICATES'] as const).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterPill, activeFilter === filter && styles.filterPillActive]}
                  onPress={() => setActiveFilter(filter)}
                >
                  <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                    {filter === 'ALL'
                      ? 'All Logs'
                      : filter === 'LESSONS'
                      ? 'Lessons'
                      : filter === 'COURSES'
                      ? 'Courses'
                      : 'Certificates'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Timeline Activity List */}
            <Text style={styles.sectionTitle}>Activity Timeline</Text>
            {filteredLogs.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📜</Text>
                <Text style={styles.emptyTitle}>No activity logs recorded yet</Text>
                <Text style={styles.emptySub}>As you complete lessons & courses, your activity history will appear here.</Text>
              </View>
            ) : (
              filteredLogs.map((item: any, idx: number) => {
                const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent';
                const timeStr = item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                const isCert = item.activityType === 'COMPLETED_COURSE' || item.description?.includes('Certificate');

                return (
                  <View key={item.id || idx} style={styles.timelineItem}>
                    {/* Left Icon Dot */}
                    <View style={[styles.timelineDot, isCert && { backgroundColor: COLORS.primary }]}>
                      <Text style={styles.timelineDotIcon}>{isCert ? '🏆' : item.activityType === 'PASSED_QUIZ' ? '⚡' : '📚'}</Text>
                    </View>

                    {/* Right Log Content */}
                    <View style={styles.timelineContentCard}>
                      <View style={styles.logHeaderRow}>
                        <Text style={styles.logCategoryTag}>{item.category || 'General Learning'}</Text>
                        <Text style={styles.logDateText}>{dateStr} {timeStr}</Text>
                      </View>
                      <Text style={styles.logDescription}>{item.description || item.activityType}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

      {/* Sticky Bottom Container with Footer Navigation Bar */}
      <View style={styles.bottomFixedContainer}>
        <View style={styles.footerNavBar}>
          <TouchableOpacity
            style={styles.footerTabItem}
            activeOpacity={0.8}
            onPress={() => navigation?.navigate('MainTabs', { screen: 'HomeTab' })}
          >
            <View style={styles.footerTabIconWrapper}>
              <Text style={styles.footerTabIcon}>🎓</Text>
            </View>
            <Text style={styles.footerTabLabel}>Learn</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.footerTabItem}
            activeOpacity={0.8}
            onPress={() => navigation?.navigate('MainTabs', { screen: 'CourseListTab' })}
          >
            <View style={styles.footerTabIconWrapper}>
              <Text style={styles.footerTabIcon}>🧭</Text>
            </View>
            <Text style={styles.footerTabLabel}>Explore</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.footerTabItem}
            activeOpacity={0.8}
            onPress={() => navigation?.navigate('MainTabs', { screen: 'MyLearningTab' })}
          >
            <View style={styles.footerTabIconWrapper}>
              <Text style={styles.footerTabIcon}>💬</Text>
            </View>
            <Text style={styles.footerTabLabel}>My Learning</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.footerTabItem}
            activeOpacity={0.8}
            onPress={() => navigation?.navigate('MainTabs', { screen: 'ProfileTab' })}
          >
            <View style={styles.footerTabIconWrapper}>
              <Text style={styles.footerTabIcon}>👤</Text>
            </View>
            <Text style={styles.footerTabLabel}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgWarm,
    ...Platform.select({
      web: {
        height: '100vh' as any,
        maxHeight: '100vh' as any,
        overflow: 'hidden' as any,
      },
    }),
  },
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: COLORS.neutralMedium },
  scrollContent: {
    flex: 1,
    ...Platform.select({
      web: {
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      },
    }),
  },
  contentPadding: { paddingHorizontal: 18, paddingTop: 10 },
  growthBanner: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
  },
  growthBannerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  growthBannerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  growthBannerSub: { fontSize: 12, color: 'rgba(255, 255, 255, 0.8)', marginTop: 2 },
  streakBadgePill: { backgroundColor: COLORS.badgeOrangeBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  streakBadgeText: { color: COLORS.primary, fontSize: 12, fontWeight: '800' },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statBox: { alignItems: 'center' },
  statVal: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  statLbl: { fontSize: 10, color: 'rgba(255, 255, 255, 0.75)', marginTop: 2 },
  statDivider: { width: 1, height: 22, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterPill: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  filterPillActive: { backgroundColor: COLORS.primaryDark, borderColor: COLORS.primaryDark },
  filterText: { fontSize: 12, fontWeight: '700', color: COLORS.neutralDark },
  filterTextActive: { color: COLORS.white },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.neutralDark, marginBottom: 12 },
  emptyState: { backgroundColor: COLORS.white, padding: 24, borderRadius: 20, alignItems: 'center', marginVertical: 20 },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: COLORS.neutralDark },
  emptySub: { fontSize: 12, color: COLORS.neutralMedium, textAlign: 'center', marginTop: 4 },
  timelineItem: { flexDirection: 'row', marginBottom: 12 },
  timelineDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.badgeOrangeBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 4,
  },
  timelineDotIcon: { fontSize: 14 },
  timelineContentCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  logHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  logCategoryTag: { fontSize: 11, fontWeight: '800', color: COLORS.primary },
  logDateText: { fontSize: 10, color: COLORS.neutralLight },
  logDescription: { fontSize: 13, fontWeight: '700', color: COLORS.neutralDark, lineHeight: 18 },
  bottomFixedContainer: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderWarm,
    elevation: 8,
    shadowColor: COLORS.neutralDark,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  footerNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#F3E5DC',
    height: 58,
    paddingBottom: 4,
    paddingTop: 4,
  },
  footerTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  footerTabIconWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 12,
  },
  footerTabIcon: {
    fontSize: 18,
  },
  footerTabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.neutralMedium,
    marginTop: 2,
  },
});
