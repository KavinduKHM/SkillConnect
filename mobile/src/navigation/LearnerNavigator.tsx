import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';

import HomeScreen from '../screens/learner/HomeScreen';
import CourseListScreen from '../screens/learner/CourseListScreen';
import CourseDetailScreen from '../screens/learner/CourseDetailScreen';
import MyLearningScreen from '../screens/learner/MyLearningScreen';
import LessonPlayerScreen from '../screens/learner/LessonPlayerScreen';
import AssessmentDetailScreen from '../screens/learner/AssessmentDetailScreen';
import SkillSharerProfileScreen from '../screens/learner/SkillSharerProfileScreen';
import LearnerProfileScreen from '../screens/learner/LearnerProfileScreen';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { RADIUS, SHADOWS } from '../theme/shadows';
import AssignmentDetailScreen from '../screens/learner/AssignmentDetailScreen';
import CourseReviewScreen from '../screens/learner/CourseReviewScreen';
import MyRecommendationsScreen from '../screens/learner/MyRecommendationsScreen';
import LearningHistoryScreen from '../screens/learner/LearningHistoryScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function LearnerBottomTabs() {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.neutralMedium,
        tabBarStyle: {
          backgroundColor: COLORS.surfaceCard,
          borderTopColor: COLORS.borderWarm,
          borderTopWidth: 1,
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
          ...SHADOWS.level3,
        },
        tabBarLabelStyle: {
          ...TYPOGRAPHY.labelSm,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Learn',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && styles.iconContainerFocused,
              ]}
            >
              <Text style={{ fontSize: 18 }}>🎓</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="CourseListTab"
        component={CourseListScreen}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && styles.iconContainerFocused,
              ]}
            >
              <Text style={{ fontSize: 18 }}>🧭</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="MyLearningTab"
        component={MyLearningScreen}
        options={{
          tabBarLabel: 'My Learning',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && styles.iconContainerFocused,
              ]}
            >
              <Text style={{ fontSize: 18 }}>📚</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={LearnerProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && styles.iconContainerFocused,
              ]}
            >
              <Text style={{ fontSize: 18 }}>👤</Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerFocused: {
    backgroundColor: COLORS.badgeOrangeBg,
  },
});

export default function LearnerNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: COLORS.bgWarm },
      }}
    >
      <Stack.Screen name="MainTabs" component={LearnerBottomTabs} />
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="CourseList" component={CourseListScreen} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="MyLearning" component={MyLearningScreen} />
      <Stack.Screen name="LessonPlayer" component={LessonPlayerScreen} />
      <Stack.Screen name="AssessmentDetail" component={AssessmentDetailScreen} />
      <Stack.Screen name="SkillSharerProfile" component={SkillSharerProfileScreen} />
      <Stack.Screen name="LearnerProfile" component={LearnerProfileScreen} />
      <Stack.Screen name="AssignmentDetail" component={AssignmentDetailScreen} />
      <Stack.Screen name="CourseReview" component={CourseReviewScreen} />
      <Stack.Screen name="MyRecommendations" component={MyRecommendationsScreen} />
      <Stack.Screen name="LearningHistory" component={LearningHistoryScreen} />
    </Stack.Navigator>
  );
}
