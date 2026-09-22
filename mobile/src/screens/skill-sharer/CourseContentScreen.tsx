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
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
  const handleDeleteModule = async (moduleId: string) => {
    setDeletingId(moduleId);
    try {
      await moduleService.deleteModule(moduleId);
      setModules((currentModules) => currentModules.filter((module) => module.id !== moduleId));
    } catch (error: any) {
      Alert.alert('Error', error.error || error.message || 'Failed to delete module');
    } finally {
      setDeletingId(null);
    }
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

  const handleDeleteLesson = async (lessonId: string) => {
    setDeletingId(lessonId);
    try {
      await lessonService.deleteLesson(lessonId);
      setModules((currentModules) => currentModules.map((module) => ({
        ...module,
        lessons: module.lessons.filter((lesson) => lesson.id !== lessonId),
      })));
    } catch (error: any) {
      Alert.alert('Error', error.error || error.message || 'Failed to delete lesson');
    } finally {
      setDeletingId(null);
    }
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

      formData.append('lessonId', lessonId);
      formData.append('title', file.name || 'Uploaded Material');
      formData.append('type', fileType);
      const lesson = modules.flatMap((module) => module.lessons).find((item) => item.id === lessonId);
      formData.append('order', String((lesson?.materials?.length || 0) + 1));

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

  const handleDeleteMaterial = async (materialId: string) => {
    setDeletingId(materialId);
    try {
      await materialService.deleteMaterial(materialId);
      setModules((currentModules) => currentModules.map((module) => ({
        ...module,
        lessons: module.lessons.map((lesson) => ({
          ...lesson,
          materials: lesson.materials.filter((material) => material.id !== materialId),
        })),
      })));
    } catch (error: any) {
      Alert.alert('Error', error.error || error.message || 'Failed to delete material');
    } finally {
      setDeletingId(null);
    }
  };

  const openModal = (type: 'module' | 'lesson', moduleId?: string) => {
    setModalType(type);
    setSelectedModuleId(moduleId || null);
    setFormTitle('');
    setFormDescription('');
    setEditingId(null);
    setModalVisible(true);
  };

  const handlePublish = async () => {
    try {
      await courseService.submitCourse(courseId);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.error || 'Failed to publish course');
    }
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
      <TouchableOpacity onPress={() => handleDeleteMaterial(material.id)} disabled={deletingId === material.id} accessibilityLabel="Delete material">
        {deletingId === material.id ? <ActivityIndicator size="small" color="#B3310D" /> : <Ionicons name="close-circle" size={18} color="#EF4444" />}
      </TouchableOpacity>
    </View>
  );

  const renderLesson = ({ item: lesson }: { item: Lesson }) => (
    <View style={styles.lessonItem}>
      <View style={styles.lessonHeader}>
        <TouchableOpacity
          style={styles.lessonHeaderLeft}
          onPress={() => navigation.navigate('LessonEditor', { lessonId: lesson.id })}
        >
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          {lesson.isRequired && (
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredText}>Required</Text>
            </View>
          )}
          {lesson.estimatedMinutes && (
            <Text style={styles.lessonDuration}>{lesson.estimatedMinutes}m</Text>
          )}
        </TouchableOpacity>
        <View style={styles.lessonActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('LessonEditor', { lessonId: lesson.id })}
            accessibilityLabel="Edit lesson"
          >
            <Ionicons name="create-outline" size={18} color="#4F46E5" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteLesson(lesson.id)} disabled={deletingId === lesson.id} accessibilityLabel="Delete lesson">
            {deletingId === lesson.id ? <ActivityIndicator size="small" color="#B3310D" /> : <Ionicons name="trash-outline" size={18} color="#EF4444" />}
          </TouchableOpacity>
        </View>
      </View>

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
          <View style={styles.moduleEyebrowRow}>
            <Text style={styles.moduleNumber}>{module.order}.</Text>
            <Text style={styles.moduleTitle}>{module.title}</Text>
            <View style={styles.lessonCountBadge}><Text style={styles.lessonCountText}>{module.lessons.length} {module.lessons.length === 1 ? 'lesson' : 'lessons'}</Text></View>
          </View>
        </View>
        <View style={styles.moduleActions}>
          <TouchableOpacity style={styles.circleAction} onPress={() => openModal('lesson', module.id)} accessibilityLabel="Add lesson">
            <Ionicons name="add" size={22} color="#B3310D" />
          </TouchableOpacity>
          <TouchableOpacity onPress={(event) => { event.stopPropagation(); handleDeleteModule(module.id); }} disabled={deletingId === module.id} accessibilityLabel="Delete module">
            {deletingId === module.id ? <ActivityIndicator size="small" color="#B3310D" /> : <Ionicons name="trash-outline" size={18} color="#80695F" />}
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={22} color="#2A1712" />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Curriculum Builder</Text>
          <Text style={styles.headerSubtitle}>Step 2 of 2 • Structure &amp; Materials</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.publishedBadge}><Text style={styles.publishedText}>{course?.status || 'DRAFT'}</Text></View>
          <TouchableOpacity onPress={() => Alert.alert('Course options', 'Choose an action from the buttons below.')} accessibilityLabel="Course options"><Ionicons name="ellipsis-vertical" size={21} color="#80695F" /></TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={modules}
        renderItem={renderModule}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.tipCard}>
              <View style={styles.tipIcon}><Ionicons name="bulb" size={18} color="#8A5600" /></View>
              <View style={styles.tipCopy}><View style={styles.tipHeading}><Text style={styles.tipLabel}>CURRICULUM PRO-TIP</Text><Text style={styles.recommendedBadge}>Recommended</Text></View><Text style={styles.tipBody}>Attach concrete materials (PDFs, schematics, code starter kits) directly to micro-lessons to raise learner engagement by <Text style={styles.tipStrong}>42%</Text>.</Text></View>
            </View>
            <View style={styles.courseCard}>
              <View style={styles.courseMeta}><Text style={styles.courseType}>COURSE</Text><Text style={styles.courseMetaText}>{modules.length} Modules</Text><Text style={styles.courseDot}>•</Text><Text style={styles.courseMetaText}>{modules.reduce((count, item) => count + item.lessons.length, 0)} Lessons</Text></View>
              <Text style={styles.courseCardTitle}>{course?.title || 'Untitled Course'}</Text>
              <View style={styles.courseCardFooter}><Text style={styles.courseCardHint}>Organized in self-contained{`\n`}milestones</Text><TouchableOpacity style={styles.addModuleButton} onPress={() => openModal('module')}><Ionicons name="add" size={20} color="#FFFFFF" /><Text style={styles.addModuleText}>Add{`\n`}Module</Text></TouchableOpacity></View>
            </View>
          </>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B3310D" />
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
        ListFooterComponent={
          <TouchableOpacity style={styles.addNewModule} onPress={() => openModal('module')}>
            <View style={styles.addNewModuleIcon}><Ionicons name="add" size={20} color="#80695F" /></View>
            <Text style={styles.addNewModuleText}>Add New Module</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.previewButton} onPress={() => Alert.alert('Preview', 'Course preview is coming soon.')}>
          <Text style={styles.previewText}>Preview Course</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.publishButton} onPress={handlePublish}>
          <Text style={styles.publishText}>Save &amp; Publish</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

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
    backgroundColor: '#FFFCF9',
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EBDCCC',
  },
  backButton: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: '#EBDCCC', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFCF9' },
  headerCopy: { flex: 1, marginLeft: 14 },
  headerTitle: { color: '#201713', fontSize: 17, fontWeight: '700' },
  headerSubtitle: { color: '#80695F', fontSize: 12, marginTop: 3 },
  headerRight: { alignItems: 'flex-end', gap: 8, marginLeft: 8 },
  publishedBadge: { backgroundColor: '#D8F7E5', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  publishedText: { color: '#147A3D', fontSize: 10, fontWeight: '700' },
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
    padding: 20,
    paddingBottom: 115,
  },
  moduleItem: {
    backgroundColor: '#FFFCF9',
    borderRadius: 17,
    padding: 17,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ECDDD0',
    shadowColor: '#6E3828',
    shadowOpacity: 0.05,
    shadowRadius: 7,
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
    fontSize: 17,
    fontWeight: '700',
    color: '#201713',
  },
  moduleEyebrowRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 },
  moduleNumber: { color: '#201713', fontSize: 17, fontWeight: '700' },
  lessonCountBadge: { backgroundColor: '#FFF0D1', borderRadius: 14, paddingHorizontal: 9, paddingVertical: 5 },
  lessonCountText: { color: '#8A5600', fontSize: 11, fontWeight: '700' },
  moduleCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  moduleDescription: {
    fontSize: 14,
    color: '#80695F',
    lineHeight: 21,
    marginBottom: 8,
  },
  moduleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lessonsList: {
    marginTop: 13,
    borderTopWidth: 1,
    borderTopColor: '#F0E3D8',
    paddingTop: 12,
  },
  lessonItem: {
    backgroundColor: '#FBF7F2',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ECDDD0',
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
    fontSize: 15,
    fontWeight: '700',
    color: '#201713',
    marginRight: 8,
  },
  requiredBadge: {
    backgroundColor: '#CFF7E1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  requiredText: {
    fontSize: 10,
    color: '#147A3D',
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
    marginTop: 10,
    paddingVertical: 4,
  },
  uploadButtonText: {
    fontSize: 12,
    color: '#B3310D',
    marginLeft: 4,
  },
  materialsList: {
    marginTop: 8,
    paddingLeft: 0,
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFCF9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ECDDD0',
    marginBottom: 4,
  },
  materialIcon: {
    marginRight: 8,
  },
  materialText: {
    fontSize: 13,
    color: '#60443B',
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#201713',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#80695F',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  emptyAddButton: {
    backgroundColor: '#B3310D',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyAddButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tipCard: { flexDirection: 'row', backgroundColor: '#FFF8EC', borderRadius: 17, borderWidth: 1, borderColor: '#F0D9B5', padding: 16, marginBottom: 18 },
  tipIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFF0D1', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  tipCopy: { flex: 1 },
  tipHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  tipLabel: { color: '#A66A00', fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  recommendedBadge: { color: '#8A5600', backgroundColor: '#FFE5B3', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3, fontSize: 10 },
  tipBody: { color: '#60443B', fontSize: 14, lineHeight: 21 },
  tipStrong: { color: '#201713', fontWeight: '800' },
  courseCard: { backgroundColor: '#FFFCF9', borderRadius: 17, borderWidth: 1, borderColor: '#ECDDD0', padding: 20, marginBottom: 18 },
  courseMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  courseType: { color: '#B3310D', fontSize: 11, fontWeight: '800', letterSpacing: 0.7, backgroundColor: '#FFF0EC', borderRadius: 6, paddingHorizontal: 9, paddingVertical: 4 },
  courseMetaText: { color: '#80695F', fontSize: 14 },
  courseDot: { color: '#C9AEA0', fontSize: 14 },
  courseCardTitle: { color: '#201713', fontSize: 21, fontWeight: '800', lineHeight: 27, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: '#F0E3D8' },
  courseCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 15 },
  courseCardHint: { color: '#80695F', fontSize: 14, lineHeight: 20 },
  addNewModule: { height: 68, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: '#EBDCCC', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, marginTop: 1, marginBottom: 10 },
  addNewModuleIcon: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#EBDCCC', alignItems: 'center', justifyContent: 'center' },
  addNewModuleText: { color: '#80695F', fontSize: 15, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFCF9',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#201713',
    marginBottom: 16,
  },
  modalField: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#60443B',
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#EBDCCC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#201713',
    backgroundColor: '#FBF7F2',
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
    backgroundColor: '#F3EAE2',
  },
  modalCancelText: {
    color: '#80695F',
    fontWeight: '500',
  },
  modalSaveButton: {
    backgroundColor: '#B3310D',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  circleAction: { width: 38, height: 38, borderRadius: 11, borderWidth: 1, borderColor: '#EBDCCC', backgroundColor: '#FFFCF9', alignItems: 'center', justifyContent: 'center' },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 22, backgroundColor: '#FFFCF9', borderTopWidth: 1, borderTopColor: '#EBDCCC' },
  previewButton: { flex: 0.85, minHeight: 50, borderRadius: 13, borderWidth: 1, borderColor: '#EBDCCC', backgroundColor: '#FFFCF9', alignItems: 'center', justifyContent: 'center' },
  previewText: { color: '#201713', fontSize: 14, fontWeight: '700' },
  publishButton: { flex: 1.5, minHeight: 50, borderRadius: 13, backgroundColor: '#B3310D', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  publishText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});