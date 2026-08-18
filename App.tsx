import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import AuthNavigator from './mobile/src/navigation/AuthNavigator';
import LearnerNavigator from './mobile/src/navigation/LearnerNavigator';
import { AdminNavigator } from './mobile/src/navigation/AdminNavigator';
import { SkillSharerNavigator } from './mobile/src/navigation/SkillSharerNavigator';

const RootStack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="#4F46E5" />
        <RootStack.Navigator initialRouteName="Auth" screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="Auth" component={AuthNavigator} />
          <RootStack.Screen name="Learner" component={LearnerNavigator} />
          <RootStack.Screen name="Admin" component={AdminNavigator} />
          <RootStack.Screen name="SkillSharer" component={SkillSharerNavigator} />
        </RootStack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
