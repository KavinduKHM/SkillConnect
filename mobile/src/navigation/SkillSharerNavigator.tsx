import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import SkillSharerDashboardScreen from '../screens/skill-sharer/SkillSharerDashboardScreen';
import CourseFormScreen from '../screens/skill-sharer/CourseFormScreen';
import CourseContentScreen from '../screens/skill-sharer/CourseContentScreen';
import ModuleEditorScreen from '../screens/skill-sharer/ModuleEditorScreen';
import LessonEditorScreen from '../screens/skill-sharer/LessonEditorScreen';
import ProfileScreen from '../screens/skill-sharer/ProfileScreen';
import QualificationsScreen from '../screens/skill-sharer/QualificationsScreen';
import LearnerProgressScreen from '../screens/skill-sharer/LearnerProgressScreen';
import CourseAnalyticsScreen from '../screens/skill-sharer/CourseAnalyticsScreen';

const Stack = createStackNavigator();

export const SkillSharerNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#4F46E5' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '600' },
        headerBackTitle: '', // ✅ Hides back button text
        // For React Navigation v7+, use:
        // headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={SkillSharerDashboardScreen}
        options={{ title: 'My Courses' }}
      />
      <Stack.Screen
        name="CourseForm"
        component={CourseFormScreen}
        options={{ title: 'Create Course' }}
      />
      <Stack.Screen
        name="CourseContent"
        component={CourseContentScreen}
        options={{ title: 'Course Content' }}
      />
      <Stack.Screen
        name="ModuleEditor"
        component={ModuleEditorScreen}
        options={{ title: 'Edit Module' }}
      />
      <Stack.Screen
        name="LessonEditor"
        component={LessonEditorScreen}
        options={{ title: 'Edit Lesson' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'My Profile' }}
      />
      <Stack.Screen
        name="Qualifications"
        component={QualificationsScreen}
        options={{ title: 'Qualifications' }}
      />
      <Stack.Screen
        name="LearnerProgress"
        component={LearnerProgressScreen}
        options={{ title: 'Learner Progress' }}
      />
      <Stack.Screen
        name="CourseAnalytics"
        component={CourseAnalyticsScreen}
        options={{ title: 'Course Analytics' }}
      />
    </Stack.Navigator>
  );
};

export default SkillSharerNavigator;