import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchSingleAssignment, submitAssignmentWork, fetchLearnerSubmissions } from '../../api/learner.service';

export default function AssignmentDetailScreen({ route, navigation }: any) {
  const { assignmentId } = route.params || {};
  const [assignment, setAssignment] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form
  const [textSubmission, setTextSubmission] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (assignmentId) {
      loadData();
    }
  }, [assignmentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch assignment
      const assignRes: any = await fetchSingleAssignment(assignmentId);
      setAssignment(assignRes?.assignment || assignRes?.data?.assignment || assignRes?.data);

      // Fetch submission
      const subRes: any = await fetchLearnerSubmissions(assignmentId);
      const subs = subRes?.submissions || subRes?.data || [];
      if (subs.length > 0) {
        setSubmission(subs[0]);
      }
    } catch (error) {
      console.error('Error fetching assignment details:', error);
      Alert.alert('Error', 'Could not load assignment details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!textSubmission.trim() && !githubLink.trim()) {
      Alert.alert('Validation Error', 'Please provide either text submission or a GitHub link.');
      return;
    }

    try {
      setIsSubmitting(true);
      await submitAssignmentWork(assignmentId, {
        textSubmission: textSubmission.trim() || undefined,
        githubLink: githubLink.trim() || undefined,
        // Assuming file upload is not fully implemented in the UI yet, we can add it later
      });
      
      Alert.alert('Success', 'Assignment submitted successfully!');
      loadData();
    } catch (error: any) {
      console.error('Error submitting assignment:', error);
      Alert.alert('Error', error?.response?.data?.error || 'Failed to submit assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!assignment) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Assignment Not Found</Text>
        </View>
      </View>
    );
  }

  const isGraded = submission && submission.status === 'GRADED';
  const isSubmitted = submission && (submission.status === 'SUBMITTED' || isGraded);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{assignment.title}</Text>
          <Text style={styles.headerSubtitle}>Assignment Details</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ padding: 20 }}>
        {/* Instructions */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.instructionsText}>{assignment.instructions || 'No special instructions provided.'}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>Max Marks</Text>
              <Text style={styles.metaValue}>{assignment.maxMarks}</Text>
            </View>
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>Deadline</Text>
              <Text style={styles.metaValue}>{new Date(assignment.deadline).toLocaleDateString()}</Text>
            </View>
          </View>
        </View>

        {/* Previous Submission Status */}
        {submission && (
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusTitle}>Submission Status</Text>
              <View style={[styles.badge, isGraded ? styles.badgeSuccess : styles.badgeWarning]}>
                <Text style={[styles.badgeText, isGraded ? styles.badgeTextSuccess : styles.badgeTextWarning]}>
                  {submission.status}
                </Text>
              </View>
            </View>
            
            {isGraded && (
              <View style={styles.gradeBox}>
                <Text style={styles.gradeLabel}>Grade Received</Text>
                <Text style={styles.gradeValue}>{submission.grade} / {assignment.maxMarks}</Text>
                {submission.feedback && (
                  <View style={styles.feedbackBox}>
                    <Text style={styles.feedbackLabel}>Feedback:</Text>
                    <Text style={styles.feedbackText}>{submission.feedback}</Text>
                  </View>
                )}
              </View>
            )}
            
            <View style={styles.submittedWork}>
              <Text style={styles.submittedWorkTitle}>Your Work:</Text>
              {submission.textSubmission && <Text style={styles.submittedText}>{submission.textSubmission}</Text>}
              {submission.githubLink && (
                <TouchableOpacity onPress={() => Linking.openURL(submission.githubLink)}>
                  <Text style={styles.submittedLink}>{submission.githubLink}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Submission Form */}
        {!isGraded && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{isSubmitted ? 'Resubmit Assignment' : 'Submit Assignment'}</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Text / Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={textSubmission}
                onChangeText={setTextSubmission}
                placeholder="Enter any text submission here..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>GitHub / Project Link</Text>
              <TextInput
                style={styles.input}
                value={githubLink}
                onChangeText={setGithubLink}
                placeholder="https://github.com/..."
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>{isSubmitted ? 'Resubmit' : 'Submit Work'}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  headerSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 18, color: '#6B7280' },
  content: { flex: 1 },
  
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  instructionsText: { fontSize: 15, color: '#4B5563', lineHeight: 22, marginBottom: 20 },
  
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  metaLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  metaValue: { fontSize: 16, fontWeight: '600', color: '#111827' },
  
  statusCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  statusTitle: { fontSize: 16, fontWeight: '700', color: '#312E81' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeSuccess: { backgroundColor: '#D1FAE5' },
  badgeWarning: { backgroundColor: '#FEF3C7' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  badgeTextSuccess: { color: '#065F46' },
  badgeTextWarning: { color: '#92400E' },
  
  gradeBox: { backgroundColor: '#FFF', padding: 16, borderRadius: 8, marginBottom: 15 },
  gradeLabel: { fontSize: 14, color: '#6B7280' },
  gradeValue: { fontSize: 24, fontWeight: '700', color: '#111827', marginVertical: 4 },
  feedbackBox: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  feedbackLabel: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  feedbackText: { fontSize: 14, color: '#111827', marginTop: 4 },
  
  submittedWork: { marginTop: 10 },
  submittedWorkTitle: { fontSize: 14, fontWeight: '600', color: '#312E81', marginBottom: 8 },
  submittedText: { fontSize: 14, color: '#4B5563', marginBottom: 8 },
  submittedLink: { fontSize: 14, color: '#4F46E5', textDecorationLine: 'underline' },
  
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: { height: 100 },
  
  submitBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
