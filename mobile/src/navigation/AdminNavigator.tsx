import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { UsersScreen } from '../screens/admin/UsersScreen';
import { QualificationsScreen } from '../screens/admin/QualificationsScreen';
import { CourseApprovalScreen } from '../screens/admin/CourseApprovalScreen';
import { CategoriesScreen } from '../screens/admin/CategoriesScreen';
import { SkillsScreen } from '../screens/admin/SkillsScreen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const Stack = createStackNavigator();
const queryClient = new QueryClient();

export const AdminNavigator = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#fff' },
          headerTitleStyle: { fontWeight: '600' },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="Dashboard"
          component={AdminDashboardScreen}
          options={{ title: 'Admin Panel' }}
        />
        <Stack.Screen
          name="Users"
          component={UsersScreen}
          options={{ title: 'Users' }}
        />
        <Stack.Screen
          name="Qualifications"
          component={QualificationsScreen}
          options={{ title: 'Qualifications' }}
        />
        <Stack.Screen
          name="CourseApproval"
          component={CourseApprovalScreen}
          options={{ title: 'Course Approval' }}
        />
        <Stack.Screen
          name="Categories"
          component={CategoriesScreen}
          options={{ title: 'Categories' }}
        />
        <Stack.Screen
          name="Skills"
          component={SkillsScreen}
          options={{ title: 'Skills' }}
        />
      </Stack.Navigator>
    </QueryClientProvider>
  );
};