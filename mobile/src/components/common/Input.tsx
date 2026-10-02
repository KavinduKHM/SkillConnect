import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { RADIUS } from '../../theme/shadows';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  touched?: boolean;
  icon?: string;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  touched,
  icon,
  secureTextEntry,
  required = false,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(!secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  const hasError = touched && error;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.requiredStar}> *</Text>}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputFocused,
          hasError && styles.inputError,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon as any}
            size={20}
            color={
              hasError
                ? COLORS.error
                : isFocused
                ? COLORS.primary
                : COLORS.neutralLight
            }
            style={styles.icon}
          />
        )}
        <TextInput
          style={[styles.input, style]}
          secureTextEntry={secureTextEntry && !showPassword}
          placeholderTextColor={COLORS.neutralLight}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus && onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur && onBlur(e);
          }}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={isFocused ? COLORS.primary : COLORS.neutralLight}
            />
          </TouchableOpacity>
        )}
      </View>
      {hasError ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    ...TYPOGRAPHY.labelLg,
    color: COLORS.neutralDark,
    marginBottom: 8,
  },
  requiredStar: {
    color: COLORS.primary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.borderSubtle,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceMuted,
    minHeight: 48,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  inputError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorBg,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    ...TYPOGRAPHY.bodyLg,
    color: COLORS.neutralDark,
  },
  icon: {
    paddingLeft: 14,
  },
  eyeIcon: {
    paddingRight: 14,
  },
  errorText: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.error,
    marginTop: 6,
  },
});