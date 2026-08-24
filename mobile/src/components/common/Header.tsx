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

import { ConfirmModal } from './ConfirmModal';

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
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

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
    setShowLogoutConfirm(false);
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
    setShowLogoutConfirm(true);
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

      <ConfirmModal
        visible={showLogoutConfirm}
        title="Sign Out"
        message="Are you sure you want to sign out of SkillConnect?"
        confirmText="Sign Out"
        confirmType="danger"
        onConfirm={performLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FAF9F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FAF9F5',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoutButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  }
});