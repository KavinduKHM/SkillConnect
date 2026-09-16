import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import HomeScreen from '../screens/learner/HomeScreen';
import CourseListScreen from '../screens/learner/CourseListScreen';
import CourseDetailScreen from '../screens/learner/CourseDetailScreen';
import MyLearningScreen from '../screens/learner/MyLearningScreen';
import LessonPlayerScreen from '../screens/learner/LessonPlayerScreen';
import AssessmentDetailScreen from '../screens/learner/AssessmentDetailScreen';
import SkillSharerProfileScreen from '../screens/learner/SkillSharerProfileScreen';
import LearnerProfileScreen from '../screens/learner/LearnerProfileScreen';
import AssignmentDetailScreen from '../screens/learner/AssignmentDetailScreen';
import CourseReviewScreen from '../screens/learner/CourseReviewScreen';
import MyRecommendationsScreen from '../screens/learner/MyRecommendationsScreen';
import CertificatesScreen from '../screens/learner/CertificatesScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function LearnerBottomTabs() {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      // @ts-ignore
      sceneContainerStyle={{ flex: 1 }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#064E3B',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F1F5F9',
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="CourseListTab"
        component={CourseListScreen}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🧭</Text>,
        }}
      />
      <Tab.Screen
        name="MyLearningTab"
        component={MyLearningScreen}
        options={{
          tabBarLabel: 'My Learning',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>📑</Text>,
        }}
      />
      <Tab.Screen
        name="CertificatesTab"
        component={CertificatesScreen}
        options={{
          tabBarLabel: 'Certificates',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🎖️</Text>,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={LearnerProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function LearnerNavigator() {
  return (
    <Stack.Navigator initialRouteName="MainTabs" screenOptions={{ headerShown: false, cardStyle: { flex: 1 } }}>
      <Stack.Screen name="MainTabs" component={LearnerBottomTabs} />
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="CourseList" component={CourseListScreen} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="MyLearning" component={MyLearningScreen} />
      <Stack.Screen name="Certificates" component={CertificatesScreen} />
      <Stack.Screen name="LessonPlayer" component={LessonPlayerScreen} />
      <Stack.Screen name="AssessmentDetail" component={AssessmentDetailScreen} />
      <Stack.Screen name="SkillSharerProfile" component={SkillSharerProfileScreen} />
      <Stack.Screen name="LearnerProfile" component={LearnerProfileScreen} />
      <Stack.Screen name="AssignmentDetail" component={AssignmentDetailScreen} />
      <Stack.Screen name="CourseReview" component={CourseReviewScreen} />
      <Stack.Screen name="MyRecommendations" component={MyRecommendationsScreen} />
    </Stack.Navigator>
  );
}
