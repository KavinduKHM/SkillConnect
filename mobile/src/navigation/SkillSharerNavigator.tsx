import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

<<<<<<< HEAD
import SkillSharerDashboardScreen from '../screens/skill-sharer/SkillSharerDashboardScreen';
import CourseFormScreen from '../screens/skill-sharer/CourseFormScreen';
import CourseContentScreen from '../screens/skill-sharer/CourseContentScreen';
import ModuleEditorScreen from '../screens/skill-sharer/ModuleEditorScreen';
import LessonEditorScreen from '../screens/skill-sharer/LessonEditorScreen';
import ProfileScreen from '../screens/skill-sharer/ProfileScreen';
import QualificationsScreen from '../screens/skill-sharer/QualificationsScreen';
import LearnerProgressScreen from '../screens/skill-sharer/LearnerProgressScreen';
import CourseAnalyticsScreen from '../screens/skill-sharer/CourseAnalyticsScreen';
=======
// Import screens
import { DashboardScreen } from '../screens/skill-sharer/DashboardScreen';
import { ProfileScreen } from '../screens/skill-sharer/ProfileScreen';
import { CourseCreatorScreen } from '../screens/skill-sharer/CourseCreatorScreen';
import { MyCoursesScreen } from '../screens/skill-sharer/MyCoursesScreen';
import { AssessmentsScreen } from '../screens/skill-sharer/AssessmentsScreen';
import { AssignmentsScreen } from '../screens/skill-sharer/AssignmentsScreen';
import { AssignmentSubmissionsScreen } from '../screens/skill-sharer/AssignmentSubmissionsScreen';
import { CompletionRequestsScreen } from '../screens/skill-sharer/CompletionRequestsScreen';
import { RecommendationScreen } from '../screens/skill-sharer/RecommendationScreen';
import CourseReviewScreen from '../screens/learner/CourseReviewScreen';
import CourseDetailScreen from '../screens/learner/CourseDetailScreen';
import SkillSharerProfileScreen from '../screens/learner/SkillSharerProfileScreen';
>>>>>>> origin/main

const Stack = createStackNavigator();

export const SkillSharerNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
<<<<<<< HEAD
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
=======
        headerShown: false,
        cardStyle: { flex: 1, backgroundColor: '#F9FAFB' },
      }}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="CourseCreator" component={CourseCreatorScreen} />
      <Stack.Screen name="MyCourses" component={MyCoursesScreen} />
      <Stack.Screen name="Assessments" component={AssessmentsScreen} />
      <Stack.Screen name="Assignments" component={AssignmentsScreen} />
      <Stack.Screen name="AssignmentSubmissions" component={AssignmentSubmissionsScreen} />
      <Stack.Screen name="CompletionRequests" component={CompletionRequestsScreen} />
      <Stack.Screen name="Recommendations" component={RecommendationScreen} />
      <Stack.Screen name="CourseReview" component={CourseReviewScreen} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="SkillSharerProfile" component={SkillSharerProfileScreen} />
>>>>>>> origin/main
    </Stack.Navigator>
  );
};

export default SkillSharerNavigator;