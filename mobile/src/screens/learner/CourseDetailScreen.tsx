import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';

export default function CourseDetailScreen({ route, navigation }: any) {
  const { course } = route.params || {
    course: {
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
  };

  const [enrolled, setEnrolled] = useState(false);

  const handleEnroll = () => {
    setEnrolled(true);
    Alert.alert('Enrolled Successfully! 🎉', 'You can now access all course modules and track your progress.', [
      { text: 'Go to My Learning', onPress: () => navigation?.navigate('MyLearning') },
      { text: 'OK' },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />

      <ScrollView style={styles.scrollContent}>
        {/* Banner / Header */}
        <View style={styles.heroBanner}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.badgeCategory}>{course.category || 'General'}</Text>
          <Text style={styles.heroTitle}>{course.title}</Text>
          <Text style={styles.heroRating}>⭐ {course.rating} • ⏱️ {course.duration} • 👥 {course.enrolledCount} enrolled</Text>
        </View>

        {/* Content Body */}
        <View style={styles.bodyContent}>
          {/* Instructor Box */}
          <View style={styles.instructorCard}>
            <View>
              <Text style={styles.instructorRole}>Skill Sharer</Text>
              <Text style={styles.instructorName}>{course.creatorName}</Text>
            </View>
            {course.verified && <Text style={styles.verifiedBadge}>✓ Verified Skill Sharer</Text>}
          </View>

          {/* Description */}
          <Text style={styles.sectionHeading}>Course Overview</Text>
          <Text style={styles.descriptionText}>{course.description}</Text>

          {/* Learning Outcomes */}
          <Text style={styles.sectionHeading}>What You Will Learn</Text>
          <View style={styles.outcomeList}>
            <Text style={styles.outcomeItem}>✓ Build production-grade React Native mobile apps</Text>
            <Text style={styles.outcomeItem}>✓ Connect APIs & manage global application state</Text>
            <Text style={styles.outcomeItem}>✓ Implement authentication and JWT token security</Text>
            <Text style={styles.outcomeItem}>✓ Deploy to App Store & Google Play Store</Text>
          </View>

          {/* Syllabus / Modules */}
          <Text style={styles.sectionHeading}>Course Modules (Syllabus)</Text>
          <View style={styles.moduleCard}>
            <Text style={styles.moduleTitle}>Module 1: Getting Started & Navigation</Text>
            <Text style={styles.lessonItem}>• Lesson 1.1: Project Setup & Environment (15 mins)</Text>
            <Text style={styles.lessonItem}>• Lesson 1.2: React Navigation & Stack Routing (25 mins)</Text>
          </View>

          <View style={styles.moduleCard}>
            <Text style={styles.moduleTitle}>Module 2: API Integration & Progress Tracking</Text>
            <Text style={styles.lessonItem}>• Lesson 2.1: Axios HTTP Client & Auth Headers (30 mins)</Text>
            <Text style={styles.lessonItem}>• Lesson 2.2: Marking Lessons Complete & Updating Progress (40 mins)</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        {enrolled ? (
          <TouchableOpacity style={styles.continueBtn} onPress={() => navigation?.navigate('MyLearning')}>
            <Text style={styles.actionBtnText}>Continue Learning →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.enrollBtn} onPress={handleEnroll}>
            <Text style={styles.actionBtnText}>Enroll in Course Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { flex: 1 },
  heroBanner: { backgroundColor: '#4F46E5', padding: 20, paddingTop: 10 },
  backBtn: { marginBottom: 12 },
  backBtnText: { color: '#EEF2FF', fontSize: 14, fontWeight: '600' },
  badgeCategory: {
    alignSelf: 'flex-start',
    backgroundColor: '#6366F1',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  heroTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  heroRating: { fontSize: 13, color: '#E0E7FF' },
  bodyContent: { padding: 20, gap: 16 },
  instructorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  instructorRole: { fontSize: 11, color: '#6B7280', textTransform: 'uppercase' },
  instructorName: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  verifiedBadge: {
    backgroundColor: '#D1FAE5',
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sectionHeading: { fontSize: 17, fontWeight: 'bold', color: '#111827', marginTop: 8 },
  descriptionText: { fontSize: 14, color: '#4B5563', lineHeight: 22 },
  outcomeList: { gap: 8, backgroundColor: '#F0FDF4', padding: 14, borderRadius: 12 },
  outcomeItem: { fontSize: 13, color: '#166534', fontWeight: '500' },
  moduleCard: { backgroundColor: '#F9FAFB', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  moduleTitle: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  lessonItem: { fontSize: 13, color: '#4B5563', paddingVertical: 2 },
  bottomBar: { padding: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  enrollBtn: { backgroundColor: '#4F46E5', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  continueBtn: { backgroundColor: '#059669', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
