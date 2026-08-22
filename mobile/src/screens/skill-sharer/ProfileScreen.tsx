import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Header } from '../../components/common/Header';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ProfileForm } from '../../components/skill-sharer/ProfileForm';
import { profileApi } from '../../api/skill-sharer.service';
import { Profile } from '../../types';

export const ProfileScreen: React.FC = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hasProfile, setHasProfile] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await profileApi.getMyProfile();
      
      if (response.success && response.data) {
        setProfile(response.data);
        setHasProfile(true);
      } else {
        setHasProfile(false);
        setProfile(null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setHasProfile(false);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const handleSubmit = async (data: any) => {
    try {
      setSaving(true);
      
      let response;
      if (hasProfile && profile) {
        response = await profileApi.updateProfile(data);
      } else {
        response = await profileApi.createProfile(data);
      }

      if (response.success) {
        setProfile(response.data!);
        setHasProfile(true);
        Alert.alert(
          'Success',
          hasProfile ? 'Profile updated successfully!' : 'Profile created successfully!'
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  if (loading) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  return (
    <View style={styles.container}>
      <Header title="My Profile" />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {hasProfile && profile && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Profile Status:</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#10B981' }]}>
              <Text style={styles.statusBadgeText}>Active</Text>
            </View>
          </View>
        )}

        <ProfileForm
          initialData={profile || undefined}  // ✅ Pass undefined when null
          onSubmit={handleSubmit}
          loading={saving}
        />

        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    height: 20,
  },
});