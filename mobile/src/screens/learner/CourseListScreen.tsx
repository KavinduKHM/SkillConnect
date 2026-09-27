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
import { COLORS } from '../../theme/colors';

const DEMO_COURSES = [
  {
    id: 'c1',
    title: 'React Native Development',
    description: 'Master cross-platform mobile development using React Native, Expo, and TypeScript.',
    category: { name: 'Mobile Development' },
    difficulty: 'BEGINNER',
    duration: '5 weeks',
    rating: 4.8,
    reviewCount: 142,
    enrolledCount: '154',
    creator: { id: 's1', name: 'John Perera', verifiedBadge: true },
    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'c2',
    title: 'Full-Stack Web Development with React & Node.js',
    description: 'Fullstack web development with React, Node.js, Express, PostgreSQL, and Prisma.',
    category: { name: 'Web Development' },
    difficulty: 'INTERMEDIATE',
    duration: '8 weeks',
    rating: 4.9,
    reviewCount: 98,
    enrolledCount: '99',
    creator: { id: 's2', name: 'Shehan Sankalana', verifiedBadge: true },
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'c3',
    title: 'UI/UX Design Masterclass: Figma to Mobile UI',
    description: 'Learn design systems, wireframing, mobile UI components, and Figma prototypes.',
    category: { name: 'Arts & Design' },
    difficulty: 'BEGINNER',
    duration: '4 weeks',
    rating: 4.7,
    reviewCount: 215,
    enrolledCount: '210',
    creator: { id: 's3', name: 'Elena Rostova', verifiedBadge: true },
    thumbnail: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'c4',
    title: 'Spring Boot Mastery & Microservices',
    description: 'Build enterprise Java applications with Spring Boot, Spring Cloud, and Docker.',
    category: { name: 'Technology' },
    difficulty: 'INTERMEDIATE',
    duration: '6 weeks',
    rating: 4.8,
    reviewCount: 88,
    enrolledCount: '340',
    creator: { id: 's4', name: 'Shehan Sankalana', verifiedBadge: true },
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
  },
];

export default function CourseListScreen({ navigation, route }: any) {
  const initialSearch = route.params?.search || '';
  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />

      {/* Main Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore Courses</Text>
        <Text style={styles.headerSubtitle}>Discover skills, categories & expert Skill Sharers</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for courses, skills, instructors..."
            placeholderTextColor={COLORS.neutralLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={loadData}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Chips Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryChipsScroll}>
        {['All', 'Technology', 'Web Development', 'Mobile Development', 'Arts & Design', 'Business'].map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, isActive && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Dropdown Filters & Active Filter Tags */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dropdownScroll}>
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

        {/* Active Filter Tags Row */}
        {(selectedCategory !== 'All' || selectedDifficulty !== 'All' || selectedDuration !== 'All' || selectedRating !== 'All') && (
          <View style={styles.activeTagsRow}>
            {selectedCategory !== 'All' && (
              <TouchableOpacity style={styles.activeTag} onPress={() => setSelectedCategory('All')}>
                <Text style={styles.activeTagText}>{selectedCategory} ✕</Text>
              </TouchableOpacity>
            )}
            {selectedDifficulty !== 'All' && (
              <TouchableOpacity style={styles.activeTag} onPress={() => setSelectedDifficulty('All')}>
                <Text style={styles.activeTagText}>{selectedDifficulty} ✕</Text>
              </TouchableOpacity>
            )}
            {selectedDuration !== 'All' && (
              <TouchableOpacity style={styles.activeTag} onPress={() => setSelectedDuration('All')}>
                <Text style={styles.activeTagText}>{selectedDuration} ✕</Text>
              </TouchableOpacity>
            )}
            {selectedRating !== 'All' && (
              <TouchableOpacity style={styles.activeTag} onPress={() => setSelectedRating('All')}>
                <Text style={styles.activeTagText}>{selectedRating} ★ ✕</Text>
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
          <ActivityIndicator size="large" color={COLORS.primary} />
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
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={COLORS.primary} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.courseCard}
              activeOpacity={0.9}
              onPress={() => navigation?.navigate('CourseDetail', { courseId: item.id, course: item })}
            >
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
                    {item.creator?.name || item.creatorName || 'Skill Sharer'}
                  </Text>
                  {(item.creator?.verifiedBadge || item.verified) && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>✔</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Rating & Level */}
                <View style={styles.metaRow}>
                  <Text style={styles.ratingText}>★ {item.rating || 4.8}</Text>
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
              Select {activeModal === 'DIFFICULTY' ? 'Difficulty' : activeModal === 'DURATION' ? 'Duration' : 'Rating'}
            </Text>

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
                    {selectedDifficulty === diff && <Text style={styles.checkmark}>✔</Text>}
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
                    {selectedDuration === dur && <Text style={styles.checkmark}>✔</Text>}
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
                      {rat === 'All' ? 'All Ratings' : `${rat} ★ Stars`}
                    </Text>
                    {selectedRating === rat && <Text style={styles.checkmark}>✔</Text>}
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
  container: { flex: 1, backgroundColor: COLORS.bgWarm },
  header: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 6 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.neutralDark, letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 13, color: COLORS.neutralMedium, marginTop: 2 },
  searchSection: { paddingHorizontal: 18, marginVertical: 10 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.neutralDark },
  clearSearchIcon: { fontSize: 14, color: COLORS.neutralMedium, padding: 4 },
  categoryChipsScroll: { paddingHorizontal: 18, marginBottom: 10 },
  categoryChip: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    marginRight: 8,
  },
  categoryChipActive: { backgroundColor: COLORS.primaryDark, borderColor: COLORS.primaryDark },
  categoryChipText: { fontSize: 13, fontWeight: '700', color: COLORS.neutralDark },
  categoryChipTextActive: { color: COLORS.white },
  filterSection: { paddingBottom: 10 },
  dropdownScroll: { paddingHorizontal: 18, gap: 8 },
  dropdownPill: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  dropdownPillActive: { backgroundColor: COLORS.badgeOrangeBg, borderColor: COLORS.primary },
  dropdownText: { fontSize: 12, fontWeight: '700', color: COLORS.neutralDark },
  dropdownTextActive: { color: COLORS.primary },
  activeTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginTop: 8,
    gap: 8,
  },
  activeTag: {
    backgroundColor: COLORS.badgeOrangeBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  activeTagText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  clearAllText: { fontSize: 12, color: COLORS.neutralMedium, fontWeight: '700', marginLeft: 4 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: COLORS.neutralMedium },
  gridContainer: { paddingHorizontal: 14, paddingBottom: 40 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 14 },
  courseCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: COLORS.neutralDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardImage: { width: '100%', height: 115 },
  cardBody: { padding: 10 },
  courseTitle: { fontSize: 13, fontWeight: '800', color: COLORS.neutralDark, lineHeight: 17, marginBottom: 4 },
  instructorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  instructorName: { fontSize: 11, color: COLORS.neutralMedium, flexShrink: 1 },
  verifiedBadge: { backgroundColor: COLORS.primary, width: 13, height: 13, borderRadius: 6.5, justifyContent: 'center', alignItems: 'center' },
  verifiedText: { fontSize: 8, fontWeight: '900', color: COLORS.white },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  ratingText: { fontSize: 11, fontWeight: '800', color: COLORS.neutralDark },
  difficultyBadge: { backgroundColor: COLORS.badgeOrangeBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  difficultyText: { fontSize: 9, color: COLORS.primary, fontWeight: '700' },
  statsText: { fontSize: 10, color: COLORS.neutralLight },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(43, 33, 30, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.neutralDark, marginBottom: 16 },
  optionList: { gap: 4, marginBottom: 16 },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderWarm,
  },
  optionText: { fontSize: 14, color: COLORS.neutralDark, fontWeight: '500' },
  optionTextActive: { color: COLORS.primary, fontWeight: '800' },
  checkmark: { fontSize: 14, color: COLORS.primary, fontWeight: '800' },
  closeBtn: { backgroundColor: COLORS.primaryDark, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  closeBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 14 },
});
