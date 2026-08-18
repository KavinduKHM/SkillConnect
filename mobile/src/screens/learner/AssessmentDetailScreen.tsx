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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const AssessmentDetailScreen = ({ route, navigation }: any) => {
  const { assessment } = route.params || {};
  const [status, setStatus] = useState(assessment?.status || 'PENDING');

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!assessment) {
    return (
      <View style={styles.centerContainer}>
        <Text>Assessment data missing.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleOpenForm = async () => {
    try {
      const supported = await Linking.canOpenURL(assessment.url);
      if (supported) {
        await Linking.openURL(assessment.url);
      } else {
        Alert.alert('Error', `Don't know how to open this URL: ${assessment.url}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open the assessment link.');
    }
  };

  const handleMarkCompleted = () => {
    Alert.alert(
      'Confirm Submission',
      'Have you completely finished submitting the Google Form?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes, Mark Completed', 
          onPress: async () => {
            try {
              setIsSubmitting(true);
              const { completeQuiz } = await import('../../api/learner.service');
              await completeQuiz(assessment.id);
              setStatus('COMPLETED');
              Alert.alert('Success', 'Your assessment status has been updated!');
              if (route.params?.loadMyLearning) {
                route.params.loadMyLearning();
              }
            } catch (error: any) {
              Alert.alert('Error', error?.response?.data?.error || 'Failed to update status');
            } finally {
              setIsSubmitting(false);
            }
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtnIcon} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assessment Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.courseName}>{route.params.courseName || assessment.course?.title}</Text>
        
        <View style={[styles.statusBadge, { backgroundColor: status === 'PENDING' ? '#FEF3C7' : '#D1FAE5' }]}>
          <Text style={[styles.statusText, { color: status === 'PENDING' ? '#D97706' : '#059669' }]}>
            Status: {status}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.sectionText}>{assessment.instructions || 'No instructions provided.'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Passing Requirements</Text>
          <Text style={styles.sectionText}>{assessment.passingScore ? `Minimum Score of ${assessment.passingScore}` : 'No specific requirements.'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Due Date</Text>
          <Text style={styles.sectionText}>{route.params.dueDate || 'No due date.'}</Text>
        </View>

        <View style={styles.spacer} />

        <TouchableOpacity style={styles.primaryBtn} onPress={handleOpenForm}>
          <Ionicons name="open-outline" size={20} color="#FFF" style={styles.btnIcon} />
          <Text style={styles.primaryBtnText}>Open Google Form</Text>
        </TouchableOpacity>

        {status === 'PENDING' && (
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleMarkCompleted}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#4F46E5" style={styles.btnIcon} />
            <Text style={styles.secondaryBtnText}>Mark as Completed</Text>
          </TouchableOpacity>
        )}
      </View>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
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
    padding: 20,
    flex: 1,
  },
  courseName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 24,
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  section: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4B5563',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
  },
  spacer: {
    flex: 1,
  },
  primaryBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
    marginBottom: 20,
  },
  secondaryBtnText: {
    color: '#4F46E5',
    fontWeight: 'bold',
    fontSize: 16,
  },
  btnIcon: {
    marginRight: 8,
  },
  backBtn: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFF',
  },
});
