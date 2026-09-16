import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar, Platform, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

if (Platform.OS === 'web') {
  try {
    const style = document.createElement('style');
    style.textContent = `
      html, body, #root {
        height: 100vh;
        width: 100%;
        display: flex;
        flex-direction: column;
        flex: 1;
      }
    `;
    document.head.appendChild(style);
  } catch (e) {}
}

import AuthNavigator from './src/navigation/AuthNavigator';
import { AdminNavigator } from './src/navigation/AdminNavigator';
import LearnerNavigator from './src/navigation/LearnerNavigator';
import { SkillSharerNavigator } from './src/navigation/SkillSharerNavigator';

const queryClient = new QueryClient();
const Stack = createStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider style={styles.container}>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { flex: 1 } }}>
              <Stack.Screen name="Auth" component={AuthNavigator} />
              <Stack.Screen name="Admin" component={AdminNavigator} />
              <Stack.Screen name="Learner" component={LearnerNavigator} />
              <Stack.Screen name="SkillSharer" component={SkillSharerNavigator} />
            </Stack.Navigator>
            <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
      <Toast />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});