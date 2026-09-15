import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card } from '../common/Card';
import { Course } from '../../types';

interface CourseCardProps {
  course: Course;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSubmit?: () => void;
  onViewReviews?: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return '#6B7280';
    case 'SUBMITTED':
      return '#F59E0B';
    case 'UNDER_REVIEW':
      return '#3B82F6';
    case 'APPROVED':
      return '#10B981';
    case 'PUBLISHED':
      return '#059669';
    case 'REJECTED':
      return '#EF4444';
    default:
      return '#6B7280';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return 'Draft';
    case 'SUBMITTED':
      return 'Pending Review';
    case 'UNDER_REVIEW':
      return 'Under Review';
    case 'CHANGES_REQUESTED':
      return 'Changes Requested';
    case 'APPROVED':
      return 'Approved';
    case 'PUBLISHED':
      return 'Published';
    case 'REJECTED':
      return 'Rejected';
    case 'SUSPENDED':
      return 'Suspended';
    default:
      return status;
  }
};

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onPress,
  onEdit,
  onDelete,
  onSubmit,
  onViewReviews,
}) => {
  const isDraft = course?.status === 'DRAFT';
  const isSubmitted = course?.status === 'SUBMITTED' || course?.status === 'UNDER_REVIEW';

  const ratingNum = Number(course?.rating) || 0;
  const enrolledNum = Number(course?.enrolledCount) || 0;
  const rawDate = course?.createdAt ? new Date(course.createdAt) : new Date();
  const dateStr = !isNaN(rawDate.getTime()) ? rawDate.toLocaleDateString() : 'N/A';

  return (
    <Card variant="elevated" style={styles.card}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {course?.title || 'Untitled Course'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(course?.status || 'DRAFT') }]}>
              <Text style={styles.statusText}>{getStatusLabel(course?.status || 'DRAFT')}</Text>
            </View>
          </View>
          <Text style={styles.difficulty}>{course?.difficulty || 'Beginner'}</Text>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {course?.description || 'No description provided.'}
        </Text>

        <View style={styles.footer}>
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text style={styles.metaText}>{course?.duration || 'N/A'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={16} color="#6B7280" />
              <Text style={styles.metaText}>{enrolledNum} enrolled</Text>
            </View>
            {ratingNum > 0 && (
              <View style={styles.metaItem}>
                <Ionicons name="star" size={16} color="#F59E0B" />
                <Text style={styles.metaText}>{ratingNum.toFixed(1)}</Text>
              </View>
            )}
          </View>
          <Text style={styles.date}>{dateStr}</Text>
        </View>
      </TouchableOpacity>

      {(isDraft || isSubmitted) ? (
        <View style={styles.actions}>
          {isDraft && (
            <>
              <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
                <Ionicons name="create-outline" size={20} color="#4F46E5" />
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={onSubmit}>
                <Ionicons name="send-outline" size={20} color="#10B981" />
                <Text style={[styles.actionText, styles.actionTextSubmit]}>Submit</Text>
              </TouchableOpacity>
            </>
          )}
          {isDraft && (
            <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={[styles.actionText, styles.actionTextDelete]}>Delete</Text>
            </TouchableOpacity>
          )}
          {isSubmitted && (
            <Text style={styles.pendingText}>Waiting for admin review...</Text>
          )}
        </View>
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={onViewReviews}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={[styles.actionText, { color: '#B45309', fontWeight: '600' }]}>
              {ratingNum > 0 ? `Learner Reviews (${ratingNum.toFixed(1)} ⭐)` : 'Learner Reviews ⭐'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  difficulty: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    color: '#4F46E5',
  },
  actionTextSubmit: {
    color: '#10B981',
  },
  actionTextDelete: {
    color: '#EF4444',
  },
  pendingText: {
    fontSize: 14,
    color: '#F59E0B',
    fontStyle: 'italic',
  },
});