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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { fetchMyRecommendations } from '../../api/learner.service';

export default function MyRecommendationsScreen({ navigation }: any) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const res = await fetchMyRecommendations();
      const data = res?.data || res?.recommendations || (Array.isArray(res) ? res : []);
      setRecommendations(data);
    } catch (err) {
      console.log('Failed to load recommendations', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadRecommendations(); }, []));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation?.canGoBack && navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation?.navigate('MyLearning');
            }
          }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>My Recommendations</Text>
          <Text style={styles.headerSub}>What your Skill Sharers say about you</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading recommendations...</Text>
        </View>
      ) : recommendations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="ribbon-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Recommendations Yet</Text>
          <Text style={styles.emptyText}>
            Complete a course and your Skill Sharer may write a recommendation highlighting your performance.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Banner */}
          <View style={styles.banner}>
            <Ionicons name="trophy" size={28} color="#F59E0B" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.bannerTitle}>You have {recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''}!</Text>
              <Text style={styles.bannerSub}>These are visible to potential employers.</Text>
            </View>
          </View>

          {recommendations.map((rec: any) => {
            const instructorName = rec.instructor?.name || rec.skillSharer?.name || rec.recommender?.name || 'Skill Sharer';
            const instructorTitle = rec.instructor?.profile?.headline || rec.skillSharer?.profile?.headline || '';
            const courseName = rec.course?.title || '';
            const recDate = rec.createdAt ? new Date(rec.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '';
            const isPublic = rec.isPublic !== false;

            return (
              <View key={rec.id} style={styles.recCard}>
                {/* Quote icon */}
                <View style={styles.quoteIcon}>
                  <Ionicons name="chatbubble-ellipses" size={18} color="#4F46E5" />
                </View>

                {/* Content */}
                <Text style={styles.recTitle}>{rec.title}</Text>
                <Text style={styles.recContent}>"{rec.content}"</Text>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Recommender */}
                <View style={styles.recommenderRow}>
                  <View style={styles.recommenderAvatar}>
                    <Text style={styles.recommenderAvatarText}>
                      {instructorName[0]?.toUpperCase() || 'S'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recommenderName}>{instructorName}</Text>
                    {instructorTitle ? <Text style={styles.recommenderTitle}>{instructorTitle}</Text> : null}
                    {courseName ? (
                      <View style={styles.courseTag}>
                        <Ionicons name="book-outline" size={11} color="#6B7280" />
                        <Text style={styles.courseTagText}>{courseName}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.metaRight}>
                    {recDate ? <Text style={styles.recDate}>{recDate}</Text> : null}
                    {isPublic && (
                      <View style={styles.publicBadge}>
                        <Ionicons name="globe-outline" size={10} color="#059669" />
                        <Text style={styles.publicBadgeText}>Public</Text>
                      </View>
                    )}
                  </View>
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
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#4F46E5', paddingHorizontal: 16, paddingVertical: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: '#C7D2FE', marginTop: 2 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14 },

  emptyContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 32, gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 22 },

  content: { padding: 16, gap: 16, paddingBottom: 40 },

  banner: {
    backgroundColor: '#FFFBEB', borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#FDE68A',
  },
  bannerTitle: { fontSize: 14, fontWeight: '700', color: '#92400E' },
  bannerSub: { fontSize: 12, color: '#A16207', marginTop: 2 },

  recCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 20,
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 4,
    borderLeftWidth: 4, borderLeftColor: '#4F46E5',
  },
  quoteIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  recTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 8 },
  recContent: {
    fontSize: 14, color: '#374151', lineHeight: 22,
    fontStyle: 'italic', marginBottom: 16,
  },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 14 },

  recommenderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  recommenderAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center',
  },
  recommenderAvatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  recommenderName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  recommenderTitle: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  courseTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  courseTagText: { fontSize: 11, color: '#6B7280' },
  metaRight: { alignItems: 'flex-end', gap: 4 },
  recDate: { fontSize: 11, color: '#9CA3AF' },
  publicBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  publicBadgeText: { fontSize: 10, fontWeight: '600', color: '#059669' },
});
