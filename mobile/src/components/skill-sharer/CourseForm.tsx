import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { CreateCourseInput } from '../../types';

interface CourseFormProps {
  onSubmit: (data: CreateCourseInput) => void;
  loading?: boolean;
  categories?: { id: string; name: string }[];
}

export const CourseForm: React.FC<CourseFormProps> = ({
  onSubmit,
  loading = false,
  categories = [],
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState('BEGINNER');
  const [duration, setDuration] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [language, setLanguage] = useState('English');
  const [prerequisites, setPrerequisites] = useState('');
  const [learningOutcomes, setLearningOutcomes] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const difficulties = [
    { label: 'Beginner', value: 'BEGINNER' },
    { label: 'Intermediate', value: 'INTERMEDIATE' },
    { label: 'Advanced', value: 'ADVANCED' },
  ];

  const languages = ['English', 'Sinhala', 'Tamil', 'Other'];

  const handleSubmit = () => {
  const parsedEstimatedHours =
    estimatedHours.trim() !== '' ? parseInt(estimatedHours, 10) : undefined;

  const data: CreateCourseInput = {
    title,
    description,
    categoryId,
    difficulty: difficulty as CreateCourseInput['difficulty'],
    duration,
    language,
    prerequisites,
    learningOutcomes: learningOutcomes
      .split('\n')
      .map((o) => o.trim())
      .filter(Boolean),
    ...(parsedEstimatedHours !== undefined
      ? { estimatedHours: parsedEstimatedHours }
      : {}),
  };

  onSubmit(data);
};

  return (
    <View style={styles.contentContainer}>
      <Text style={styles.sectionTitle}>Course Information</Text>

      <Input
        label="Course Title"
        placeholder="Enter course title"
        value={title}
        onChangeText={setTitle}
        required
      />

      <Input
        label="Description"
        placeholder="Describe what learners will learn"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        style={styles.textArea}
        required
      />

      {/* Category Selection */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Category *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowCategoryPicker(!showCategoryPicker)}
        >
          <Text style={categoryId ? styles.pickerText : styles.pickerPlaceholder}>
            {categoryId
              ? categories.find((c) => c.id === categoryId)?.name || 'Select category'
              : 'Select category'}
          </Text>
        </TouchableOpacity>
        {showCategoryPicker && (
          <View style={styles.pickerDropdown}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.pickerItem}
                onPress={() => {
                  setCategoryId(category.id);
                  setShowCategoryPicker(false);
                }}
              >
                <Text style={styles.pickerItemText}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Difficulty Selection */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Difficulty</Text>
        <View style={styles.difficultyContainer}>
          {difficulties.map((d) => (
            <TouchableOpacity
              key={d.value}
              style={[
                styles.difficultyButton,
                difficulty === d.value && styles.difficultyButtonActive,
              ]}
              onPress={() => setDifficulty(d.value)}
            >
              <Text
                style={[
                  styles.difficultyButtonText,
                  difficulty === d.value && styles.difficultyButtonTextActive,
                ]}
              >
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Input
        label="Duration"
        placeholder="e.g., 4 weeks"
        value={duration}
        onChangeText={setDuration}
      />

      <Input
        label="Estimated Hours"
        placeholder="Total estimated learning hours"
        value={estimatedHours}
        onChangeText={setEstimatedHours}
        keyboardType="numeric"
      />

      <Input
        label="Language"
        placeholder="Course language"
        value={language}
        onChangeText={setLanguage}
      />

      <Input
        label="Prerequisites"
        placeholder="What learners should know before starting"
        value={prerequisites}
        onChangeText={setPrerequisites}
        multiline
        numberOfLines={2}
      />

      <Input
        label="Learning Outcomes"
        placeholder="Enter each outcome on a new line"
        value={learningOutcomes}
        onChangeText={setLearningOutcomes}
        multiline
        numberOfLines={4}
        style={styles.textArea}
      />

      <Button
        title="Create Course Draft"
        onPress={handleSubmit}
        loading={loading}
        style={styles.submitButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 20,
    marginBottom: 40,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  pickerText: {
    fontSize: 16,
    color: '#1F2937',
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  pickerDropdown: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
    maxHeight: 150,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#1F2937',
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  difficultyButtonActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  difficultyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  difficultyButtonTextActive: {
    color: '#FFFFFF',
  },
});