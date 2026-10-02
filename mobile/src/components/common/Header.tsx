import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { RADIUS } from '../../theme/shadows';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightComponent?: React.ReactNode;
  onBackPress?: () => void;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  rightComponent,
  onBackPress,
  subtitle,
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
          {showBack ? (
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.neutralDark} />
            </TouchableOpacity>
          ) : null}
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        {rightComponent ? (
          <View style={styles.rightContainer}>{rightComponent}</View>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.surfaceCard,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderWarm,
    backgroundColor: COLORS.surfaceCard,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceMuted,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...TYPOGRAPHY.headlineSm,
    color: COLORS.neutralDark,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.neutralMedium,
    marginTop: 1,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
});