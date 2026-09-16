import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightComponent?: React.ReactNode;
  onBackPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  rightComponent,
  onBackPress,
}) => {
  const navigation = useNavigation();

  const canGoBack = navigation.canGoBack();
  const displayBack = showBack || canGoBack;

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (canGoBack) {
      navigation.goBack();
    }
  };

  const performLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['@token', '@user', 'token', 'user']);
      if (Platform.OS === 'web') {
        window.location.replace('/');
      } else {
        try {
          if (typeof (navigation as any).replace === 'function') {
            (navigation as any).replace('Auth');
          } else {
            (navigation as any).navigate('Auth');
          }
        } catch (navErr) {
          (navigation as any).navigate('Auth');
        }
      }
    } catch (e) {
      console.warn("Logout handler failed", e);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        performLogout();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: performLogout },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.leftContainer}>
          {displayBack && (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.rightContainer}>
          {rightComponent}
          <TouchableOpacity onPress={handleLogout} style={[styles.logoutButton, rightComponent ? { marginLeft: 16 } : {}]}>
            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutButton: {
    padding: 4,
  }
});