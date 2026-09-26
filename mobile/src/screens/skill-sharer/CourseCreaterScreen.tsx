import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { Header } from '../../components/common/Header';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { CourseForm } from '../../components/skill-sharer/CourseForm';
import { courseApi } from '../../api/skill-sharer.service';
import { Category } from '../../types';

export const CourseCreatorScreen: React.FC = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Load categories (this would come from SKIL-4 eventually)
  useEffect(() => {
    // For now, use dummy categories or fetch from admin endpoint
    // This is a placeholder - you'd fetch real categories from the admin API
    const dummyCategories: Category[] = [
      { id: '1', name: 'Technology', description: 'Tech courses', courseCount: 0 },
      { id: '2', name: 'Arts', description: 'Creative courses', courseCount: 0 },
      { id: '3', name: 'Business', description: 'Business courses', courseCount: 0 },
      { id: '4', name: 'Health', description: 'Health courses', courseCount: 0 },
    ];
    setCategories(dummyCategories);
    setLoadingCategories(false);
  }, []);

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      
      // Ensure categoryId is valid
      if (!data.categoryId) {
        Alert.alert('Error', 'Please select a category');
        return;
      }

      const response = await courseApi.createCourse(data);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Course draft created successfully! You can now add content to your course.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to create course');
      }
    } catch (error: any) {
      console.error('Error creating course:', error);
      Alert.alert('Error', error?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  if (loadingCategories) {
    return <LoadingSpinner message="Loading categories..." />;
  }

  return (
    <View style={styles.container}>
      <Header title="Create Course" showBack />
      
      <CourseForm
        onSubmit={handleSubmit}
        loading={loading}
        categories={categories}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
});