import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { authService } from '../../api/auth.service';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { RADIUS, SHADOWS } from '../../theme/shadows';

export const RegisterScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'LEARNER' | 'SKILL_SHARER'>('LEARNER');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async () => {
    setErrorMsg('');
    if (!name || !email || !password) {
      setErrorMsg('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await authService.register({ name, email, password, role });
      Alert.alert('Success', 'Account created successfully! Please sign in.', [
        { text: 'Sign In Now', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error: any) {
      setErrorMsg(error.error || 'Could not register. Please try again.');
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
            <Text style={styles.title}>Join SkillConnect</Text>
            <Text style={styles.subtitle}>
              Start learning or share your expertise with the community
            </Text>
          </View>

          <View style={styles.form}>
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
              </View>
            ) : null}

            <Input
              label="Full Name"
              placeholder="e.g. Jane Doe"
              value={name}
              onChangeText={setName}
              icon="person-outline"
              required
            />

            <Input
              label="Email Address"
              placeholder="e.g. jane@example.com"
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

            <View style={styles.roleGroup}>
              <Text style={styles.roleLabel}>I want to join as a: *</Text>
              <View style={styles.roleRow}>
                <TouchableOpacity
                  style={[
                    styles.rolePill,
                    role === 'LEARNER' && styles.rolePillActive,
                  ]}
                  onPress={() => setRole('LEARNER')}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 16, marginRight: 6 }}>🎓</Text>
                  <Text
                    style={[
                      styles.roleText,
                      role === 'LEARNER' && styles.roleTextActive,
                    ]}
                  >
                    Learner
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.rolePill,
                    role === 'SKILL_SHARER' && styles.rolePillActive,
                  ]}
                  onPress={() => setRole('SKILL_SHARER')}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 16, marginRight: 6 }}>🌟</Text>
                  <Text
                    style={[
                      styles.roleText,
                      role === 'SKILL_SHARER' && styles.roleTextActive,
                    ]}
                  >
                    Skill Sharer
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              variant="primary"
              size="large"
              style={styles.registerButton}
            />

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.7}
            >
              <Text style={styles.loginLinkText}>
                Already have an account?{' '}
                <Text style={styles.loginHighlight}>Sign In</Text>
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
    marginBottom: 24,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
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
    marginTop: 4,
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
  roleGroup: {
    marginBottom: 20,
  },
  roleLabel: {
    ...TYPOGRAPHY.labelLg,
    color: COLORS.neutralDark,
    marginBottom: 10,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rolePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.borderSubtle,
    backgroundColor: COLORS.surfaceMuted,
  },
  rolePillActive: {
    backgroundColor: COLORS.badgeOrangeBg,
    borderColor: COLORS.primary,
  },
  roleText: {
    ...TYPOGRAPHY.labelLg,
    color: COLORS.neutralMedium,
  },
  roleTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  registerButton: {
    marginTop: 8,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 20,
  },
  loginLinkText: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.neutralMedium,
  },
  loginHighlight: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
