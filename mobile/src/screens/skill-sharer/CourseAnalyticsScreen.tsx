import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { courseApi, progressApi } from '../../api/skill-sharer.service';
import { COLORS } from '../../theme/colors';
import { RADIUS, SHADOWS } from '../../theme/shadows';
import { Course } from '../../types';

interface CourseAnalytics {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
  averageProgress: number;
  averageRating: number;
  totalReviews: number;
}

export default function CourseAnalyticsScreen({ route }: any) {
  const courseId = route?.params?.courseId as string | undefined;
  const [course, setCourse] = useState<Course | null>(null);
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(async () => {
    if (!courseId) {
      setError('A course was not specified.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [courseResponse, analyticsResponse] = await Promise.all([
        courseApi.getCourse(courseId),
        progressApi.getCourseAnalytics(courseId),
      ]);
      if (!courseResponse?.success || !courseResponse.data) {
        throw new Error(courseResponse?.error || 'Could not load the course.');
      }
      if (!analyticsResponse?.success || !analyticsResponse.data) {
        throw new Error(analyticsResponse?.error || 'Could not load course analytics.');
      }
      setCourse(courseResponse.data);
      setAnalytics(analyticsResponse.data);
    } catch (loadError: any) {
      setError(loadError?.error || loadError?.message || 'Could not load course analytics.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return (
    <View style={styles.container}>
      <Header title="Course Analytics" showBack subtitle={course?.title} />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Gathering your course insights...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle-outline" size={28} color={COLORS.error} />
          </View>
          <Text style={styles.errorTitle}>Insights unavailable</Text>
          <Text style={styles.error}>{error}</Text>
          <Button title="Try again" onPress={loadAnalytics} size="small" />
        </View>
      ) : analytics ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.heroIcon}>
                <Ionicons name="bar-chart" size={20} color={COLORS.white} />
              </View>
              <Text style={styles.heroEyebrow}>YOUR COURSE AT A GLANCE</Text>
            </View>
            <Text style={styles.heroTitle}>{course?.title || 'Course overview'}</Text>
            <Text style={styles.heroSubtitle}>A snapshot of learner activity and course performance.</Text>
            <View style={styles.heroDivider} />
            <View style={styles.heroFooter}>
              <View>
                <Text style={styles.heroValue}>{analytics.totalEnrollments}</Text>
                <Text style={styles.heroCaption}>total learners</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroRating}>
                <Ionicons name="star" size={17} color="#FFD27A" />
                <View>
                  <Text style={styles.heroValue}>{analytics.averageRating.toFixed(1)}</Text>
                  <Text style={styles.heroCaption}>average rating</Text>
                </View>
              </View>
            </View>
            <View style={styles.heroOrb} />
          </View>

          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.heading}>Learner engagement</Text>
              <Text style={styles.sectionSubheading}>Enrollment and completion at a glance</Text>
            </View>
            <Ionicons name="people-outline" size={21} color={COLORS.primary} />
          </View>
          <View style={styles.metricRow}>
            <MetricCard
              icon="people"
              label="Active learners"
              value={analytics.activeEnrollments}
              tint={COLORS.badgeOrangeBg}
              iconColor={COLORS.primary}
            />
            <MetricCard
              icon="checkmark-circle"
              label="Completed"
              value={analytics.completedEnrollments}
              tint={COLORS.badgeGreenBg}
              iconColor={COLORS.badgeGreenText}
            />
          </View>

          <View style={styles.performanceCard}>
            <View style={styles.cardHeading}>
              <View style={styles.performanceIcon}>
                <Ionicons name="trending-up" size={18} color={COLORS.honeyText} />
              </View>
              <View style={styles.cardHeadingCopy}>
                <Text style={styles.cardTitle}>Course progress</Text>
                <Text style={styles.cardSubtitle}>How learners are moving through your course</Text>
              </View>
            </View>
            <ProgressMetric label="Completion rate" value={analytics.completionRate} />
            <View style={styles.progressDivider} />
            <ProgressMetric label="Average learner progress" value={analytics.averageProgress} />
          </View>

          <View style={styles.reviewCard}>
            <View style={styles.reviewIcon}>
              <Ionicons name="star" size={19} color="#A66A00" />
            </View>
            <View style={styles.reviewCopy}>
              <Text style={styles.reviewLabel}>Learner feedback</Text>
              <Text style={styles.reviewValue}>{analytics.averageRating.toFixed(1)}<Text style={styles.reviewOutOf}> / 5</Text></Text>
              <Text style={styles.reviewCount}>
                Based on {analytics.totalReviews} {analytics.totalReviews === 1 ? 'review' : 'reviews'}
              </Text>
            </View>
            <View style={styles.reviewStars}>
              {Array.from({ length: 5 }, (_, index) => (
                <Ionicons
                  key={index}
                  name={index < Math.round(analytics.averageRating) ? 'star' : 'star-outline'}
                  size={13}
                  color="#C38B26"
                />
              ))}
            </View>
          </View>

          <View style={styles.footerNote}>
            <Ionicons name="information-circle-outline" size={15} color={COLORS.neutralLight} />
            <Text style={styles.footerText}>Insights update as learners engage with your course.</Text>
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

function MetricCard({
  icon,
  label,
  value,
  tint,
  iconColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  tint: string;
  iconColor: string;
}) {
  return (
    <View style={styles.metric}>
      <View style={[styles.metricIcon, { backgroundColor: tint }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function ProgressMetric({ label, value }: { label: string; value: number }) {
  const percentage = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

  return (
    <View style={styles.progressMetric}>
      <View style={styles.progressLabels}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{percentage.toFixed(1)}%</Text>
      </View>
      <View
        style={styles.progressTrack}
        accessible
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: percentage }}
      >
        <View style={[styles.progressFill, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgWarm,
    ...Platform.select({
      web: {
        height: '100vh' as any,
        maxHeight: '100vh' as any,
        overflow: 'hidden' as any,
      },
    }),
  },
  scroll: {
    flex: 1,
    minHeight: 0,
    ...Platform.select({
      web: {
        overflowY: 'auto' as any,
        WebkitOverflowScrolling: 'touch' as any,
      },
    }),
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 },
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 36 },
  loadingText: { color: COLORS.neutralMedium, fontSize: 13, marginTop: 2 },
  hero: {
    overflow: 'hidden',
    backgroundColor: COLORS.primaryDark,
    borderRadius: RADIUS.xl,
    padding: 20,
    marginBottom: 26,
    ...SHADOWS.level1,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 17 },
  heroIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  heroEyebrow: { color: '#F8D8C7', fontSize: 10, fontWeight: '700', letterSpacing: 1.1 },
  heroTitle: { color: COLORS.white, fontSize: 22, lineHeight: 28, fontWeight: '700', maxWidth: '92%' },
  heroSubtitle: { color: '#F4DCD1', fontSize: 12, lineHeight: 18, marginTop: 6, maxWidth: '92%' },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.18)', marginTop: 18, marginBottom: 14 },
  heroFooter: { flexDirection: 'row', alignItems: 'center' },
  heroValue: { color: COLORS.white, fontSize: 24, lineHeight: 29, fontWeight: '700' },
  heroCaption: { color: '#F4DCD1', fontSize: 11, marginTop: 2 },
  heroStatDivider: { width: 1, height: 38, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 22 },
  heroRating: { flexDirection: 'row', alignItems: 'center', columnGap: 8 },
  heroOrb: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    right: -76,
    top: -76,
    backgroundColor: 'rgba(255,255,255,0.055)',
  },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  heading: { color: COLORS.neutralDark, fontSize: 17, fontWeight: '700' },
  sectionSubheading: { color: COLORS.neutralMedium, fontSize: 12, marginTop: 3 },
  metricRow: { flexDirection: 'row', columnGap: 12, marginBottom: 18 },
  metric: {
    flex: 1,
    minWidth: 0,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: RADIUS.lg,
    padding: 15,
    ...SHADOWS.level1,
  },
  metricIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  metricValue: { color: COLORS.neutralDark, fontSize: 24, fontWeight: '700' },
  metricLabel: { color: COLORS.neutralMedium, fontSize: 12, marginTop: 4 },
  performanceCard: {
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: RADIUS.lg,
    padding: 17,
    marginBottom: 14,
    ...SHADOWS.level1,
  },
  cardHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 19 },
  performanceIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.honeyBg, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  cardHeadingCopy: { flex: 1 },
  cardTitle: { color: COLORS.neutralDark, fontSize: 14, fontWeight: '700' },
  cardSubtitle: { color: COLORS.neutralMedium, fontSize: 11, marginTop: 3 },
  progressMetric: { marginBottom: 14 },
  progressLabels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { color: COLORS.neutralMedium, fontSize: 12 },
  progressValue: { color: COLORS.neutralDark, fontSize: 12, fontWeight: '700' },
  progressTrack: { height: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceMuted, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: RADIUS.full, backgroundColor: COLORS.primary },
  progressDivider: { height: 1, backgroundColor: COLORS.borderWarm, marginTop: 1, marginBottom: 14 },
  reviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.honeyBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#F0E1BF',
    padding: 16,
    marginBottom: 15,
  },
  reviewIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#F8EBCF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  reviewCopy: { flex: 1 },
  reviewLabel: { color: COLORS.honeyText, fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  reviewValue: { color: COLORS.neutralDark, fontSize: 23, fontWeight: '700', marginTop: 2 },
  reviewOutOf: { color: COLORS.neutralMedium, fontSize: 13, fontWeight: '500' },
  reviewCount: { color: COLORS.neutralMedium, fontSize: 11, marginTop: 1 },
  reviewStars: { flexDirection: 'row', columnGap: 2, marginLeft: 6 },
  footerNote: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 4 },
  footerText: { color: COLORS.neutralLight, fontSize: 11, marginLeft: 5 },
  errorIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: COLORS.errorBg, alignItems: 'center', justifyContent: 'center' },
  errorTitle: { color: COLORS.neutralDark, fontSize: 17, fontWeight: '700' },
  error: { color: COLORS.neutralMedium, fontSize: 14, textAlign: 'center', lineHeight: 21 },
});
