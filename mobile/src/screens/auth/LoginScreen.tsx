import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../../api/auth.service';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { RADIUS, SHADOWS } from '../../theme/shadows';

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login({ email, password });
      const { token, user } = response.data;

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      // Navigate to appropriate screen based on role
      if (user.role === 'ADMIN') {
        navigation.replace('Admin');
      } else if (user.role === 'SKILL_SHARER') {
        navigation.replace('SkillSharer');
      } else {
        navigation.replace('Learner');
      }
    } catch (error: any) {
      setErrorMsg(error.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card variant="elevated" style={styles.card}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>SC</Text>
            </View>
            <Text style={styles.title}>SkillConnect</Text>
            <Text style={styles.subtitle}>
              Empowering bite-sized microlearning & skill sharing
            </Text>
          </View>

          <View style={styles.form}>
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
              </View>
            ) : null}

            <Input
              label="Email Address"
              placeholder="e.g. learner@skillconnect.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              icon="mail-outline"
              required
            />

            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              icon="lock-closed-outline"
              required
            />

            <Button
              title="Sign In to Account"
              onPress={handleLogin}
              loading={loading}
              variant="primary"
              size="large"
              style={styles.loginButton}
            />

            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.7}
            >
              <Text style={styles.registerLinkText}>
                Don't have an account?{' '}
                <Text style={styles.registerHighlight}>Create Account</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgWarm,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  card: {
    padding: 28,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surfaceCard,
    ...SHADOWS.level2,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...SHADOWS.level1,
  },
  logoText: {
    ...TYPOGRAPHY.headlineLg,
    color: COLORS.white,
    fontWeight: '800',
  },
  title: {
    ...TYPOGRAPHY.displayLg,
    fontSize: 26,
    color: COLORS.neutralDark,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    marginTop: 4,
  },
  form: {
    marginTop: 8,
  },
  errorBox: {
    backgroundColor: COLORS.errorBg,
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorText: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.error,
    fontWeight: '600',
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 12,
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 20,
  },
  registerLinkText: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.neutralMedium,
  },
  registerHighlight: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});