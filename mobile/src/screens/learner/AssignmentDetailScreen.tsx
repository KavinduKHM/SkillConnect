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
import * as DocumentPicker from 'expo-document-picker';
import {
  fetchSingleAssignment,
  submitAssignmentWork,
  fetchLearnerSubmissions,
  uploadAssessmentFiles,
  deleteAssignmentSubmission,
} from '../../api/learner.service';
import { Header } from '../../components/common/Header';

interface LocalFile {
  name: string;
  size?: number;
  uri: string;
  mimeType?: string;
  file?: any;
}

export default function AssignmentDetailScreen({ route, navigation }: any) {
  const { assignmentId } = route.params || {};
  const [assignment, setAssignment] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form
  const [textSubmission, setTextSubmission] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<LocalFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

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
        setIsEditing(false); // reset editing state on load
      } else {
        setSubmission(null);
      }
    } catch (error) {
      console.error('Error fetching assignment details:', error);
      showNotification('Error', 'Could not load assignment details.');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newFiles: LocalFile[] = result.assets.map((asset) => ({
          name: asset.name,
          size: asset.size,
          uri: asset.uri,
          mimeType: asset.mimeType,
          file: (asset as any).file,
        }));

        setSelectedFiles((prev) => {
          const combined = [...prev, ...newFiles];
          if (combined.length > 5) {
            showNotification('Limit Reached', 'You can upload a maximum of 5 files.');
            return combined.slice(0, 5);
          }
          return combined;
        });
      }
    } catch (err: any) {
      console.error('Error picking document:', err);
      showNotification('Error', 'Failed to pick file.');
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!textSubmission.trim() && !githubLink.trim() && selectedFiles.length === 0) {
      showNotification('Validation Error', 'Please upload a file, enter text notes, or provide a GitHub link.');
      return;
    }

    try {
      setIsSubmitting(true);
      let uploadedFileUrls: string[] = [];

      if (selectedFiles.length > 0) {
        setUploadStatus('Uploading files to Cloudinary...');
        const formData = new FormData();

        for (const file of selectedFiles) {
          if (Platform.OS === 'web' && file.file) {
            formData.append('files', file.file, file.name);
          } else if (Platform.OS === 'web') {
            const res = await fetch(file.uri);
            const blob = await res.blob();
            formData.append('files', blob, file.name);
          } else {
            formData.append('files', {
              uri: file.uri,
              name: file.name,
              type: file.mimeType || 'application/octet-stream',
            } as any);
          }
        }

        const uploadRes: any = await uploadAssessmentFiles(formData);
        const filesData = uploadRes?.files || uploadRes?.data?.files || uploadRes?.data || [];
        uploadedFileUrls = (Array.isArray(filesData) ? filesData : []).map((f: any) => f.url || f);
      }

      setUploadStatus('Saving submission...');
      await submitAssignmentWork(assignmentId, {
        textSubmission: textSubmission.trim() || undefined,
        githubLink: githubLink.trim() || undefined,
        fileUrls: uploadedFileUrls.length > 0 ? uploadedFileUrls : undefined,
      });

      showNotification('Success', 'Assignment submitted successfully!');
      setSelectedFiles([]);
      setTextSubmission('');
      setGithubLink('');
      loadData();
    } catch (error: any) {
      console.error('Error submitting assignment:', error);
      showNotification('Error', error?.error || error?.response?.data?.error || 'Failed to submit assignment.');
    } finally {
      setIsSubmitting(false);
      setUploadStatus('');
    }
  };

  const handleEdit = () => {
    setTextSubmission(submission?.textSubmission || '');
    setGithubLink(submission?.githubLink || '');
    // Note: Previously uploaded files are kept on the server unless overwritten.
    // In this simple flow, if they want to keep previous files, they should not upload new ones.
    setSelectedFiles([]); 
    setIsEditing(true);
  };

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this submission?')) {
        performDelete();
      }
    } else {
      Alert.alert('Delete Submission', 'Are you sure you want to delete this submission?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: performDelete },
      ]);
    }
  };

  const performDelete = async () => {
    try {
      setLoading(true);
      await deleteAssignmentSubmission(submission.id);
      showNotification('Success', 'Submission deleted successfully!');
      setTextSubmission('');
      setGithubLink('');
      setSelectedFiles([]);
      setSubmission(null);
      setIsEditing(false);
      loadData();
    } catch (error: any) {
      console.error('Error deleting submission:', error);
      showNotification('Error', error?.error || error?.response?.data?.error || 'Failed to delete submission.');
      setLoading(false);
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

  const isGraded = Boolean(submission && (submission.status === 'GRADED' || submission.status === 'COMPLETED' || (submission.grade !== null && submission.grade !== undefined)));
  const isSubmitted = submission && (submission.status === 'SUBMITTED' || isGraded);

  return (
    <View style={styles.container}>
      <Header
        title={assignment.title}
        showBack={true}
        onBackPress={() => navigation?.goBack()}
      />

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
                  {isGraded ? 'GRADED' : (submission.status || 'SUBMITTED')}
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
              {submission.textSubmission && (
                <View style={{ marginBottom: 8 }}>
                  <Text style={styles.detailLabel}>Notes / Text:</Text>
                  <Text style={styles.submittedText}>{submission.textSubmission}</Text>
                </View>
              )}
              {submission.githubLink && (
                <View style={{ marginBottom: 8 }}>
                  <Text style={styles.detailLabel}>Project Link:</Text>
                  <TouchableOpacity onPress={() => Linking.openURL(submission.githubLink)}>
                    <Text style={styles.submittedLink}>{submission.githubLink}</Text>
                  </TouchableOpacity>
                </View>
              )}
              {submission.fileUrls && submission.fileUrls.length > 0 && (
                <View style={{ marginTop: 4 }}>
                  <Text style={styles.detailLabel}>Attached Files ({submission.fileUrls.length}):</Text>
                  {submission.fileUrls.map((url: string, idx: number) => {
                    const fullUrl = getFileUrl(url);
                    const fileName = url.split('/').pop() || `Attachment ${idx + 1}`;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={styles.attachedFileItem}
                        onPress={() => Linking.openURL(fullUrl)}
                      >
                        <Ionicons name="document-attach-outline" size={18} color="#4F46E5" />
                        <Text style={styles.attachedFileText} numberOfLines={1}>
                          {fileName}
                        </Text>
                        <Ionicons name="download-outline" size={16} color="#4F46E5" />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              
              {!isGraded && !isEditing && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.editBtn} onPress={handleEdit}>
                    <Ionicons name="create-outline" size={18} color="#4F46E5" />
                    <Text style={styles.editBtnText}>Edit Submission</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Submission Form */}
        {(!isSubmitted || isEditing) && !isGraded && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{isSubmitted ? 'Resubmit Assignment' : 'Submit Assignment'}</Text>
            
            {/* File Upload Section */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Upload Files (PDF, DOCX, ZIP, Code, Images - Max 10MB)</Text>
              
              <TouchableOpacity style={styles.uploadBox} onPress={handlePickDocument}>
                <Ionicons name="cloud-upload-outline" size={32} color="#4F46E5" />
                <Text style={styles.uploadBoxTitle}>Select Files to Upload</Text>
                <Text style={styles.uploadBoxSub}>Browse documents, code files, or archives</Text>
              </TouchableOpacity>

              {selectedFiles.length > 0 && (
                <View style={styles.fileList}>
                  {selectedFiles.map((file, index) => (
                    <View key={index} style={styles.fileRow}>
                      <View style={styles.fileRowLeft}>
                        <Ionicons name="document-text" size={22} color="#4F46E5" />
                        <View style={styles.fileInfo}>
                          <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                          {file.size ? <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text> : null}
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => handleRemoveFile(index)} style={styles.removeBtn}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Text / Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={textSubmission}
                onChangeText={setTextSubmission}
                placeholder="Enter any notes or text description..."
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

            {uploadStatus ? (
              <View style={styles.statusIndicator}>
                <ActivityIndicator size="small" color="#4F46E5" />
                <Text style={styles.statusIndicatorText}>{uploadStatus}</Text>
              </View>
            ) : null}

            <TouchableOpacity 
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>{isSubmitted ? 'Resubmit Assignment' : 'Submit Work'}</Text>
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
  submittedWorkTitle: { fontSize: 14, fontWeight: '700', color: '#312E81', marginBottom: 8 },
  detailLabel: { fontSize: 13, fontWeight: '600', color: '#4B5563', marginBottom: 2 },
  submittedText: { fontSize: 14, color: '#111827', marginBottom: 4 },
  submittedLink: { fontSize: 14, color: '#4F46E5', textDecorationLine: 'underline' },
  
  attachedFileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  attachedFileText: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '500',
  },

  formGroup: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  
  uploadBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBoxTitle: { fontSize: 15, fontWeight: '600', color: '#4F46E5', marginTop: 6 },
  uploadBoxSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  
  fileList: { marginTop: 10 },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  fileRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  fileInfo: { marginLeft: 8, flex: 1 },
  fileName: { fontSize: 13, fontWeight: '500', color: '#1E293B' },
  fileSize: { fontSize: 11, color: '#64748B', marginTop: 1 },
  removeBtn: { padding: 4 },

  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  textArea: { height: 90 },

  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 8,
  },
  statusIndicatorText: { fontSize: 13, color: '#4F46E5', fontWeight: '500' },
  
  submitBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    gap: 12,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  editBtnText: { color: '#4F46E5', fontWeight: '600', fontSize: 14, marginLeft: 6 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  deleteBtnText: { color: '#EF4444', fontWeight: '600', fontSize: 14, marginLeft: 6 },
});

