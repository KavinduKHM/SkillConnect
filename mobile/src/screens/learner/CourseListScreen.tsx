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
  Modal,
} from 'react-native';
import { fetchCourses, fetchCategories } from '../../api/learner.service';

const DEMO_COURSES = [
  {
    id: 'c1',
    title: 'React Native Development',
    description: 'Master cross-platform mobile development using React Native, Expo, and TypeScript.',
    category: { name: 'Mobile Development' },
    difficulty: 'BEGINNER',
    duration: '5 weeks',
    rating: 4.8,
    enrolledCount: '154',
    creator: { id: 's1', name: 'John Perera', verifiedBadge: true },
    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'c2',
    title: 'Full-Stack Web Development with React & Node.js',
    description: 'Fullstack web development with React, Node.js, Express, PostgreSQL, and Prisma.',
    category: { name: 'Web Development' },
    difficulty: 'BEGINNER',
    duration: '8 weeks',
    rating: 4.9,
    enrolledCount: '99',
    creator: { id: 's2', name: 'John Perera', verifiedBadge: true },
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'c3',
    title: 'UI/UX Design Masterclass: Figma to Mobile UI',
    description: 'Learn design systems, wireframing, mobile UI components, and Figma prototypes.',
    category: { name: 'Software Engineering' },
    difficulty: 'BEGINNER',
    duration: '4 weeks',
    rating: 4.7,
    enrolledCount: '210',
    creator: { id: 's3', name: 'Dr. Sarah Jenkins', verifiedBadge: true },
    thumbnail: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=600&q=80',
  },
];

export default function CourseListScreen({ navigation }: any) {
  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedDuration, setSelectedDuration] = useState('All');
  const [selectedRating, setSelectedRating] = useState('All');

  const [activeModal, setActiveModal] = useState<'CATEGORY' | 'DIFFICULTY' | 'DURATION' | 'RATING' | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [coursesData, categoriesData] = await Promise.all([
        fetchCourses(
          searchQuery,
          selectedCategory === 'All' ? undefined : selectedCategory,
          selectedDifficulty === 'All' ? undefined : selectedDifficulty
        ),
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
  }, [selectedCategory, selectedDifficulty]);

  const handleSearchSubmit = () => {
    loadData();
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      !searchQuery ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCat =
      selectedCategory === 'All' ||
      course.category?.name === selectedCategory ||
      course.categoryId === selectedCategory;

    const matchesDiff =
      selectedDifficulty === 'All' ||
      course.difficulty?.toUpperCase() === selectedDifficulty.toUpperCase();

    const matchesDuration =
      selectedDuration === 'All' ||
      (() => {
        const durStr = (course.duration || '').toLowerCase();
        const match = durStr.match(/(\d+)/);
        if (!match) return true;
        const num = parseInt(match[1], 10);
        const isHours = durStr.includes('hour');
        const weeks = isHours ? Math.ceil(num / 40) : num;
        if (selectedDuration === 'Short (< 5 wks)') return weeks < 5;
        if (selectedDuration === 'Long (5+ wks)') return weeks >= 5;
        return true;
      })();

    const matchesRating =
      selectedRating === 'All' ||
      (selectedRating === '4.8+' && (course.rating || 4.8) >= 4.8) ||
      (selectedRating === '4.5+' && (course.rating || 4.8) >= 4.5);

    return matchesSearch && matchesCat && matchesDiff && matchesDuration && matchesRating;
  });

  const clearAllFilters = () => {
    setSelectedCategory('All');
    setSelectedDifficulty('All');
    setSelectedDuration('All');
    setSelectedRating('All');
    setSearchQuery('');
  };

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
            onPress={() => setActiveModal('CATEGORY')}
          >
            <Text style={[styles.dropdownText, selectedCategory !== 'All' && styles.dropdownTextActive]}>
              Category: {selectedCategory === 'All' ? 'All' : selectedCategory} ▾
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dropdownPill, selectedDifficulty !== 'All' && styles.dropdownPillActive]}
            onPress={() => setActiveModal('DIFFICULTY')}
          >
            <Text style={[styles.dropdownText, selectedDifficulty !== 'All' && styles.dropdownTextActive]}>
              Difficulty: {selectedDifficulty === 'All' ? 'All' : selectedDifficulty} ▾
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dropdownPill, selectedDuration !== 'All' && styles.dropdownPillActive]}
            onPress={() => setActiveModal('DURATION')}
          >
            <Text style={[styles.dropdownText, selectedDuration !== 'All' && styles.dropdownTextActive]}>
              Duration: {selectedDuration === 'All' ? 'All' : selectedDuration} ▾
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dropdownPill, selectedRating !== 'All' && styles.dropdownPillActive]}
            onPress={() => setActiveModal('RATING')}
          >
            <Text style={[styles.dropdownText, selectedRating !== 'All' && styles.dropdownTextActive]}>
              Rating: {selectedRating === 'All' ? 'All' : selectedRating} ▾
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Active Filter Tags */}
        {(selectedCategory !== 'All' || selectedDifficulty !== 'All' || selectedDuration !== 'All' || selectedRating !== 'All') && (
          <View style={styles.activeTagsRow}>
            {selectedCategory !== 'All' && (
              <TouchableOpacity style={styles.activeTag} onPress={() => setSelectedCategory('All')}>
                <Text style={styles.activeTagText}>{selectedCategory} ⊗</Text>
              </TouchableOpacity>
            )}
            {selectedDifficulty !== 'All' && (
              <TouchableOpacity style={styles.activeTag} onPress={() => setSelectedDifficulty('All')}>
                <Text style={styles.activeTagText}>{selectedDifficulty} ⊗</Text>
              </TouchableOpacity>
            )}
            {selectedDuration !== 'All' && (
              <TouchableOpacity style={styles.activeTag} onPress={() => setSelectedDuration('All')}>
                <Text style={styles.activeTagText}>{selectedDuration} ⊗</Text>
              </TouchableOpacity>
            )}
            {selectedRating !== 'All' && (
              <TouchableOpacity style={styles.activeTag} onPress={() => setSelectedRating('All')}>
                <Text style={styles.activeTagText}>{selectedRating} ⭐ ⊗</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={clearAllFilters}>
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
          style={{ flex: 1 }}
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
                    <Text style={styles.difficultyText}>{item.difficulty || 'BEGINNER'}</Text>
                  </View>
                </View>

                {/* Duration & Learners */}
                <Text style={styles.statsText}>
                  {item.duration || '5 weeks'} • {item.enrolledCount || '154'} learners
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* FILTER SELECTION MODALS */}
      <Modal visible={!!activeModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setActiveModal(null)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Select {activeModal === 'CATEGORY' ? 'Category' : activeModal === 'DIFFICULTY' ? 'Difficulty' : activeModal === 'DURATION' ? 'Duration' : 'Rating'}
            </Text>

            {activeModal === 'CATEGORY' && (
              <View style={styles.optionList}>
                {(categories.length > 0
                  ? ['All', ...Array.from(new Set(categories.map((c) => (typeof c === 'string' ? c : c.name))))]
                  : ['All', 'Web Development', 'Mobile Development', 'Software Engineering', 'Arts & Design', 'Business']
                ).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={styles.optionItem}
                    onPress={() => {
                      setSelectedCategory(cat);
                      setActiveModal(null);
                    }}
                  >
                    <Text style={[styles.optionText, selectedCategory === cat && styles.optionTextActive]}>
                      {cat}
                    </Text>
                    {selectedCategory === cat && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {activeModal === 'DIFFICULTY' && (
              <View style={styles.optionList}>
                {['All', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((diff) => (
                  <TouchableOpacity
                    key={diff}
                    style={styles.optionItem}
                    onPress={() => {
                      setSelectedDifficulty(diff);
                      setActiveModal(null);
                    }}
                  >
                    <Text style={[styles.optionText, selectedDifficulty === diff && styles.optionTextActive]}>
                      {diff}
                    </Text>
                    {selectedDifficulty === diff && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {activeModal === 'DURATION' && (
              <View style={styles.optionList}>
                {['All', 'Short (< 5 wks)', 'Long (5+ wks)'].map((dur) => (
                  <TouchableOpacity
                    key={dur}
                    style={styles.optionItem}
                    onPress={() => {
                      setSelectedDuration(dur);
                      setActiveModal(null);
                    }}
                  >
                    <Text style={[styles.optionText, selectedDuration === dur && styles.optionTextActive]}>
                      {dur}
                    </Text>
                    {selectedDuration === dur && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {activeModal === 'RATING' && (
              <View style={styles.optionList}>
                {['All', '4.8+', '4.5+'].map((rat) => (
                  <TouchableOpacity
                    key={rat}
                    style={styles.optionItem}
                    onPress={() => {
                      setSelectedRating(rat);
                      setActiveModal(null);
                    }}
                  >
                    <Text style={[styles.optionText, selectedRating === rat && styles.optionTextActive]}>
                      {rat === 'All' ? 'All Ratings' : `${rat} ⭐ Stars`}
                    </Text>
                    {selectedRating === rat && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.closeBtn} onPress={() => setActiveModal(null)}>
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F5' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  searchSection: { paddingHorizontal: 20, marginBottom: 12 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A', fontWeight: '500' },
  filterSection: { paddingBottom: 12 },
  dropdownScroll: { paddingHorizontal: 20, gap: 8 },
  dropdownPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dropdownPillActive: { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' },
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
  activeTagText: { fontSize: 12, fontWeight: '700', color: '#166534' },
  clearAllText: { fontSize: 12, color: '#64748B', fontWeight: '600', marginLeft: 4 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#64748B' },
  gridContainer: { paddingHorizontal: 16, paddingBottom: 40 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 16 },
  courseCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  cardImage: { width: '100%', height: 120, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  cardBody: { padding: 12 },
  courseTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', lineHeight: 18, marginBottom: 6 },
  instructorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  instructorName: { fontSize: 12, color: '#64748B', flexShrink: 1 },
  verifiedBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  verifiedText: { fontSize: 10, fontWeight: '700', color: '#166534' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  difficultyBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  difficultyText: { fontSize: 10, color: '#475569', fontWeight: '600' },
  statsText: { fontSize: 11, color: '#94A3B8' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  optionList: { gap: 4, marginBottom: 16 },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  optionText: { fontSize: 14, color: '#334155', fontWeight: '500' },
  optionTextActive: { color: '#164E37', fontWeight: '700' },
  checkmark: { fontSize: 16, color: '#166534', fontWeight: '700' },
  closeBtn: { backgroundColor: '#164E37', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  closeBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
