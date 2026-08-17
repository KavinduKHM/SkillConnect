import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

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

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.leftContainer}>
          {showBack && (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
        {rightComponent && <View style={styles.rightContainer}>{rightComponent}</View>}
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
  },
});