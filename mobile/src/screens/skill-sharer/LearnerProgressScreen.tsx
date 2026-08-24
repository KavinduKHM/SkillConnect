import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { progressService } from '../../api/skill-sharer.service';
import { Header } from '../../components/common/Header';

interface Learner {
  learner: {
    id: string;
    name: string;
    email: string;
  };
  progress: {
    progressPercentage: number;
    completedLessons: number;
    totalLessons: number;
  };
  completedLessons: number;
  totalLessons: number;
}

export default function LearnerProgressScreen() {
  const route = useRoute();
  const { courseId } = route.params as { courseId: string };

  const [loading, setLoading] = useState(true);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [selectedLearner, setSelectedLearner] = useState<Learner | null>(null);

  useEffect(() => {
    loadData();
  }, [courseId]);

  const loadData = async () => {
    try {
      const response = await progressService.getLearnersProgress(courseId);
      setLearners(response.data || []);
    } catch (error: any) {
      Alert.alert('Error', error.error || 'Failed to load learners');
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = (percentage: number) => (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBar, { width: `${Math.min(percentage, 100)}%` }]} />
      <Text style={styles.progressText}>{Math.round(percentage)}%</Text>
    </View>
  );

  const renderItem = ({ item }: { item: Learner }) => (
    <TouchableOpacity
      style={styles.learnerCard}
      onPress={() => setSelectedLearner(item)}
    >
      <View style={styles.learnerHeader}>
        <View style={styles.learnerInfo}>
          <Text style={styles.learnerName}>{item.learner.name}</Text>
          <Text style={styles.learnerEmail}>{item.learner.email}</Text>
        </View>
        <Text style={styles.lessonCount}>
          {item.completedLessons}/{item.totalLessons} lessons
        </Text>
      </View>
      {renderProgressBar(item.progress.progressPercentage)}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={{ flex: 1 }}>
        <Header title="Learner Progress" showBack={true} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      </View>
    );
  }

  const renderContent = () => {
    if (learners.length === 0) {
      return (
        <View style={styles.centered}>
          <Ionicons name="people-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Enrolled Learners</Text>
          <Text style={styles.emptySubtitle}>
            Learners who enroll in your course will appear here
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={learners}
        renderItem={renderItem}
        keyExtractor={(item) => item.learner.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {learners.length} Learner{learners.length > 1 ? 's' : ''} Enrolled
            </Text>
          </View>
        }
      />
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title="Learner Progress" showBack={true} />
      <View style={styles.container}>
        {renderContent()}

        {selectedLearner && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedLearner.learner.name}</Text>
                <TouchableOpacity onPress={() => setSelectedLearner(null)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.modalEmail}>{selectedLearner.learner.email}</Text>
                <View style={styles.modalStats}>
                  <View style={styles.modalStat}>
                    <Text style={styles.modalStatValue}>
                      {selectedLearner.completedLessons}
                    </Text>
                    <Text style={styles.modalStatLabel}>Completed Lessons</Text>
                  </View>
                  <View style={styles.modalStat}>
                    <Text style={styles.modalStatValue}>
                      {selectedLearner.totalLessons}
                    </Text>
                    <Text style={styles.modalStatLabel}>Total Lessons</Text>
                  </View>
                  <View style={styles.modalStat}>
                    <Text style={styles.modalStatValue}>
                      {Math.round(selectedLearner.progress.progressPercentage)}%
                    </Text>
                    <Text style={styles.modalStatLabel}>Progress</Text>
                  </View>
                </View>
                {renderProgressBar(selectedLearner.progress.progressPercentage)}
              </View>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setSelectedLearner(null)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  learnerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  learnerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  learnerInfo: {
    flex: 1,
  },
  learnerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  learnerEmail: {
    fontSize: 12,
    color: '#6B7280',
  },
  lessonCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressBarContainer: {
    height: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 10,
  },
  progressText: {
    position: 'absolute',
    right: 8,
    fontSize: 10,
    color: '#111827',
    fontWeight: '500',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  modalBody: {
    marginBottom: 16,
  },
  modalEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  modalStat: {
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  modalButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});