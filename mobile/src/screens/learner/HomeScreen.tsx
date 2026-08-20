import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  FlatList,
} from 'react-native';
import { fetchCourses, fetchMyLearning } from '../../api/learner.service';

export default function HomeScreen({ navigation }: any) {
  const [inProgress, setInProgress] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Technology');

  const loadHomeData = async () => {
    try {
      const [myLearningRes, coursesRes] = await Promise.all([
        fetchMyLearning().catch(() => null),
        fetchCourses().catch(() => null),
      ]);

      if (myLearningRes?.inProgress) {
        setInProgress(myLearningRes.inProgress);
      }
      if (coursesRes?.courses) {
        setCourses(coursesRes.courses);
      }
    } catch (err) {
      console.log('Error loading home data:', err);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  const continueItem = inProgress[0] || {
    id: 'e1',
    course: {
      title: 'React Native Development',
      creator: { name: 'John Perera', verifiedBadge: true },
      thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=600&q=80',
    },
    courseProgress: { completedLessons: 16, totalLessons: 20 },
  };

  const recommendedCourses = courses.length > 0 ? courses.slice(0, 4) : [
    {
      id: 'r1',
      title: 'UX Research Fundamentals',
      creatorName: 'Sarah Chen',
      verified: true,
      rating: 4.8,
      difficulty: 'Beginner',
      duration: '8h',
      enrolledCount: '1.2k',
      thumbnail: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'r2',
      title: 'Python for Data Science',
      creatorName: 'David Okafor',
      verified: true,
      rating: 4.9,
      difficulty: 'Intermediate',
      duration: '12h',
      enrolledCount: '3.4k',
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />

      <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.contentPadding}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greetingSub}>Good morning,</Text>
              <Text style={styles.greetingName}>Alex Morgan</Text>
            </View>
            <View style={styles.headerRightActions}>
              <TouchableOpacity style={styles.iconCircle}>
                <Text style={{ fontSize: 16 }}>🔔</Text>
              </TouchableOpacity>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
                }}
                style={styles.avatarHeader}
              />
            </View>
          </View>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="What do you want to learn?"
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => navigation?.navigate('CourseListTab', { search: searchQuery })}
            />
          </View>

          {/* Category Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {['Technology', 'Business', 'Arts', 'Construction'].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryPill, selectedCategory === cat && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Continue Learning Card */}
          <Text style={styles.sectionHeading}>Continue Learning</Text>
          <View style={styles.continueCard}>
            <Image source={{ uri: continueItem.course?.thumbnail || 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=600&q=80' }} style={styles.continueThumbnail} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.continueTitle}>{continueItem.course?.title || 'React Native Development'}</Text>
              <View style={styles.creatorRow}>
                <Text style={styles.creatorName}>{continueItem.course?.creator?.name || 'John Perera'}</Text>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓ Verified</Text>
                </View>
              </View>
              {/* Progress Track */}
              <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: '80%' }]} />
                </View>
                <Text style={styles.progressMeta}>
                  {continueItem.courseProgress?.completedLessons || 16}/{continueItem.courseProgress?.totalLessons || 20} lessons
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.playCircleBtn}
              onPress={() =>
                navigation?.navigate('CourseDetail', { courseId: continueItem.courseId || continueItem.course?.id })
              }
            >
              <Text style={styles.playIconText}>▶</Text>
            </TouchableOpacity>
          </View>

          {/* Recommended for You */}
          <Text style={styles.sectionHeading}>Recommended for You</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
            {recommendedCourses.map((c: any) => (
              <TouchableOpacity
                key={c.id}
                style={styles.recCard}
                onPress={() => navigation?.navigate('CourseDetail', { courseId: c.id, course: c })}
              >
                <Image source={{ uri: c.thumbnail || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80' }} style={styles.recThumbnail} />
                <View style={{ padding: 12 }}>
                  <Text style={styles.recTitle} numberOfLines={2}>{c.title}</Text>
                  <Text style={styles.recCreator}>{c.creatorName || c.creator?.name || 'Sarah Chen'}</Text>
                  <View style={styles.recFooter}>
                    <Text style={styles.recRating}>⭐ {c.rating || 4.8}</Text>
                    <View style={styles.diffBadge}>
                      <Text style={styles.diffText}>{c.difficulty || 'Beginner'}</Text>
                    </View>
                  </View>
                  <Text style={styles.recStats}>{c.duration || '8h'} • {c.enrolledCount || '1.2k'} learners</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Popular Courses */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Popular Courses</Text>
            <TouchableOpacity onPress={() => navigation?.navigate('CourseListTab')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  scrollContent: { flex: 1 },
  contentPadding: { paddingHorizontal: 20, paddingTop: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greetingSub: { fontSize: 13, color: '#64748B' },
  greetingName: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  headerRightActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarHeader: { width: 38, height: 38, borderRadius: 19 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A' },
  categoryScroll: { marginBottom: 20 },
  categoryPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  categoryPillActive: { backgroundColor: '#064E3B', borderColor: '#064E3B' },
  categoryText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  categoryTextActive: { color: '#FFFFFF' },
  sectionHeading: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 24,
  },
  continueThumbnail: { width: 64, height: 64, borderRadius: 14 },
  continueTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  creatorName: { fontSize: 12, color: '#64748B' },
  verifiedBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  verifiedText: { fontSize: 10, fontWeight: '700', color: '#15803D' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: { flex: 1, height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#064E3B', borderRadius: 3 },
  progressMeta: { fontSize: 11, color: '#94A3B8' },
  playCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  playIconText: { fontSize: 16, color: '#15803D', marginLeft: 2 },
  recCard: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    marginBottom: 20,
  },
  recThumbnail: { width: '100%', height: 110 },
  recTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', height: 38, marginBottom: 4 },
  recCreator: { fontSize: 12, color: '#64748B', marginBottom: 6 },
  recFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  recRating: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  diffBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  diffText: { fontSize: 10, color: '#475569', fontWeight: '600' },
  recStats: { fontSize: 11, color: '#94A3B8' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  seeAllText: { fontSize: 14, fontWeight: '700', color: '#064E3B' },
});
