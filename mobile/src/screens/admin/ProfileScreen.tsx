import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../../api/auth.service';
import { StatusBadge } from '../../components/admin/StatusBadge';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  verifiedBadge: boolean;
  profilePicture: string | null;
  createdAt: string;
  profile: {
    bio: string;
    skills: string[];
    experience: string;
  };
}

export const ProfileScreen = ({ navigation }: any) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    skills: '',
    experience: '',
  });
  const [loading, setLoading] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await authService.getMe();
      return response.data;
    },
  });

  useEffect(() => {
    if (data) {
      setUser(data);
      setFormData({
        name: data.name || '',
        bio: data.profile?.bio || '',
        skills: data.profile?.skills?.join(', ') || '',
        experience: data.profile?.experience || '',
      });
    }
  }, [data]);

  const handleLogout = async () => {
    const doLogout = async () => {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      if (Platform.OS === 'web') {
        window.location.replace('/');
      } else {
        try {
          if (typeof (navigation as any).replace === 'function') {
            (navigation as any).replace('Auth');
          } else {
            (navigation as any).navigate('Auth');
          }
        } catch (e) {
          (navigation as any).navigate('Auth');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        doLogout();
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: doLogout,
          },
        ]
      );
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      // Update user name
      await authService.updateProfile({
        name: formData.name,
      });

      // Update profile
      await authService.updateProfileDetails({
        bio: formData.bio,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
        experience: formData.experience,
      });

      Alert.alert('Success', 'Profile updated successfully');
      setEditModalVisible(false);
      refetch();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load profile</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}>
      {/* Profile Header */}
      <View style={styles.headerCard}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <View style={styles.badgeContainer}>
          <StatusBadge status={user.role} type="role" />
          <StatusBadge status={user.status} type="status" />
          {user.verifiedBadge && (
            <StatusBadge status="Verified" type="badge" />
          )}
        </View>
        <Text style={styles.memberSince}>
          Member since {new Date(user.createdAt).toLocaleDateString()}
        </Text>
      </View>

      {/* Profile Details */}
      <View style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Profile Details</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Name</Text>
          <Text style={styles.detailValue}>{user.name}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Email</Text>
          <Text style={styles.detailValue}>{user.email}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Role</Text>
          <Text style={styles.detailValue}>{user.role}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status</Text>
          <Text style={styles.detailValue}>{user.status}</Text>
        </View>

        {user.profile?.bio && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Bio</Text>
            <Text style={styles.detailValue}>{user.profile.bio}</Text>
          </View>
        )}

        {user.profile?.skills && user.profile.skills.length > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Skills</Text>
            <View style={styles.skillsContainer}>
              {user.profile.skills.map((skill, index) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillTagText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {user.profile?.experience && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Experience</Text>
            <Text style={styles.detailValue}>{user.profile.experience}</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setEditModalVisible(true)}
        >
          <Text style={styles.editButtonText}>✎ Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>🚪 Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.bio}
                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Skills (comma separated)</Text>
              <TextInput
                style={styles.input}
                value={formData.skills}
                onChangeText={(text) => setFormData({ ...formData, skills: text })}
                placeholder="e.g., JavaScript, React, Node.js"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Experience</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.experience}
                onChangeText={(text) => setFormData({ ...formData, experience: text })}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateProfile}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  headerCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#3b82f6',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  memberSince: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
  },
  detailsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  detailRow: {
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9ca3af',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  skillTag: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skillTagText: {
    fontSize: 12,
    color: '#3b82f6',
  },
  actionsContainer: {
    padding: 16,
    gap: 10,
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: '#eff6ff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#fee2e2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});