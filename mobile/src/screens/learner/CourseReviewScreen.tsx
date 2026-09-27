import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  fetchCourseReviews,
  createCourseReview,
  updateCourseReview,
  deleteCourseReview,
} from '../../api/learner.service';

const STAR_COUNT = 5;

function StarRating({ rating, onRate, size = 28, readonly = false }: { rating: number; onRate?: (r: number) => void; size?: number; readonly?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {Array.from({ length: STAR_COUNT }).map((_, i) => (
        <TouchableOpacity
          key={i}
          disabled={readonly}
          onPress={() => onRate && onRate(i + 1)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={i < rating ? 'star' : 'star-outline'}
            size={size}
            color={i < rating ? '#F59E0B' : '#D1D5DB'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function CourseReviewScreen({ route, navigation }: any) {
  const { courseId, courseTitle, hasCompleted } = route.params;

  const [reviews, setReviews] = useState<any[]>([]);
  const [myReview, setMyReview] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await fetchCourseReviews(courseId);
      const allReviews = res?.reviews || res?.data || [];
      setReviews(allReviews);
    } catch (err) {
      console.log('Failed to load reviews', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadReviews(); }, []));

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length
    : 0;

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }
    try {
      setSubmitting(true);
      if (isEditing && myReview) {
        await updateCourseReview(myReview.id, { rating, comment });
        Alert.alert('Success', 'Your review has been updated!');
      } else {
        await createCourseReview({ courseId, rating, comment });
        Alert.alert('Success', 'Your review has been submitted!');
      }
      setIsEditing(false);
      setRating(0);
      setComment('');
      setMyReview(null);
      loadReviews();
    } catch (err: any) {
      Alert.alert('Error', err?.error || err?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditReview = (review: any) => {
    setMyReview(review);
    setRating(review.rating);
    setComment(review.comment || '');
    setIsEditing(true);
  };

  const handleDeleteReview = (reviewId: string) => {
    Alert.alert('Delete Review', 'Are you sure you want to delete your review?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteCourseReview(reviewId);
            setIsEditing(false);
            setRating(0);
            setComment('');
            setMyReview(null);
            loadReviews();
          } catch (err: any) {
            Alert.alert('Error', err?.error || 'Failed to delete review.');
          }
        }
      }
    ]);
  };

  const ratingBars = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter((r: any) => r.rating === star).length,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Ratings & Reviews</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{courseTitle}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* ── Rating Summary ── */}
        {!loading && reviews.length > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryLeft}>
              <Text style={styles.bigRating}>{avgRating.toFixed(1)}</Text>
              <StarRating rating={Math.round(avgRating)} size={20} readonly />
              <Text style={styles.reviewCount}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.summaryRight}>
              {ratingBars.map(({ star, count }) => (
                <View key={star} style={styles.barRow}>
                  <Text style={styles.barLabel}>{star}</Text>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` as any : '0%' }]} />
                  </View>
                  <Text style={styles.barCount}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Write / Edit Review ── */}
        {hasCompleted && (
          <View style={styles.writeCard}>
            <Text style={styles.sectionTitle}>
              {isEditing ? '✏️ Edit Your Review' : '⭐ Write a Review'}
            </Text>
            <Text style={styles.sectionSub}>
              {isEditing ? 'Update your rating and comment below.' : 'Share your experience with this course.'}
            </Text>

            <View style={styles.starRow}>
              <StarRating rating={rating} onRate={setRating} />
              {rating > 0 && (
                <Text style={styles.ratingLabel}>
                  {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                </Text>
              )}
            </View>

            <TextInput
              style={styles.commentInput}
              placeholder="Write your comment (optional)..."
              placeholderTextColor="#9CA3AF"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.formActions}>
              {isEditing && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => { setIsEditing(false); setRating(0); setComment(''); setMyReview(null); }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                onPress={handleSubmitReview}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>{isEditing ? 'Update Review' : 'Submit Review'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── All Reviews ── */}
        <Text style={[styles.sectionTitle, { paddingHorizontal: 4, marginBottom: 12 }]}>
          All Reviews {reviews.length > 0 ? `(${reviews.length})` : ''}
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
        ) : reviews.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="chatbubble-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No reviews yet</Text>
            <Text style={styles.emptyText}>Be the first to share your experience!</Text>
          </View>
        ) : (
          reviews.map((review: any) => {
            const isOwn = review.learnerId && myReview?.id === review.id;
            const reviewDate = review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
            return (
              <View key={review.id} style={[styles.reviewCard, isEditing && myReview?.id === review.id && styles.reviewCardEditing]}>
                <View style={styles.reviewHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(review.learner?.name || review.learner?.email || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewerName}>{review.learner?.name || 'Learner'}</Text>
                    <Text style={styles.reviewDate}>{reviewDate}</Text>
                  </View>
                  <StarRating rating={review.rating} size={14} readonly />
                </View>

                {review.comment ? (
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                ) : null}

                {/* Show edit/delete only for own review — use learner field from server */}
                {review.isMyReview && (
                  <View style={styles.reviewActions}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => handleEditReview(review)}>
                      <Ionicons name="pencil-outline" size={14} color="#4F46E5" />
                      <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteReview(review.id)}>
                      <Ionicons name="trash-outline" size={14} color="#DC2626" />
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
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
  content: { padding: 16, gap: 16, paddingBottom: 40 },

  // Summary
  summaryCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    flexDirection: 'row', gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  summaryLeft: { alignItems: 'center', justifyContent: 'center', width: 90 },
  bigRating: { fontSize: 48, fontWeight: '800', color: '#111827', lineHeight: 52 },
  reviewCount: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  summaryRight: { flex: 1, justifyContent: 'center', gap: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  barLabel: { fontSize: 11, color: '#374151', width: 12, textAlign: 'right' },
  barBg: { flex: 1, height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#F59E0B', borderRadius: 3 },
  barCount: { fontSize: 11, color: '#6B7280', width: 20, textAlign: 'right' },

  // Write card
  writeCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  sectionSub: { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  ratingLabel: { fontSize: 14, fontWeight: '600', color: '#F59E0B' },
  commentInput: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    padding: 14, fontSize: 14, color: '#111827',
    minHeight: 90, marginBottom: 16,
  },
  formActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  submitBtn: {
    flex: 2, paddingVertical: 12, borderRadius: 10,
    backgroundColor: '#4F46E5', alignItems: 'center',
  },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Review cards
  reviewCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  reviewCardEditing: { borderWidth: 2, borderColor: '#4F46E5' },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#4F46E5' },
  reviewerName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  reviewDate: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  reviewComment: { fontSize: 14, color: '#374151', lineHeight: 20 },
  reviewActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, backgroundColor: '#EEF2FF',
  },
  editBtnText: { fontSize: 12, fontWeight: '600', color: '#4F46E5' },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, backgroundColor: '#FEF2F2',
  },
  deleteBtnText: { fontSize: 12, fontWeight: '600', color: '#DC2626' },

  // Empty
  emptyBox: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptyText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
});
