import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { UsersScreen } from '../screens/admin/UsersScreen';
import { QualificationsScreen } from '../screens/admin/QualificationsScreen';
import { CourseApprovalScreen } from '../screens/admin/CourseApprovalScreen';
import { AdminCoursesScreen } from '../screens/admin/AdminCoursesScreen';
import { CategoriesScreen } from '../screens/admin/CategoriesScreen';
import { SkillsScreen } from '../screens/admin/SkillsScreen';
import { ProfileScreen } from '../screens/admin/ProfileScreen';
import { COLORS } from '../theme/colors';

const Stack = createStackNavigator();

export const AdminNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.bgWarm },
        headerTitleStyle: { fontWeight: '700', color: COLORS.neutralDark },
        headerShadowVisible: false,
        headerTintColor: COLORS.primary,
      }}
    >
      <Stack.Screen name="Dashboard" component={AdminDashboardScreen} options={{ title: 'Admin Control Center' }} />
      <Stack.Screen name="Users" component={UsersScreen} options={{ title: 'User Management' }} />
      <Stack.Screen name="AdminCourses" component={AdminCoursesScreen} options={{ title: 'Manage Courses' }} />
      <Stack.Screen name="Qualifications" component={QualificationsScreen} options={{ title: 'Qualifications' }} />
      <Stack.Screen name="CourseApproval" component={CourseApprovalScreen} options={{ title: 'Course Approval' }} />
      <Stack.Screen name="Categories" component={CategoriesScreen} options={{ title: 'Categories' }} />
      <Stack.Screen name="Skills" component={SkillsScreen} options={{ title: 'Skills' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
    </Stack.Navigator>
  );
};