import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/common/Header';
import { progressApi } from '../../api/skill-sharer.service';
import { fetchCourseReviews, replyToCourseReview } from '../../api/learner.service';

interface Analytics {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
  averageProgress: number;
  averageRating: number;
  totalReviews: number;
}

interface ReviewItem {
  id: string;
  learnerName: string;
  rating: number;
  comment: string;
  reply?: string;
}

const defaultAnalytics: Analytics = {
  totalEnrollments: 12,
  activeEnrollments: 7,
  completedEnrollments: 3,
  completionRate: 68,
  averageProgress: 72,
  averageRating: 4.8,
  totalReviews: 4,
};

export default function CourseAnalyticsScreen() {
  const route = useRoute();
  const { courseId, courseTitle } = route.params as { courseId: string; courseTitle?: string };

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, [courseId]);

  const loadReviews = async () => {
    try {
      const res = await fetchCourseReviews(courseId);
      const allReviews = res?.reviews || res?.data || [];

      const mappedReviews = Array.isArray(allReviews)
        ? allReviews.map((item: any) => ({
            id: item.id || item.reviewId || String(Math.random()),
            learnerName: item.learner?.name || item.learnerName || 'Learner',
            rating: item.rating ?? 0,
            comment: item.comment || item.review || 'No comment provided.',
            reply: item.reply || item.instructorReply || undefined,
          }))
        : [];

      setReviews(mappedReviews);
    } catch (error: any) {
      console.error('Failed to load course reviews:', error);
      setReviews([]);
    }
  };

  const loadData = async () => {
    try {
      const response = await progressApi.getCourseAnalytics(courseId);
      const responseData = response?.data?.data ?? response?.data ?? defaultAnalytics;

      setAnalytics({
        ...defaultAnalytics,
        ...responseData,
      });

      await loadReviews();
    } catch (error: any) {
      setAnalytics(defaultAnalytics);
      setReviews([]);
      Alert.alert('Error', error?.error || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const submitReply = async (reviewId: string) => {
    const reply = (replyDrafts[reviewId] || '').trim();

    if (!reply) {
      Alert.alert('Reply required', 'Please type a reply before sending.');
      return;
    }

    try {
      await replyToCourseReview(reviewId, reply);
      await loadReviews();
      setReplyDrafts((current) => ({ ...current, [reviewId]: '' }));
      Alert.alert('Reply sent', 'Your response has been saved.');
    } catch (error: any) {
      Alert.alert('Unable to send reply', error?.response?.data?.error || 'Please try again.');
    }
  };

  const StatCard = ({ icon, label, value, color }: any) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={18} color="#FFFFFF" />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF7A59" />
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.centered}>
        <Ionicons name="bar-chart-outline" size={64} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>No Data Available</Text>
        <Text style={styles.emptySubtitle}>Analytics will appear once learners enroll.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screenWrap}>
      <Header title="Course Analytics" showBack />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.topBanner}>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>PUBLISHED</Text>
            <Text style={styles.statusMeta}>Updated today</Text>
          </View>

          <Text style={styles.courseTitle}>{courseTitle || 'React Native Development Masterclass'}</Text>
        </View>

        <View style={styles.tabRow}>
          {['Last 30 Days', 'This Week', 'All Time'].map((tab, index) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, index === 1 && styles.tabButtonActive]}
            >
              <Text style={[styles.tabText, index === 1 && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.grid}>
          <StatCard icon="people-outline" label="Total Enrollments" value={analytics.totalEnrollments} color="#4F46E5" />
          <StatCard icon="play-circle-outline" label="Active Learners" value={analytics.activeEnrollments} color="#10B981" />
          <StatCard icon="checkmark-circle-outline" label="Completed" value={analytics.completedEnrollments} color="#8B5CF6" />
          <StatCard icon="star-outline" label="Average Rating" value={analytics.averageRating.toFixed(1)} color="#F59E0B" />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>Progress Metrics</Text>
            <Text style={styles.sectionBadge}>1 Learner Tracked</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Completion Rate</Text>
            <Text style={styles.metricValue}>{analytics.completionRate.toFixed(1)}%</Text>
          </View>
          <View style={styles.metricBarTrack}>
            <View style={[styles.metricBarFill, { width: `${Math.min(analytics.completionRate, 100)}%` }]} />
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Average Progress</Text>
            <Text style={styles.metricValue}>{analytics.averageProgress.toFixed(1)}%</Text>
          </View>
          <View style={styles.metricBarTrack}>
            <View style={[styles.metricBarFillAlt, { width: `${Math.min(analytics.averageProgress, 100)}%` }]} />
          </View>

          <View style={styles.indicatorRow}>
            <Ionicons name="information-circle" size={18} color="#4F46E5" />
            <Text style={styles.indicatorText}>Active learner is in Module 1: Setup & Foundations</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>Reviews</Text>
            <Text style={styles.sectionBadge}>{analytics.totalReviews} Review{analytics.totalReviews === 1 ? '' : 's'}</Text>
          </View>

          {reviews.length === 0 ? (
            <View style={styles.emptyReviewCard}>
              <Ionicons name="star" size={36} color="#F59E0B" />
              <Text style={styles.emptyReviewTitle}>No reviews yet</Text>
              <Text style={styles.emptyReviewDescription}>
                Ratings and learner feedback will show up here after students finish the course.
              </Text>
              <Text style={styles.emptyReviewCTA}>Invite learners to review</Text>
            </View>
          ) : (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeaderRow}>
                  <View style={styles.avatar}>{review.learnerName.charAt(0).toUpperCase()}</View>
                  <View style={styles.reviewMeta}>
                    <Text style={styles.reviewAuthor}>{review.learnerName}</Text>
                    <View style={styles.starRowSmall}>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Ionicons
                          key={`${review.id}-${index}`}
                          name={index < review.rating ? 'star' : 'star-outline'}
                          size={12}
                          color={index < review.rating ? '#F59E0B' : '#D1D5DB'}
                        />
                      ))}
                    </View>
                  </View>
                </View>

                <Text style={styles.reviewText}>{review.comment}</Text>

                {review.reply ? (
                  <View style={styles.replyBubble}>
                    <Text style={styles.replyTitle}>Your reply</Text>
                    <Text style={styles.replyText}>{review.reply}</Text>
                  </View>
                ) : (
                  <View style={styles.replyBox}>
                    <TextInput
                      value={replyDrafts[review.id] ?? ''}
                      onChangeText={(text) =>
                        setReplyDrafts((current) => ({ ...current, [review.id]: text }))
                      }
                      placeholder="Reply to this learner..."
                      placeholderTextColor="#9CA3AF"
                      multiline
                      style={styles.replyInput}
                    />
                    <TouchableOpacity
                      style={styles.replyButton}
                      onPress={() => submitReply(review.id)}
                    >
                      <Text style={styles.replyButtonText}>Reply</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  screenWrap: {
    flex: 1,
    backgroundColor: '#F7F4F1',
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F4F1',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },
  topBanner: {
    backgroundColor: '#F7F3EF',
    borderColor: '#E9DCCB',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0EA56A',
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0EA56A',
    letterSpacing: 0.5,
  },
  statusMeta: {
    marginLeft: 'auto',
    fontSize: 12,
    color: '#6B7280',
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.4,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#F4EFEA',
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#F06E48',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#F8F7F5',
    borderWidth: 1,
    borderColor: '#E7E0D7',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#F8F7F5',
    borderWidth: 1,
    borderColor: '#E9DED1',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionBadge: {
    backgroundColor: '#F2EFEA',
    color: '#374151',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  metricLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  metricBarTrack: {
    height: 12,
    backgroundColor: '#E7E2DC',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 8,
  },
  metricBarFill: {
    height: '100%',
    backgroundColor: '#F06E48',
    borderRadius: 10,
  },
  metricBarFillAlt: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 10,
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F3FF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginTop: 16,
  },
  indicatorText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
  emptyReviewCard: {
    backgroundColor: '#F5F1ED',
    borderWidth: 1,
    borderColor: '#E7D8C8',
    borderStyle: 'dashed',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 22,
  },
  emptyReviewTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
  },
  emptyReviewDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  emptyReviewCTA: {
    marginTop: 18,
    fontSize: 18,
    fontWeight: '700',
    color: '#F06E48',
  },
  reviewCard: {
    backgroundColor: '#F5F0EA',
    borderWidth: 1,
    borderColor: '#E7D8C8',
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8C7AE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    fontWeight: '700',
    color: '#1F2937',
  },
  reviewMeta: {
    flex: 1,
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  starRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  reviewText: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
  replyBubble: {
    marginTop: 12,
    backgroundColor: '#F0F3FF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DADCFD',
  },
  replyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
    marginBottom: 4,
  },
  replyText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#374151',
  },
  replyBox: {
    marginTop: 12,
  },
  replyInput: {
    minHeight: 70,
    borderWidth: 1,
    borderColor: '#E7D8C8',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    textAlignVertical: 'top',
  },
  replyButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#F06E48',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 10,
  },
  replyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#F4EFEA',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
});