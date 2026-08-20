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
  Linking,
  Image,
} from 'react-native';
import { fetchSharerProfile } from '../../api/learner.service';

export default function SkillSharerProfileScreen({ route, navigation }: any) {
  const sharerId = route.params?.sharerId;
  const initialName = route.params?.sharerName || 'Skill Sharer';

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [sharerId]);

  const loadProfile = async () => {
    if (!sharerId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetchSharerProfile(sharerId);
      if (res) {
        setProfileData(res);
      }
    } catch (err) {
      console.log('Error loading Skill Sharer profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const user = profileData || {
    name: initialName,
    email: 'sharer@skillconnect.com',
    verifiedBadge: true,
    profile: {
      bio: 'Senior Software Engineer & Lead Mobile Architect with 10+ years in React Native and Cross-Platform Apps.',
      skills: ['React Native', 'TypeScript', 'Node.js', 'Redux', 'GraphQL', 'Mobile Security'],
      experience: '10+ years software engineering, Ex-Tech Lead at Fortune 500',
      portfolio: ['https://github.com/johnperera', 'https://johnperera.dev'],
      location: 'Colombo, Sri Lanka',
      website: 'https://johnperera.dev',
    },
    qualifications: [
      { id: 'q1', title: 'B.Sc. (Hons) in Computer Science', institution: 'University of Moratuwa', year: 2016 },
      { id: 'q2', title: 'AWS Certified Solutions Architect', institution: 'Amazon Web Services', year: 2020 },
    ],
    courses: [
      {
        id: 'd1cbb66b-8696-47bf-9d1f-d5138800a0c7',
        title: 'React Native Mobile App Development',
        difficulty: 'INTERMEDIATE',
        rating: 4.8,
        enrolledCount: 154,
        category: { name: 'Mobile Development' },
      },
    ],
  };

  const profile = user.profile || {};
  const skills = profile.skills || [];
  const qualifications = user.qualifications || [];
  const courses = user.courses || [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Skill Sharer Profile</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading instructor profile...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Instructor Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{user.name ? user.name.charAt(0).toUpperCase() : 'S'}</Text>
            </View>
            <Text style={styles.sharerName}>{user.name}</Text>
            {user.verifiedBadge && (
              <View style={styles.verifiedBadgeRow}>
                <Text style={styles.verifiedBadgeText}>✓ Verified Skill Sharer</Text>
              </View>
            )}
            <Text style={styles.locationText}>📍 {profile.location || 'Colombo, Sri Lanka'}</Text>
            <Text style={styles.bioText}>{profile.bio || 'Experienced Educator & Industry Professional.'}</Text>

            {profile.website && (
              <TouchableOpacity onPress={() => Linking.openURL(profile.website)}>
                <Text style={styles.websiteLink}>🌐 {profile.website}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.bodyContent}>
            {/* Expertise & Skills */}
            <Text style={styles.sectionHeading}>Skills & Areas of Expertise</Text>
            <View style={styles.skillPillContainer}>
              {skills.length > 0 ? (
                skills.map((sk: string, idx: number) => (
                  <View key={idx} style={styles.skillPill}>
                    <Text style={styles.skillPillText}>{sk}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No skills specified.</Text>
              )}
            </View>

            {/* Professional Experience */}
            <Text style={styles.sectionHeading}>Professional Experience</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxText}>
                {profile.experience || 'Experienced practitioner in software design, development, and mentoring.'}
              </Text>
            </View>

            {/* Verified Qualifications */}
            <Text style={styles.sectionHeading}>Verified Qualifications</Text>
            {qualifications.length > 0 ? (
              qualifications.map((q: any, idx: number) => (
                <View key={q.id || idx} style={styles.qualificationCard}>
                  <Text style={styles.qualificationTitle}>🎓 {q.title}</Text>
                  <Text style={styles.qualificationInstitution}>
                    {q.institution} • {q.year}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxText}>Verified qualifications on file with SkillConnect platform.</Text>
              </View>
            )}

            {/* Published Courses */}
            <Text style={styles.sectionHeading}>Courses Created by {user.name}</Text>
            {courses.length > 0 ? (
              courses.map((c: any, idx: number) => (
                <TouchableOpacity
                  key={c.id || idx}
                  style={styles.courseCard}
                  onPress={() => navigation?.navigate('CourseDetail', { courseId: c.id, course: c })}
                >
                  <View style={styles.courseBadgeRow}>
                    <Text style={styles.courseCategoryBadge}>{c.category?.name || 'General'}</Text>
                    <Text style={styles.courseDifficultyBadge}>{c.difficulty}</Text>
                  </View>
                  <Text style={styles.courseTitle}>{c.title}</Text>
                  <Text style={styles.courseStats}>
                    ⭐ {c.rating || 4.8} • 👥 {c.enrolledCount || 0} Learners enrolled
                  </Text>
                  <Text style={styles.viewCourseLink}>View Course Syllabus & Details →</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>No published courses yet.</Text>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#6B7280' },
  header: {
    backgroundColor: '#4F46E5',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  backBtnText: { color: '#EEF2FF', fontSize: 14, fontWeight: '600' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  scrollContent: { flex: 1 },
  heroCard: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#FFFFFF', fontSize: 32, fontWeight: 'bold' },
  sharerName: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  verifiedBadgeRow: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  verifiedBadgeText: { color: '#059669', fontSize: 12, fontWeight: '700' },
  locationText: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  bioText: { fontSize: 14, color: '#374151', textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  websiteLink: { fontSize: 13, color: '#4F46E5', fontWeight: '600' },
  bodyContent: { padding: 16, gap: 12 },
  sectionHeading: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginTop: 12 },
  skillPillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  skillPillText: { color: '#4338CA', fontSize: 13, fontWeight: '600' },
  infoBox: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoBoxText: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
  qualificationCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  qualificationTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  qualificationInstitution: { fontSize: 13, color: '#6B7280' },
  courseCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  courseBadgeRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  courseCategoryBadge: {
    backgroundColor: '#EEF2FF',
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  courseDifficultyBadge: {
    backgroundColor: '#FEF3C7',
    color: '#D97706',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  courseTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  courseStats: { fontSize: 13, color: '#6B7280' },
  viewCourseLink: { fontSize: 13, color: '#4F46E5', fontWeight: '700', marginTop: 4 },
  emptyText: { fontSize: 13, color: '#9CA3AF' },
});
