import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import Toast from 'react-native-toast-message';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import {
  courseApi,
  lessonService,
  materialService,
  moduleService,
} from '../../api/skill-sharer.service';
import { COLORS } from '../../theme/colors';
import { Course, CourseLesson, CourseModule, LearningMaterial } from '../../types';
import { RADIUS, SHADOWS } from '../../theme/shadows';

type EditableContent =
  | { kind: 'module'; id: string; title: string; description: string; content: string }
  | { kind: 'lesson'; id: string; title: string; description: string; content: string }
  | { kind: 'material'; id: string; title: string; description: string; content: string };

type CreationTarget =
  | { kind: 'module' }
  | { kind: 'lesson'; moduleId: string; moduleTitle: string };

const contentKindLabels = {
  module: 'Module',
  lesson: 'Lesson',
  material: 'Material',
} as const;

type MaterialType = LearningMaterial['type'];

interface PickedMaterialFile {
  name: string;
  uri: string;
  mimeType?: string | null;
  file?: Blob;
}

const materialTypes: MaterialType[] = ['PDF', 'VIDEO', 'SLIDE', 'IMAGE', 'EXTERNAL'];

const iconForMaterial: Record<LearningMaterial['type'], keyof typeof Ionicons.glyphMap> = {
  VIDEO: 'videocam-outline',
  PDF: 'document-text-outline',
  SLIDE: 'albums-outline',
  EXTERNAL: 'link-outline',
  IMAGE: 'image-outline',
};

export default function CourseContentScreen({ route, navigation }: any) {
  const courseId = route?.params?.courseId as string | undefined;
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editTarget, setEditTarget] = useState<EditableContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [creationTarget, setCreationTarget] = useState<CreationTarget | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newLessonContent, setNewLessonContent] = useState('');
  const [creatingContent, setCreatingContent] = useState(false);
  const [materialLesson, setMaterialLesson] = useState<CourseLesson | null>(null);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [materialExternalUrl, setMaterialExternalUrl] = useState('');
  const [materialType, setMaterialType] = useState<MaterialType>('PDF');
  const [materialFile, setMaterialFile] = useState<PickedMaterialFile | null>(null);
  const [addingMaterial, setAddingMaterial] = useState(false);

  const loadContent = useCallback(async () => {
    if (!courseId) {
      setError('A course was not specified.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [courseResponse, modulesResponse] = await Promise.all([
        courseApi.getCourse(courseId),
        moduleService.getModules(courseId),
      ]);
      if (!courseResponse?.success || !courseResponse.data) {
        throw new Error(courseResponse?.error || 'Could not load the course.');
      }
      if (!modulesResponse?.success || !Array.isArray(modulesResponse.data)) {
        throw new Error(modulesResponse?.error || 'Could not load course content.');
      }
      setCourse(courseResponse.data);
      setModules(modulesResponse.data);
    } catch (loadError: any) {
      setError(loadError?.error || loadError?.message || 'Could not load course content.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const saveEdit = async () => {
    if (!editTarget || !editTarget.title.trim()) {
      Toast.show({ type: 'error', text1: 'Title required', text2: 'Enter a title before saving.' });
      return;
    }

    setSaving(true);
    try {
      const data = {
        title: editTarget.title.trim(),
        description: editTarget.description.trim(),
      };
      const response = editTarget.kind === 'module'
        ? await moduleService.updateModule(editTarget.id, data)
        : editTarget.kind === 'lesson'
          ? await lessonService.updateLesson(editTarget.id, { ...data, content: editTarget.content.trim() })
          : await materialService.updateMaterial(editTarget.id, data);

      if (!response?.success) {
        throw new Error(response?.error || `Could not update ${contentKindLabels[editTarget.kind].toLowerCase()}.`);
      }

      setEditTarget(null);
      Toast.show({
        type: 'success',
        text1: `${contentKindLabels[editTarget.kind]} updated`,
        text2: 'Your changes have been saved.',
      });
      await loadContent();
    } catch (saveError: any) {
      Toast.show({
        type: 'error',
        text1: 'Could not save changes',
        text2: saveError?.error || saveError?.message || 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteContent = (kind: EditableContent['kind'], id: string, title: string) => {
    const confirmDelete = async () => {
      try {
        const response = kind === 'module'
          ? await moduleService.deleteModule(id)
          : kind === 'lesson'
            ? await lessonService.deleteLesson(id)
            : await materialService.deleteMaterial(id);
        if (!response?.success) {
          throw new Error(response?.error || `Could not delete ${contentKindLabels[kind].toLowerCase()}.`);
        }
        Toast.show({
          type: 'success',
          text1: `${contentKindLabels[kind]} deleted`,
          text2: `"${title}" has been removed.`,
        });
        await loadContent();
      } catch (deleteError: any) {
        Toast.show({
          type: 'error',
          text1: 'Could not delete content',
          text2: deleteError?.error || deleteError?.message || 'Please try again.',
        });
      }
    };

    const message = kind === 'module'
      ? `Delete "${title}" and all of its lessons and materials?`
      : `Delete "${title}"?`;

    if (Platform.OS === 'web') {
      if (window.confirm(message)) void confirmDelete();
      return;
    }

    Alert.alert(`Delete ${contentKindLabels[kind].toLowerCase()}?`, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void confirmDelete() },
    ]);
  };

  const openEditor = (kind: EditableContent['kind'], item: CourseModule | CourseLesson | LearningMaterial) => {
    setEditTarget({
      kind,
      id: item.id,
      title: item.title,
      description: item.description || '',
      content: kind === 'lesson' ? (item as CourseLesson).content || '' : '',
    });
  };

  const openCreationForm = (target: CreationTarget) => {
    setCreationTarget(target);
    setNewTitle('');
    setNewDescription('');
    setNewLessonContent('');
  };

  const closeCreationForm = () => {
    if (creatingContent) return;
    setCreationTarget(null);
  };

  const createContent = async () => {
    const title = newTitle.trim();
    if (!creationTarget || !title) {
      Toast.show({ type: 'error', text1: 'Title required', text2: 'Enter a title before saving.' });
      return;
    }

    if (!courseId) {
      Toast.show({ type: 'error', text1: 'Course unavailable', text2: 'Reload the course and try again.' });
      return;
    }

    const description = newDescription.trim();
    setCreatingContent(true);
    try {
      const response = creationTarget.kind === 'module'
        ? await moduleService.createModule({
            courseId,
            title,
            ...(description ? { description } : {}),
            order: Math.max(0, ...modules.map((module) => module.order)) + 1,
          })
        : await lessonService.createLesson({
            moduleId: creationTarget.moduleId,
            title,
            ...(description ? { description } : {}),
            ...(newLessonContent.trim() ? { content: newLessonContent.trim() } : {}),
            order: Math.max(
              0,
              ...(modules.find((module) => module.id === creationTarget.moduleId)?.lessons || [])
                .map((lesson) => lesson.order),
            ) + 1,
          });

      if (!response?.success) {
        throw new Error(response?.error || `Could not create ${creationTarget.kind}.`);
      }

      const createdKind = creationTarget.kind;
      setCreationTarget(null);
      Toast.show({
        type: 'success',
        text1: `${contentKindLabels[createdKind]} added`,
        text2: `"${title}" was added to the course.`,
      });
      await loadContent();
    } catch (createError: any) {
      Toast.show({
        type: 'error',
        text1: `Could not add ${creationTarget.kind}`,
        text2: createError?.error || createError?.message || 'Please try again.',
      });
    } finally {
      setCreatingContent(false);
    }
  };

  const openMaterial = async (url?: string) => {
    if (!url) return;
    const fullUrl = /^https?:\/\//i.test(url)
      ? url
      : `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
    try {
      await Linking.openURL(fullUrl);
    } catch (openError) {
      Toast.show({
        type: 'error',
        text1: 'Could not open material',
        text2: openError instanceof Error ? openError.message : 'Please try again.',
      });
    }
  };

  const openAddMaterial = (lesson: CourseLesson) => {
    setMaterialLesson(lesson);
    setMaterialTitle('');
    setMaterialDescription('');
    setMaterialExternalUrl('');
    setMaterialType('PDF');
    setMaterialFile(null);
  };

  const closeAddMaterial = () => {
    if (addingMaterial) return;
    setMaterialLesson(null);
    setMaterialFile(null);
  };

  const pickMaterialFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        const picked: PickedMaterialFile = {
          name: asset.name,
          uri: asset.uri,
          mimeType: asset.mimeType,
          file: (asset as typeof asset & { file?: Blob }).file,
        };
        setMaterialFile(picked);
        if (!materialTitle.trim()) {
          setMaterialTitle(asset.name.replace(/\.[^.]+$/, ''));
        }
      }
    } catch (pickError) {
      Toast.show({
        type: 'error',
        text1: 'Could not select file',
        text2: pickError instanceof Error ? pickError.message : 'Please try again.',
      });
    }
  };

  const addMaterial = async () => {
    const title = materialTitle.trim();
    if (!materialLesson || !title) {
      Toast.show({ type: 'error', text1: 'Title required', text2: 'Enter a title for the material.' });
      return;
    }

    const isExternal = materialType === 'EXTERNAL';
    const externalUrl = materialExternalUrl.trim();
    if (isExternal && !/^https?:\/\/\S+$/i.test(externalUrl)) {
      Toast.show({ type: 'error', text1: 'Valid link required', text2: 'Enter a link starting with http:// or https://.' });
      return;
    }
    if (!isExternal && !materialFile) {
      Toast.show({ type: 'error', text1: 'Choose a file', text2: 'Select the material file you want to upload.' });
      return;
    }

    setAddingMaterial(true);
    try {
      const description = materialDescription.trim();
      let payload: FormData | {
        lessonId: string;
        type: 'EXTERNAL';
        title: string;
        description?: string;
        externalUrl: string;
      };

      if (isExternal) {
        payload = {
          lessonId: materialLesson.id,
          type: 'EXTERNAL',
          title,
          ...(description ? { description } : {}),
          externalUrl,
        };
      } else {
        const formData = new FormData();
        formData.append('lessonId', materialLesson.id);
        formData.append('type', materialType);
        formData.append('title', title);
        formData.append('order', '0');
        if (description) formData.append('description', description);

        if (Platform.OS === 'web' && materialFile.file) {
          formData.append('file', materialFile.file, materialFile.name);
        } else if (Platform.OS === 'web') {
          const response = await fetch(materialFile.uri);
          if (!response.ok) throw new Error('Could not read the selected file.');
          const blob = await response.blob();
          formData.append('file', blob, materialFile.name);
        } else {
          formData.append('file', {
            uri: materialFile.uri,
            name: materialFile.name,
            type: materialFile.mimeType || 'application/octet-stream',
          } as any);
        }
        payload = formData;
      }

      const response = await materialService.uploadMaterial(payload);
      if (!response?.success) {
        throw new Error(response?.error || 'Could not add the material.');
      }

      setMaterialLesson(null);
      setMaterialFile(null);
      Toast.show({
        type: 'success',
        text1: 'Material added',
        text2: `"${title}" was added to ${materialLesson.title}.`,
      });
      await loadContent();
    } catch (uploadError: any) {
      Toast.show({
        type: 'error',
        text1: 'Could not add material',
        text2: uploadError?.error || uploadError?.message || 'Please try again.',
      });
    } finally {
      setAddingMaterial(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Course Content"
        showBack
        onBackPress={() => navigation.popTo('MyCourses')}
        rightComponent={
          courseId ? (
            <Button
              title="Edit course"
              size="small"
              variant="outline"
              onPress={() => navigation.navigate('CourseCreator', { courseId })}
            />
          ) : undefined
        }
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.muted}>Loading course content...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <View style={styles.emptyIcon}>
            <Ionicons name="cloud-offline-outline" size={26} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>Could not load content</Text>
          <Text style={styles.error}>{error}</Text>
          <Button title="Try again" onPress={loadContent} size="small" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.courseIntro}>
            <View style={styles.courseIcon}>
              <Ionicons name="library-outline" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.courseIntroCopy}>
              <Text style={styles.courseEyebrow}>COURSE CURRICULUM</Text>
              <Text style={styles.courseTitle}>{course?.title || 'Course content'}</Text>
              <Text style={styles.courseDescription} numberOfLines={3}>
                {course?.description || 'Manage modules, lessons, and learning materials.'}
              </Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Modules & lessons</Text>
              <Text style={styles.sectionSubtitle}>
                {modules.length} {modules.length === 1 ? 'module' : 'modules'} in this course
              </Text>
            </View>
            <View style={styles.sectionActions}>
              <View style={styles.moduleCount}>
                <Ionicons name="layers-outline" size={15} color={COLORS.primary} />
                <Text style={styles.moduleCountText}>{modules.length}</Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => openCreationForm({ kind: 'module' })}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={16} color={COLORS.white} />
                <Text style={styles.addButtonText}>Add module</Text>
              </TouchableOpacity>
            </View>
          </View>

          {modules.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="albums-outline" size={25} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>No modules yet</Text>
              <Text style={styles.muted}>Start with a module, then add its lessons and learning materials.</Text>
              <TouchableOpacity
                style={styles.emptyAction}
                onPress={() => openCreationForm({ kind: 'module' })}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={17} color={COLORS.primary} />
                <Text style={styles.emptyActionText}>Add your first module</Text>
              </TouchableOpacity>
            </View>
          ) : (
            modules.map((module, moduleIndex) => (
              <View key={module.id} style={styles.moduleCard}>
                <View style={styles.moduleHeader}>
                  <View style={styles.moduleNumber}>
                    <Text style={styles.moduleNumberText}>{String(moduleIndex + 1).padStart(2, '0')}</Text>
                  </View>
                  <View style={styles.moduleCopy}>
                    <Text style={styles.itemEyebrow}>MODULE {moduleIndex + 1}</Text>
                    <Text style={styles.moduleTitle}>{module.title}</Text>
                    {!!module.description && <Text style={styles.itemDescription}>{module.description}</Text>}
                  </View>
                  <ActionButtons
                    onEdit={() => openEditor('module', module)}
                    onDelete={() => deleteContent('module', module.id, module.title)}
                  />
                </View>

                <View style={styles.moduleDivider} />

                {(module.lessons || []).length === 0 ? (
                  <Text style={styles.emptyLesson}>No lessons in this module yet.</Text>
                ) : (
                  module.lessons?.map((lesson, lessonIndex) => (
                    <View key={lesson.id} style={styles.lessonCard}>
                      <View style={styles.lessonMarker}>
                        <Ionicons name="play" size={11} color={COLORS.primary} />
                      </View>
                      <View style={styles.lessonContent}>
                        <View style={styles.lessonHeading}>
                          <Text style={styles.lessonTitle}>
                            {moduleIndex + 1}.{lessonIndex + 1} {lesson.title}
                          </Text>
                          <ActionButtons
                            onEdit={() => openEditor('lesson', lesson)}
                            onDelete={() => deleteContent('lesson', lesson.id, lesson.title)}
                          />
                        </View>
                        {!!lesson.description && <Text style={styles.itemDescription}>{lesson.description}</Text>}
                        {!!lesson.content && <Text style={styles.lessonBody} numberOfLines={4}>{lesson.content}</Text>}

                        <TouchableOpacity
                          style={styles.addMaterialButton}
                          onPress={() => openAddMaterial(lesson)}
                          activeOpacity={0.75}
                        >
                          <Ionicons name="add-circle-outline" size={15} color={COLORS.primary} />
                          <Text style={styles.addMaterialText}>Add material</Text>
                        </TouchableOpacity>

                        {(lesson.materials || []).length > 0 && (
                          <View style={styles.materialList}>
                            {lesson.materials?.map((material) => (
                              <View key={material.id} style={styles.materialRow}>
                                <View style={styles.materialIcon}>
                                  <Ionicons name={iconForMaterial[material.type] || 'attach-outline'} size={15} color={COLORS.primary} />
                                </View>
                                <View style={styles.materialCopy}>
                                  <Text style={styles.materialTitle}>{material.title}</Text>
                                  <Text style={styles.materialMeta}>
                                    {material.type}{material.fileSize ? ` · ${formatFileSize(material.fileSize)}` : ''}
                                  </Text>
                                  {(material.fileUrl || material.externalUrl) && (
                                    <TouchableOpacity
                                      style={styles.openMaterial}
                                      onPress={() => openMaterial(material.externalUrl || material.fileUrl)}
                                      activeOpacity={0.75}
                                    >
                                      <Text style={styles.openMaterialText} numberOfLines={1}>
                                        {getMaterialFileName(material.externalUrl || material.fileUrl || '')}
                                      </Text>
                                      <Ionicons name="open-outline" size={12} color={COLORS.primary} />
                                    </TouchableOpacity>
                                  )}
                                  {!!material.description && (
                                    <Text style={styles.materialDescription} numberOfLines={2}>{material.description}</Text>
                                  )}
                                </View>
                                <ActionButtons
                                  onEdit={() => openEditor('material', material)}
                                  onDelete={() => deleteContent('material', material.id, material.title)}
                                />
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  ))
                )}
                <TouchableOpacity
                  style={styles.addLessonButton}
                  onPress={() => openCreationForm({
                    kind: 'lesson',
                    moduleId: module.id,
                    moduleTitle: module.title,
                  })}
                  activeOpacity={0.75}
                >
                  <Ionicons name="add-circle-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.addMaterialText}>Add lesson</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <Modal
        visible={editTarget !== null}
        animationType="slide"
        transparent
        onRequestClose={() => !saving && setEditTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalHeadingCopy}>
                <Text style={styles.modalEyebrow}>EDIT CONTENT</Text>
                <Text style={styles.modalTitle}>
                  {editTarget ? `Edit ${contentKindLabels[editTarget.kind]}` : 'Edit content'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setEditTarget(null)}
                disabled={saving}
                style={styles.closeButton}
                accessibilityLabel="Close edit dialog"
              >
                <Ionicons name="close" size={20} color={COLORS.neutralDark} />
              </TouchableOpacity>
            </View>

            {editTarget && (
              <ScrollView keyboardShouldPersistTaps="handled" style={styles.formScroll}>
                <Text style={styles.inputLabel}>Title</Text>
                <TextInput
                  value={editTarget.title}
                  onChangeText={(title) => setEditTarget({ ...editTarget, title })}
                  style={styles.input}
                  placeholder="Enter a title"
                  placeholderTextColor={COLORS.neutralLight}
                  maxLength={160}
                />
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  value={editTarget.description}
                  onChangeText={(description) => setEditTarget({ ...editTarget, description })}
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Add a short description"
                  placeholderTextColor={COLORS.neutralLight}
                  multiline
                  textAlignVertical="top"
                  maxLength={1000}
                />
                {editTarget.kind === 'lesson' && (
                  <>
                    <Text style={styles.inputLabel}>Lesson content</Text>
                    <TextInput
                      value={editTarget.content}
                      onChangeText={(content) => setEditTarget({ ...editTarget, content })}
                      style={[styles.input, styles.contentInput]}
                      placeholder="Edit lesson content"
                      placeholderTextColor={COLORS.neutralLight}
                      multiline
                      textAlignVertical="top"
                    />
                  </>
                )}
              </ScrollView>
            )}

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setEditTarget(null)}
                disabled={saving}
                style={styles.modalActionButton}
              />
              <Button
                title="Save changes"
                onPress={saveEdit}
                loading={saving}
                disabled={saving}
                style={styles.modalActionButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={creationTarget !== null}
        animationType="slide"
        transparent
        onRequestClose={closeCreationForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalHeadingCopy}>
                <Text style={styles.modalEyebrow}>
                  {creationTarget?.kind === 'module' ? 'COURSE CURRICULUM' : 'MODULE LESSON'}
                </Text>
                <Text style={styles.modalTitle}>
                  {creationTarget?.kind === 'module' ? 'Add module' : 'Add lesson'}
                </Text>
                {creationTarget?.kind === 'lesson' && (
                  <Text style={styles.modalSubtitle} numberOfLines={1}>{creationTarget.moduleTitle}</Text>
                )}
              </View>
              <TouchableOpacity
                onPress={closeCreationForm}
                disabled={creatingContent}
                style={styles.closeButton}
                accessibilityLabel="Close add content dialog"
              >
                <Ionicons name="close" size={20} color={COLORS.neutralDark} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled">
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                value={newTitle}
                onChangeText={setNewTitle}
                style={styles.input}
                placeholder={creationTarget?.kind === 'module' ? 'e.g. Getting started' : 'e.g. Introduction'}
                placeholderTextColor={COLORS.neutralLight}
                maxLength={160}
                autoFocus
              />
              <Text style={styles.inputLabel}>Description (optional)</Text>
              <TextInput
                value={newDescription}
                onChangeText={setNewDescription}
                style={[styles.input, styles.multilineInput]}
                placeholder="Add a short description"
                placeholderTextColor={COLORS.neutralLight}
                multiline
                textAlignVertical="top"
                maxLength={1000}
              />
              {creationTarget?.kind === 'lesson' && (
                <>
                  <Text style={styles.inputLabel}>Lesson content (optional)</Text>
                  <TextInput
                    value={newLessonContent}
                    onChangeText={setNewLessonContent}
                    style={[styles.input, styles.contentInput]}
                    placeholder="Add lesson instructions or notes"
                    placeholderTextColor={COLORS.neutralLight}
                    multiline
                    textAlignVertical="top"
                  />
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={closeCreationForm}
                disabled={creatingContent}
                style={styles.modalActionButton}
              />
              <Button
                title={creationTarget?.kind === 'module' ? 'Add module' : 'Add lesson'}
                onPress={createContent}
                loading={creatingContent}
                disabled={creatingContent}
                style={styles.modalActionButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={materialLesson !== null}
        animationType="slide"
        transparent
        onRequestClose={closeAddMaterial}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalHeadingCopy}>
                <Text style={styles.modalEyebrow}>LESSON MATERIAL</Text>
                <Text style={styles.modalTitle}>Add material</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>{materialLesson?.title}</Text>
              </View>
              <TouchableOpacity
                onPress={closeAddMaterial}
                disabled={addingMaterial}
                style={styles.closeButton}
                accessibilityLabel="Close add material dialog"
              >
                <Ionicons name="close" size={20} color={COLORS.neutralDark} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled">
              <Text style={styles.inputLabel}>Material type</Text>
              <View style={styles.typeOptions}>
                {materialTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeOption, materialType === type && styles.typeOptionActive]}
                    onPress={() => {
                      setMaterialType(type);
                      setMaterialFile(null);
                      if (type === 'EXTERNAL') setMaterialExternalUrl('');
                    }}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={type === 'EXTERNAL' ? 'link-outline' : iconForMaterial[type]}
                      size={14}
                      color={materialType === type ? COLORS.white : COLORS.neutralMedium}
                    />
                    <Text style={[styles.typeOptionText, materialType === type && styles.typeOptionTextActive]}>
                      {type === 'EXTERNAL' ? 'Link' : type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                value={materialTitle}
                onChangeText={setMaterialTitle}
                style={styles.input}
                placeholder="e.g. Lesson slides"
                placeholderTextColor={COLORS.neutralLight}
                maxLength={160}
              />

              {materialType === 'EXTERNAL' ? (
                <>
                  <Text style={styles.inputLabel}>URL</Text>
                  <TextInput
                    value={materialExternalUrl}
                    onChangeText={setMaterialExternalUrl}
                    style={styles.input}
                    placeholder="https://example.com/resource"
                    placeholderTextColor={COLORS.neutralLight}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                </>
              ) : (
                <>
                  <Text style={styles.inputLabel}>File</Text>
                  <TouchableOpacity style={styles.filePicker} onPress={pickMaterialFile} activeOpacity={0.75}>
                    <View style={styles.filePickerIcon}>
                      <Ionicons name={materialFile ? 'document-attach-outline' : 'cloud-upload-outline'} size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.filePickerCopy}>
                      <Text style={styles.filePickerTitle} numberOfLines={1}>
                        {materialFile?.name || 'Choose a file'}
                      </Text>
                      <Text style={styles.filePickerHint}>
                        {materialFile ? 'Tap to choose a different file' : 'PDF, video, image, or slides'}
                      </Text>
                    </View>
                    <Ionicons name="folder-open-outline" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                </>
              )}

              <Text style={styles.inputLabel}>Description (optional)</Text>
              <TextInput
                value={materialDescription}
                onChangeText={setMaterialDescription}
                style={[styles.input, styles.multilineInput]}
                placeholder="Add a note about this material"
                placeholderTextColor={COLORS.neutralLight}
                multiline
                textAlignVertical="top"
                maxLength={1000}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={closeAddMaterial}
                disabled={addingMaterial}
                style={styles.modalActionButton}
              />
              <Button
                title="Add material"
                onPress={addMaterial}
                loading={addingMaterial}
                disabled={addingMaterial}
                style={styles.modalActionButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ActionButtons({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <View style={styles.actionButtons}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={onEdit}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Edit"
      >
        <Ionicons name="create-outline" size={17} color={COLORS.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, styles.deleteAction]}
        onPress={onDelete}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Delete"
      >
        <Ionicons name="trash-outline" size={16} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getMaterialFileName(url: string) {
  const pathname = url.split(/[?#]/, 1)[0] || url;
  return pathname.split('/').filter(Boolean).pop() || url;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgWarm,
    ...Platform.select({
      web: {
        height: '100vh' as any,
        maxHeight: '100vh' as any,
        overflow: 'hidden' as any,
      },
    }),
  },
  scroll: {
    flex: 1,
    minHeight: 0,
    backgroundColor: COLORS.bgWarm,
    ...Platform.select({
      web: {
        overflowY: 'auto' as any,
        WebkitOverflowScrolling: 'touch' as any,
      },
    }),
  },
  content: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 36 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  courseIntro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 24,
    ...SHADOWS.level1,
  },
  courseIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.badgeOrangeBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  courseIntroCopy: { flex: 1 },
  courseEyebrow: { color: COLORS.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  courseTitle: { color: COLORS.neutralDark, fontSize: 18, lineHeight: 24, fontWeight: '700', marginTop: 4 },
  courseDescription: { color: COLORS.neutralMedium, fontSize: 12, lineHeight: 18, marginTop: 5 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  sectionTitle: { color: COLORS.neutralDark, fontSize: 17, fontWeight: '700' },
  sectionSubtitle: { color: COLORS.neutralMedium, fontSize: 12, marginTop: 3 },
  sectionActions: { flexDirection: 'row', alignItems: 'center', columnGap: 8 },
  moduleCount: { flexDirection: 'row', alignItems: 'center', columnGap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: RADIUS.full, backgroundColor: COLORS.badgeOrangeBg },
  moduleCountText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  addButton: { flexDirection: 'row', alignItems: 'center', columnGap: 3, paddingHorizontal: 11, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.primary },
  addButtonText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  moduleCard: { backgroundColor: COLORS.surfaceCard, borderWidth: 1, borderColor: COLORS.borderSubtle, borderRadius: RADIUS.lg, marginBottom: 13, padding: 15, ...SHADOWS.level1 },
  moduleHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  moduleNumber: { width: 38, height: 38, borderRadius: 13, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  moduleNumberText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  moduleCopy: { flex: 1, paddingTop: 1 },
  itemEyebrow: { color: COLORS.primary, fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  moduleTitle: { color: COLORS.neutralDark, fontSize: 15, lineHeight: 20, fontWeight: '700', marginTop: 3 },
  itemDescription: { color: COLORS.neutralMedium, fontSize: 12, lineHeight: 18, marginTop: 4 },
  moduleDivider: { height: 1, backgroundColor: COLORS.borderWarm, marginTop: 14, marginBottom: 4 },
  emptyLesson: { color: COLORS.neutralLight, fontSize: 12, paddingVertical: 11, paddingLeft: 4 },
  addLessonButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', columnGap: 5, paddingVertical: 8, paddingRight: 8, marginTop: 3 },
  lessonCard: { flexDirection: 'row', alignItems: 'flex-start', paddingTop: 12 },
  lessonMarker: { width: 24, height: 24, borderRadius: 9, backgroundColor: COLORS.badgeOrangeBg, alignItems: 'center', justifyContent: 'center', marginRight: 9, marginTop: 1 },
  lessonContent: { flex: 1, minWidth: 0 },
  lessonHeading: { flexDirection: 'row', alignItems: 'center' },
  lessonTitle: { flex: 1, color: COLORS.neutralDark, fontSize: 13, lineHeight: 18, fontWeight: '600', marginRight: 5 },
  lessonBody: { color: COLORS.neutralMedium, fontSize: 12, lineHeight: 18, marginTop: 6 },
  actionButtons: { flexDirection: 'row', alignItems: 'center', columnGap: 5 },
  actionButton: { width: 30, height: 30, borderRadius: 10, backgroundColor: COLORS.badgeOrangeBg, alignItems: 'center', justifyContent: 'center' },
  deleteAction: { backgroundColor: COLORS.errorBg },
  materialList: { borderTopWidth: 1, borderTopColor: COLORS.borderWarm, marginTop: 11, paddingTop: 2 },
  materialRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 9 },
  materialIcon: { width: 29, height: 29, borderRadius: 10, backgroundColor: COLORS.surfaceMuted, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  materialCopy: { flex: 1, minWidth: 0, marginRight: 5 },
  materialTitle: { color: COLORS.neutralDark, fontSize: 12, fontWeight: '600' },
  materialMeta: { color: COLORS.primary, fontSize: 9, fontWeight: '700', letterSpacing: 0.4, marginTop: 2 },
  openMaterial: { flexDirection: 'row', alignItems: 'center', columnGap: 4, alignSelf: 'flex-start', maxWidth: '100%', marginTop: 4 },
  openMaterialText: { color: COLORS.primary, fontSize: 10, flexShrink: 1 },
  materialDescription: { color: COLORS.neutralMedium, fontSize: 11, lineHeight: 15, marginTop: 3 },
  emptyCard: { alignItems: 'center', backgroundColor: COLORS.surfaceCard, borderWidth: 1, borderColor: COLORS.borderSubtle, borderRadius: RADIUS.lg, padding: 24, ...SHADOWS.level1 },
  emptyIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: COLORS.badgeOrangeBg, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: COLORS.neutralDark, fontSize: 16, fontWeight: '700', marginTop: 11 },
  muted: { color: COLORS.neutralMedium, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  emptyAction: { flexDirection: 'row', alignItems: 'center', columnGap: 6, marginTop: 15, paddingVertical: 8 },
  emptyActionText: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
  error: { color: COLORS.error, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(43,33,30,0.48)' },
  modalCard: { maxHeight: '90%', backgroundColor: COLORS.bgWarm, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 24 },
  modalHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: COLORS.borderSubtle, alignSelf: 'center', marginTop: 10, marginBottom: 17 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalHeadingCopy: { flex: 1 },
  modalEyebrow: { color: COLORS.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  modalTitle: { color: COLORS.neutralDark, fontSize: 19, fontWeight: '700', marginTop: 3 },
  modalSubtitle: { color: COLORS.neutralMedium, fontSize: 12, marginTop: 3 },
  closeButton: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  formScroll: { flexShrink: 1 },
  inputLabel: { color: COLORS.neutralDark, fontSize: 12, fontWeight: '700', marginBottom: 7, marginTop: 4 },
  input: { minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderSubtle, backgroundColor: COLORS.surfaceCard, paddingHorizontal: 12, paddingVertical: 10, color: COLORS.neutralDark, fontSize: 14, marginBottom: 14 },
  multilineInput: { minHeight: 82 },
  contentInput: { minHeight: 140 },
  addMaterialButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', columnGap: 5, paddingVertical: 7, paddingRight: 8, marginTop: 5 },
  addMaterialText: { color: COLORS.primary, fontSize: 11, fontWeight: '700' },
  typeOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 14 },
  typeOption: { flexDirection: 'row', alignItems: 'center', columnGap: 5, paddingHorizontal: 10, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.borderSubtle, backgroundColor: COLORS.surfaceCard },
  typeOptionActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  typeOptionText: { color: COLORS.neutralMedium, fontSize: 10, fontWeight: '700' },
  typeOptionTextActive: { color: COLORS.white },
  filePicker: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.primary, borderRadius: 13, backgroundColor: COLORS.badgeOrangeBg, padding: 12, marginBottom: 14 },
  filePickerIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.surfaceCard, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  filePickerCopy: { flex: 1, marginRight: 8 },
  filePickerTitle: { color: COLORS.neutralDark, fontSize: 12, fontWeight: '700' },
  filePickerHint: { color: COLORS.neutralMedium, fontSize: 10, marginTop: 3 },
  modalActions: { flexDirection: 'row', columnGap: 10, paddingTop: 8 },
  modalActionButton: { flex: 1 },
});
