import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

// Import screens
import { DashboardScreen } from '../screens/skill-sharer/DashboardScreen';
import { ProfileScreen } from '../screens/skill-sharer/ProfileScreen';
import { CourseCreatorScreen } from '../screens/skill-sharer/CourseCreatorScreen';
import { MyCoursesScreen } from '../screens/skill-sharer/MyCoursesScreen';

const Stack = createStackNavigator();

export const SkillSharerNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#F9FAFB' },
      }}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="CourseCreator" component={CourseCreatorScreen} />
      <Stack.Screen name="MyCourses" component={MyCoursesScreen} />
    </Stack.Navigator>
  );
};