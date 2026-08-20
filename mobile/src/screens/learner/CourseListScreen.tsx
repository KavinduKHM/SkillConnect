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
  Image,
} from 'react-native';
import { fetchCourses, fetchCategories } from '../../api/learner.service';

const DEMO_COURSES = [
  {
    id: 'c1',
    title: 'React Native Development',
    description: 'Master cross-platform mobile development using React Native, Expo, and TypeScript.',
    category: { name: 'Technology' },
    difficulty: 'Beginner',
    duration: '20h',
    rating: 4.8,
    enrolledCount: '3.4k',
    creator: { id: 's1', name: 'John Perera', verifiedBadge: true },
    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'c2',
    title: 'Web Development Bootcamp',
    description: 'Fullstack web development with React, Node.js, Express, and modern databases.',
    category: { name: 'Technology' },
    difficulty: 'Beginner',
    duration: '20h',
    rating: 4.7,
    enrolledCount: '1.4k',
    creator: { id: 's2', name: 'Maria Santos', verifiedBadge: true },
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'c3',
    title: 'Digital Photography Masterclass',
    description: 'Learn composition, lighting, camera controls, and digital photo editing.',
    category: { name: 'Arts' },
    difficulty: 'All Levels',
    duration: '10h',
    rating: 4.6,
    enrolledCount: '1.4k',
    creator: { id: 's3', name: 'James Wilson', verifiedBadge: false },
    thumbnail: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'c4',
    title: 'Business Analytics',
    description: 'Data analytics, visualization, dashboard building, and business insights.',
    category: { name: 'Business' },
    difficulty: 'Intermediate',
    duration: '15h',
    rating: 4.8,
    enrolledCount: '1.4k',
    creator: { id: 's4', name: 'Priya Sharma', verifiedBadge: true },
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'c5',
    title: 'Graphic Design Essentials',
    description: 'Color theory, typography, branding, and digital illustration workflow.',
    category: { name: 'Arts' },
    difficulty: 'Beginner',
    duration: '8h',
    rating: 4.5,
    enrolledCount: '1.4k',
    creator: { id: 's5', name: 'Aisha Mohammed', verifiedBadge: false },
    thumbnail: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=600&q=80',
  },
];

export default function CourseListScreen({ navigation }: any) {
  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
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
    const matchesCat = selectedCategory === 'All' || course.category?.name === selectedCategory || course.categoryId === selectedCategory;
    const matchesDiff = selectedDifficulty === 'All' || course.difficulty === selectedDifficulty;
    return matchesSearch && matchesCat && matchesDiff;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />

      {/* Main Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for courses, skills..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
          />
        </View>
      </View>

      {/* Dropdown Filters & Active Tags */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dropdownScroll}>
          <TouchableOpacity
            style={[styles.dropdownPill, selectedCategory !== 'All' && styles.dropdownPillActive]}
            onPress={() => setSelectedCategory(selectedCategory === 'All' ? 'Technology' : 'All')}
          >
            <Text style={[styles.dropdownText, selectedCategory !== 'All' && styles.dropdownTextActive]}>
              Category ▾
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dropdownPill, selectedDifficulty !== 'All' && styles.dropdownPillActive]}
            onPress={() => setSelectedDifficulty(selectedDifficulty === 'All' ? 'Beginner' : 'All')}
          >
            <Text style={[styles.dropdownText, selectedDifficulty !== 'All' && styles.dropdownTextActive]}>
              Difficulty ▾
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dropdownPill}>
            <Text style={styles.dropdownText}>Duration ▾</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dropdownPill}>
            <Text style={styles.dropdownText}>Rating ▾</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Active Filter Tags */}
        {(selectedCategory !== 'All' || selectedDifficulty !== 'All') && (
          <View style={styles.activeTagsRow}>
            {selectedCategory !== 'All' && (
              <TouchableOpacity
                style={styles.activeTag}
                onPress={() => setSelectedCategory('All')}
              >
                <Text style={styles.activeTagText}>{selectedCategory} ⊗</Text>
              </TouchableOpacity>
            )}
            {selectedDifficulty !== 'All' && (
              <TouchableOpacity
                style={styles.activeTag}
                onPress={() => setSelectedDifficulty('All')}
              >
                <Text style={styles.activeTagText}>{selectedDifficulty} ⊗</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => {
                setSelectedCategory('All');
                setSelectedDifficulty('All');
              }}
            >
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Course Cards Grid */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#064E3B" />
          <Text style={styles.loadingText}>Loading courses...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCourses}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.gridContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.courseCard}
              activeOpacity={0.9}
              onPress={() => navigation?.navigate('CourseDetail', { courseId: item.id, course: item })}
            >
              {/* Image Banner */}
              <Image
                source={{ uri: item.thumbnail || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80' }}
                style={styles.cardImage}
              />

              <View style={styles.cardBody}>
                <Text style={styles.courseTitle} numberOfLines={2}>
                  {item.title}
                </Text>

                {/* Instructor Row */}
                <TouchableOpacity
                  style={styles.instructorRow}
                  onPress={() =>
                    navigation?.navigate('SkillSharerProfile', {
                      sharerId: item.creator?.id,
                      sharerName: item.creator?.name || item.creatorName,
                    })
                  }
                >
                  <Text style={styles.instructorName} numberOfLines={1}>
                    {item.creator?.name || item.creatorName || 'Instructor'}
                  </Text>
                  {(item.creator?.verifiedBadge || item.verified) && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>✓ Verified</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Rating & Level Row */}
                <View style={styles.metaRow}>
                  <Text style={styles.ratingText}>⭐ {item.rating || 4.8}</Text>
                  <View style={styles.difficultyBadge}>
                    <Text style={styles.difficultyText}>{item.difficulty || 'Beginner'}</Text>
                  </View>
                </View>

                {/* Duration & Learners */}
                <Text style={styles.statsText}>
                  {item.duration || '20h'} • {item.enrolledCount || '1.4k'} learners
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  searchSection: { paddingHorizontal: 20, marginBottom: 12 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A' },
  filterSection: { paddingBottom: 12 },
  dropdownScroll: { paddingHorizontal: 20, gap: 8 },
  dropdownPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dropdownPillActive: { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
  dropdownText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  dropdownTextActive: { color: '#166534' },
  activeTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    gap: 8,
  },
  activeTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeTagText: { fontSize: 12, fontWeight: '700', color: '#15803D' },
  clearAllText: { fontSize: 12, color: '#64748B', fontWeight: '600', marginLeft: 4 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#64748B' },
  gridContainer: { paddingHorizontal: 16, paddingBottom: 40 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 16 },
  courseCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImage: { width: '100%', height: 120, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  cardBody: { padding: 12 },
  courseTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', lineHeight: 18, marginBottom: 6 },
  instructorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  instructorName: { fontSize: 12, color: '#64748B', flexShrink: 1 },
  verifiedBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  verifiedText: { fontSize: 10, fontWeight: '700', color: '#15803D' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  difficultyBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  difficultyText: { fontSize: 10, color: '#475569', fontWeight: '600' },
  statsText: { fontSize: 11, color: '#94A3B8' },
});
