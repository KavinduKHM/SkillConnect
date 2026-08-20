import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

// Import screens
import { DashboardScreen } from '../screens/skill-sharer/DashboardScreen';
import { ProfileScreen } from '../screens/skill-sharer/ProfileScreen';
import { CourseCreatorScreen } from '../screens/skill-sharer/CourseCreatorScreen';
import { MyCoursesScreen } from '../screens/skill-sharer/MyCoursesScreen';
import { AssessmentsScreen } from '../screens/skill-sharer/AssessmentsScreen';
import { AssignmentsScreen } from '../screens/skill-sharer/AssignmentsScreen';
import { AssignmentSubmissionsScreen } from '../screens/skill-sharer/AssignmentSubmissionsScreen';

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
      <Stack.Screen name="Assessments" component={AssessmentsScreen} />
      <Stack.Screen name="Assignments" component={AssignmentsScreen} />
      <Stack.Screen name="AssignmentSubmissions" component={AssignmentSubmissionsScreen} />
    </Stack.Navigator>
  );
};