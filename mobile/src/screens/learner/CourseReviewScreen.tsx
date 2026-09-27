import React, { useState, useCallback } from 'react';
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
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  fetchCourseReviews,
  createCourseReview,
  updateCourseReview,
  deleteCourseReview,
} from '../../api/learner.service';
import { COLORS } from '../../theme/colors';

const STAR_COUNT = 5;

function StarRating({
  rating,
  onRate,
  size = 28,
  readonly = false,
}: {
  rating: number;
  onRate?: (r: number) => void;
  size?: number;
  readonly?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
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
            color={i < rating ? COLORS.tertiary : COLORS.neutralLight}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function CourseReviewScreen({ route, navigation }: any) {
  const { courseId, courseTitle, hasCompleted } = route.params || {};

  const [reviews, setReviews] = useState<any[]>([]);
  const [myReview, setMyReview] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const showNotification = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await fetchCourseReviews(courseId);
      const allReviews = res?.reviews || res?.data || [];
      setReviews(Array.isArray(allReviews) ? allReviews : []);
    } catch (err) {
      console.log('Failed to load reviews', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadReviews();
    }, [courseId])
  );

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length
      : 0;

  const handleSubmitReview = async () => {
    if (rating === 0) {
      showNotification('Rating Required', 'Please select a star rating before submitting.');
      return;
    }
    try {
      setSubmitting(true);
      if (isEditing && myReview) {
        await updateCourseReview(myReview.id, { rating, comment: comment.trim() });
        showNotification('Success', 'Your review has been updated!');
      } else {
        await createCourseReview({ courseId, rating, comment: comment.trim() });
        showNotification('Success', 'Your review has been submitted!');
      }
      setIsEditing(false);
      setRating(0);
      setComment('');
      setMyReview(null);
      loadReviews();
    } catch (err: any) {
      showNotification('Error', err?.error || err?.message || 'Failed to submit review.');
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

  const doDeleteReview = async (reviewId: string) => {
    try {
      await deleteCourseReview(reviewId);
      setIsEditing(false);
      setRating(0);
      setComment('');
      setMyReview(null);
      showNotification('Deleted', 'Your review has been removed.');
      loadReviews();
    } catch (err: any) {
      showNotification('Error', err?.error || 'Failed to delete review.');
    }
  };

  const handleDeleteReview = (reviewId: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete your review?')) {
        doDeleteReview(reviewId);
      }
    } else {
      Alert.alert('Delete Review', 'Are you sure you want to delete your review?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => doDeleteReview(reviewId),
        },
      ]);
    }
  };

  const ratingBars = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r: any) => r.rating === star).length,
  }));

  const ratingDescriptors = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Exceptional!'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={COLORS.neutralDark} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Ratings & Reviews</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {courseTitle || 'Course Reviews'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Rating Summary Hero Card */}
        {!loading && reviews.length > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryLeft}>
              <Text style={styles.bigRating}>{avgRating.toFixed(1)}</Text>
              <StarRating rating={Math.round(avgRating)} size={18} readonly />
              <Text style={styles.reviewCount}>
                {reviews.length} {reviews.length !== 1 ? 'reviews' : 'review'}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRight}>
              {ratingBars.map(({ star, count }) => (
                <View key={star} style={styles.barRow}>
                  <Text style={styles.barLabel}>{star}</Text>
                  <Ionicons name="star" size={11} color={COLORS.tertiary} />
                  <View style={styles.barBg}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: reviews.length > 0 ? (`${(count / reviews.length) * 100}%` as any) : '0%',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barCount}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Write / Edit Review Card */}
        {hasCompleted && (
          <View style={styles.writeCard}>
            <View style={styles.writeCardHeader}>
              <View style={styles.writeCardPill}>
                <Text style={styles.writeCardPillText}>
                  {isEditing ? 'UPDATE FEEDBACK' : 'YOUR FEEDBACK'}
                </Text>
              </View>
              <Text style={styles.sectionTitle}>
                {isEditing ? 'Edit Your Review' : 'Rate this Course'}
              </Text>
              <Text style={styles.sectionSub}>
                {isEditing
                  ? 'Adjust your rating score or feedback comment below.'
                  : 'Share your learning experience to help other learners.'}
              </Text>
            </View>

            <View style={styles.starRow}>
              <StarRating rating={rating} onRate={setRating} size={32} />
              {rating > 0 && (
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingBadgeText}>{ratingDescriptors[rating]}</Text>
                </View>
              )}
            </View>

            <TextInput
              style={styles.commentInput}
              placeholder="What did you think of the explanations, exercises, and instructor support?..."
              placeholderTextColor={COLORS.neutralLight}
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
                    setRating(0);
                    setComment('');
                    setMyReview(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                onPress={handleSubmitReview}
                disabled={submitting}
                activeOpacity={0.9}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {isEditing ? 'Update Review' : 'Submit Review →'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* All Reviews Feed */}
        <View style={styles.feedHeader}>
          <Text style={styles.feedTitle}>
            Learner Reviews {reviews.length > 0 ? `(${reviews.length})` : ''}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading reviews...</Text>
          </View>
        ) : reviews.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="chatbubbles-outline" size={36} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Reviews Yet</Text>
            <Text style={styles.emptyText}>
              Be the first to finish this course and share your rating and feedback!
            </Text>
          </View>
        ) : (
          reviews.map((review: any) => {
            const reviewDate = review.createdAt
              ? new Date(review.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : '';
            const initial = (review.learner?.name || review.learner?.email || '?')[0]?.toUpperCase() || 'L';

            return (
              <View
                key={review.id}
                style={[
                  styles.reviewCard,
                  isEditing && myReview?.id === review.id && styles.reviewCardEditing,
                ]}
              >
                <View style={styles.reviewHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initial}</Text>
                  </View>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.reviewerName}>{review.learner?.name || 'Enrolled Learner'}</Text>
                    <Text style={styles.reviewDate}>{reviewDate}</Text>
                  </View>
                  <StarRating rating={review.rating} size={14} readonly />
                </View>

                {review.comment ? <Text style={styles.reviewComment}>"{review.comment}"</Text> : null}

                {/* Show edit/delete for learner's own review */}
                {review.isMyReview && (
                  <View style={styles.reviewActions}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => handleEditReview(review)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="pencil-outline" size={13} color={COLORS.primaryDark} />
                      <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteReview(review.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="trash-outline" size={13} color={COLORS.error} />
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

  // Summary Card
  summaryCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 22,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    elevation: 2,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  summaryLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
  },
  bigRating: {
    fontSize: 44,
    fontWeight: '800',
    color: COLORS.neutralDark,
    lineHeight: 48,
    marginBottom: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: COLORS.neutralMedium,
    marginTop: 6,
    fontWeight: '600',
  },
  summaryDivider: {
    width: 1,
    height: '75%',
    backgroundColor: COLORS.borderWarm,
    marginHorizontal: 16,
  },
  summaryRight: {
    flex: 1,
    justifyContent: 'center',
    gap: 5,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.neutralDark,
    width: 10,
    textAlign: 'right',
  },
  barBg: {
    flex: 1,
    height: 7,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.tertiary,
    borderRadius: 4,
  },
  barCount: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.neutralMedium,
    width: 22,
    textAlign: 'right',
  },

  // Write Card
  writeCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    elevation: 2,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  writeCardHeader: {
    marginBottom: 14,
  },
  writeCardPill: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.badgeOrangeBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  writeCardPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.neutralDark,
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: 12,
    color: COLORS.neutralMedium,
    marginTop: 2,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  ratingBadge: {
    backgroundColor: COLORS.honeyBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FBE8C4',
  },
  ratingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.honeyText,
  },
  commentInput: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 14,
    padding: 14,
    fontSize: 13,
    color: COLORS.neutralDark,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    minHeight: 88,
    marginBottom: 14,
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.neutralDark,
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.2,
  },

  // Feed
  feedHeader: {
    marginTop: 4,
    marginBottom: -4,
  },
  feedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.neutralDark,
    letterSpacing: -0.2,
  },
  reviewCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    elevation: 1,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
  },
  reviewCardEditing: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
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
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.neutralDark,
  },
  reviewDate: {
    fontSize: 11,
    color: COLORS.neutralMedium,
    marginTop: 1,
  },
  reviewComment: {
    fontSize: 13,
    color: COLORS.neutralDark,
    lineHeight: 19,
    fontStyle: 'italic',
    marginTop: 4,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderWarm,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceMuted,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: COLORS.errorBg,
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.error,
  },

  // States
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: COLORS.neutralMedium,
    fontWeight: '600',
  },
  emptyBox: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.badgeOrangeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    lineHeight: 18,
  },
});
