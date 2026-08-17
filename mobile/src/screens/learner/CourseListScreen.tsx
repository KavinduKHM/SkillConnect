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
} from 'react-native';

const DEMO_COURSES = [
  {
    id: 'c1',
    title: 'React Native & Mobile App Development',
    description: 'Build cross-platform iOS & Android mobile apps with modern React Native and TypeScript.',
    category: 'Software Engineering',
    difficulty: 'BEGINNER',
    duration: '12 Hours',
    rating: 4.8,
    enrolledCount: 142,
    creatorName: 'Senior Dev John',
    verified: true,
  },
  {
    id: 'c2',
    title: 'Fullstack Web Development with Node.js & PostgreSQL',
    description: 'Master RESTful API design, database schemas, authentication, and backend architecture.',
    category: 'Web Development',
    difficulty: 'INTERMEDIATE',
    duration: '18 Hours',
    rating: 4.9,
    enrolledCount: 215,
    creatorName: 'Tech Lead Sarah',
    verified: true,
  },
  {
    id: 'c3',
    title: 'UI/UX Design Systems & Mobile Prototyping',
    description: 'Learn modern design principles, color theory, accessibility, and component styling.',
    category: 'Design & Arts',
    difficulty: 'BEGINNER',
    duration: '8 Hours',
    rating: 4.7,
    enrolledCount: 98,
    creatorName: 'Alex Rivera',
    verified: false,
  },
];

const CATEGORIES = ['All', 'Software Engineering', 'Web Development', 'Design & Arts', 'Data Science'];

export default function CourseListScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(false);

  const filteredCourses = DEMO_COURSES.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#4F46E5" />
      
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

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title, topic or skill..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Pills */}
      <View style={styles.categoryWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map((cat) => (
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
      </View>

      {/* Course List */}
      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.courseCard}
            activeOpacity={0.85}
            onPress={() => navigation?.navigate('CourseDetail', { courseId: item.id, course: item })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.badgeDifficulty}>{item.difficulty}</Text>
              <Text style={styles.ratingText}>⭐ {item.rating}</Text>
            </View>

            <Text style={styles.courseTitle}>{item.title}</Text>
            <Text style={styles.courseDescription} numberOfLines={2}>
              {item.description}
            </Text>

            <View style={styles.creatorRow}>
              <Text style={styles.creatorName}>By {item.creatorName}</Text>
              {item.verified && <Text style={styles.verifiedBadge}>✓ Verified Sharer</Text>}
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.metaText}>⏱️ {item.duration}</Text>
              <Text style={styles.metaText}>👥 {item.enrolledCount} learners</Text>
              <Text style={styles.viewDetailText}>View Details →</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerSubtitle: {
    color: '#EEF2FF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 2,
  },
  myLearningBtn: {
    backgroundColor: '#6366F1',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  myLearningBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  categoryWrapper: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 12,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  categoryPillActive: {
    backgroundColor: '#4F46E5',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeDifficulty: {
    backgroundColor: '#E0E7FF',
    color: '#3730A3',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D97706',
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  courseDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 12,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  creatorName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
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
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  viewDetailText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
});
