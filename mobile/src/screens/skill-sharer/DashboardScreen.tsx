import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { courseApi } from '../../api/skill-sharer.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { RADIUS, SHADOWS } from '../../theme/shadows';
import { Card } from '../../components/common/Card';

interface Course {
  id: string;
  title: string;
  description: string;
  status: string;
  difficulty: string;
  createdAt: string;
}

export const DashboardScreen = ({ navigation }: any) => {
  const [userName, setUserName] = useState('User');
  const [verifiedBadge, setVerifiedBadge] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
    loadCourses();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setUserName(user.name || 'User');
        setVerifiedBadge(Boolean(user.verifiedBadge));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await courseApi.getMyCourses();
      if (response && response.success && Array.isArray(response.data))
        setCourses(response.data);
      else if (Array.isArray(response)) setCourses(response);
      else if (response && Array.isArray((response as any).data?.data))
        setCourses((response as any).data.data);
      else setCourses([]);
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const go = (screen: string, params?: object) => navigation.navigate(screen, params);

  const handleSignOut = async () => {
    await AsyncStorage.multiRemove(['token', 'user', 'skill_sharer_profile']);
    const rootNavigation = navigation.getParent?.() || navigation;
    rootNavigation.reset({
      index: 0,
      routes: [{ name: 'Auth', state: { routes: [{ name: 'Login' }] } }],
    });
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadCourses();
          }}
          tintColor={COLORS.primary}
        />
      }
    >
      <View style={styles.topBar}>
        <View>
          <Text style={styles.eyebrow}>CREATOR STUDIO ✧</Text>
          <Text style={styles.pageTitle}>Dashboard</Text>
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity style={styles.bell} onPress={() => go('Assignments')}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.neutralDark} />
            <View style={styles.dot} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            accessibilityLabel="Sign out"
          >
            <Ionicons name="log-out-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.avatar} onPress={() => go('Profile')}>
            <Ionicons name="person-outline" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <Card variant="elevated" style={styles.welcomeCard}>
        <View style={styles.welcomeAvatar}>
          <Ionicons name="leaf-outline" size={24} color={COLORS.white} />
        </View>
        <View style={styles.welcomeCopy}>
          <Text style={styles.welcome}>Welcome back,</Text>
          <Text style={styles.userName} numberOfLines={1}>
            {userName}
          </Text>
        </View>
        <View style={styles.verified}>
          <Ionicons
            name={verifiedBadge ? 'checkmark-circle' : 'time-outline'}
            size={14}
            color={COLORS.primary}
          />
          <Text style={styles.verifiedText}>
            {verifiedBadge ? 'Verified' : 'Pending'}
          </Text>
        </View>
      </Card>

      <View style={styles.stats}>
        <Stat value={courses.length} label="Total Courses" />
        <Stat
          value={courses.filter((c) => c.status === 'PUBLISHED').length}
          label="Published"
          color={COLORS.badgeGreenText}
        />
        <Stat
          value={courses.filter((c) => c.status === 'DRAFT').length}
          label="Drafts"
          color={COLORS.honeyText}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.heading}>
          <Text style={styles.sectionTitle}>Studio Actions</Text>
          <Text style={styles.meta}>8 Studio Tools</Text>
        </View>

        <View style={styles.grid}>
          <Action
            label="Create Course"
            detail="New micro-module"
            icon="add-circle-outline"
            tone="primary"
            onPress={() => go('CourseCreator')}
          />
          <Action
            label="Recommend"
            detail="Featured spotlight"
            icon="trophy-outline"
            tone="gold"
            onPress={() => go('Recommendations')}
          />
          <Action
            label="Certificates"
            detail="Track issued"
            icon="ribbon-outline"
            onPress={() => go('CompletionRequests')}
          />
          <Action
            label="My Courses"
            detail="Manage tracks"
            icon="book-outline"
            onPress={() => go('MyCourses')}
          />
          <Action
            label="Assessments"
            detail="Active tests"
            icon="clipboard-outline"
            onPress={() => go('Assessments')}
          />
          <Action
            label="Assignments"
            detail="Needs review"
            icon="document-text-outline"
            onPress={() => go('Assignments')}
          />
          <Action
            label="Profile"
            detail="Public studio"
            icon="person-outline"
            onPress={() => go('Profile')}
          />
        </View>
      </View>

      <View style={styles.tip}>
        <Ionicons name="bulb-outline" size={24} color={COLORS.primary} />
        <View style={styles.tipCopy}>
          <Text style={styles.tipTitle}>Skill Sharer Tip</Text>
          <Text style={styles.tipText}>
            Adding bite-sized quiz cards boosts engagement by 40%.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

function Stat({
  value,
  label,
  color = COLORS.primary,
}: {
  value: number;
  label: string;
  color?: string;
}) {
  return (
    <Card variant="elevated" style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={[styles.line, { backgroundColor: color }]} />
    </Card>
  );
}

function Action({
  label,
  detail,
  icon,
  tone,
  onPress,
}: {
  label: string;
  detail: string;
  icon: any;
  tone?: string;
  onPress: () => void;
}) {
  const isPrimary = tone === 'primary';
  const isGold = tone === 'gold';

  return (
    <TouchableOpacity
      style={[
        styles.action,
        isPrimary && styles.primaryAction,
        isGold && styles.goldAction,
      ]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View
        style={[
          styles.actionIcon,
          isPrimary && styles.primaryActionIcon,
          isGold && styles.goldActionIcon,
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={
            isPrimary ? COLORS.white : isGold ? COLORS.honeyText : COLORS.primary
          }
        />
      </View>

      <View style={styles.actionCopy}>
        <Text
          style={[styles.actionLabel, (isPrimary || isGold) && styles.whiteText]}
        >
          {label}
        </Text>
        <Text
          style={[styles.actionDetail, (isPrimary || isGold) && styles.whiteTextSub]}
        >
          {detail}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgWarm,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 32,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bgWarm,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  eyebrow: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.primary,
    letterSpacing: 1,
  },
  pageTitle: {
    ...TYPOGRAPHY.displayLg,
    fontSize: 26,
    color: COLORS.neutralDark,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bell: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  dot: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  signOutButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    backgroundColor: COLORS.badgeOrangeBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    padding: 16,
  },
  welcomeAvatar: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeCopy: {
    flex: 1,
    marginLeft: 12,
  },
  welcome: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.neutralMedium,
  },
  userName: {
    ...TYPOGRAPHY.headlineMd,
    color: COLORS.neutralDark,
  },
  verified: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.badgeOrangeBg,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  verifiedText: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.primary,
    marginLeft: 4,
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  stat: {
    flex: 1,
    minHeight: 96,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 0,
  },
  statValue: {
    ...TYPOGRAPHY.displayLg,
    fontSize: 28,
  },
  statLabel: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.neutralMedium,
    marginTop: 4,
  },
  line: {
    width: 24,
    height: 2,
    borderRadius: 1,
    marginTop: 6,
    opacity: 0.4,
  },
  section: {
    marginBottom: 20,
  },
  heading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    ...TYPOGRAPHY.headlineMd,
    color: COLORS.neutralDark,
  },
  meta: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.neutralMedium,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  action: {
    width: '48.5%',
    minHeight: 72,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceCard,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    ...SHADOWS.level1,
  },
  primaryAction: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  goldAction: {
    backgroundColor: COLORS.honeyBg,
    borderColor: COLORS.borderSubtle,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.badgeOrangeBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryActionIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  goldActionIcon: {
    backgroundColor: COLORS.white,
  },
  actionCopy: {
    flex: 1,
    marginLeft: 10,
  },
  actionLabel: {
    ...TYPOGRAPHY.labelLg,
    color: COLORS.neutralDark,
  },
  actionDetail: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.neutralMedium,
    marginTop: 2,
  },
  whiteText: {
    color: COLORS.white,
  },
  whiteTextSub: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  tip: {
    backgroundColor: COLORS.honeyBg,
    borderRadius: RADIUS.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  tipCopy: {
    marginLeft: 12,
    flex: 1,
  },
  tipTitle: {
    ...TYPOGRAPHY.labelLg,
    color: COLORS.neutralDark,
  },
  tipText: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.neutralMedium,
    marginTop: 2,
  },
});
