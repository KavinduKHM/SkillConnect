import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as skillSharerService from '../../api/skill-sharer.service';
import { authService } from '../../api/auth.service';

const profileService = skillSharerService as any;
const PROFILE_CACHE_KEY = 'skill_sharer_profile';

interface ProfileData {
  bio: string;
  skills: string[];
  experience: string;
  portfolio: string[];
  location: string;
  website: string;
  socialLinks: {
    linkedin?: string;
    github?: string;
    twitter?: string;
  };
}

export default function ProfileScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userName, setUserName] = useState('');
  const [profile, setProfile] = useState<ProfileData>({
    bio: '',
    skills: [],
    experience: '',
    portfolio: [],
    location: '',
    website: '',
    socialLinks: {},
  });
  const [newSkill, setNewSkill] = useState('');

  const normalizeUrl = (value?: string): string | undefined => {
    const trimmed = value?.trim();
    if (!trimmed) return undefined;
    const url = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      const parsed = new URL(url);
      return parsed.hostname.includes('.') ? url : undefined;
    } catch {
      return undefined;
    }
  };

  const getProfileData = (response: any): any => {
    const data = response?.data?.data ?? response?.data ?? {};
    return data?.profile ?? data;
  };

  const mapProfile = (data: any): ProfileData => ({
    bio: data?.bio || '',
    skills: Array.isArray(data?.skills) ? data.skills : [],
    experience: data?.experience || '',
    portfolio: Array.isArray(data?.portfolio) ? data.portfolio : [],
    location: data?.location || '',
    website: data?.website || '',
    socialLinks: data?.socialLinks || {},
  });

  const loadProfile = async () => {
    try {
      const cachedProfile = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
      if (cachedProfile) {
        setProfile(mapProfile(JSON.parse(cachedProfile)));
      }

      const response = await profileService.getMyProfile();
      const data = getProfileData(response);
      const loadedProfile = mapProfile(data);
      const hasSavedDetails = loadedProfile.bio || loadedProfile.skills.length || loadedProfile.experience || loadedProfile.location || loadedProfile.website || Object.keys(loadedProfile.socialLinks).length;
      if (hasSavedDetails || !cachedProfile) {
        setProfile(loadedProfile);
      }

      // Get user name
      const userResponse = await authService.getMe();
      const userData = userResponse?.data?.data?.user ?? userResponse?.data?.user ?? userResponse?.data?.data ?? userResponse?.data ?? {};
      setUserName(userData.name || data.user?.name || '');
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        bio: profile.bio.trim() || undefined,
        skills: profile.skills.map((s) => s.trim()).filter(Boolean),
        experience: profile.experience.trim() || undefined,
        portfolio: profile.portfolio,
        location: profile.location.trim() || undefined,
        website: normalizeUrl(profile.website),
        socialLinks: {
          linkedin: normalizeUrl(profile.socialLinks?.linkedin),
          github: normalizeUrl(profile.socialLinks?.github),
          twitter: normalizeUrl(profile.socialLinks?.twitter),
        },
      };

      const hasSocialLinks = Object.values(payload.socialLinks).some(Boolean);
      await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(payload));
      const response = await profileService.updateProfile({
        ...payload,
        socialLinks: hasSocialLinks ? payload.socialLinks : undefined,
      });
      setProfile(mapProfile(getProfileData(response) || payload));
    } catch (error: any) {
      const firstValidationError = error?.errors?.[0]?.msg;
      const responseError = error?.data?.errors?.[0]?.msg || error?.data?.error;
      Alert.alert('Unable to save profile', firstValidationError || responseError || error.message || error.error || 'Failed to update profile');
    } finally {
      setSaving(false);
      navigation.navigate('Dashboard');
    }
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setProfile({
        ...profile,
        skills: [...profile.skills, newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const removeSkill = (index: number) => {
    setProfile({
      ...profile,
      skills: profile.skills.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={21} color="#3B2924" />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <Text style={styles.headerSubtitle}><Text style={styles.statusDot}>•</Text> Instructor &amp; Personal Info</Text>
        </View>
        <TouchableOpacity style={styles.headerCheck} onPress={handleSave} disabled={saving} accessibilityLabel="Save profile">
          {saving ? <ActivityIndicator size="small" color="#A66A00" /> : <Ionicons name="checkmark" size={20} color="#A66A00" />}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.identityCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{(userName || 'U').slice(0, 2).toUpperCase()}</Text><View style={styles.cameraBadge}><Ionicons name="camera" size={12} color="#FFFFFF" /></View></View>
          <View style={styles.identityCopy}><Text style={styles.identityName}>{userName || 'Skill Sharer'}</Text><Text style={styles.identityRole}>Mobile App Specialist &amp; Lead Creator</Text><View style={styles.identityBadges}><Text style={styles.verifiedBadge}>● Verified Creator</Text><Text style={styles.ratingBadge}>★ 4.9 Rating</Text></View></View>
        </View>

      <View style={styles.section}>
        <View style={styles.sectionHeading}><View style={styles.headingIcon}><Ionicons name="person-outline" size={17} color="#B3310D" /></View><Text style={styles.sectionTitle}>Personal Information</Text><Text style={styles.coreBadge}>Core</Text></View>
        <View style={styles.rule} />

        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={userName}
            editable={false}
          />
          <Text style={styles.helperText}><Text style={styles.warning}>●</Text> Name cannot be changed here. Contact support to update verified identity.</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={profile.bio}
            onChangeText={(text) => setProfile({ ...profile, bio: text })}
            placeholder="Tell us about yourself"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <View style={styles.fieldMeta}><Text style={styles.helperText}>Minimum 30 characters recommended</Text><Text style={styles.helperText}>{profile.bio.length}/350</Text></View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={profile.location}
            onChangeText={(text) => setProfile({ ...profile, location: text })}
            placeholder="Your location"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Website</Text>
          <TextInput
            style={styles.input}
            value={profile.website}
            onChangeText={(text) => setProfile({ ...profile, website: text })}
            placeholder="Your website URL"
            placeholderTextColor="#9CA3AF"
            keyboardType="url"
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeading}><View style={styles.headingIcon}><Ionicons name="flash-outline" size={17} color="#A66A00" /></View><Text style={styles.sectionTitle}>Skills &amp; Topics</Text><Text style={styles.sectionMeta}>{profile.skills.length} Added</Text></View>
        <View style={styles.rule} />
        <View style={styles.skillsContainer}>
          {profile.skills.map((skill, index) => (
            <View key={index} style={styles.skillItem}>
              <Text style={styles.skillText}>{skill}</Text>
              <TouchableOpacity onPress={() => removeSkill(index)}>
                <Ionicons name="close" size={14} color="#B3310D" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <View style={styles.addSkillContainer}>
          <TextInput
            style={[styles.input, styles.skillInput]}
            value={newSkill}
            onChangeText={setNewSkill}
            placeholder="Add a skill (e.g., Redux, GraphQL)"
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity style={styles.addSkillButton} onPress={addSkill}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeading}><View style={styles.headingIcon}><Ionicons name="briefcase-outline" size={17} color="#B3310D" /></View><Text style={styles.sectionTitle}>Experience</Text><TouchableOpacity onPress={() => Alert.alert('Experience', 'Add detailed experience from your profile settings.')}><Text style={styles.linkText}>View Degrees →</Text></TouchableOpacity></View>
        <View style={styles.rule} />
        <Text style={styles.label}>Professional Track Record</Text>
        <View style={styles.field}>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={profile.experience}
            onChangeText={(text) => setProfile({ ...profile, experience: text })}
            placeholder="Your professional experience"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeading}><View style={styles.headingIcon}><Ionicons name="link-outline" size={17} color="#B3310D" /></View><Text style={styles.sectionTitle}>Social &amp; Profiles</Text><Text style={styles.sectionMeta}>Public</Text></View>
        <View style={styles.rule} />

        <View style={styles.field}>
          <Text style={styles.label}>LinkedIn</Text>
          <TextInput
            style={styles.input}
            value={profile.socialLinks?.linkedin || ''}
            onChangeText={(text) =>
              setProfile({
                ...profile,
                socialLinks: { ...profile.socialLinks, linkedin: text },
              })
            }
            placeholder="LinkedIn URL"
            placeholderTextColor="#9CA3AF"
            keyboardType="url"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>GitHub</Text>
          <TextInput
            style={styles.input}
            value={profile.socialLinks?.github || ''}
            onChangeText={(text) =>
              setProfile({
                ...profile,
                socialLinks: { ...profile.socialLinks, github: text },
              })
            }
            placeholder="GitHub URL"
            placeholderTextColor="#9CA3AF"
            keyboardType="url"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Twitter</Text>
          <TextInput
            style={styles.input}
            value={profile.socialLinks?.twitter || ''}
            onChangeText={(text) =>
              setProfile({
                ...profile,
                socialLinks: { ...profile.socialLinks, twitter: text },
              })
            }
            placeholder="Twitter URL"
            placeholderTextColor="#9CA3AF"
            keyboardType="url"
          />
        </View>
      </View>

      <View style={styles.tip}><Ionicons name="information-circle" size={18} color="#B3310D" /><Text style={styles.tipText}><Text style={styles.tipBold}>Instructor Tip:</Text> Complete profiles with verified social links and specific skill tags receive 3.2× higher learner engagement.</Text></View>
      <View style={styles.bottomActions}>
      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation?.goBack()}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>Save Profile  ✓</Text>
        )}
      </TouchableOpacity>
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF7F2',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 15,
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#FFFCF9',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ECDDD0',
    padding: 17,
    marginBottom: 14,
    shadowColor: '#6E3828',
    shadowOpacity: 0.04,
    shadowRadius: 7,
    elevation: 1,
  },
  topHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 19, paddingTop: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#EFE3D8' },
  backButton: { width: 38, height: 38, borderRadius: 20, borderWidth: 1, borderColor: '#EBDCCC', backgroundColor: '#FFFCF9', alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#171311', fontSize: 16, fontWeight: '700' },
  headerSubtitle: { color: '#B3310D', fontSize: 11, marginTop: 2 },
  statusDot: { color: '#00A86B', fontSize: 15 },
  headerCheck: { width: 38, height: 38, borderRadius: 20, borderWidth: 1, borderColor: '#F0D291', backgroundColor: '#FFF8E9', alignItems: 'center', justifyContent: 'center' },
  identityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFCF9', borderRadius: 15, borderWidth: 1, borderColor: '#ECDDD0', padding: 14, marginBottom: 14, shadowColor: '#6E3828', shadowOpacity: 0.04, shadowRadius: 7, elevation: 1 },
  avatar: { width: 58, height: 58, borderRadius: 30, borderWidth: 2, borderColor: '#B3310D', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#B3310D', fontSize: 17, fontWeight: '700' },
  cameraBadge: { position: 'absolute', right: -3, bottom: -2, width: 19, height: 19, borderRadius: 10, backgroundColor: '#B3310D', alignItems: 'center', justifyContent: 'center' },
  identityCopy: { flex: 1, marginLeft: 13 },
  identityName: { color: '#201713', fontSize: 15, fontWeight: '700' },
  identityRole: { color: '#80695F', fontSize: 11, marginTop: 2 },
  identityBadges: { flexDirection: 'row', alignItems: 'center', marginTop: 7, gap: 6 },
  verifiedBadge: { color: '#B3310D', borderColor: '#F1C6B9', borderWidth: 1, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3, fontSize: 9 },
  ratingBadge: { color: '#A66A00', borderColor: '#F0D291', borderWidth: 1, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3, fontSize: 9 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center' },
  headingIcon: { width: 25, height: 25, borderRadius: 7, backgroundColor: '#FFF0EC', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  sectionMeta: { color: '#80695F', fontSize: 10, marginLeft: 'auto' },
  coreBadge: { color: '#B3310D', backgroundColor: '#FFF5F1', borderWidth: 1, borderColor: '#F1C6B9', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3, fontSize: 10, marginLeft: 'auto' },
  rule: { height: 1, backgroundColor: '#EFE3D8', marginVertical: 12 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#201713',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2A1C17',
    marginBottom: 7,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#EBDCCC',
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 9,
    fontSize: 12,
    color: '#3B2D27',
    backgroundColor: '#FFFCF9',
  },
  disabledInput: {
    backgroundColor: '#F5EFEB',
    color: '#80695F',
  },
  textArea: {
    minHeight: 80,
  },
  helperText: {
    fontSize: 10,
    color: '#A18D83',
    marginTop: 4,
  },
  warning: { color: '#B3310D' },
  fieldMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFCF9',
    borderWidth: 1,
    borderColor: '#F1C6B9',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    fontSize: 11,
    color: '#B3310D',
    marginRight: 4,
  },
  addSkillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillInput: {
    flex: 1,
    marginRight: 8,
  },
  addSkillButton: {
    backgroundColor: '#B3310D',
    width: 45,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#B3310D',
    flex: 1,
    paddingVertical: 13,
    borderRadius: 11,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  linkText: { color: '#B3310D', fontSize: 10, marginLeft: 'auto' },
  tip: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFF7DD', borderWidth: 1, borderColor: '#F0DCA5', borderRadius: 11, padding: 11, marginBottom: 12 },
  tipText: { flex: 1, color: '#7C4E16', fontSize: 10, lineHeight: 15, marginLeft: 8 },
  tipBold: { fontWeight: '700', color: '#422713' },
  bottomActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  cancelButton: { borderWidth: 1, borderColor: '#EBDCCC', borderRadius: 11, backgroundColor: '#FFFCF9', paddingVertical: 13, paddingHorizontal: 18 },
  cancelText: { color: '#4F3B33', fontSize: 12 },
});