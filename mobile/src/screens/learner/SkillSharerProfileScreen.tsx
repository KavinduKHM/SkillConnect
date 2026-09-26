import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import { fetchSharerProfile } from '../../api/learner.service';
import { COLORS } from '../../theme/colors';

export default function SkillSharerProfileScreen({ route, navigation }: any) {
  const sharerId = route.params?.sharerId;
  const sharerName = route.params?.sharerName || 'John Perera';

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      setLoading(true);
      if (sharerId) {
        const res = await fetchSharerProfile(sharerId);
        if (res) {
          setProfileData(res);
        }
      }
    } catch (err) {
      console.log('Error loading sharer profile from API, using demo data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [sharerId]);

  const user = profileData?.user || profileData || {
    name: sharerName,
    verifiedBadge: true,
  };
  const profile = user.profile || profileData?.profile || {};

  const coursesTaught = profileData?.courses || profileData?.publishedCourses || [
    {
      id: 'c1',
      title: 'React Native Development',
      duration: '20 hours',
      enrolledCount: '3.4k',
      rating: 4.8,
      thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'c2',
      title: 'Advanced Full-Stack Architecture',
      duration: '15 hours',
      enrolledCount: '1.2k',
      rating: 4.9,
      thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />

      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.circleBtn} onPress={() => navigation?.goBack()}>
          <Text style={styles.circleBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Skill Sharer Profile</Text>
        <TouchableOpacity style={styles.circleBtn}>
          <Text style={styles.circleBtnText}>⋮</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading instructor profile...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.contentPadding}>
            {/* Hero Card */}
            <View style={styles.heroCard}>
              <Image
                source={{
                  uri:
                    profile.avatar ||
                    profile.profilePicture ||
                    user.profilePicture ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                }}
                style={styles.avatarImage}
              />
              <View style={styles.nameRow}>
                <Text style={styles.sharerName}>{user.name || sharerName}</Text>
                {Boolean(user.verifiedBadge) && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>✔ Verified</Text>
                  </View>
                )}
              </View>
              <Text style={styles.headlineText}>{profile.bio ? profile.bio.slice(0, 45) : 'Senior Software Engineer & Mobile Specialist'}</Text>
              <Text style={styles.locationText}>📍 {profile.location || 'Colombo, Sri Lanka'}</Text>
            </View>

            {/* Stats Box (3 Columns) */}
            <View style={styles.statsBox}>
              <View style={styles.statCol}>
                <Text style={styles.statValue}>★ 4.8</Text>
                <Text style={styles.statLabel}>avg rating</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={styles.statValue}>3.4k</Text>
                <Text style={styles.statLabel}>total learners</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={styles.statValue}>{coursesTaught.length}</Text>
                <Text style={styles.statLabel}>courses taught</Text>
              </View>
            </View>

            {/* Bio Section */}
            <Text style={styles.sectionHeading}>Bio & Background</Text>
            <Text style={styles.bioParagraph}>
              {profile.bio ||
                'Passionate software architect with 8+ years of hands-on experience in building hybrid mobile apps and backend services. Helping peers bridge skill gaps since 2018.'}
            </Text>

            {/* Expertise Skills Pills */}
            <Text style={styles.sectionHeading}>Expertise & Skills</Text>
            <View style={styles.skillsWrapper}>
              {['React Native', 'TypeScript', 'Mobile Development', 'Node.js', 'System Architecture'].map((sk) => (
                <View key={sk} style={styles.skillPill}>
                  <Text style={styles.skillText}>{sk}</Text>
                </View>
              ))}
            </View>

            {/* Experience Card */}
            <Text style={styles.sectionHeading}>Experience</Text>
            <View style={styles.expCard}>
              <Text style={styles.expTitle}>Lead Mobile Engineer — CodeLabs</Text>
              <Text style={styles.expDates}>2021 - Present • Full-time</Text>
            </View>

            {/* Courses Taught */}
            <Text style={styles.sectionHeading}>Courses Taught by {user.name?.split(' ')[0] || 'Skill Sharer'}</Text>
            {coursesTaught.map((c: any) => (
              <TouchableOpacity
                key={c.id}
                style={styles.courseRowCard}
                activeOpacity={0.9}
                onPress={() => navigation?.navigate('CourseDetail', { courseId: c.id, course: c })}
              >
                <Image source={{ uri: c.thumbnail || 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=400&q=80' }} style={styles.rowThumbnail} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.rowTitle}>{c.title}</Text>
                  <Text style={styles.rowStats}>
                    {c.duration || '20 hours'} • {c.enrolledCount || '3.4k'} learners
                  </Text>
                  <Text style={styles.rowRating}>★ {c.rating || 4.8}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgWarm },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  circleBtnText: { fontSize: 16, color: COLORS.neutralDark },
  headerTitle: { fontSize: 16, fontWeight: '800', color: COLORS.neutralDark },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: COLORS.neutralMedium },
  scrollContent: { flex: 1 },
  contentPadding: { paddingHorizontal: 18, paddingTop: 10 },
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    marginBottom: 16,
  },
  avatarImage: { width: 84, height: 84, borderRadius: 42, marginBottom: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  sharerName: { fontSize: 20, fontWeight: '800', color: COLORS.neutralDark },
  verifiedBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  verifiedText: { fontSize: 10, fontWeight: '800', color: COLORS.white },
  headlineText: { fontSize: 13, color: COLORS.neutralMedium, fontWeight: '500', marginBottom: 4, textAlign: 'center' },
  locationText: { fontSize: 12, color: COLORS.neutralLight },
  statsBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  statCol: { alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '800', color: COLORS.neutralDark },
  statLabel: { fontSize: 10, color: COLORS.neutralLight, marginTop: 2 },
  statDivider: { width: 1, height: 24, backgroundColor: COLORS.borderWarm },
  sectionHeading: { fontSize: 17, fontWeight: '800', color: COLORS.neutralDark, marginTop: 12, marginBottom: 8 },
  bioParagraph: { fontSize: 14, color: COLORS.neutralMedium, lineHeight: 22, marginBottom: 14 },
  skillsWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  skillPill: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  skillText: { fontSize: 12, color: COLORS.neutralDark, fontWeight: '700' },
  expCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    marginBottom: 16,
  },
  expTitle: { fontSize: 14, fontWeight: '800', color: COLORS.neutralDark },
  expDates: { fontSize: 12, color: COLORS.neutralLight, marginTop: 4 },
  courseRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    marginBottom: 12,
  },
  rowThumbnail: { width: 64, height: 64, borderRadius: 14 },
  rowTitle: { fontSize: 14, fontWeight: '800', color: COLORS.neutralDark },
  rowStats: { fontSize: 11, color: COLORS.neutralLight, marginTop: 2 },
  rowRating: { fontSize: 12, fontWeight: '800', color: COLORS.neutralDark, marginTop: 2 },
});
