import React, { useState, useEffect, useCallback } from 'react';
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
import { profileService } from '../../api/skill-sharer.service';
import { authService } from '../../api/auth.service';

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

export default function ProfileScreen() {
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
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const loadProfile = async () => {
    try {
      const response = await profileService.getMyProfile();
      const data = response?.data?.data ?? response?.data ?? {};
      setProfile({
        bio: data.bio || '',
        skills: data.skills || [],
        experience: data.experience || '',
        portfolio: data.portfolio || [],
        location: data.location || '',
        website: data.website || '',
        socialLinks: data.socialLinks || {},
      });

      // Get user name
      const userResponse = await authService.getMe();
      const userData = userResponse?.data?.data ?? userResponse?.data ?? {};
      setUserName(userData.name || '');
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
      await profileService.updateProfile({
        ...payload,
        socialLinks: hasSocialLinks ? payload.socialLinks : undefined,
      });
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      const firstValidationError = error?.errors?.[0]?.msg;
      Alert.alert('Error', firstValidationError || error.message || error.error || 'Failed to update profile');
    } finally {
      setSaving(false);
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={userName}
            editable={false}
          />
          <Text style={styles.helperText}>Name cannot be changed here</Text>
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
        <Text style={styles.sectionTitle}>Skills</Text>
        <View style={styles.skillsContainer}>
          {profile.skills.map((skill, index) => (
            <View key={index} style={styles.skillItem}>
              <Text style={styles.skillText}>{skill}</Text>
              <TouchableOpacity onPress={() => removeSkill(index)}>
                <Ionicons name="close-circle" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <View style={styles.addSkillContainer}>
          <TextInput
            style={[styles.input, styles.skillInput]}
            value={newSkill}
            onChangeText={setNewSkill}
            placeholder="Add a skill"
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity style={styles.addSkillButton} onPress={addSkill}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Experience</Text>
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
        <Text style={styles.sectionTitle}>Social Links</Text>

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

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>Save Profile</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },
  textArea: {
    minHeight: 80,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    fontSize: 14,
    color: '#4F46E5',
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
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});