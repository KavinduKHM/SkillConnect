import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import LearnerNavigator from './src/navigation/LearnerNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="#4F46E5" />
        <LearnerNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
