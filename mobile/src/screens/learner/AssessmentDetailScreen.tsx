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
import Ionicons from 'react-native-vector-icons/Ionicons';
import { completeQuiz } from '../../api/learner.service';

export const AssessmentDetailScreen = ({ route, navigation }: any) => {
  const { assessment } = route.params || {};
  const [status, setStatus] = useState(route.params?.status || assessment?.status || 'PENDING');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!assessment) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={{ marginTop: 12, fontSize: 16, color: '#374151', fontWeight: '600' }}>Assessment data missing.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const courseTitle = route.params?.courseName || assessment.course?.title || 'Course Assessment';
  const assessmentTitle = assessment.title || `${courseTitle} - Final Assessment`;
  const dueDate = route.params?.dueDate || (assessment.dueDate ? new Date(assessment.dueDate).toLocaleDateString() : 'No due date');

  const handleOpenForm = async () => {
    try {
      if (!assessment.url) {
        Alert.alert('Error', 'No Google Form link provided.');
        return;
      }
      const supported = await Linking.canOpenURL(assessment.url);
      if (supported) {
        await Linking.openURL(assessment.url);
      } else {
        Alert.alert('Error', `Cannot open this URL: ${assessment.url}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open the assessment link in browser.');
    }
  };

  const doSubmitCompletion = async () => {
    try {
      setIsSubmitting(true);
      await completeQuiz(assessment.id);
      setStatus('COMPLETED');
      
      if (Platform.OS === 'web') {
        window.alert('Assessment Submitted! Your completion has been recorded successfully.');
      } else {
        Alert.alert('Assessment Submitted!', 'Your completion has been recorded successfully.');
      }

      if (route.params?.loadMyLearning) {
        route.params.loadMyLearning();
      }
    } catch (error: any) {
      const errMsg = error?.response?.data?.error || error?.error || error?.message || 'Failed to update assessment status';
      if (Platform.OS === 'web') {
        window.alert('Error: ' + errMsg);
      } else {
        Alert.alert('Error', errMsg);
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtnIcon} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Course Assessment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title & Status */}
        <View style={styles.topCard}>
          <Text style={styles.courseName}>{courseTitle}</Text>
          <Text style={styles.assessmentTitle}>{assessmentTitle}</Text>
          
          <View style={[styles.statusBadge, { backgroundColor: status === 'PENDING' ? '#FEF3C7' : '#DEF7EC' }]}>
            <Ionicons 
              name={status === 'PENDING' ? "time-outline" : "checkmark-circle"} 
              size={16} 
              color={status === 'PENDING' ? "#D97706" : "#059669"} 
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.statusText, { color: status === 'PENDING' ? '#D97706' : '#059669' }]}>
              {status === 'PENDING' ? 'Action Required: Pending' : 'Completed ✓'}
            </Text>
          </View>
        </View>

        {/* 1. Assessment Instructions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={20} color="#4F46E5" />
            <Text style={styles.sectionTitle}>Instructions</Text>
          </View>
          <Text style={styles.sectionText}>
            {assessment.instructions || 'Please complete the Google Form linked below. Answer all questions according to the course materials.'}
          </Text>
        </View>

        {/* 2. Assessment Requirements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="ribbon-outline" size={20} color="#059669" />
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
            <Ionicons name="logo-google" size={18} color="#FFF" style={styles.btnIcon} />
            <Text style={styles.primaryBtnText}>Open Google Form</Text>
            <Ionicons name="open-outline" size={18} color="#FFF" style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          {status === 'PENDING' && (
            <TouchableOpacity 
              style={styles.secondaryBtn} 
              onPress={handleMarkCompleted}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#4F46E5" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#4F46E5" style={styles.btnIcon} />
                  <Text style={styles.secondaryBtnText}>Mark as Submitted & Completed</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.returnBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.returnBtnText}>Return to Platform</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AssessmentDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtnIcon: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    padding: 16,
    flex: 1,
  },
  topCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  courseName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  assessmentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: {
    fontWeight: '700',
    fontSize: 13,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
  },
  sectionText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  requirementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  requirementLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  requirementValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  actionSection: {
    marginTop: 10,
    marginBottom: 40,
  },
  primaryBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryBtn: {
    backgroundColor: '#EEF2FF',
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: 12,
  },
  secondaryBtnText: {
    color: '#4F46E5',
    fontWeight: 'bold',
    fontSize: 15,
  },
  returnBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  returnBtnText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 14,
  },
  btnIcon: {
    marginRight: 8,
  },
  backBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFF',
    fontWeight: '600',
  },
});
