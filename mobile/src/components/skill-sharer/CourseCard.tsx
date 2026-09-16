import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card } from '../common/Card';
import { Course } from '../../types';

interface CourseCardProps { course: Course; onPress: () => void; onEdit?: () => void; onDelete?: () => void; onSubmit?: () => void; onViewReviews?: () => void; onViewAnalytics?: () => void; }

const statusInfo = (status: string) => {
  switch (status) {
    case 'PUBLISHED': return { label: 'Published', color: '#16804B' };
    case 'SUBMITTED': case 'UNDER_REVIEW': return { label: 'Pending Review', color: '#C66A00' };
    case 'APPROVED': return { label: 'Approved', color: '#16804B' };
    case 'REJECTED': return { label: 'Rejected', color: '#B3310D' };
    default: return { label: 'Draft', color: '#806C65' };
  }
};

export const CourseCard: React.FC<CourseCardProps> = ({ course, onPress, onEdit, onDelete, onSubmit, onViewReviews, onViewAnalytics }) => {
  const isDraft = course?.status === 'DRAFT';
  const isSubmitted = course?.status === 'SUBMITTED' || course?.status === 'UNDER_REVIEW';
  const rating = Number(course?.rating) || 0;
  const enrolled = Number(course?.enrolledCount) || 0;
  const date = course?.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'N/A';
  const status = statusInfo(course?.status || 'DRAFT');
  const cardStyle = { ...styles.card, borderTopColor: status.color };

  return <Card variant="elevated" style={cardStyle}>
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}><View style={styles.titleColumn}><View style={styles.badges}><View style={[styles.statusBadge, { backgroundColor: `${status.color}18` }]}><View style={[styles.statusDot, { backgroundColor: status.color }]} /><Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text></View><View style={styles.difficulty}><Text style={styles.difficultyText}>{course?.difficulty || 'BEGINNER'}</Text></View></View><Text style={styles.title} numberOfLines={2}>{course?.title || 'Untitled Course'}</Text></View><Text style={styles.date}>{date}</Text></View>
      <Text style={styles.description} numberOfLines={2}>{course?.description || 'No description provided.'}</Text>
      {isSubmitted && <View style={styles.pendingBox}><Ionicons name="time-outline" size={16} color="#C66A00" /><View><Text style={styles.pendingText}>Waiting for admin review...</Text><Text style={styles.pendingSubtext}>Curriculum team is reviewing your content.</Text></View></View>}
      <View style={styles.metaRow}><View style={styles.metaItem}><Ionicons name="time-outline" size={14} color="#B3310D" /><Text style={styles.metaText}>{course?.duration || 'N/A'}</Text></View><Text style={styles.separator}>•</Text><View style={styles.metaItem}><Ionicons name="people-outline" size={14} color="#B3310D" /><Text style={styles.metaText}>{enrolled} enrolled</Text></View>{rating > 0 && <View style={styles.reviewMeta}><Ionicons name="star" size={14} color="#D58B14" /><Text style={styles.reviewText}>{rating.toFixed(1)} Reviews</Text></View>}</View>
    </TouchableOpacity>
    <View style={styles.actions}>
      {isDraft && <><TouchableOpacity style={styles.editAction} onPress={onEdit}><Ionicons name="create-outline" size={15} color="#B3310D" /><Text style={styles.editText}>Edit</Text></TouchableOpacity><TouchableOpacity style={styles.submitAction} onPress={onSubmit}><Ionicons name="checkmark" size={15} color="#FFFFFF" /><Text style={styles.submitText}>Submit</Text></TouchableOpacity><TouchableOpacity style={styles.deleteAction} onPress={onDelete}><Ionicons name="trash-outline" size={16} color="#8A6B61" /></TouchableOpacity></>}
      {isSubmitted && <TouchableOpacity style={styles.editAction} onPress={onEdit}><Text style={styles.editText}>Edit Details</Text></TouchableOpacity>}
      {!isDraft && !isSubmitted && <><TouchableOpacity style={styles.analyticsAction} onPress={onViewAnalytics}><Ionicons name="bar-chart-outline" size={15} color="#16804B" /><Text style={styles.analyticsText}>Analytics</Text></TouchableOpacity><TouchableOpacity style={styles.reviewAction} onPress={onViewReviews}><Ionicons name="star-outline" size={15} color="#B3310D" /><Text style={styles.editText}>{rating > 0 ? `${rating.toFixed(1)} Reviews` : 'Learner Reviews'}</Text></TouchableOpacity></>}
    </View>
  </Card>;
};

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 14, padding: 16, borderRadius: 16, borderTopWidth: 3, borderColor: '#F0D9D1', backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 9 }, titleColumn: { flex: 1, marginRight: 8 }, badges: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 }, statusBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }, statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 }, statusText: { fontSize: 10, fontWeight: '700' }, difficulty: { backgroundColor: '#FFF0EC', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }, difficultyText: { color: '#7A4B3D', fontSize: 10, fontWeight: '700' }, title: { color: '#1D1412', fontSize: 17, lineHeight: 21, fontWeight: '700' }, date: { color: '#60443B', fontSize: 11 }, description: { color: '#60443B', fontSize: 13, lineHeight: 19, marginBottom: 12 },
  pendingBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF5E8', borderColor: '#F4C98E', borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 11 }, pendingText: { color: '#A85D00', fontSize: 12, fontWeight: '600', marginLeft: 7 }, pendingSubtext: { color: '#A85D00', fontSize: 10, marginLeft: 7, marginTop: 2 }, metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderBottomColor: '#F2DED8', paddingBottom: 12 }, metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 }, metaText: { color: '#60443B', fontSize: 11 }, separator: { color: '#B9A29B', fontSize: 12 }, reviewMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' }, reviewText: { color: '#A85D00', fontSize: 11 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 12 }, editAction: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF0EC', borderRadius: 8, paddingHorizontal: 11, paddingVertical: 7 }, submitAction: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#B3310D', borderRadius: 8, paddingHorizontal: 11, paddingVertical: 7 }, deleteAction: { padding: 8, marginLeft: 'auto' }, reviewAction: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFF0EC', borderRadius: 8, paddingHorizontal: 11, paddingVertical: 7 }, editText: { color: '#B3310D', fontSize: 12, fontWeight: '600' }, submitText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  analyticsAction: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#E5F5EB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 }, analyticsText: { color: '#16804B', fontSize: 12, fontWeight: '600' },
});
