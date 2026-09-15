import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { Header } from '../../components/common/Header';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { CourseForm } from '../../components/skill-sharer/CourseForm';
import { courseApi } from '../../api/skill-sharer.service';
import { fetchCategories } from '../../api/learner.service';
import { Category } from '../../types';

export const CourseCreatorScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetchCategories();
        if (res.success && res.data) {
          setCategories(res.data);
        } else if (Array.isArray(res)) {
          setCategories(res);
        } else if (res.data && Array.isArray(res.data)) {
          setCategories(res.data);
        } else {
          setCategories([]);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load categories. Please try again.' });
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      
      // Ensure categoryId is valid
      if (!data.categoryId) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Please select a category' });
        return;
      }

      const response = await courseApi.createCourse(data);
      
      if (response.success) {
        Toast.show({ type: 'success', text1: 'Success', text2: 'Course draft created successfully! You can now add content to your course.' });
        setTimeout(() => navigation.goBack(), 1500);
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: response.error || 'Failed to create course' });
      }
    } catch (error: any) {
      console.error('Error creating course:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: error?.message || 'Failed to create course' });
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