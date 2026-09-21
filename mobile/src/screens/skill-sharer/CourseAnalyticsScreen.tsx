import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { progressService } from '../../api/skill-sharer.service';
import { Header } from '../../components/common/Header';

interface Analytics {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
  averageProgress: number;
  averageRating: number;
  totalReviews: number;
}

export default function CourseAnalyticsScreen() {
  const route = useRoute();
  const { courseId } = route.params as { courseId: string };

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    loadData();
  }, [courseId]);

  const loadData = async () => {
    try {
      const response = await progressService.getCourseAnalytics(courseId);
      setAnalytics(response.data);
    } catch (error: any) {
      Alert.alert('Error', error.error || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1 }}>
        <Header title="Course Analytics" showBack={true} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      </View>
    );
  }

  const StatCard = ({ icon, label, value, color }: any) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color="#FFFFFF" />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );

  const renderContent = () => {
    if (!analytics) {
      return (
        <View style={styles.centered}>
          <Ionicons name="bar-chart-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Data Available</Text>
          <Text style={styles.emptySubtitle}>
            Analytics will appear once learners enroll
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          <StatCard
            icon="people-outline"
            label="Total Enrollments"
            value={analytics.totalEnrollments}
            color="#4F46E5"
          />
          <StatCard
            icon="play-circle-outline"
            label="Active Learners"
            value={analytics.activeEnrollments}
            color="#10B981"
          />
          <StatCard
            icon="checkmark-circle-outline"
            label="Completed"
            value={analytics.completedEnrollments}
            color="#8B5CF6"
          />
          <StatCard
            icon="star-outline"
            label="Average Rating"
            value={analytics.averageRating?.toFixed(1) || 'N/A'}
            color="#F59E0B"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress Metrics</Text>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Transition / Completion Rate</Text>
            <View style={styles.metricBarContainer}>
              <View
                style={[
                  styles.metricBar,
                  { width: `${Math.min(analytics.completionRate, 100)}%` },
                ]}
              />
              <Text style={styles.metricValue}>
                {analytics.completionRate.toFixed(1)}%
              </Text>
            </View>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Average Progress</Text>
            <View style={styles.metricBarContainer}>
              <View
                style={[
                  styles.metricBar,
                  { width: `${Math.min(analytics.averageProgress, 100)}%` },
                ]}
              />
              <Text style={styles.metricValue}>
                {analytics.averageProgress.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          <View style={styles.reviewStats}>
            <Text style={styles.reviewCount}>
              {analytics.totalReviews} Review{analytics.totalReviews > 1 ? 's' : ''}
            </Text>
            {analytics.averageRating > 0 && (
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={20} color="#F59E0B" />
                <Text style={styles.ratingText}>
                  {analytics.averageRating.toFixed(1)} / 5.0
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title="Course Analytics" showBack={true} />
      <View style={{ flex: 1 }}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  metricItem: {
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  metricBarContainer: {
    height: 24,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  metricBar: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 12,
  },
  metricValue: {
    position: 'absolute',
    right: 8,
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
  },
  reviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
});