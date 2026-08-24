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
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchCourseReviews,
  createCourseReview,
  updateCourseReview,
  deleteCourseReview,
  fetchCourseDetails,
} from '../../api/learner.service';
import { Header } from '../../components/common/Header';

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
  const { courseId, courseTitle, hasCompleted: routeHasCompleted } = route.params || {};

  const [reviews, setReviews] = useState<any[]>([]);
  const [myReview, setMyReview] = useState<any | null>(null);
  const [hasCompleted, setHasCompleted] = useState<boolean>(routeHasCompleted ?? true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const loadReviews = async () => {
    try {
      setLoading(true);

      // 1. Get current logged-in user
      let userId: string | null = null;
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const u = JSON.parse(userStr);
          userId = u.id || u.userId;
          setCurrentUserId(userId);
        }
      } catch (e) {}

      // 2. Fetch all reviews for this course
      const res = await fetchCourseReviews(courseId);
      const allReviews: any[] = res?.reviews || res?.data || (Array.isArray(res) ? res : []);
      setReviews(allReviews);

      // 3. Find if user already submitted a review
      if (userId) {
        const found = allReviews.find((r: any) => (r.learnerId && r.learnerId === userId) || (r.learner?.id && r.learner.id === userId));
        if (found) {
          setMyReview(found);
        }
      }

      // 4. Verify completion status if not explicitly passed as true
      if (routeHasCompleted === undefined) {
        try {
          const courseRes = await fetchCourseDetails(courseId);
          const enrollment = courseRes?.userEnrollment;
          if (enrollment) {
            const isDone = enrollment.status === 'COMPLETED' || (enrollment.progressPercentage != null && enrollment.progressPercentage >= 100);
            setHasCompleted(isDone);
          } else {
            setHasCompleted(true);
          }
        } catch (e) {
          setHasCompleted(true);
        }
      } else {
        setHasCompleted(routeHasCompleted);
      }
    } catch (err) {
      console.log('Failed to load reviews', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadReviews(); }, [courseId]));

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length
    : 0;

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Toast.show({ type: 'error', text1: 'Rating Required', text2: 'Please select a star rating between 1 and 5.' });
      return;
    }
    try {
      setSubmitting(true);
      if (isEditing && myReview) {
        await updateCourseReview(myReview.id, { rating, comment, review: comment } as any);
        Toast.show({ type: 'success', text1: 'Success', text2: 'Your review has been updated!' });
      } else {
        await createCourseReview({ courseId, rating, comment, review: comment } as any);
        Toast.show({ type: 'success', text1: 'Success', text2: 'Your review has been submitted!' });
      }
      setIsEditing(false);
      setComment('');
      loadReviews();
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || err?.error || err?.message || 'Failed to submit review.';
      Toast.show({ type: 'error', text1: 'Notice', text2: errMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditReview = (review: any) => {
    setMyReview(review);
    setRating(review.rating || 5);
    setComment(review.comment || review.review || '');
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
            setRating(5);
            setComment('');
            setMyReview(null);
            loadReviews();
          } catch (err: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: err?.error || err?.message || 'Failed to delete review.' });
          }
        }
      }
    ]);
  };

  const ratingBars = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter((r: any) => r.rating === star).length,
  }));

  const canReview = hasCompleted || !!myReview;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />

      <Header
        title="Ratings & Reviews"
        showBack={true}
        onBackPress={() => {
          if (navigation?.canGoBack && navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation?.navigate('CourseList');
          }
        }}
      />

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
        {canReview ? (
          <View style={styles.writeCard}>
            <Text style={styles.sectionTitle}>
              {isEditing || myReview ? '✏️ Your Review' : '⭐ Write a Review'}
            </Text>
            <Text style={styles.sectionSub}>
              {isEditing || myReview
                ? 'Update your rating and feedback for this course.'
                : 'Share your learning experience with other students.'}
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
              placeholder="Write your review and feedback..."
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
                  onPress={() => {
                    setIsEditing(false);
                    setComment('');
                  }}
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
                  <Text style={styles.submitBtnText}>{isEditing || myReview ? 'Update Review' : 'Submit Review'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.noticeCard}>
            <Ionicons name="ribbon-outline" size={24} color="#6366F1" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.noticeTitle}>Completed Learners Only</Text>
              <Text style={styles.noticeText}>
                Complete all course lessons (100% progress) to unlock rating and reviewing.
              </Text>
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
            const isOwn =
              (currentUserId && (review.learnerId === currentUserId || review.learner?.id === currentUserId)) ||
              (myReview && myReview.id === review.id) ||
              review.isMyReview;

            const reviewDate = review.createdAt
              ? new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
              : '';

            const commentContent = review.comment || review.review;

            return (
              <View
                key={review.id}
                style={[styles.reviewCard, isOwn && styles.reviewCardEditing]}
              >
                <View style={styles.reviewHeader}>
                  <View style={[styles.avatar, isOwn && { backgroundColor: '#4F46E5' }]}>
                    <Text style={[styles.avatarText, isOwn && { color: '#fff' }]}>
                      {(review.learner?.name || review.learner?.email || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewerName}>
                      {review.learner?.name || 'Learner'} {isOwn ? '(You)' : ''}
                    </Text>
                    <Text style={styles.reviewDate}>{reviewDate}</Text>
                  </View>
                  <StarRating rating={review.rating} size={14} readonly />
                </View>

                {commentContent ? (
                  <Text style={styles.reviewComment}>{commentContent}</Text>
                ) : null}

                {/* Show edit/delete for own review */}
                {isOwn && (
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
    </View>
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
  content: { flexGrow: 1, padding: 16, gap: 16, paddingBottom: 40 },

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
  noticeCard: {
    backgroundColor: '#EFF6FF', borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  noticeTitle: { fontSize: 14, fontWeight: '700', color: '#1E40AF' },
  noticeText: { fontSize: 12, color: '#3B82F6', marginTop: 2, lineHeight: 18 },

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
  reviewCardEditing: { borderWidth: 1.5, borderColor: '#4F46E5' },
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
