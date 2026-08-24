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
  ScrollView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { courseService, moduleService, lessonService, materialService } from '../../api/skill-sharer.service';
import { Header } from '../../components/common/Header';

interface Module {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  order: number;
  isRequired: boolean;
  estimatedMinutes?: number;
  materials: Material[];
}

interface Material {
  id: string;
  title: string;
  type: 'VIDEO' | 'PDF' | 'SLIDE' | 'EXTERNAL' | 'IMAGE';
  fileUrl?: string;
  externalUrl?: string;
  description?: string;
  duration?: number;
}

export default function CourseContentScreen({ route, navigation }: any) {
  const { courseId } = route.params;
  console.log('📚 courseId from route:', courseId);
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'module' | 'lesson'>('module');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    try {
      const courseResponse = await courseService.getCourse(courseId);
      const coursePayload = (courseResponse as any)?.data?.data ?? (courseResponse as any)?.data ?? courseResponse;
      setCourse(coursePayload);

      const modulesResponse = await moduleService.getModules(courseId);
      const modulesPayload = (modulesResponse as any)?.data?.data ?? (modulesResponse as any)?.data ?? modulesResponse;
      setModules(Array.isArray(modulesPayload) ? modulesPayload : []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load course content');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [courseId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };
// Inside CourseContentScreen.tsx - The handleAddModule function

// Inside CourseContentScreen.tsx

// Inside CourseContentScreen.tsx - The handleAddModule function

// Inside CourseContentScreen.tsx

// Inside CourseContentScreen.tsx - The handleAddModule function

const handleAddModule = async () => {
  // ✅ Validate title
  if (!formTitle.trim()) {
    Alert.alert('Error', 'Please enter a module title');
    return;
  }

  try {
    // Keep order valid even if modules payload shape changes.
    const order = Array.isArray(modules) ? modules.length + 1 : 1;
    
    // ✅ Build data object
    const moduleData = {
      courseId: courseId,
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      order: order,
    };
    
    console.log('📤 Sending module data:', JSON.stringify(moduleData, null, 2));

    // ✅ Call API
    const response = await moduleService.createModule(moduleData);
    console.log('✅ Module created:', response);
    
    // ✅ Reset form and refresh
    setModalVisible(false);
    setFormTitle('');
    setFormDescription('');
    loadData();
  } catch (error: any) {
    console.error('❌ Error creating module:', error);
    const errorMsg = error.error || error.message || 'Failed to create module';
    Alert.alert('Error', errorMsg);
  }
};
  const handleDeleteModule = (moduleId: string) => {
    Alert.alert(
      'Delete Module',
      'This will also delete all lessons and materials in this module. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await moduleService.deleteModule(moduleId);
              loadData();
            } catch (error: any) {
              Alert.alert('Error', error.error || 'Failed to delete module');
            }
          },
        },
      ]
    );
  };

  const handleAddLesson = async (moduleId: string) => {
    if (!formTitle.trim()) {
      Alert.alert('Error', 'Please enter a lesson title');
      return;
    }

    try {
      const module = modules.find((m) => m.id === moduleId);
      const order = module ? module.lessons.length + 1 : 1;

      await lessonService.createLesson({
        moduleId,
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        order,
        isRequired: true,
      });
      setModalVisible(false);
      setFormTitle('');
      setFormDescription('');
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.error || 'Failed to create lesson');
    }
  };

  const handleDeleteLesson = (lessonId: string) => {
    Alert.alert(
      'Delete Lesson',
      'This will also delete all materials in this lesson. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await lessonService.deleteLesson(lessonId);
              loadData();
            } catch (error: any) {
              Alert.alert('Error', error.error || 'Failed to delete lesson');
            }
          },
        },
      ]
    );
  };

  const handleUploadMaterial = async (lessonId: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'video/*',
          'application/pdf',
          'image/*',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets?.[0];
      if (!file) {
        Alert.alert('Error', 'No file selected');
        return;
      }

      const formData = new FormData();

      // Determine file type
      let fileType: 'VIDEO' | 'PDF' | 'SLIDE' | 'IMAGE' = 'VIDEO';
      if (file.mimeType?.startsWith('video/')) fileType = 'VIDEO';
      else if (file.mimeType === 'application/pdf') fileType = 'PDF';
      else if (file.mimeType?.startsWith('image/')) fileType = 'IMAGE';
      else if (
        file.mimeType?.includes('presentation') ||
        file.mimeType?.includes('powerpoint')
      ) {
        fileType = 'SLIDE';
      }

      // Dynamically calculate order based on length of existing materials in the lesson
      let order = 1;
      for (const m of modules) {
        const foundLesson = m.lessons.find((l) => l.id === lessonId);
        if (foundLesson) {
          order = (foundLesson.materials?.length || 0) + 1;
          break;
        }
      }

      formData.append('lessonId', lessonId);
      formData.append('title', file.name || 'Uploaded Material');
      formData.append('type', fileType);
      formData.append('order', String(order));

      if (Platform.OS === 'web') {
        const webFile = (file as any).file as File | undefined;
        if (webFile) {
          formData.append('file', webFile);
        } else if (file.uri) {
          const fileBlob = await fetch(file.uri).then((res) => res.blob());
          formData.append('file', fileBlob, file.name || 'file');
        }
      } else if (file.uri) {
        formData.append('file', {
          uri: file.uri,
          type: file.mimeType || 'application/octet-stream',
          name: file.name || 'file',
        } as any);
      }

      if (!formData.get('file')) {
        Alert.alert('Error', 'Could not attach the selected file. Please try again.');
        return;
      }

      setUploading(true);
      await materialService.uploadMaterial(formData);
      Alert.alert('Success', 'Material uploaded successfully');
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.error || 'Failed to upload material');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMaterial = (materialId: string) => {
    Alert.alert(
      'Delete Material',
      'Are you sure you want to delete this material?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await materialService.deleteMaterial(materialId);
              loadData();
            } catch (error: any) {
              Alert.alert('Error', error.error || 'Failed to delete material');
            }
          },
        },
      ]
    );
  };

  const openModal = (type: 'module' | 'lesson', moduleId?: string) => {
    setModalType(type);
    setSelectedModuleId(moduleId || null);
    setFormTitle('');
    setFormDescription('');
    setEditingId(null);
    setModalVisible(true);
  };

  const renderMaterial = (material: Material) => (
    <View key={material.id} style={styles.materialItem}>
      <View style={styles.materialIcon}>
        <Ionicons
          name={
            material.type === 'VIDEO' ? 'videocam-outline' :
            material.type === 'PDF' ? 'document-text-outline' :
            material.type === 'SLIDE' ? 'desktop-outline' :
            material.type === 'EXTERNAL' ? 'link-outline' :
            'image-outline'
          }
          size={16}
          color="#6B7280"
        />
      </View>
      <Text style={styles.materialText} numberOfLines={1}>
        {material.title}
      </Text>
      <TouchableOpacity onPress={() => handleDeleteMaterial(material.id)}>
        <Ionicons name="close-circle" size={18} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  const renderLesson = ({ item: lesson }: { item: Lesson }) => (
    <View style={styles.lessonItem}>
      <TouchableOpacity
        style={styles.lessonHeader}
        onPress={() => navigation.navigate('LessonEditor', { lessonId: lesson.id })}
      >
        <View style={styles.lessonHeaderLeft}>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          {lesson.isRequired && (
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredText}>Required</Text>
            </View>
          )}
          {lesson.estimatedMinutes && (
            <Text style={styles.lessonDuration}>{lesson.estimatedMinutes}m</Text>
          )}
        </View>
        <View style={styles.lessonActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('LessonEditor', { lessonId: lesson.id })}
          >
            <Ionicons name="create-outline" size={18} color="#4F46E5" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteLesson(lesson.id)}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => handleUploadMaterial(lesson.id)}
        disabled={uploading}
      >
        <Ionicons name="cloud-upload-outline" size={16} color="#4F46E5" />
        <Text style={styles.uploadButtonText}>
          {uploading ? 'Uploading...' : 'Add Material'}
        </Text>
      </TouchableOpacity>

      {lesson.materials && lesson.materials.length > 0 && (
        <View style={styles.materialsList}>
          {lesson.materials.map(renderMaterial)}
        </View>
      )}
    </View>
  );

  const renderModule = ({ item: module }: { item: Module }) => (
    <View style={styles.moduleItem}>
      <View style={styles.moduleHeader}>
        <View style={styles.moduleHeaderLeft}>
          <Text style={styles.moduleTitle}>{module.title}</Text>
          <Text style={styles.moduleCount}>
            {module.lessons.length} lessons
          </Text>
        </View>
        <View style={styles.moduleActions}>
          <TouchableOpacity onPress={() => openModal('lesson', module.id)}>
            <Ionicons name="add-circle" size={24} color="#4F46E5" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteModule(module.id)}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {module.description && (
        <Text style={styles.moduleDescription}>{module.description}</Text>
      )}

      <FlatList
        data={module.lessons}
        renderItem={renderLesson}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={styles.lessonsList}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1 }}>
        <Header title={course?.title || "Course Content"} showBack={true} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Header
        title={course?.title || "Course Content"}
        showBack={true}
        rightComponent={
          <TouchableOpacity
            style={{ marginRight: 8 }}
            onPress={() => openModal('module')}
          >
            <Ionicons name="add" size={26} color="#4F46E5" />
          </TouchableOpacity>
        }
      />
      <View style={styles.container}>
        <View style={styles.statusBanner}>
          <Text style={styles.statusBannerText}>Status: {course?.status}</Text>
        </View>

      <FlatList
        data={modules}
        renderItem={renderModule}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="layers-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Modules Yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your first module to start building your course content
            </Text>
            <TouchableOpacity
              style={styles.emptyAddButton}
              onPress={() => openModal('module')}
            >
              <Text style={styles.emptyAddButtonText}>Add Module</Text>
            </TouchableOpacity>
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
            <Text style={styles.modalTitle}>
              Add {modalType === 'module' ? 'Module' : 'Lesson'}
            </Text>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Title *</Text>
              <TextInput
                style={styles.modalInput}
                value={formTitle}
                onChangeText={setFormTitle}
                placeholder={`Enter ${modalType} title`}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Description</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                value={formDescription}
                onChangeText={setFormDescription}
                placeholder={`Enter ${modalType} description`}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={() => {
                  if (modalType === 'module') {
                    handleAddModule();
                  } else if (selectedModuleId) {
                    handleAddLesson(selectedModuleId);
                  }
                }}
              >
                <Text style={styles.modalSaveText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  statusBanner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  statusBannerText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E40AF',
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  courseStatus: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  addModuleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  addModuleText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  moduleItem: {
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
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  moduleHeaderLeft: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  moduleCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  moduleDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  moduleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lessonsList: {
    marginTop: 8,
  },
  lessonItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lessonHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginRight: 8,
  },
  requiredBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  requiredText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  lessonDuration: {
    fontSize: 12,
    color: '#6B7280',
  },
  lessonActions: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  uploadButtonText: {
    fontSize: 12,
    color: '#4F46E5',
    marginLeft: 4,
  },
  materialsList: {
    marginTop: 8,
    paddingLeft: 8,
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 4,
  },
  materialIcon: {
    marginRight: 8,
  },
  materialText: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
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
    marginBottom: 24,
  },
  emptyAddButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyAddButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
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