import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Platform,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';
import { Header } from '../../components/common/Header';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { CourseCard } from '../../components/skill-sharer/CourseCard';
import { Button } from '../../components/common/Button';
import { courseApi } from '../../api/skill-sharer.service';
import { Course } from '../../types';
import { RADIUS, SHADOWS } from '../../theme/shadows';
import { COLORS } from '../../theme/colors';

type CourseFilter = 'ALL' | 'PUBLISHED' | 'DRAFT' | 'PENDING';

const courseFilters: { key: CourseFilter; label: string }[] = [
  { key: 'ALL', label: 'All courses' },
  { key: 'PUBLISHED', label: 'Published' },
  { key: 'DRAFT', label: 'Drafts' },
  { key: 'PENDING', label: 'In review' },
];

export const MyCoursesScreen: React.FC = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<CourseFilter>('ALL');

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await courseApi.getMyCourses();
      
      if (response && response.success && Array.isArray(response.data)) {
        setCourses(response.data);
      } else if (Array.isArray(response)) {
        setCourses(response);
      } else if (response && Array.isArray((response as any).data?.data)) {
        setCourses((response as any).data.data);
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCourses();
    }, [])
  );

  const handleCoursePress = (course: Course) => {
    navigation.navigate('CourseContent', { courseId: course.id });
  };

  const handleEdit = (course: Course) => {
    navigation.navigate('CourseCreator', { courseId: course.id });
  };

  const handleDelete = async (course: Course) => {
    if (course.status !== 'DRAFT') {
      Toast.show({ type: 'error', text1: 'Cannot Delete', text2: 'Only draft courses can be deleted.' });
      return;
    }

    const doDelete = async () => {
      try {
        const response = await courseApi.deleteCourse(course.id);
        if (response.success) {
          setCourses(prev => prev.filter((c) => c.id !== course.id));
          Toast.show({ type: 'success', text1: 'Success', text2: 'Course deleted successfully' });
        } else {
          Toast.show({ type: 'error', text1: 'Error', text2: response.error || 'Failed to delete course' });
        }
      } catch (error) {
        console.error('Error deleting course:', error);
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to delete course' });
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete "${course.title}"?`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Delete Course',
        `Are you sure you want to delete "${course.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: doDelete,
          },
        ]
      );
    }
  };

  const handleSubmit = async (course: Course) => {
    if (course.status !== 'DRAFT') {
      Toast.show({ type: 'info', text1: 'Already Submitted', text2: 'This course has already been submitted.' });
      return;
    }

    const doSubmit = async () => {
      try {
        const response = await courseApi.submitCourse(course.id);
        if (response.success) {
          // Update the course in the list
          setCourses(prev =>
            prev.map((c) =>
              c.id === course.id ? { ...c, status: 'SUBMITTED' } : c
            )
          );
          Toast.show({ type: 'success', text1: 'Success', text2: 'Course submitted for approval!' });
        } else {
          Toast.show({ type: 'error', text1: 'Error', text2: response.error || 'Failed to submit course' });
        }
      } catch (error) {
        console.error('Error submitting course:', error);
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to submit course' });
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to submit "${course.title}" for admin review?`)) {
        doSubmit();
      }
    } else {
      Alert.alert(
        'Submit for Approval',
        `Are you sure you want to submit "${course.title}" for admin review?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Submit',
            onPress: doSubmit,
          },
        ]
      );
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCourses();
    setRefreshing(false);
  };

  const publishedCount = courses.filter((course) => course.status === 'PUBLISHED').length;
  const draftCount = courses.filter((course) => course.status === 'DRAFT').length;
  const pendingCount = courses.filter((course) =>
    course.status === 'SUBMITTED' || course.status === 'UNDER_REVIEW'
  ).length;
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const visibleCourses = courses.filter((course) => {
    const matchesSearch = !normalizedSearch ||
      course.title.toLowerCase().includes(normalizedSearch) ||
      course.description?.toLowerCase().includes(normalizedSearch);
    const matchesFilter =
      activeFilter === 'ALL' ||
      (activeFilter === 'PUBLISHED' && course.status === 'PUBLISHED') ||
      (activeFilter === 'DRAFT' && course.status === 'DRAFT') ||
      (activeFilter === 'PENDING' && (course.status === 'SUBMITTED' || course.status === 'UNDER_REVIEW'));
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <LoadingSpinner message="Loading your courses..." />;
  }

  return (
    <View style={styles.container}>
      <Header
        title="My Courses"
        showBack
        onBackPress={() => navigation.navigate('Dashboard')}
        rightComponent={
          <Button
            title="Create"
            onPress={() => navigation.navigate('CourseCreator')}
            size="small"
            icon={<Ionicons name="add" size={17} color={COLORS.white} />}
          />
        }
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.pageContent}>
          <View style={styles.hero}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroIcon}>
                <Ionicons name="library" size={20} color={COLORS.white} />
              </View>
              <Text style={styles.heroEyebrow}>CREATOR STUDIO</Text>
              <View style={styles.totalPill}>
                <Ionicons name="albums-outline" size={13} color={COLORS.primary} />
                <Text style={styles.totalValue}>{courses.length}</Text>
                <Text style={styles.totalLabel}>{courses.length === 1 ? 'course' : 'courses'}</Text>
              </View>
            </View>
            <Text style={styles.heroTitle}>Your learning library</Text>
            <Text style={styles.heroSubtitle}>Build, refine, and share courses with your learners.</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, styles.statIconGreen]}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.badgeGreenText} />
                </View>
                <Text style={styles.statValue}>{publishedCount}</Text>
                <Text style={styles.statLabel}>Published</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statIcon, styles.statIconHoney]}>
                  <Ionicons name="document-text-outline" size={16} color={COLORS.honeyText} />
                </View>
                <Text style={styles.statValue}>{draftCount}</Text>
                <Text style={styles.statLabel}>Drafts</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statIcon, styles.statIconReview]}>
                  <Ionicons name="time-outline" size={16} color={COLORS.primary} />
                </View>
                <Text style={styles.statValue}>{pendingCount}</Text>
                <Text style={styles.statLabel}>In review</Text>
              </View>
            </View>
          </View>
          <View style={styles.listHeading}>
            <View>
              <Text style={styles.sectionTitle}>Your courses</Text>
              <Text style={styles.sectionSubtitle}>Manage your course content and performance</Text>
            </View>
            <View style={styles.resultCount}>
              <Text style={styles.resultCountText}>{visibleCourses.length} shown</Text>
            </View>
          </View>

          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color={COLORS.neutralMedium} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search your courses"
              placeholderTextColor={COLORS.neutralLight}
              style={styles.searchInput}
              returnKeyType="search"
              accessibilityLabel="Search courses"
            />
            {!!searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery('')} accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={18} color={COLORS.neutralLight} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}
          >
            {courseFilters.map((filter) => {
              const active = activeFilter === filter.key;
              const count = filter.key === 'ALL'
                ? courses.length
                : filter.key === 'PUBLISHED'
                  ? publishedCount
                  : filter.key === 'DRAFT'
                    ? draftCount
                    : pendingCount;
              return (
                <TouchableOpacity
                  key={filter.key}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setActiveFilter(filter.key)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {filter.label}
                  </Text>
                  <Text style={[styles.filterCount, active && styles.filterCountActive]}>{count}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {courses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="albums-outline" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyText}>Your next great course starts here</Text>
              <Text style={styles.emptySubtext}>
                Create a course, add your lessons, and share what you know.
              </Text>
              <Button
                title="Create your first course"
                onPress={() => navigation.navigate('CourseCreator')}
                size="small"
                style={styles.emptyCreateButton}
                icon={<Ionicons name="add" size={17} color={COLORS.white} />}
              />
            </View>
          ) : visibleCourses.length === 0 ? (
            <View style={styles.noResults}>
              <Ionicons name="search-outline" size={22} color={COLORS.neutralLight} />
              <Text style={styles.noResultsTitle}>No matching courses</Text>
              <Text style={styles.emptySubtext}>Try another search or status filter.</Text>
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setActiveFilter('ALL');
                }}
                style={styles.clearFilters}
              >
                <Text style={styles.clearFiltersText}>Clear filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            visibleCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onPress={() => handleCoursePress(course)}
                onEdit={() => handleEdit(course)}
                onDelete={() => handleDelete(course)}
                onSubmit={() => handleSubmit(course)}
                onViewReviews={() => navigation.navigate('CourseReview', {
                  courseId: course.id,
                  courseTitle: course.title,
                })}
                onViewAnalytics={() => navigation.navigate('CourseAnalytics', {
                  courseId: course.id,
                })}
              />
            ))
          )}
        </View>
        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
};

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
  scrollView: {
    flex: 1,
    minHeight: 0,
    backgroundColor: COLORS.bgWarm,
    ...Platform.select({
      web: {
        overflowY: 'auto' as any,
        WebkitOverflowScrolling: 'touch' as any,
      },
    }),
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 40,
  },
  pageContent: { paddingHorizontal: 16 },
  hero: {
    overflow: 'hidden',
    backgroundColor: COLORS.primaryDark,
    borderRadius: RADIUS.xl,
    padding: 18,
    marginBottom: 23,
    ...SHADOWS.level1,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  heroIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  heroEyebrow: { flex: 1, color: '#F8D8C7', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  totalPill: { flexDirection: 'row', alignItems: 'center', columnGap: 5, backgroundColor: '#FFFDF9', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 6 },
  totalValue: { color: COLORS.primary, fontSize: 12, fontWeight: '800' },
  totalLabel: { color: COLORS.neutralMedium, fontSize: 10 },
  heroTitle: { color: COLORS.white, fontSize: 22, lineHeight: 28, fontWeight: '700' },
  heroSubtitle: { color: '#F4DCD1', fontSize: 12, lineHeight: 18, marginTop: 4 },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.17)' },
  statItem: { flex: 1, alignItems: 'center' },
  statIcon: { width: 29, height: 29, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statIconGreen: { backgroundColor: 'rgba(220,252,231,0.16)' },
  statIconHoney: { backgroundColor: 'rgba(254,248,236,0.16)' },
  statIconReview: { backgroundColor: 'rgba(252,238,230,0.16)' },
  statValue: { color: COLORS.white, fontSize: 17, fontWeight: '700' },
  statLabel: { color: '#F4DCD1', fontSize: 10, marginTop: 2 },
  statDivider: { height: 46, width: 1, backgroundColor: 'rgba(255,255,255,0.18)' },
  listHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: COLORS.neutralDark, fontSize: 18, fontWeight: '700' },
  sectionSubtitle: { color: COLORS.neutralMedium, fontSize: 11, marginTop: 3 },
  resultCount: { backgroundColor: COLORS.surfaceMuted, borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 6 },
  resultCountText: { color: COLORS.neutralMedium, fontSize: 10, fontWeight: '600' },
  searchBar: { height: 46, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderSubtle, backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.md, paddingHorizontal: 13, marginBottom: 12 },
  searchInput: { flex: 1, marginLeft: 9, paddingVertical: 0, color: COLORS.neutralDark, fontSize: 13, outlineStyle: 'none' as any },
  filtersRow: { flexDirection: 'row', columnGap: 8, paddingBottom: 15 },
  filterChip: { flexDirection: 'row', alignItems: 'center', columnGap: 7, borderWidth: 1, borderColor: COLORS.borderSubtle, backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 8 },
  filterChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  filterChipText: { color: COLORS.neutralMedium, fontSize: 11, fontWeight: '600' },
  filterChipTextActive: { color: COLORS.white },
  filterCount: { overflow: 'hidden', color: COLORS.neutralMedium, backgroundColor: COLORS.surfaceMuted, borderRadius: RADIUS.full, paddingHorizontal: 5, paddingVertical: 1, fontSize: 9, fontWeight: '700' },
  filterCountActive: { color: COLORS.primary, backgroundColor: COLORS.white },
  emptyContainer: {
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 32,
    ...SHADOWS.level1,
  },
  emptyIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: COLORS.badgeOrangeBg, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.neutralDark,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.neutralMedium,
    marginTop: 6,
    textAlign: 'center',
  },
  emptyCreateButton: { marginTop: 17 },
  noResults: { alignItems: 'center', backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg, paddingVertical: 28, paddingHorizontal: 20, borderWidth: 1, borderColor: COLORS.borderSubtle },
  noResultsTitle: { color: COLORS.neutralDark, fontSize: 14, fontWeight: '700', marginTop: 8 },
  clearFilters: { marginTop: 12, paddingVertical: 5, paddingHorizontal: 8 },
  clearFiltersText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  footer: {
    height: 20,
  },
});