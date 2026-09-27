import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { fetchMyRecommendations } from '../../api/learner.service';
import { COLORS } from '../../theme/colors';

export default function MyRecommendationsScreen({ navigation }: any) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const res: any = await fetchMyRecommendations();
      const data = res?.data || res?.recommendations || (Array.isArray(res) ? res : []);
      setRecommendations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log('Failed to load recommendations', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRecommendations();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={COLORS.neutralDark} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>My Recommendations</Text>
          <Text style={styles.headerSub}>Endorsements from your Skill Sharers</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading recommendations...</Text>
        </View>
      ) : recommendations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="ribbon-outline" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Endorsements Yet</Text>
          <Text style={styles.emptyText}>
            Complete your courses with distinction, and your Skill Sharers can write verified endorsements highlighting your skills to future employers.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Trophy Banner */}
          <View style={styles.banner}>
            <View style={styles.bannerIconCircle}>
              <Ionicons name="trophy" size={22} color={COLORS.honeyText} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.bannerTitle}>
                {recommendations.length} Verified Endorsement{recommendations.length !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.bannerSub}>
                These recommendations are visible on your profile and shareable with potential employers.
              </Text>
            </View>
          </View>

          {recommendations.map((rec: any) => {
            const instructorName =
              rec.instructor?.name || rec.skillSharer?.name || rec.recommender?.name || 'Skill Sharer';
            const instructorTitle = rec.instructor?.profile?.headline || rec.skillSharer?.profile?.headline || '';
            const courseName = rec.course?.title || '';
            const recDate = rec.createdAt
              ? new Date(rec.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : '';
            const isPublic = rec.isPublic !== false;
            const initial = instructorName[0]?.toUpperCase() || 'S';

            return (
              <View key={rec.id} style={styles.recCard}>
                {/* Header Tag Row */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.courseTag}>
                    <Ionicons name="book-outline" size={12} color={COLORS.primary} style={{ marginRight: 4 }} />
                    <Text style={styles.courseTagText} numberOfLines={1}>
                      {courseName || 'Completed Course'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.publicBadge,
                      { backgroundColor: isPublic ? COLORS.badgeGreenBg : COLORS.surfaceMuted },
                    ]}
                  >
                    <Ionicons
                      name={isPublic ? 'globe-outline' : 'lock-closed-outline'}
                      size={11}
                      color={isPublic ? COLORS.badgeGreenText : COLORS.neutralMedium}
                      style={{ marginRight: 3 }}
                    />
                    <Text
                      style={[
                        styles.publicBadgeText,
                        { color: isPublic ? COLORS.badgeGreenText : COLORS.neutralMedium },
                      ]}
                    >
                      {isPublic ? 'Public' : 'Private'}
                    </Text>
                  </View>
                </View>

                {/* Content Quote */}
                <Text style={styles.recTitle}>"{rec.title}"</Text>
                <Text style={styles.recContent}>{rec.content}</Text>

                {/* Recommender Footer */}
                <View style={styles.recommenderRow}>
                  <View style={styles.recommenderAvatar}>
                    <Text style={styles.recommenderAvatarText}>{initial}</Text>
                  </View>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.recommenderName}>{instructorName}</Text>
                    {instructorTitle ? <Text style={styles.recommenderTitle}>{instructorTitle}</Text> : null}
                    <Text style={styles.instructorBadgeText}>Verified Course Instructor</Text>
                  </View>
                  {recDate ? <Text style={styles.recDate}>{recDate}</Text> : null}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: COLORS.bgWarm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    elevation: 2,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.neutralDark,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.neutralMedium,
    fontWeight: '500',
    marginTop: 1,
  },
  scrollArea: {
    flex: 1,
    ...Platform.select({
      web: {
        overflowY: 'auto' as any,
        WebkitOverflowScrolling: 'touch' as any,
      },
    }),
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 40,
    gap: 16,
  },

  // Banner
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.honeyBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FBE8C4',
  },
  bannerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F7DCAB',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.honeyText,
    marginBottom: 2,
  },
  bannerSub: {
    fontSize: 11,
    color: COLORS.neutralDark,
    lineHeight: 16,
  },

  // Card
  recCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    elevation: 2,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  courseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.badgeOrangeBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    maxWidth: '70%',
  },
  courseTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  publicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  publicBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  recTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.neutralDark,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  recContent: {
    fontSize: 13,
    color: COLORS.neutralDark,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 14,
  },

  recommenderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderWarm,
    paddingTop: 12,
  },
  recommenderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.badgeOrangeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  recommenderAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  recommenderName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.neutralDark,
  },
  recommenderTitle: {
    fontSize: 11,
    color: COLORS.neutralMedium,
  },
  instructorBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 1,
  },
  recDate: {
    fontSize: 10,
    color: COLORS.neutralMedium,
  },

  // Loading & Empty
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: COLORS.neutralMedium,
    fontWeight: '600',
  },
  emptyContainer: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    marginHorizontal: 18,
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.badgeOrangeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.neutralDark,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    lineHeight: 18,
  },
});
