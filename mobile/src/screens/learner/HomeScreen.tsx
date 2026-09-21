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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchCourses, fetchMyLearning } from '../../api/learner.service';
import { COLORS } from '../../theme/colors';

export default function HomeScreen({ navigation }: any) {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [inProgress, setInProgress] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Technology');

  const loadHomeData = async () => {
    try {
      const userJson = await AsyncStorage.getItem('@user');
      if (userJson) {
        setUserInfo(JSON.parse(userJson));
      }
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
    courseId: 'c1',
    course: {
      title: 'React Native Development',
      creator: { name: 'Skill Sharer', verifiedBadge: true },
      thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=600&q=80',
    },
    courseProgress: { completedLessons: 16, totalLessons: 20, progressPercentage: 80 },
  };

  const recommendedCourses = [
    {
      id: 'r1',
      title: 'Spring Boot Mastery',
      creatorName: 'Shehan Sankalana',
      sprintTime: '2m sprint',
      rating: 4.8,
      difficulty: 'Intermediate',
      thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'r2',
      title: 'Artisanal Flavors Masterclass',
      creatorName: 'Shehan Malisha',
      sprintTime: '5m sprint',
      rating: 4.8,
      difficulty: 'Beginner',
      thumbnail: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'r3',
      title: 'Full-Stack Node.js & React',
      creatorName: 'John Perera',
      sprintTime: '3m sprint',
      rating: 4.9,
      difficulty: 'Advanced',
      thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const popularCourses = courses.length > 0 ? courses.slice(0, 3) : [
    {
      id: 'p1',
      badge: 'Bestseller',
      badgeIcon: '🛡️',
      title: 'UX Micro-interactions',
      creatorName: 'Elena Rostova',
      rating: 4.9,
      learnersCount: '1.4k',
      thumbnail: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'p2',
      badge: 'Top Rated',
      badgeIcon: '💡',
      title: 'System Design Architecture',
      creatorName: 'Anura Kumara',
      rating: 4.9,
      learnersCount: '2.1k',
      thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const firstName = userInfo?.name ? userInfo.name.split(' ')[0] : 'Asheni';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />

      <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.contentPadding}>
          {/* Top Header Row (Matching image.png) */}
          <View style={styles.headerRow}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
                }}
                style={styles.avatarHeader}
              />
              <View style={styles.onlineBadge} />
            </View>

            <View style={styles.greetingContainer}>
              <Text style={styles.greetingSub}>Welcome back</Text>
              <Text style={styles.greetingName}>Good morning, {firstName}</Text>
            </View>

            <View style={styles.headerRightActions}>
              {/* Streak Badge */}
              <View style={styles.streakBadge}>
                <Text style={styles.streakIcon}>🔥</Text>
                <Text style={styles.streakText}>7d</Text>
              </View>

              {/* Notification Bell */}
              <TouchableOpacity style={styles.bellIconBtn} activeOpacity={0.8}>
                <Text style={styles.bellIcon}>🔔</Text>
                <View style={styles.bellBadgeDot} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Box with Filter Icon Button */}
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="What do you want to learn?"
              placeholderTextColor={COLORS.neutralLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => navigation?.navigate('CourseListTab', { search: searchQuery })}
            />
            <TouchableOpacity
              style={styles.filterBtn}
              onPress={() => navigation?.navigate('CourseListTab')}
            >
              <Text style={styles.filterIconText}>🎛️</Text>
            </TouchableOpacity>
          </View>

          {/* Horizontal Categories Scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {['Technology', 'Business', 'Arts', 'Construction'].map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Continue Learning Card Section */}
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.continuePlayIcon}>▶</Text>
              <Text style={styles.sectionHeading}>Continue Learning</Text>
            </View>
            <TouchableOpacity onPress={() => navigation?.navigate('MyLearningTab')}>
              <Text style={styles.inProgressLink}>In Progress</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.continueCard}>
            {/* Top Row inside Continue Card */}
            <View style={styles.continueTopRow}>
              <View style={styles.sprintTag}>
                <Text style={styles.sprintTagText}>⚡ Daily Sprint</Text>
              </View>
              <TouchableOpacity
                style={styles.playCircleBtn}
                activeOpacity={0.9}
                onPress={() =>
                  navigation?.navigate('CourseDetail', { courseId: continueItem.courseId || 'c1' })
                }
              >
                <Text style={styles.playIconText}>▶</Text>
              </TouchableOpacity>
            </View>

            {/* Course Title & Instructor */}
            <Text style={styles.continueTitle}>{continueItem.course?.title || 'React Native Development'}</Text>
            <View style={styles.creatorRow}>
              <Text style={styles.creatorName}>{continueItem.course?.creator?.name || 'Skill Sharer'}</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✔</Text>
              </View>
            </View>

            {/* Lesson Progress Count & Percentage */}
            <View style={styles.progressTextRow}>
              <Text style={styles.progressMeta}>
                {continueItem.courseProgress?.completedLessons || 16} of {continueItem.courseProgress?.totalLessons || 20} lessons completed
              </Text>
              <Text style={styles.progressPctText}>
                {continueItem.courseProgress?.progressPercentage || 80}%
              </Text>
            </View>

            {/* Thick Terracotta Progress Bar */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${continueItem.courseProgress?.progressPercentage || 80}%` }]} />
            </View>
          </View>

          {/* Recommended for You Section */}
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.sparkleIcon}>✨</Text>
              <Text style={styles.sectionHeading}>Recommended for You</Text>
            </View>
            <Text style={styles.swipeText}>Swipe →</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recommendedScrollContent}
          >
            {recommendedCourses.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.recCard}
                activeOpacity={0.9}
                onPress={() => navigation?.navigate('CourseDetail', { courseId: c.id, course: c })}
              >
                <View style={styles.recThumbnailWrapper}>
                  <Image source={{ uri: c.thumbnail }} style={styles.recThumbnail} />
                  <View style={styles.timeTag}>
                    <Text style={styles.timeTagText}>⏱ {c.sprintTime}</Text>
                  </View>
                </View>

                <View style={styles.recCardBody}>
                  <Text style={styles.recTitle} numberOfLines={2}>
                    {c.title}
                  </Text>
                  <Text style={styles.recCreator}>{c.creatorName}</Text>

                  <View style={styles.recFooter}>
                    <Text style={styles.recRating}>★ {c.rating}</Text>
                    <View style={styles.diffBadge}>
                      <Text style={styles.diffText}>{c.difficulty}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Popular Courses Section */}
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.trendingIcon}>📈</Text>
              <Text style={styles.sectionHeading}>Popular Courses</Text>
            </View>
            <TouchableOpacity onPress={() => navigation?.navigate('CourseListTab')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.popularList}>
            {popularCourses.map((item: any) => (
              <TouchableOpacity
                key={item.id}
                style={styles.popularCard}
                activeOpacity={0.9}
                onPress={() => navigation?.navigate('CourseDetail', { courseId: item.id, course: item })}
              >
                <Image
                  source={{ uri: item.thumbnail || 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=600&q=80' }}
                  style={styles.popularThumbnail}
                />
                <View style={styles.popularBody}>
                  <View style={styles.bestsellerTag}>
                    <Text style={styles.bestsellerText}>
                      {item.badgeIcon || '🛡️'} {item.badge || 'Bestseller'}
                    </Text>
                  </View>
                  <Text style={styles.popularTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.popularCreator}>{item.creatorName || item.creator?.name || 'Instructor'}</Text>
                  <Text style={styles.popularStats}>
                    ★ {item.rating || 4.9} • {item.learnersCount || '1.4k'} learners
                  </Text>
                </View>

                <View style={styles.arrowCircle}>
                  <Text style={styles.arrowText}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgWarm,
  },
  scrollContent: {
    flex: 1,
  },
  contentPadding: {
    paddingHorizontal: 18,
    paddingTop: 12,
  },

  // Header Row
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  avatarHeader: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingSub: {
    fontSize: 12,
    color: COLORS.neutralMedium,
    fontWeight: '500',
  },
  greetingName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.neutralDark,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.badgeOrangeBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  streakIcon: {
    fontSize: 14,
    marginRight: 3,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  bellIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    position: 'relative',
  },
  bellIcon: {
    fontSize: 16,
  },
  bellBadgeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.primary,
  },

  // Search Box
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.neutralDark,
    paddingVertical: 6,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.badgeOrangeBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIconText: {
    fontSize: 14,
  },

  // Category Pills
  categoryScroll: {
    marginBottom: 20,
  },
  categoryPill: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    marginRight: 10,
  },
  categoryPillActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.neutralDark,
  },
  categoryTextActive: {
    color: COLORS.white,
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  continuePlayIcon: {
    fontSize: 14,
    color: COLORS.primary,
  },
  sparkleIcon: {
    fontSize: 14,
  },
  trendingIcon: {
    fontSize: 14,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.neutralDark,
  },
  inProgressLink: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  swipeText: {
    fontSize: 12,
    color: COLORS.neutralMedium,
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Continue Learning Card
  continueCard: {
    backgroundColor: COLORS.cardBgSoft,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    marginBottom: 24,
  },
  continueTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sprintTag: {
    backgroundColor: COLORS.badgeOrangeBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sprintTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  playCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  playIconText: {
    fontSize: 16,
    color: COLORS.white,
    marginLeft: 2,
  },
  continueTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  creatorName: {
    fontSize: 13,
    color: COLORS.neutralMedium,
    fontWeight: '500',
  },
  verifiedBadge: {
    backgroundColor: COLORS.primary,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.white,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.neutralDark,
  },
  progressPctText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#F3E5DC',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primaryDark,
    borderRadius: 4,
  },

  // Recommended Scroll
  recommendedScrollContent: {
    gap: 14,
    paddingRight: 10,
    marginBottom: 24,
  },
  recCard: {
    width: 210,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    overflow: 'hidden',
  },
  recThumbnailWrapper: {
    position: 'relative',
    width: '100%',
    height: 120,
  },
  recThumbnail: {
    width: '100%',
    height: '100%',
  },
  timeTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  timeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.neutralDark,
  },
  recCardBody: {
    padding: 12,
  },
  recTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.neutralDark,
    height: 38,
    lineHeight: 18,
    marginBottom: 4,
  },
  recCreator: {
    fontSize: 12,
    color: COLORS.neutralMedium,
    marginBottom: 8,
  },
  recFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recRating: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.neutralDark,
  },
  diffBadge: {
    backgroundColor: COLORS.badgeOrangeBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  diffText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '700',
  },

  // Popular Courses List
  popularList: {
    gap: 12,
  },
  popularCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  popularThumbnail: {
    width: 72,
    height: 72,
    borderRadius: 14,
  },
  popularBody: {
    flex: 1,
    marginLeft: 12,
  },
  bestsellerTag: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.badgeOrangeBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  bestsellerText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  popularTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.neutralDark,
    marginBottom: 2,
  },
  popularCreator: {
    fontSize: 12,
    color: COLORS.neutralMedium,
    marginBottom: 4,
  },
  popularStats: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.neutralDark,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bgWarm,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  arrowText: {
    fontSize: 18,
    color: COLORS.neutralDark,
    fontWeight: '700',
  },
});
