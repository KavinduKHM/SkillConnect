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
  SafeAreaView,
  StatusBar,
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
import { COLORS } from '../../theme/colors';

interface LocalFile {
  name: string;
  size?: number | undefined;
  uri: string;
  mimeType?: string | undefined;
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
        setIsEditing(false);
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
        setUploadStatus('Uploading files...');
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

      setUploadStatus('Saving your submission...');
      const payload: { textSubmission?: string; githubLink?: string; fileUrls?: string[] } = {};
      if (textSubmission.trim()) payload.textSubmission = textSubmission.trim();
      if (githubLink.trim()) payload.githubLink = githubLink.trim();
      if (uploadedFileUrls.length > 0) payload.fileUrls = uploadedFileUrls;

      await submitAssignmentWork(assignmentId, payload);

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
    setSelectedFiles([]);
    setIsEditing(true);
  };

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this submission? This will revoke your submitted status.')) {
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
      showNotification('Success', 'Submission deleted successfully.');
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
      <SafeAreaView style={styles.centerContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading assignment...</Text>
      </SafeAreaView>
    );
  }

  if (!assignment) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />
        <View style={styles.missingCard}>
          <Text style={{ fontSize: 36, marginBottom: 12 }}>📋</Text>
          <Text style={styles.missingTitle}>Assignment Not Found</Text>
          <Text style={styles.missingSub}>
            This assignment could not be loaded. Please return to your learning dashboard.
          </Text>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.returnBtn} activeOpacity={0.85}>
            <Text style={styles.returnBtnText}>Return to Learning</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isGraded = Boolean(
    submission &&
      (submission.status === 'GRADED' ||
        submission.status === 'COMPLETED' ||
        (submission.grade !== null && submission.grade !== undefined))
  );
  const isSubmitted = Boolean(submission && (submission.status === 'SUBMITTED' || isGraded));

  const deadlineFormatted = assignment.deadline
    ? new Date(assignment.deadline).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No deadline';

  const daysLeft = assignment.deadline
    ? Math.ceil((new Date(assignment.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={COLORS.neutralDark} />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {assignment.title}
          </Text>
          <Text style={styles.headerSubtitle}>Practical Assignment</Text>
        </View>

        {isGraded ? (
          <View style={styles.headerGradedBadge}>
            <Text style={styles.headerGradedBadgeText}>✓ Graded</Text>
          </View>
        ) : isSubmitted ? (
          <View style={styles.headerSubmittedBadge}>
            <Text style={styles.headerSubmittedBadgeText}>Submitted</Text>
          </View>
        ) : null}
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Instructions Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadgeRow}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>PRACTICAL TASK</Text>
            </View>
            {assignment.requireForCompletion && (
              <View style={styles.mandatoryPill}>
                <Text style={styles.mandatoryPillText}>Mandatory for Certificate</Text>
              </View>
            )}
          </View>

          <Text style={styles.heroTitle}>{assignment.title}</Text>

          {assignment.instructions ? (
            <View style={styles.instructionsWrap}>
              <Text style={styles.instructionsText}>{assignment.instructions}</Text>
            </View>
          ) : (
            <Text style={styles.noInstructionsText}>
              Review the course materials and submit your solution files or GitHub repository below.
            </Text>
          )}

          {/* Meta Badges Row */}
          <View style={styles.metaRow}>
            <View style={styles.metaBox}>
              <View style={styles.metaBoxHeader}>
                <Ionicons name="ribbon-outline" size={14} color={COLORS.honeyText} />
                <Text style={styles.metaLabel}>Max Marks</Text>
              </View>
              <Text style={styles.metaValue}>{assignment.maxMarks || 100} pts</Text>
            </View>

            <View style={styles.metaBox}>
              <View style={styles.metaBoxHeader}>
                <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
                <Text style={styles.metaLabel}>Deadline</Text>
              </View>
              <Text style={styles.metaValue}>{deadlineFormatted}</Text>
              {daysLeft !== null && (
                <Text
                  style={[
                    styles.daysLeftText,
                    daysLeft <= 0 ? { color: COLORS.error } : { color: COLORS.neutralMedium },
                  ]}
                >
                  {daysLeft > 0 ? `${daysLeft} days remaining` : 'Due date passed'}
                </Text>
              )}
            </View>

            <View style={styles.metaBox}>
              <View style={styles.metaBoxHeader}>
                <Ionicons name="layers-outline" size={14} color={COLORS.neutralMedium} />
                <Text style={styles.metaLabel}>Attempts</Text>
              </View>
              <Text style={styles.metaValue}>Max {assignment.maxSubmissions || 3}</Text>
            </View>
          </View>
        </View>

        {/* Existing Submission Details & Grade Card */}
        {submission && (
          <View style={styles.submissionCard}>
            {/* Status Header */}
            <View style={styles.submissionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.submissionSectionTitle}>Your Submission</Text>
                <Text style={styles.submissionDateText}>
                  Submitted on{' '}
                  {new Date(submission.submissionDate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  isGraded ? styles.statusBadgeGraded : styles.statusBadgePending,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    isGraded ? styles.statusTextGraded : styles.statusTextPending,
                  ]}
                >
                  {isGraded ? '✓ EVALUATED' : 'UNDER REVIEW'}
                </Text>
              </View>
            </View>

            {/* Score Showcase if Graded */}
            {isGraded && (
              <View style={styles.gradeHeroBox}>
                <View style={styles.scoreRow}>
                  <View style={styles.scoreIconCircle}>
                    <Ionicons name="trophy" size={24} color={COLORS.honeyText} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.scoreLabel}>Final Grade Received</Text>
                    <Text style={styles.scoreValue}>
                      {submission.grade} <Text style={styles.scoreMax}>/ {assignment.maxMarks || 100}</Text>
                    </Text>
                  </View>
                </View>

                {submission.feedback ? (
                  <View style={styles.feedbackSection}>
                    <Text style={styles.feedbackSectionTitle}>Instructor Feedback:</Text>
                    <Text style={styles.feedbackSectionContent}>"{submission.feedback}"</Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* Submitted Deliverables Content */}
            <View style={styles.submittedDeliverables}>
              {submission.textSubmission ? (
                <View style={styles.submittedItem}>
                  <Text style={styles.submittedLabel}>Your Notes</Text>
                  <Text style={styles.submittedNotes}>{submission.textSubmission}</Text>
                </View>
              ) : null}

              {submission.githubLink ? (
                <View style={styles.submittedItem}>
                  <Text style={styles.submittedLabel}>Project Repository</Text>
                  <TouchableOpacity
                    style={styles.submittedLinkPill}
                    onPress={() => Linking.openURL(submission.githubLink)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="logo-github" size={16} color={COLORS.neutralDark} style={{ marginRight: 8 }} />
                    <Text style={styles.submittedLinkText} numberOfLines={1}>
                      {submission.githubLink}
                    </Text>
                    <Ionicons name="open-outline" size={14} color={COLORS.primary} style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
              ) : null}

              {submission.fileUrls && submission.fileUrls.length > 0 && (
                <View style={styles.submittedItem}>
                  <Text style={styles.submittedLabel}>Uploaded Files ({submission.fileUrls.length})</Text>
                  <View style={styles.attachedFilesList}>
                    {submission.fileUrls.map((url: string, idx: number) => {
                      const fullUrl = getFileUrl(url);
                      const fileName = url.split('/').pop() || `File_${idx + 1}`;
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={styles.attachedFileItem}
                          onPress={() => Linking.openURL(fullUrl)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="document-attach-outline" size={16} color={COLORS.primary} />
                          <Text style={styles.attachedFileName} numberOfLines={1}>
                            {fileName}
                          </Text>
                          <Ionicons name="cloud-download-outline" size={16} color={COLORS.neutralMedium} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Actions: Edit or Delete (Only if not yet graded) */}
              {!isGraded && !isEditing && (
                <View style={styles.submissionActionsRow}>
                  <TouchableOpacity style={styles.editSubmissionBtn} onPress={handleEdit} activeOpacity={0.85}>
                    <Ionicons name="create-outline" size={16} color={COLORS.primaryDark} style={{ marginRight: 6 }} />
                    <Text style={styles.editSubmissionBtnText}>Edit Submission</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.deleteSubmissionBtn} onPress={handleDelete} activeOpacity={0.85}>
                    <Ionicons name="trash-outline" size={16} color={COLORS.error} style={{ marginRight: 6 }} />
                    <Text style={styles.deleteSubmissionBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Submission Input Form (if not submitted OR if in editing mode) */}
        {(!isSubmitted || isEditing) && !isGraded && (
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                {isSubmitted ? 'Edit Your Deliverables' : 'Submit Assignment Deliverables'}
              </Text>
              <Text style={styles.formSub}>
                Upload your project files, enter notes, or paste your GitHub repository link.
              </Text>
            </View>

            {/* File Upload Dropzone */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Upload Files (Zip, Code, PDF, Documents)</Text>
              <TouchableOpacity style={styles.uploadDropzone} onPress={handlePickDocument} activeOpacity={0.8}>
                <View style={styles.uploadIconCircle}>
                  <Ionicons name="cloud-upload" size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.uploadTitle}>Browse & Select Files</Text>
                <Text style={styles.uploadSub}>Tap to pick project archive, code, or documentation (up to 5 files)</Text>
              </TouchableOpacity>

              {/* Picked Files List */}
              {selectedFiles.length > 0 && (
                <View style={styles.pickedFilesList}>
                  {selectedFiles.map((file, index) => (
                    <View key={index} style={styles.pickedFileRow}>
                      <View style={styles.pickedFileIconWrap}>
                        <Ionicons name="document-text" size={16} color={COLORS.primary} />
                      </View>
                      <View style={styles.pickedFileInfo}>
                        <Text style={styles.pickedFileName} numberOfLines={1}>
                          {file.name}
                        </Text>
                        {file.size ? (
                          <Text style={styles.pickedFileSize}>{formatFileSize(file.size)}</Text>
                        ) : null}
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoveFile(index)}
                        style={styles.removeFileBtn}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close-circle" size={18} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* GitHub Project Link */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>GitHub or Live Project Link</Text>
              <View style={styles.linkInputWrap}>
                <Ionicons name="logo-github" size={18} color={COLORS.neutralMedium} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.linkTextInput}
                  value={githubLink}
                  onChangeText={setGithubLink}
                  placeholder="https://github.com/username/project"
                  placeholderTextColor={COLORS.neutralLight}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Text Notes Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Submission Notes / Implementation Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={textSubmission}
                onChangeText={setTextSubmission}
                placeholder="Explain your approach, any difficulties encountered, or instructions to run your project..."
                placeholderTextColor={COLORS.neutralLight}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Upload Progress Status */}
            {uploadStatus ? (
              <View style={styles.uploadStatusWrap}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.uploadStatusText}>{uploadStatus}</Text>
              </View>
            ) : null}

            {/* Submit Action Button */}
            <TouchableOpacity
              style={[styles.submitActionBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.9}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.submitActionBtnText}>
                  {isSubmitted ? 'Save Updated Submission' : 'Submit Assignment →'}
                </Text>
              )}
            </TouchableOpacity>

            {isEditing && (
              <TouchableOpacity
                style={styles.cancelEditBtn}
                onPress={() => setIsEditing(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelEditBtnText}>Cancel Editing</Text>
              </TouchableOpacity>
            )}
          </View>
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
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.bgWarm,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.neutralMedium,
    fontWeight: '600',
    fontSize: 13,
  },
  missingCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    maxWidth: 400,
  },
  missingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.neutralDark,
    marginBottom: 6,
  },
  missingSub: {
    fontSize: 13,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  returnBtn: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 22,
  },
  returnBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 13,
  },

  // Header
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
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    elevation: 2,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.neutralDark,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.neutralMedium,
    fontWeight: '600',
    marginTop: 1,
  },
  headerGradedBadge: {
    backgroundColor: COLORS.badgeGreenBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  headerGradedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.badgeGreenText,
  },
  headerSubmittedBadge: {
    backgroundColor: COLORS.badgeOrangeBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  headerSubmittedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },

  // Scroll Area
  scrollArea: {
    flex: 1,
    ...Platform.select({
      web: {
        overflowY: 'auto' as any,
        WebkitOverflowScrolling: 'touch' as any,
      },
    }),
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 40,
    gap: 16,
  },

  // Hero Card
  heroCard: {
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
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  heroPill: {
    backgroundColor: COLORS.badgeOrangeBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  heroPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  mandatoryPill: {
    backgroundColor: COLORS.honeyBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mandatoryPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.honeyText,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.neutralDark,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  instructionsWrap: {
    backgroundColor: COLORS.cardBgSoft,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    marginBottom: 16,
  },
  instructionsText: {
    fontSize: 13,
    color: COLORS.neutralDark,
    lineHeight: 20,
  },
  noInstructionsText: {
    fontSize: 13,
    color: COLORS.neutralMedium,
    marginBottom: 16,
    lineHeight: 18,
  },

  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metaBox: {
    flex: 1,
    backgroundColor: COLORS.surfaceMuted,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  metaBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.neutralMedium,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.neutralDark,
  },
  daysLeftText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },

  // Existing Submission Card
  submissionCard: {
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
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  submissionSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.neutralDark,
  },
  submissionDateText: {
    fontSize: 11,
    color: COLORS.neutralMedium,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeGraded: {
    backgroundColor: COLORS.badgeGreenBg,
  },
  statusBadgePending: {
    backgroundColor: COLORS.badgeOrangeBg,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  statusTextGraded: {
    color: COLORS.badgeGreenText,
  },
  statusTextPending: {
    color: COLORS.primary,
  },

  // Grade Hero Box
  gradeHeroBox: {
    backgroundColor: COLORS.honeyBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FBE8C4',
    marginBottom: 14,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F7DCAB',
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.honeyText,
    textTransform: 'uppercase',
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.neutralDark,
  },
  scoreMax: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.neutralMedium,
  },
  feedbackSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F7DCAB',
  },
  feedbackSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.honeyText,
    textTransform: 'uppercase',
  },
  feedbackSectionContent: {
    fontSize: 13,
    fontStyle: 'italic',
    color: COLORS.neutralDark,
    marginTop: 3,
    lineHeight: 18,
  },

  // Submitted Deliverables
  submittedDeliverables: {
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderWarm,
    paddingTop: 12,
  },
  submittedItem: {
    gap: 4,
  },
  submittedLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.neutralMedium,
    textTransform: 'uppercase',
  },
  submittedNotes: {
    fontSize: 13,
    color: COLORS.neutralDark,
    backgroundColor: COLORS.cardBgSoft,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    lineHeight: 18,
  },
  submittedLinkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  submittedLinkText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  attachedFilesList: {
    gap: 6,
  },
  attachedFileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    gap: 8,
  },
  attachedFileName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.neutralDark,
  },

  // Edit / Delete Actions
  submissionActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  editSubmissionBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceMuted,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  editSubmissionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  deleteSubmissionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.errorBg,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFDAD6',
  },
  deleteSubmissionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.error,
  },

  // Submission Form Card
  formCard: {
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
  formHeader: {
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.neutralDark,
    letterSpacing: -0.2,
  },
  formSub: {
    fontSize: 12,
    color: COLORS.neutralMedium,
    marginTop: 3,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.neutralDark,
    marginBottom: 6,
  },
  uploadDropzone: {
    backgroundColor: COLORS.cardBgSoft,
    borderWidth: 1.5,
    borderColor: COLORS.borderSubtle,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.badgeOrangeBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  uploadSub: {
    fontSize: 11,
    color: COLORS.neutralMedium,
    marginTop: 2,
    textAlign: 'center',
  },
  pickedFilesList: {
    marginTop: 10,
    gap: 6,
  },
  pickedFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  pickedFileIconWrap: {
    marginRight: 8,
  },
  pickedFileInfo: {
    flex: 1,
  },
  pickedFileName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.neutralDark,
  },
  pickedFileSize: {
    fontSize: 10,
    color: COLORS.neutralMedium,
    marginTop: 1,
  },
  removeFileBtn: {
    padding: 4,
  },

  linkInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  linkTextInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 13,
    color: COLORS.neutralDark,
  },
  textInput: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: COLORS.neutralDark,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },

  uploadStatusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  uploadStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },

  submitActionBtn: {
    backgroundColor: COLORS.primaryDark,
    paddingVertical: 14,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  submitActionBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  cancelEditBtn: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelEditBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.neutralMedium,
  },
});
