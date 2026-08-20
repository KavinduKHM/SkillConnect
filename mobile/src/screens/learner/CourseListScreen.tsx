import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { fetchCourses, fetchCategories } from '../../api/learner.service';

const DEMO_COURSES = [
  {
    id: 'c1',
    title: 'React Native & Mobile App Development',
    description: 'Build cross-platform iOS & Android mobile apps with modern React Native and TypeScript.',
    category: { name: 'Software Engineering' },
    difficulty: 'BEGINNER',
    duration: '12 Hours',
    rating: 4.8,
    enrolledCount: 142,
    creator: { name: 'Senior Dev John', verifiedBadge: true },
  },
  {
    id: 'c2',
    title: 'Fullstack Web Development with Node.js & PostgreSQL',
    description: 'Master RESTful API design, database schemas, authentication, and backend architecture.',
    category: { name: 'Web Development' },
    difficulty: 'INTERMEDIATE',
    duration: '18 Hours',
    rating: 4.9,
    enrolledCount: 215,
    creator: { name: 'Tech Lead Sarah', verifiedBadge: true },
  },
  {
    id: 'c3',
    title: 'UI/UX Design Systems & Mobile Prototyping',
    description: 'Learn modern design principles, color theory, accessibility, and component styling.',
    category: { name: 'Design & Arts' },
    difficulty: 'BEGINNER',
    duration: '8 Hours',
    rating: 4.7,
    enrolledCount: 98,
    creator: { name: 'Alex Rivera', verifiedBadge: false },
  },
];

export default function CourseListScreen({ navigation }: any) {
  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [coursesData, categoriesData] = await Promise.all([
        fetchCourses(searchQuery, selectedCategory === 'All' ? undefined : selectedCategory),
        fetchCategories().catch(() => []),
      ]);

      const fetchedList = coursesData?.courses || [];
      setCourses(fetchedList.length > 0 ? fetchedList : DEMO_COURSES);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.log('Error fetching live courses, using fallbacks:', error);
      setCourses(DEMO_COURSES);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const handleSearchSubmit = () => {
    loadData();
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      !searchQuery ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Component 2 • Learner Portal</Text>
          <Text style={styles.headerTitle}>Explore Courses 🎓</Text>
        </View>
        <TouchableOpacity
          style={styles.myLearningBtn}
          onPress={() => navigation?.navigate('MyLearning')}
        >
          <Text style={styles.myLearningBtnText}>My Learning</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title, topic or skill..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchSubmit}
        />
      </View>

      {/* Categories */}
      <View style={styles.categoryWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          <TouchableOpacity
            style={[styles.categoryPill, selectedCategory === 'All' && styles.categoryPillActive]}
            onPress={() => setSelectedCategory('All')}
          >
            <Text style={[styles.categoryText, selectedCategory === 'All' && styles.categoryTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {categories.map((cat: any) => (
            <TouchableOpacity
              key={cat.id || cat.name}
              style={[styles.categoryPill, selectedCategory === cat.id && styles.categoryPillActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Course List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading courses...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCourses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.courseCard}
              activeOpacity={0.85}
              onPress={() => navigation?.navigate('CourseDetail', { courseId: item.id, course: item })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.badgeDifficulty}>{item.difficulty || 'BEGINNER'}</Text>
                <Text style={styles.ratingText}>⭐ {item.rating || 4.8}</Text>
              </View>

              <Text style={styles.courseTitle}>{item.title}</Text>
              <Text style={styles.courseDescription} numberOfLines={2}>
                {item.description}
              </Text>

              <TouchableOpacity
                style={styles.creatorRow}
                onPress={() =>
                  navigation?.navigate('SkillSharerProfile', {
                    sharerId: item.creator?.id,
                    sharerName: item.creator?.name || item.creatorName,
                  })
                }
              >
                <Text style={styles.creatorName}>By {item.creator?.name || item.creatorName || 'Instructor'}</Text>
                {(item.creator?.verifiedBadge || item.verified) && (
                  <Text style={styles.verifiedBadge}>✓ Verified Sharer</Text>
                )}
              </TouchableOpacity>

              <View style={styles.cardFooter}>
                <Text style={styles.metaText}>⏱️ {item.duration || '10 Hours'}</Text>
                <Text style={styles.metaText}>👥 {item.enrolledCount || 0} learners</Text>
                <Text style={styles.viewDetailText}>View Details →</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    padding: 20,
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerSubtitle: { color: '#EEF2FF', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold', marginTop: 2 },
  myLearningBtn: { backgroundColor: '#6366F1', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  myLearningBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF' },
  searchInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  categoryWrapper: { backgroundColor: '#FFFFFF', paddingBottom: 12 },
  categoryScroll: { paddingHorizontal: 16, gap: 8 },
  categoryPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
  categoryPillActive: { backgroundColor: '#4F46E5' },
  categoryText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  categoryTextActive: { color: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#6B7280', fontSize: 14 },
  listContainer: { padding: 16, gap: 16 },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  badgeDifficulty: {
    backgroundColor: '#E0E7FF',
    color: '#3730A3',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: { fontSize: 13, fontWeight: '700', color: '#D97706' },
  courseTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 6 },
  courseDescription: { fontSize: 13, color: '#6B7280', lineHeight: 18, marginBottom: 12 },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  creatorName: { fontSize: 12, fontWeight: '600', color: '#374151' },
  verifiedBadge: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  metaText: { fontSize: 12, color: '#6B7280' },
  viewDetailText: { fontSize: 12, fontWeight: '700', color: '#4F46E5' },
});
