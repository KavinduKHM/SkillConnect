import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CourseListScreen from '../screens/learner/CourseListScreen';
import CourseDetailScreen from '../screens/learner/CourseDetailScreen';
import MyLearningScreen from '../screens/learner/MyLearningScreen';
import LessonPlayerScreen from '../screens/learner/LessonPlayerScreen';
import AssessmentDetailScreen from '../screens/learner/AssessmentDetailScreen';
import AssignmentDetailScreen from '../screens/learner/AssignmentDetailScreen';
import CourseReviewScreen from '../screens/learner/CourseReviewScreen';
import MyRecommendationsScreen from '../screens/learner/MyRecommendationsScreen';

const Stack = createStackNavigator();

export default function LearnerNavigator() {
  return (
    <Stack.Navigator initialRouteName="MyLearning" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CourseList" component={CourseListScreen} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="MyLearning" component={MyLearningScreen} />
      <Stack.Screen name="LessonPlayer" component={LessonPlayerScreen} />
      <Stack.Screen name="AssessmentDetail" component={AssessmentDetailScreen} />
      <Stack.Screen name="AssignmentDetail" component={AssignmentDetailScreen} />
      <Stack.Screen name="CourseReview" component={CourseReviewScreen} />
      <Stack.Screen name="MyRecommendations" component={MyRecommendationsScreen} />
    </Stack.Navigator>
  );
}
