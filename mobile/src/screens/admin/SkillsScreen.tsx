import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Platform,
  RefreshControl,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService, Skill, Category } from '../../api/admin.service';
import { Header } from '../../components/common/Header';

export const SkillsScreen = () => {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    aliases: '',
  });

  const { data: skillsData, isLoading, refetch } = useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const response = await adminService.getSkills();
      return response.data;
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await adminService.getCategories();
      return response.data;
    },
  });

  const handleSave = async () => {
    if (!formData.name) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Skill name is required' });
      return;
    }

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        ...(formData.categoryId ? { categoryId: formData.categoryId } : {}),
        aliases: formData.aliases ? formData.aliases.split(',').map(a => a.trim()) : [],
      };

      if (editingSkill) {
        await adminService.updateSkill(editingSkill.id, payload);
        Toast.show({ type: 'success', text1: 'Success', text2: 'Skill updated' });
      } else {
        await adminService.createSkill(payload);
        Toast.show({ type: 'success', text1: 'Success', text2: 'Skill created' });
      }
      setModalVisible(false);
      setEditingSkill(null);
      setFormData({ name: '', description: '', categoryId: '', aliases: '' });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      refetch();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.error || 'Failed to save' });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const action = async () => {
      queryClient.setQueryData(['skills'], (old: any) => 
        Array.isArray(old) ? old.filter((s: any) => s.id !== id) : old
      );
      try {
        await adminService.deleteSkill(id);
        Toast.show({ type: 'success', text1: 'Success', text2: 'Skill deleted' });
        queryClient.invalidateQueries({ queryKey: ['skills'] });
        refetch();
      } catch (error: any) {
        Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.error || 'Failed to delete' });
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
        action();
      }
    } else {
      Alert.alert(
        'Delete Skill',
        `Are you sure you want to delete "${name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: action },
        ]
      );
    }
  };

  const openEditModal = (skill: Skill) => {
    setEditingSkill(skill);
    setFormData({
      name: skill.name,
      description: skill.description || '',
      categoryId: skill.categoryId || '',
      aliases: skill.aliases?.join(', ') || '',
    });
    setModalVisible(true);
  };

  const openCreateModal = () => {
    setEditingSkill(null);
    setFormData({ name: '', description: '', categoryId: '', aliases: '' });
    setModalVisible(true);
  };

  const skills: Skill[] = skillsData || [];
  const categories: Category[] = categoriesData || [];

  return (
    <View style={{ flex: 1 }}>
      <Header
        title="Skills"
        rightComponent={
          <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        }
      />
      <View style={styles.container}>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {skills.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏷️</Text>
            <Text style={styles.emptyTitle}>No Skills</Text>
            <Text style={styles.emptyText}>Tap "+ Add" to create your first skill</Text>
          </View>
        ) : (
          skills.map((skill) => (
            <View key={skill.id} style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{skill.name}</Text>
                  <Text style={styles.cardDescription} numberOfLines={1}>
                    {skill.description || 'No description'}
                  </Text>
                  <View style={styles.cardTags}>
                    {skill.category && (
                      <View style={styles.categoryTag}>
                        <Text style={styles.categoryTagText}>{skill.category.name}</Text>
                      </View>
                    )}
                    {skill.aliases && skill.aliases.length > 0 && (
                      <Text style={styles.aliasesText}>
                        Aliases: {skill.aliases.join(', ')}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditModal(skill)}
                  >
                    <Text style={styles.editButtonText}>✎</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(skill.id, skill.name)}
                  >
                    <Text style={styles.deleteButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingSkill ? 'Edit Skill' : 'Add Skill'}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., JavaScript"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., JavaScript programming language"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.selectContainer}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryOption,
                      formData.categoryId === cat.id && styles.categoryOptionSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, categoryId: cat.id })}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        formData.categoryId === cat.id && styles.categoryOptionTextSelected,
                      ]}
                    >
                      {cat.icon || '📁'} {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Aliases (comma separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., JS, ECMAScript"
                value={formData.aliases}
                onChangeText={(text) => setFormData({ ...formData, aliases: text })}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  cardDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  cardTags: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  categoryTag: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  categoryTagText: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '500',
  },
  aliasesText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
  },
  editButtonText: {
    color: '#3b82f6',
    fontSize: 14,
  },
  deleteButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 14,
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
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryOptionSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  categoryOptionText: {
    fontSize: 13,
    color: '#6b7280',
  },
  categoryOptionTextSelected: {
    color: '#3b82f6',
    fontWeight: '500',
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
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
});