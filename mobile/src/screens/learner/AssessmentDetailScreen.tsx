import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Linking,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { completeQuiz } from '../../api/learner.service';

export const AssessmentDetailScreen = ({ route, navigation }: any) => {
  const { assessment } = route.params || {};
  const [status, setStatus] = useState(route.params?.status || assessment?.status || 'PENDING');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!assessment) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={{ fontSize: 32, marginBottom: 8 }}>⚠️</Text>
        <Text style={{ fontSize: 16, color: '#374151', fontWeight: '600', marginBottom: 12 }}>
          Assessment details not available.
        </Text>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const courseTitle = route.params?.courseName || assessment.course?.title || 'React Native Mobile App Development';
  const assessmentTitle = assessment.title || `${courseTitle} - Final Assessment`;
  const dueDate = route.params?.dueDate || (assessment.dueDate ? new Date(assessment.dueDate).toLocaleDateString() : 'No due date');
  const googleFormUrl = assessment.url || assessment.formUrl;

  const handleOpenForm = async () => {
    try {
      if (!googleFormUrl) {
        Alert.alert('Notice', 'No Google Form link provided for this assessment.');
        return;
      }
      const canOpen = await Linking.canOpenURL(googleFormUrl);
      if (canOpen) {
        await Linking.openURL(googleFormUrl);
      } else {
        Alert.alert('Error', 'Cannot open the provided form URL.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open assessment form link.');
    }
  };

  const doSubmitCompletion = async () => {
    try {
      setIsSubmitting(true);
      await completeQuiz(assessment.id);
      setStatus('COMPLETED');

      if (Platform.OS === 'web') {
        window.alert('Assessment Completed! Your completion has been recorded successfully.');
      } else {
        Alert.alert('Assessment Completed!', 'Your completion has been recorded successfully.');
      }

      if (route.params?.loadMyLearning) {
        route.params.loadMyLearning();
      }
    } catch (error: any) {
      const errMsg = error?.response?.data?.error || error?.error || error?.message || 'Failed to update assessment status';
      if (Platform.OS === 'web') {
        window.alert('Notice: ' + errMsg);
      } else {
        Alert.alert('Notice', errMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkCompleted = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Have you completely finished and submitted the Google Form assessment?');
      if (confirmed) {
        doSubmitCompletion();
      }
    } else {
      Alert.alert(
        'Confirm Submission',
        'Have you completely finished and submitted the Google Form assessment?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, Mark Completed',
            onPress: doSubmitCompletion,
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />

      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.circleBtn} onPress={() => navigation?.goBack()}>
          <Text style={styles.circleBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Course Assessment 📝</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Title & Status */}
        <View style={styles.topCard}>
          <Text style={styles.courseName}>{courseTitle}</Text>
          <Text style={styles.assessmentTitle}>{assessmentTitle}</Text>

          <View style={[styles.statusBadge, { backgroundColor: status === 'COMPLETED' ? '#DCFCE7' : '#FEF3C7' }]}>
            <Text style={[styles.statusText, { color: status === 'COMPLETED' ? '#15803D' : '#D97706' }]}>
              {status === 'COMPLETED' ? '✓ Completed' : 'Action Required: Pending'}
            </Text>
          </View>
        </View>

        {/* 1. Instructions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>ℹ️</Text>
            <Text style={styles.sectionTitle}>Instructions</Text>
          </View>
          <Text style={styles.sectionText}>
            {assessment.instructions ||
              'Please complete the Google Form linked below. Answer all required questions according to the course material covered.'}
          </Text>
        </View>

        {/* 2. Assessment Requirements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🎖️</Text>
            <Text style={styles.sectionTitle}>Assessment Requirements</Text>
          </View>

          <View style={styles.requirementRow}>
            <Text style={styles.requirementLabel}>Passing Score:</Text>
            <Text style={styles.requirementValue}>
              {assessment.passingScore ? `${assessment.passingScore}% or higher` : 'Complete all required questions'}
            </Text>
          </View>

          <View style={styles.requirementRow}>
            <Text style={styles.requirementLabel}>Completion Requirement:</Text>
            <Text style={styles.requirementValue}>
              {assessment.requireForCompletion ? 'Mandatory for Certificate' : 'Optional Quiz'}
            </Text>
          </View>

          <View style={styles.requirementRow}>
            <Text style={styles.requirementLabel}>Due Date:</Text>
            <Text style={styles.requirementValue}>{dueDate}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleOpenForm}>
            <Text style={styles.primaryBtnText}>Open Google Form 📋</Text>
          </TouchableOpacity>

          {status !== 'COMPLETED' && (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleMarkCompleted}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#064E3B" />
              ) : (
                <Text style={styles.secondaryBtnText}>Mark as Submitted & Completed ✓</Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.returnBtn} onPress={() => navigation?.goBack()}>
            <Text style={styles.returnBtnText}>Return to Platform</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AssessmentDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#FAF9F6' },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  circleBtnText: { fontSize: 16, color: '#0F172A' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 12 },
  topCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
  },
  courseName: { fontSize: 12, fontWeight: '700', color: '#064E3B', textTransform: 'uppercase', marginBottom: 4 },
  assessmentTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  sectionText: { fontSize: 14, color: '#475569', lineHeight: 22 },
  requirementRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  requirementLabel: { fontSize: 13, color: '#64748B' },
  requirementValue: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  actionSection: { gap: 12, marginTop: 8 },
  primaryBtn: {
    backgroundColor: '#064E3B',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  secondaryBtnText: { color: '#15803D', fontSize: 15, fontWeight: '700' },
  returnBtn: { paddingVertical: 12, alignItems: 'center' },
  returnBtnText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
});
