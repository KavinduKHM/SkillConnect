import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { AdminNavigator } from './src/navigation/AdminNavigator';
import { LearnerNavigator } from './src/navigation/LearnerNavigator';
import { SkillSharerNavigator } from './src/navigation/SkillSharerNavigator';

const queryClient = new QueryClient();
const Stack = createStackNavigator();
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import LearnerNavigator from './src/navigation/LearnerNavigator';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Auth" component={AuthNavigator} />
          <Stack.Screen name="Admin" component={AdminNavigator} />
          <Stack.Screen name="Learner" component={LearnerNavigator} />
          <Stack.Screen name="SkillSharer" component={SkillSharerNavigator} />
        </Stack.Navigator>
        <StatusBar style="light" backgroundColor="#4F46E5" />
        <LearnerNavigator />
      </NavigationContainer>
    </QueryClientProvider>
  );
}