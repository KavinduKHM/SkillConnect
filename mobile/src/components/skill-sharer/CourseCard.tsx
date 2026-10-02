import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card } from '../common/Card';
import { Course } from '../../types';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { RADIUS, SHADOWS } from '../../theme/shadows';

interface CourseCardProps {
  course: Course;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSubmit?: () => void;
  onViewReviews?: () => void;
  onViewAnalytics?: () => void;
}

const statusInfo = (status: string) => {
  switch (status) {
    case 'PUBLISHED':
      return { label: 'Published', color: COLORS.badgeGreenText, bg: COLORS.badgeGreenBg };
    case 'SUBMITTED':
    case 'UNDER_REVIEW':
      return { label: 'Pending Review', color: COLORS.honeyText, bg: COLORS.honeyBg };
    case 'APPROVED':
      return { label: 'Approved', color: COLORS.badgeGreenText, bg: COLORS.badgeGreenBg };
    case 'REJECTED':
      return { label: 'Rejected', color: COLORS.error, bg: COLORS.errorBg };
    default:
      return { label: 'Draft', color: COLORS.neutralMedium, bg: COLORS.surfaceMuted };
  }
};

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onPress,
  onEdit,
  onDelete,
  onSubmit,
  onViewReviews,
  onViewAnalytics,
}) => {
  const isDraft = course?.status === 'DRAFT';
  const isSubmitted = course?.status === 'SUBMITTED' || course?.status === 'UNDER_REVIEW';
  const rating = Number(course?.rating) || 0;
  const enrolled = Number(course?.enrolledCount) || 0;
  const date = course?.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'N/A';
  const status = statusInfo(course?.status || 'DRAFT');

  return (
    <Card variant="elevated" style={styles.cardContainer}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <View style={styles.header}>
          <View style={styles.badges}>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: status.color }]} />
              <Text style={[styles.statusText, { color: status.color }]}>
                {status.label}
              </Text>
            </View>

            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>
                ⚡ {course?.difficulty || 'BEGINNER'}
              </Text>
            </View>
          </View>

          <Text style={styles.dateText}>{date}</Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {course?.title || 'Untitled Micro-Course'}
        </Text>

        <Text style={styles.description} numberOfLines={2}>
          {course?.description || 'No sprint overview provided for this course.'}
        </Text>

        {isSubmitted && (
          <View style={styles.pendingBox}>
            <Ionicons name="time-outline" size={16} color={COLORS.honeyText} />
            <View style={styles.pendingTextContainer}>
              <Text style={styles.pendingText}>Waiting for admin review...</Text>
              <Text style={styles.pendingSubtext}>
                Curriculum team is evaluating sprint quality.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={COLORS.primary} />
            <Text style={styles.metaText}>{course?.duration || '5 mins'}</Text>
          </View>

          <Text style={styles.separator}>•</Text>

          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={14} color={COLORS.primary} />
            <Text style={styles.metaText}>{enrolled} learners</Text>
          </View>

          {rating > 0 && (
            <View style={styles.reviewMeta}>
              <Ionicons name="star" size={14} color={COLORS.starYellow} />
              <Text style={styles.reviewText}>{rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.actionsRow}>
        {isDraft && (
          <>
            <TouchableOpacity style={styles.actionBtnSecondary} onPress={onEdit} activeOpacity={0.7}>
              <Ionicons name="create-outline" size={15} color={COLORS.primary} />
              <Text style={styles.actionTextSecondary}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtnPrimary} onPress={onSubmit} activeOpacity={0.7}>
              <Ionicons name="checkmark" size={15} color={COLORS.white} />
              <Text style={styles.actionTextPrimary}>Submit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={16} color={COLORS.neutralMedium} />
            </TouchableOpacity>
          </>
        )}

        {isSubmitted && (
          <TouchableOpacity style={styles.actionBtnSecondary} onPress={onEdit} activeOpacity={0.7}>
            <Text style={styles.actionTextSecondary}>Edit Details</Text>
          </TouchableOpacity>
        )}

        {!isDraft && !isSubmitted && (
          <>
            <TouchableOpacity style={styles.analyticsBtn} onPress={onViewAnalytics} activeOpacity={0.7}>
              <Ionicons name="bar-chart-outline" size={15} color={COLORS.badgeGreenText} />
              <Text style={styles.analyticsText}>Analytics</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtnSecondary} onPress={onViewReviews} activeOpacity={0.7}>
              <Ionicons name="star-outline" size={15} color={COLORS.primary} />
              <Text style={styles.actionTextSecondary}>
                {rating > 0 ? `${rating.toFixed(1)} Reviews` : 'Reviews'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceCard,
    borderColor: COLORS.borderSubtle,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    ...TYPOGRAPHY.labelSm,
  },
  difficultyBadge: {
    backgroundColor: COLORS.honeyBg,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  difficultyText: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.honeyText,
  },
  dateText: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.neutralLight,
  },
  title: {
    ...TYPOGRAPHY.headlineSm,
    color: COLORS.neutralDark,
    marginBottom: 6,
  },
  description: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.neutralMedium,
    marginBottom: 12,
  },
  pendingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.honeyBg,
    borderColor: COLORS.borderSubtle,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 12,
  },
  pendingTextContainer: {
    marginLeft: 8,
  },
  pendingText: {
    ...TYPOGRAPHY.labelMd,
    color: COLORS.honeyText,
  },
  pendingSubtext: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.neutralMedium,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderWarm,
    paddingBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.neutralMedium,
  },
  separator: {
    color: COLORS.borderSubtle,
    fontSize: 12,
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  reviewText: {
    ...TYPOGRAPHY.labelMd,
    color: COLORS.honeyText,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actionTextPrimary: {
    ...TYPOGRAPHY.labelMd,
    color: COLORS.white,
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.badgeOrangeBg,
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actionTextSecondary: {
    ...TYPOGRAPHY.labelMd,
    color: COLORS.primary,
  },
  deleteBtn: {
    padding: 8,
    marginLeft: 'auto',
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceMuted,
  },
  analyticsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.badgeGreenBg,
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  analyticsText: {
    ...TYPOGRAPHY.labelMd,
    color: COLORS.badgeGreenText,
  },
});
