import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { courseApi, quizApi } from '../../api/skill-sharer.service';

interface CourseWithAssessment {
  id: string;
  title: string;
  assessment: any | null;
}

export const AssessmentsScreen = ({ navigation }: any) => {
  const [courses, setCourses] = useState<CourseWithAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithAssessment | null>(null);

  // Form State
  const [formLink, setFormLink] = useState('');
  const [instructions, setInstructions] = useState('');
  const [requirements, setRequirements] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCoursesAndAssessments();
  }, []);

  const fetchCoursesAndAssessments = async () => {
    try {
      setLoading(true);
      const res = await courseApi.getMyCourses();
      if (res.success && res.data) {
        const myCourses = res.data;
        
        // Fetch assessments for each course
        const coursesWithAssessments: CourseWithAssessment[] = await Promise.all(
          myCourses.map(async (c: any) => {
            const quizRes = await quizApi.getCourseQuizzes(c.id);
            const quizzes = quizRes.success ? quizRes.data || [] : [];
            return {
              id: c.id,
              title: c.title,
              assessment: quizzes.length > 0 ? quizzes[0] : null,
            };
          })
        );
        
        setCourses(coursesWithAssessments);
      }
    } catch (error) {
      console.error('Error fetching courses and assessments:', error);
      Alert.alert('Error', 'Failed to load assessments.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (course: CourseWithAssessment) => {
    setSelectedCourse(course);
    if (course.assessment) {
      setFormLink(course.assessment.url);
      setInstructions(course.assessment.instructions || '');
      setRequirements(course.assessment.passingScore ? `Score > ${course.assessment.passingScore}` : '');
    } else {
      setFormLink('');
      setInstructions('');
      setRequirements('');
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formLink) {
      Alert.alert('Error', 'Google Form link is required.');
      return;
    }
    if (!selectedCourse) return;

    try {
      setIsSaving(true);
      
      const payload = {
        courseId: selectedCourse.id,
        title: `${selectedCourse.title} Final Assessment`,
        url: formLink,
        instructions: instructions,
        // Parse basic requirements just as string for now if it's not a number, 
        // but backend expects passingScore as number. We'll simplify to just sending it in instructions if passingScore is strictly number
      };

      if (selectedCourse.assessment) {
        await quizApi.updateQuizLink(selectedCourse.assessment.id, payload);
      } else {
        await quizApi.createQuizLink(payload);
      }
      
      Alert.alert('Success', 'Assessment updated successfully!');
      setModalVisible(false);
      fetchCoursesAndAssessments();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Failed to save assessment');
    } finally {
      setIsSaving(false);
    }
  };

  const renderItem = ({ item }: { item: CourseWithAssessment }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.courseTitle}>{item.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.assessment ? '#4CAF50' : '#FF9800' }]}>
          <Text style={styles.statusText}>{item.assessment ? 'Attached' : 'Missing'}</Text>
        </View>
      </View>

      {item.assessment && (
        <View style={styles.assessmentDetails}>
          <Text style={styles.detailLabel}>Form Link:</Text>
          <Text style={styles.detailValue} numberOfLines={1}>{item.assessment.url}</Text>
          <Text style={styles.detailLabel}>Instructions:</Text>
          <Text style={styles.detailValue} numberOfLines={2}>{item.assessment.instructions}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => openModal(item)}
      >
        <Text style={styles.actionBtnText}>
          {item.assessment ? 'Edit Assessment' : 'Add Google Form Assessment'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Course Assessments</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.emptyText}>No courses found.</Text>}
        />
      )}

      {/* Add/Edit Assessment Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage Assessment</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Google Form Link *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://forms.google.com/..."
                  value={formLink}
                  onChangeText={setFormLink}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Instructions & Requirements</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Instructions for learners (e.g. Min score 80%)..."
                  value={instructions}
                  onChangeText={setInstructions}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Assessment</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AssessmentsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  assessmentDetails: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4B5563',
    marginTop: 4,
  },
  detailValue: {
    fontSize: 13,
    color: '#1F2937',
    marginBottom: 4,
  },
  actionBtn: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#4F46E5',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 40,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalBody: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    height: 100,
  },
  saveBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
