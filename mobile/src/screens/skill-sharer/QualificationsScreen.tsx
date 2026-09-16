import React, { useState, useCallback } from 'react';
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
  documents?: { id: string; fileName: string; fileType?: string }[];
}

export default function QualificationsScreen({ navigation }: any) {
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    institution: '',
    year: '',
    description: '',
  });

  const unwrapResponse = <T,>(response: unknown): T | undefined => {
    const payload = response as { data?: { data?: T } | T } | undefined;
    return (payload?.data && typeof payload.data === 'object' && 'data' in payload.data
      ? payload.data.data
      : payload?.data) as T | undefined;
  };

  const loadQualifications = async () => {
    try {
      const profileResponse = await profileService.getMyProfile();
      const profile = unwrapResponse<{ id: string }>(profileResponse);
      if (!profile?.id) {
        throw new Error('Profile not found');
      }
      setProfileId(profile.id);

      const response = await qualificationService.getQualifications();
      const qualificationData = unwrapResponse<Qualification[]>(response);
      setQualifications(Array.isArray(qualificationData) ? qualificationData : []);
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

  const resetForm = () => {
    setFormData({ title: '', institution: '', year: '', description: '' });
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (qualification: Qualification) => {
    setEditingId(qualification.id);
    setFormData({
      title: qualification.title,
      institution: qualification.institution,
      year: String(qualification.year),
      description: qualification.description || '',
    });
    setModalVisible(true);
  };

  const handleSaveQualification = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!formData.institution.trim()) {
      Alert.alert('Error', 'Please enter an institution');
      return;
    }
    const year = Number(formData.year);
    if (!formData.year.trim() || !Number.isInteger(year) || year < 1900 || year > new Date().getFullYear()) {
      Alert.alert('Error', 'Please enter a valid year');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await qualificationService.updateQualification(editingId, {
          title: formData.title.trim(),
          institution: formData.institution.trim(),
          year,
          description: formData.description.trim() || undefined,
        });
        Alert.alert('Success', 'Qualification updated successfully');
      } else {
        if (!profileId) {
          Alert.alert('Error', 'Your profile could not be found');
          return;
        }
        await qualificationService.createQualification(profileId, {
          title: formData.title.trim(),
          institution: formData.institution.trim(),
          year,
          description: formData.description.trim() || undefined,
        });
        Alert.alert('Success', 'Qualification added successfully');
      }
      setModalVisible(false);
      resetForm();
      await loadQualifications();
    } catch (error: any) {
      Alert.alert('Error', error?.errors?.[0]?.msg || error?.error || 'Failed to save qualification');
    } finally {
      setSaving(false);
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
              setQualifications((current) => current.filter((q) => q.id !== id));
              Alert.alert('Success', 'Qualification deleted');
            } catch (error: any) {
              Alert.alert('Error', error?.error || 'Failed to delete qualification');
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
        <View style={[styles.statusBadge, { borderColor: getStatusColor(item.status) }]}>
          <Ionicons name={item.status === 'VERIFIED' ? 'checkmark-circle-outline' : item.status === 'REJECTED' ? 'close-circle-outline' : 'time-outline'} size={14} color={getStatusColor(item.status)} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      <Text style={styles.cardInstitution}>{item.institution} <Text style={styles.cardYear}>• Class of {item.year}</Text></Text>
      {item.description && <View style={styles.remarks}><Text style={styles.remarksLabel}>Remarks: </Text><Text style={styles.cardDescription}>{item.description}</Text></View>}
      {item.documents?.map((document) => (
        <View key={document.id} style={styles.documentRow}>
          <Ionicons name="document-text-outline" size={18} color="#8C746B" />
          <Text style={styles.documentName} numberOfLines={1}>{document.fileName}</Text>
          <Text style={styles.documentType}>{document.fileType?.split('/').pop()?.toUpperCase() || 'PDF'}</Text>
        </View>
      ))}
      <View style={styles.divider} />
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.detailsButton} onPress={() => Alert.alert('Qualification Details', `${item.title}\n${item.institution}\nClass of ${item.year}`)}>
          <Ionicons name="information-circle-outline" size={16} color="#8C746B" />
          <Text style={styles.detailsText}>Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openEditModal(item)}
        >
          <Ionicons name="create-outline" size={16} color="#4F46E5" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteQualification(item.id, item.title)}
        >
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={23} color="#3B2924" />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Qualifications</Text>
          <Text style={styles.headerSubtitle}>Instructor Credentials</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={openAddModal}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.verificationBanner}>
        <View style={styles.bannerIcon}><Ionicons name="school" size={22} color="#A66A00" /></View>
        <View style={styles.bannerCopy}>
          <Text style={styles.bannerTitle}>Verification in Progress</Text>
          <Text style={styles.bannerText}>Verified credentials unlock the <Text style={styles.bannerAccent}>"Top Instructor"</Text> badge & boost your course reach by up to 40%.</Text>
        </View>
      </View>

      <View style={styles.listHeading}>
        <Text style={styles.listTitle}>ALL SUBMITTED ({qualifications.length})</Text>
        <View style={styles.reviewBadge}><View style={styles.reviewDot} /><Text style={styles.reviewText}>Reviewing Submissions</Text></View>
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
        ListFooterComponent={
          <TouchableOpacity style={styles.addAnother} onPress={openAddModal}>
            <View style={styles.addAnotherIcon}><Ionicons name="add" size={28} color="#B3310D" /></View>
            <Text style={styles.addAnotherTitle}>Add Another Qualification</Text>
            <Text style={styles.addAnotherText}>Upload diplomas, academic degrees, or certifications</Text>
          </TouchableOpacity>
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
            <Text style={styles.modalTitle}>{editingId ? 'Edit Qualification' : 'Add Qualification'}</Text>

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
                  resetForm();
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={handleSaveQualification}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>{editingId ? 'Save' : 'Add'}</Text>
                )}
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
    backgroundColor: '#FBF7F2',
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
    paddingHorizontal: 21,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE3D8',
  },
  backButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFCF9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EBDCCC',
    shadowColor: '#7D4938',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 1,
  },
  headerCopy: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#171311',
  },
  headerSubtitle: {
    color: '#866E65',
    fontSize: 14,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B3310D',
    paddingHorizontal: 17,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#B3310D',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  listContent: {
    paddingHorizontal: 21,
    paddingTop: 3,
    paddingBottom: 24,
  },
  verificationBanner: {
    flexDirection: 'row',
    marginHorizontal: 21,
    marginTop: 21,
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F2D19B',
    backgroundColor: '#FFF8ED',
  },
  bannerIcon: {
    width: 47,
    height: 47,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBE8C7',
  },
  bannerCopy: { flex: 1, marginLeft: 15 },
  bannerTitle: { color: '#1D1714', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  bannerText: { color: '#654F45', fontSize: 14, lineHeight: 22 },
  bannerAccent: { color: '#B3310D' },
  listHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 25,
    marginTop: 22,
    marginBottom: 13,
  },
  listTitle: { color: '#896F64', fontSize: 14, fontWeight: '600', letterSpacing: 0.3 },
  reviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0D291',
    backgroundColor: '#FFF8E9',
  },
  reviewDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#E8A32C', marginRight: 7 },
  reviewText: { color: '#A66A00', fontSize: 11, fontWeight: '600' },
  qualificationCard: {
    backgroundColor: '#FFFCF9',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ECDDD0',
    padding: 21,
    marginBottom: 17,
    shadowColor: '#6E3828',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#171311',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: '#FFF8E7',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardInstitution: {
    fontSize: 15,
    color: '#B3310D',
    marginBottom: 14,
  },
  cardYear: {
    color: '#80695F',
  },
  cardDescription: {
    flex: 1,
    fontSize: 14,
    color: '#3B2D27',
    fontStyle: 'italic',
  },
  remarks: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF4EE',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFE1D5',
    paddingHorizontal: 13,
    paddingVertical: 13,
    marginBottom: 14,
  },
  remarksLabel: { color: '#8C746B', fontSize: 14 },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF4EE',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#EFE1D5',
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginBottom: 13,
  },
  documentName: { flex: 1, color: '#2B211D', fontSize: 14, marginLeft: 10 },
  documentType: { color: '#A79086', fontSize: 12, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#EFE1D5', marginBottom: 14 },
  detailsButton: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  detailsText: { color: '#8C746B', fontSize: 15, marginLeft: 5 },
  addAnother: {
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EADACB',
    borderStyle: 'dashed',
    borderRadius: 20,
    paddingVertical: 22,
    marginBottom: 10,
  },
  addAnotherIcon: {
    width: 51,
    height: 51,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0EC',
    marginBottom: 10,
  },
  addAnotherTitle: { color: '#1D1714', fontSize: 16, fontWeight: '700' },
  addAnotherText: { color: '#8C746B', fontSize: 13, marginTop: 5 },
  cardDescriptionOld: {
    fontSize: 14,
    color: '#374151',
    marginTop: 6,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6D6C7',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  editButtonText: {
    fontSize: 14,
    color: '#8B3A20',
    marginLeft: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3B7AE',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 35,
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