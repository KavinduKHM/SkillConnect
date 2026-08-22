import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { qualificationService, profileService } from '../../api/skill-sharer.service';

interface Qualification {
  id: string;
  title: string;
  institution: string;
  year: number;
  description?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export default function QualificationsScreen() {
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [profileId, setProfileId] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    institution: '',
    year: '',
    description: '',
  });

  const loadQualifications = async () => {
    try {
      // Get profile first
      const profileResponse = await profileService.getMyProfile();
      setProfileId(profileResponse.data.id);

      const response = await qualificationService.getQualifications();
      setQualifications(response.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load qualifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadQualifications();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadQualifications();
  };

  const handleAddQualification = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!formData.institution.trim()) {
      Alert.alert('Error', 'Please enter an institution');
      return;
    }
    if (!formData.year.trim() || parseInt(formData.year) < 1900) {
      Alert.alert('Error', 'Please enter a valid year');
      return;
    }

    try {
      await qualificationService.createQualification({
        profileId,
        title: formData.title.trim(),
        institution: formData.institution.trim(),
        year: parseInt(formData.year),
        description: formData.description.trim() || undefined,
      });
      Alert.alert('Success', 'Qualification added successfully');
      setModalVisible(false);
      setFormData({ title: '', institution: '', year: '', description: '' });
      loadQualifications();
    } catch (error: any) {
      Alert.alert('Error', error.error || 'Failed to add qualification');
    }
  };

  const handleDeleteQualification = (id: string, title: string) => {
    Alert.alert(
      'Delete Qualification',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await qualificationService.deleteQualification(id);
              setQualifications(qualifications.filter((q) => q.id !== id));
              Alert.alert('Success', 'Qualification deleted');
            } catch (error: any) {
              Alert.alert('Error', error.error || 'Failed to delete qualification');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return '#10B981';
      case 'REJECTED':
        return '#EF4444';
      default:
        return '#F59E0B';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'Verified';
      case 'REJECTED':
        return 'Rejected';
      default:
        return 'Pending';
    }
  };

  const renderItem = ({ item }: { item: Qualification }) => (
    <View style={styles.qualificationCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      <Text style={styles.cardInstitution}>{item.institution}</Text>
      <Text style={styles.cardYear}>{item.year}</Text>
      {item.description && <Text style={styles.cardDescription}>{item.description}</Text>}
      {item.status === 'PENDING' && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteQualification(item.id, item.title)}
        >
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Qualifications</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={qualifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="school-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Qualifications</Text>
            <Text style={styles.emptySubtitle}>
              Add your qualifications to get verified
            </Text>
          </View>
        }
      />

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Qualification</Text>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Title *</Text>
              <TextInput
                style={styles.modalInput}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="e.g., Bachelor of Science"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Institution *</Text>
              <TextInput
                style={styles.modalInput}
                value={formData.institution}
                onChangeText={(text) => setFormData({ ...formData, institution: text })}
                placeholder="e.g., University of Colombo"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Year *</Text>
              <TextInput
                style={styles.modalInput}
                value={formData.year}
                onChangeText={(text) => setFormData({ ...formData, year: text })}
                placeholder="e.g., 2020"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Description</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Additional details"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setFormData({ title: '', institution: '', year: '', description: '' });
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={handleAddQualification}
              >
                <Text style={styles.modalSaveText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  qualificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  cardInstitution: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardYear: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  cardDescription: {
    fontSize: 14,
    color: '#374151',
    marginTop: 6,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  deleteButtonText: {
    fontSize: 12,
    color: '#EF4444',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  modalField: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  modalTextArea: {
    minHeight: 80,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalCancelButton: {
    backgroundColor: '#F3F4F6',
  },
  modalCancelText: {
    color: '#6B7280',
    fontWeight: '500',
  },
  modalSaveButton: {
    backgroundColor: '#4F46E5',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});