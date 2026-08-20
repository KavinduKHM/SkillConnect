import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { assignmentApi } from '../../api/skill-sharer.service';
import { AssignmentSubmission } from '../../types';

export const AssignmentSubmissionsScreen = ({ route, navigation }: any) => {
  const { assignmentId, assignmentTitle } = route.params || {};
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Grading Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (assignmentId) {
      fetchSubmissions();
    }
  }, [assignmentId]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res: any = await assignmentApi.getAssignmentSubmissions(assignmentId);
      const data = res?.submissions || res?.data?.submissions || res?.data || [];
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      Alert.alert('Error', 'Failed to load submissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGradeModal = (sub: AssignmentSubmission) => {
    setSelectedSubmission(sub);
    setGrade(sub.grade !== null && sub.grade !== undefined ? String(sub.grade) : '');
    setFeedback(sub.feedback || '');
    setModalVisible(true);
  };

  const handleSaveGrade = async () => {
    if (!selectedSubmission) return;
    if (!grade.trim()) {
      Alert.alert('Validation Error', 'Grade is required.');
      return;
    }

    try {
      setIsSaving(true);
      await assignmentApi.gradeSubmission(selectedSubmission.id, {
        grade: parseFloat(grade),
        feedback: feedback.trim(),
      });
      
      Alert.alert('Success', 'Grade saved successfully!');
      setModalVisible(false);
      fetchSubmissions();
    } catch (error: any) {
      console.error('Error saving grade:', error);
      Alert.alert('Error', error?.response?.data?.error || 'Failed to save grade.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderSubmission = ({ item }: { item: AssignmentSubmission }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.learnerInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.learner?.name?.charAt(0) || 'L'}</Text>
            </View>
            <View>
              <Text style={styles.learnerName}>{item.learner?.name || 'Unknown Learner'}</Text>
              <Text style={styles.submissionDate}>
                Submitted: {new Date(item.submissionDate).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, item.status === 'GRADED' ? styles.statusGraded : styles.statusPending]}>
            <Text style={[styles.statusText, item.status === 'GRADED' ? styles.statusTextGraded : styles.statusTextPending]}>
              {item.status || 'SUBMITTED'}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          {item.textSubmission && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Text:</Text>
              <Text style={styles.detailValue}>{item.textSubmission}</Text>
            </View>
          )}
          {item.githubLink && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Link:</Text>
              <TouchableOpacity onPress={() => Linking.openURL(item.githubLink!)}>
                <Text style={styles.linkValue}>{item.githubLink}</Text>
              </TouchableOpacity>
            </View>
          )}
          {item.fileUrls && item.fileUrls.length > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Files:</Text>
              {item.fileUrls.map((url, idx) => (
                <TouchableOpacity key={idx} onPress={() => Linking.openURL(url)}>
                  <Text style={styles.linkValue}>View File {idx + 1}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.gradeLabel}>Current Grade:</Text>
            <Text style={styles.gradeValue}>
              {item.grade !== null && item.grade !== undefined ? `${item.grade}` : 'Not Graded'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.gradeBtn}
            onPress={() => handleOpenGradeModal(item)}
          >
            <Text style={styles.gradeBtnText}>{item.grade !== null ? 'Update Grade' : 'Grade Now'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>Submissions</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{assignmentTitle || 'Assignment'}</Text>
        </View>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Loading submissions...</Text>
          </View>
        ) : submissions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="documents-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No Submissions Yet</Text>
            <Text style={styles.emptyStateText}>When learners submit their assignments, they will appear here.</Text>
          </View>
        ) : (
          <FlatList
            data={submissions}
            renderItem={renderSubmission}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Grading Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Grade Submission</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.learnerNameModal}>
                Learner: {selectedSubmission?.learner?.name}
              </Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Grade (Score) *</Text>
                <TextInput
                  style={styles.input}
                  value={grade}
                  onChangeText={setGrade}
                  keyboardType="numeric"
                  placeholder="e.g. 85"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Feedback (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={feedback}
                  onChangeText={setFeedback}
                  placeholder="Provide constructive feedback..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setModalVisible(false)}
                disabled={isSaving}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]} 
                onPress={handleSaveGrade}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Grade</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

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
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#111827' },
  headerSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  content: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#6B7280', fontSize: 16 },
  listContainer: { padding: 20, paddingBottom: 100 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyStateTitle: { fontSize: 20, fontWeight: '600', color: '#111827', marginTop: 20 },
  emptyStateText: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 10 },
  
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  learnerInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  learnerName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  submissionDate: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusGraded: { backgroundColor: '#DEF7EC' },
  statusText: { fontSize: 12, fontWeight: '600' },
  statusTextPending: { color: '#92400E' },
  statusTextGraded: { color: '#03543F' },
  
  cardBody: { marginBottom: 16 },
  detailRow: { marginBottom: 8 },
  detailLabel: { fontSize: 14, fontWeight: '600', color: '#4B5563', marginBottom: 4 },
  detailValue: { fontSize: 14, color: '#111827' },
  linkValue: { fontSize: 14, color: '#4F46E5', textDecorationLine: 'underline' },
  
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  gradeLabel: { fontSize: 12, color: '#6B7280' },
  gradeValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  gradeBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  gradeBtnText: { color: '#4F46E5', fontWeight: '600', fontSize: 14 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalBody: { padding: 20 },
  learnerNameModal: { fontSize: 16, fontWeight: '500', color: '#374151', marginBottom: 20 },
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
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFF',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginRight: 10,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#4B5563', fontSize: 16, fontWeight: '600' },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    marginLeft: 10,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
