import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { Header } from '../../components/common/Header';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { CourseForm } from '../../components/skill-sharer/CourseForm';
import { courseApi } from '../../api/skill-sharer.service';
import { fetchCategories } from '../../api/learner.service';
import { Category } from '../../types';

export const CourseCreatorScreen: React.FC = ({ navigation, route }: any) => {
  const courseId = route?.params?.courseId as string | undefined;
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await fetchCategories();
        if (Array.isArray(response)) {
          setCategories(response);
        } else if (response && response.success && response.data) {
          setCategories(response.data);
        } else {
          setCategories([]);
        }

        if (courseId) {
          const courseResponse = await courseApi.getCourse(courseId);
          if (courseResponse.success && courseResponse.data) {
            setInitialCourse(courseResponse.data);
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, [courseId]);

  const [initialCourse, setInitialCourse] = useState<any>(undefined);

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      
      if (!data.categoryId) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Please select a category',
        });
        return;
      }

      const response = courseId
        ? await courseApi.updateCourse(courseId, data)
        : await courseApi.createCourse(data);
      
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: courseId ? 'Course updated successfully!' : 'Course created successfully!',
        });
        navigation.navigate('MyCourses');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.error || 'Failed to create course',
        });
      }
    } catch (error: any) {
      console.error('Error creating course:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.message || 'Failed to create course',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingCategories) {
    return <LoadingSpinner message="Loading categories..." />;
  }

  return (
    <View style={styles.container}>
      <Header title={courseId ? 'Edit Course' : 'Create Course'} showBack />
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <CourseForm
          onSubmit={handleSubmit}
          loading={loading}
          categories={categories}
          initialCourse={initialCourse}
          submitLabel={courseId ? 'Update Course' : 'Create Course Draft  →'}
        />
      </ScrollView>
    </View>
  );
};

// ✅ Make sure this export exists
export default CourseCreatorScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F7',
  },
});