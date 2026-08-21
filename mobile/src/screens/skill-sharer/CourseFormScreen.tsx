import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Keyboard,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { courseService } from '../../api/skill-sharer.service';

interface FormData {
  title: string;
  description: string;
  categoryId: string;
  difficulty: string;
  duration: string;
  estimatedHours: string;
  language: string;
  deliveryMethod: string;
  prerequisites: string;
  learningOutcomes: string[];
  thumbnail: string;
}

const DIFFICULTIES = [
  { label: 'Beginner', value: 'BEGINNER' },
  { label: 'Intermediate', value: 'INTERMEDIATE' },
  { label: 'Advanced', value: 'ADVANCED' },
];

const DELIVERY_METHODS = [
  { label: 'Self-Paced', value: 'SELF_PACED' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'Hybrid', value: 'HYBRID' },
];

const LANGUAGES = ['English', 'Sinhala', 'Tamil'];

// ✅ Fallback categories
const FALLBACK_CATEGORIES = [
  { id: 'cat-1', name: 'Technology' },
  { id: 'cat-2', name: 'Arts & Crafts' },
  { id: 'cat-3', name: 'Business' },
  { id: 'cat-4', name: 'Health' },
  { id: 'cat-5', name: 'Languages' },
];

export default function CourseFormScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { courseId } = (route.params as { courseId?: string }) || {};

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    categoryId: '',
    difficulty: 'BEGINNER',
    duration: '',
    estimatedHours: '',
    language: 'English',
    deliveryMethod: 'SELF_PACED',
    prerequisites: '',
    learningOutcomes: [],
    thumbnail: '',
  });
  const [newOutcome, setNewOutcome] = useState('');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    if (courseId) {
      loadCourse(courseId);
    }
    loadCategories();
  }, [courseId]);

  const loadCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        setCategories(FALLBACK_CATEGORIES);
      }
    } catch (error) {
      setCategories(FALLBACK_CATEGORIES);
    }
  };

  // ✅ Fixed: Correctly loads course data for editing
  const loadCourse = async (id: string) => {
    setLoading(true);
    try {
      const response = await courseService.getCourse(id);
      console.log('📚 Course response:', response);

      // ✅ Get the actual course data - handles both response formats
      const course = response.data?.data || response.data;

      console.log('📚 Course data:', course);

      if (!course) {
        Alert.alert('Error', 'Course data not found');
        setLoading(false);
        return;
      }

      setFormData({
        title: course.title || '',
        description: course.description || '',
        categoryId: course.categoryId || '',
        difficulty: course.difficulty || 'BEGINNER',
        duration: course.duration || '',
        estimatedHours: course.estimatedHours?.toString() || '',
        language: course.language || 'English',
        deliveryMethod: course.deliveryMethod || 'SELF_PACED',
        prerequisites: course.prerequisites || '',
        learningOutcomes: course.learningOutcomes || [],
        thumbnail: course.thumbnail || '',
      });
    } catch (error) {
      console.error('Error loading course:', error);
      Alert.alert('Error', 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fixed: Shows success message and navigates back
  const handleSave = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a course title');
      return;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter a course description');
      return;
    }
    if (!formData.categoryId) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    setSaving(true);
    try {
      const data: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        categoryId: formData.categoryId,
        difficulty: formData.difficulty,
        language: formData.language,
        deliveryMethod: formData.deliveryMethod,
      };

      if (formData.duration.trim()) data.duration = formData.duration.trim();
      if (formData.estimatedHours.trim()) {
        data.estimatedHours = parseInt(formData.estimatedHours);
      }
      if (formData.prerequisites.trim()) data.prerequisites = formData.prerequisites.trim();
      if (formData.learningOutcomes.length > 0) {
        data.learningOutcomes = formData.learningOutcomes;
      }
      if (formData.thumbnail.trim()) data.thumbnail = formData.thumbnail.trim();

      let response;
      if (courseId) {
        response = await courseService.updateCourse(courseId, data);
        Alert.alert('Success', 'Course updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        response = await courseService.createCourse(data);
        Alert.alert('Success', 'Course created successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Error', error.error || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const addLearningOutcome = () => {
    if (newOutcome.trim()) {
      setFormData({
        ...formData,
        learningOutcomes: [...formData.learningOutcomes, newOutcome.trim()],
      });
      setNewOutcome('');
    }
  };

  const removeLearningOutcome = (index: number) => {
    setFormData({
      ...formData,
      learningOutcomes: formData.learningOutcomes.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={Keyboard.dismiss}
      >
        {/* Basic Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Course Title *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Enter course title"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Enter course description"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Category Picker */}
          <View style={styles.field}>
            <Text style={styles.label}>Category *</Text>
            <TouchableOpacity
              style={styles.pickerTrigger}
              onPress={() => setShowCategoryPicker(true)}
            >
              <Text style={styles.pickerTriggerText}>
                {formData.categoryId
                  ? categories.find((c) => c.id === formData.categoryId)?.name || 'Select Category'
                  : 'Select Category'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.halfField]}>
              <Text style={styles.label}>Difficulty</Text>
              <View style={styles.pickerContainer}>
                {DIFFICULTIES.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.pickerOption,
                      formData.difficulty === item.value && styles.pickerOptionSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, difficulty: item.value })}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        formData.difficulty === item.value && styles.pickerOptionTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.field, styles.halfField]}>
              <Text style={styles.label}>Language</Text>
              <View style={styles.pickerContainer}>
                {LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      styles.pickerOption,
                      formData.language === lang && styles.pickerOptionSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, language: lang })}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        formData.language === lang && styles.pickerOptionTextSelected,
                      ]}
                    >
                      {lang}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.halfField]}>
              <Text style={styles.label}>Duration (e.g., 6 weeks)</Text>
              <TextInput
                style={styles.input}
                value={formData.duration}
                onChangeText={(text) => setFormData({ ...formData, duration: text })}
                placeholder="e.g., 6 weeks"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={[styles.field, styles.halfField]}>
              <Text style={styles.label}>Estimated Hours</Text>
              <TextInput
                style={styles.input}
                value={formData.estimatedHours}
                onChangeText={(text) => setFormData({ ...formData, estimatedHours: text })}
                placeholder="e.g., 20"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Delivery Method</Text>
            <View style={styles.pickerContainer}>
              {DELIVERY_METHODS.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.pickerOption,
                    formData.deliveryMethod === item.value && styles.pickerOptionSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, deliveryMethod: item.value })}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      formData.deliveryMethod === item.value && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Prerequisites & Outcomes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prerequisites & Outcomes</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Prerequisites</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.prerequisites}
              onChangeText={(text) => setFormData({ ...formData, prerequisites: text })}
              placeholder="What learners should know before taking this course"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Learning Outcomes</Text>
            {formData.learningOutcomes.map((outcome, index) => (
              <View key={index} style={styles.outcomeItem}>
                <Text style={styles.outcomeText}>{outcome}</Text>
                <TouchableOpacity onPress={() => removeLearningOutcome(index)}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.addOutcomeContainer}>
              <TextInput
                style={[styles.input, styles.outcomeInput]}
                value={newOutcome}
                onChangeText={setNewOutcome}
                placeholder="Add a learning outcome"
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity style={styles.addOutcomeButton} onPress={addLearningOutcome}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* BUTTONS SECTION - ALWAYS VISIBLE */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              {courseId ? 'Update Course' : 'Create Course'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setFormData({ ...formData, categoryId: item.id });
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No categories available</Text>
              }
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCategoryPicker(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  halfField: {
    flex: 1,
    marginRight: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 80,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    marginBottom: 4,
  },
  pickerOptionSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  pickerOptionTextSelected: {
    color: '#FFFFFF',
  },
  pickerTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  pickerTriggerText: {
    fontSize: 14,
    color: '#111827',
  },
  outcomeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  outcomeText: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  addOutcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  outcomeInput: {
    flex: 1,
    marginRight: 8,
  },
  addOutcomeButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSpacer: {
    height: 80,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemText: {
    fontSize: 16,
    color: '#111827',
  },
  modalCloseButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
});