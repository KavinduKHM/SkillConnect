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
import { adminService, Category } from '../../api/admin.service';
import { Header } from '../../components/common/Header';
import { ConfirmModal } from '../../components/common/ConfirmModal';

export const CategoriesScreen = () => {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
  });

  const [confirmConfig, setConfirmConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await adminService.getCategories();
      return response.data;
    },
  });

  const handleSave = async () => {
    if (!formData.name) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Category name is required' });
      return;
    }

    try {
      if (editingCategory) {
        await adminService.updateCategory(editingCategory.id, formData);
        Toast.show({ type: 'success', text1: 'Success', text2: 'Category updated' });
      } else {
        await adminService.createCategory(formData);
        Toast.show({ type: 'success', text1: 'Success', text2: 'Category created' });
      }
      setModalVisible(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '', icon: '' });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      refetch();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.error || 'Failed to save' });
    }
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmConfig({
      visible: true,
      title: 'Delete Category',
      message: `Are you sure you want to delete "${name}"?`,
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, visible: false }));
        queryClient.setQueryData(['categories'], (old: any) => 
          Array.isArray(old) ? old.filter((c: any) => c.id !== id) : old
        );
        try {
          await adminService.deleteCategory(id);
          Toast.show({ type: 'success', text1: 'Success', text2: 'Category deleted' });
          queryClient.invalidateQueries({ queryKey: ['categories'] });
          refetch();
        } catch (error: any) {
          Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.error || 'Failed to delete' });
        }
      },
    });
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
    });
    setModalVisible(true);
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', icon: '' });
    setModalVisible(true);
  };

  const categories: Category[] = data || [];

  return (
    <View style={{ flex: 1 }}>
      <Header
        title="Categories"
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
        {categories.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyTitle}>No Categories</Text>
            <Text style={styles.emptyText}>Tap "+ Add" to create your first category</Text>
          </View>
        ) : (
          categories.map((category) => (
            <View key={category.id} style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.cardIconContainer}>
                  <Text style={styles.cardIcon}>{category.icon || '📁'}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{category.name}</Text>
                  <Text style={styles.cardDescription} numberOfLines={1}>
                    {category.description || 'No description'}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {category._count?.courses || 0} courses • {category._count?.children || 0} sub-categories
                  </Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditModal(category)}
                  >
                    <Text style={styles.editButtonText}>✎</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(category.id, category.name)}
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
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Programming"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Programming courses"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Icon (emoji)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 💻"
                value={formData.icon}
                onChangeText={(text) => setFormData({ ...formData, icon: text })}
                maxLength={2}
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

      <ConfirmModal
        visible={confirmConfig.visible}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText="Delete"
        confirmType="danger"
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, visible: false }))}
      />
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
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardIcon: {
    fontSize: 20,
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
  cardMeta: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
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