import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import { DashboardScreen } from '../screens/skill-sharer/DashboardScreen';
import ProfileScreen from '../screens/skill-sharer/ProfileScreen';
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
import CourseAnalyticsScreen from '../screens/skill-sharer/CourseAnalyticsScreen';
import CourseContentScreen from '../screens/skill-sharer/CourseContentScreen';
import LessonEditorScreen from '../screens/skill-sharer/LessonEditorScreen';
import QualificationsScreen from '../screens/skill-sharer/QualificationsScreen';

const Stack = createStackNavigator();

export const SkillSharerNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
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
      <Stack.Screen name="CourseAnalytics" component={CourseAnalyticsScreen} />
      <Stack.Screen name="CourseContent" component={CourseContentScreen} />
      <Stack.Screen name="LessonEditor" component={LessonEditorScreen} />
      <Stack.Screen name="Qualifications" component={QualificationsScreen} />
      <Stack.Screen name="SkillSharerProfile" component={SkillSharerProfileScreen} />
    </Stack.Navigator>
  );
};

export default SkillSharerNavigator;