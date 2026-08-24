import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { fetchLessonContent, completeLesson } from '../../api/learner.service';
import { Header } from '../../components/common/Header';

export default function LessonPlayerScreen({ route, navigation }: any) {
  const courseId = route.params?.courseId;
  const lessonId = route.params?.lessonId;
  const initialTitle = route.params?.lessonTitle || 'React Native Development';

  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [completedMaterials, setCompletedMaterials] = useState<string[]>([]);
  const [activeMaterial, setActiveMaterial] = useState<any>(null);

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'VIDEO': return '🎥';
      case 'PDF': return '📄';
      case 'SLIDE': return '📊';
      case 'EXTERNAL': return '🔗';
      case 'IMAGE': return '🖼️';
      default: return '📄';
    }
  };

  const getMaterialSub = (item: any) => {
    if (item.sub) return item.sub;
    const parts = [];
    if (item.type) parts.push(item.type);
    if (item.fileSize) {
      const mb = (item.fileSize / (1024 * 1024)).toFixed(1);
      parts.push(`${mb}MB`);
    } else if (item.duration) {
      parts.push(`${item.duration}m`);
    }
    return parts.join(' • ') || 'Resource';
  };

  const handleOpenMaterial = (item: any) => {
    setActiveMaterial(item);
  };

  const handleDownloadMaterial = (url: string, filename?: string) => {
    if (!url) return;
    let targetUrl = url;
    if (url.includes('dummy.pdf') || url.includes('example.com')) {
      targetUrl = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      targetUrl = `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
    }

    if (Platform.OS === 'web') {
      try {
        const link = document.createElement('a');
        link.href = targetUrl;
        link.download = filename || 'material.pdf';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        window.open(targetUrl, '_blank');
      }
    } else {
      Linking.openURL(targetUrl).catch(() => {
        Alert.alert('Error', 'Could not open or download document');
      });
    }
  };

  const renderActiveMaterial = () => {
    const defaultMaterial = videoMaterial || materials[0];
    const selected = activeMaterial || defaultMaterial;

    if (!selected) {
      return (
        <View style={[styles.videoPlayerBox, { backgroundColor: '#1E293B' }]}>
          <Text style={{ color: '#94A3B8', fontSize: 14, textAlign: 'center', paddingHorizontal: 20 }}>
            Select a learning resource below to view it here.
          </Text>
        </View>
      );
    }

    const url = selected.fileUrl || selected.externalUrl;
    if (!url) {
      return (
        <View style={[styles.videoPlayerBox, { backgroundColor: '#1E293B' }]}>
          <Text style={{ color: '#EF4444', fontSize: 13 }}>No viewable URL for: {selected.title}</Text>
        </View>
      );
    }

    let targetUrl = url;
    if (url.includes('dummy.pdf') || url.includes('example.com')) {
      targetUrl = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      targetUrl = `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
    }

    const isVideo = selected.type === 'VIDEO' || selected.icon === '🎥' || targetUrl.endsWith('.mp4') || targetUrl.endsWith('.webm') || targetUrl.endsWith('.ogg');
    const isPdf = selected.type === 'PDF' || selected.icon === '📄' || targetUrl.toLowerCase().includes('.pdf') || (selected.title && selected.title.toLowerCase().endsWith('.pdf'));

    if (Platform.OS === 'web') {
      if (isVideo) {
        return (
          <View style={styles.webFrameContainer}>
            <video
              src={targetUrl}
              controls
              style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#000' }}
            />
          </View>
        );
      } else {
        const embedUrl = isPdf && targetUrl.startsWith('http')
          ? `https://docs.google.com/viewer?url=${encodeURIComponent(targetUrl)}&embedded=true`
          : targetUrl;

        return (
          <View style={styles.webFrameContainer}>
            <iframe
              src={embedUrl}
              style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#FFFFFF' }}
              title={selected.title}
            />
            {isPdf && (
              <TouchableOpacity
                style={styles.openPdfBanner}
                onPress={() => handleDownloadMaterial(targetUrl, selected.title)}
              >
                <Text style={styles.openPdfBannerText}>📥 Download / Open PDF ↗</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      }
    }

    return (
      <TouchableOpacity
        style={styles.videoPlayerBox}
        onPress={() => {
          Linking.openURL(targetUrl).catch(() => {
            Alert.alert('Error', 'Could not open learning link');
          });
        }}
      >
        <Text style={{ color: '#F1F5F9', fontSize: 32, marginBottom: 8 }}>
          {selected.icon || getMaterialIcon(selected.type)}
        </Text>
        <Text style={{ color: '#F1F5F9', fontSize: 14, fontWeight: '700', textAlign: 'center', paddingHorizontal: 16 }} numberOfLines={2}>
          Open: {selected.title}
        </Text>
        <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 4 }}>
          (Tapping opens document in external browser)
        </Text>
      </TouchableOpacity>
    );
  };

  const loadLesson = async () => {
    if (!lessonId) return;
    try {
      setLoading(true);
      const res = await fetchLessonContent(lessonId);
      if (res?.lesson) {
        setLesson(res.lesson);
      }
    } catch (err) {
      console.log('Error fetching lesson content, using fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  const toggleMaterialCheck = (matId: string) => {
    setCompletedMaterials((prev) =>
      prev.includes(matId) ? prev.filter((id) => id !== matId) : [...prev, matId]
    );
  };

  const handleMarkComplete = async () => {
    try {
      setCompleting(true);
      const res = await completeLesson(courseId, lessonId);
      setCompleted(true);
      const pct = res.progress?.progressPercentage ?? res.progressPercentage ?? 80;
      Toast.show({ type: 'success', text1: 'Lesson Completed! 🎉', text2: `Course progress: ${pct}%` });
      // Navigate back to CourseDetail so progress reloads and ticks update
      setTimeout(() => {
        if (courseId) {
          navigation?.navigate('CourseDetail', { courseId });
        } else {
          navigation?.goBack();
        }
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Could not mark lesson complete';
      Toast.show({ type: 'error', text1: 'Notice', text2: msg });
    } finally {
      setCompleting(false);
    }
  };

  const currentLesson = lesson || {
    title: 'Lesson 5: State Management',
    moduleTitle: 'Module 2: Core Concepts',
    description: 'Learn how to manage application state using React hooks and context API.',
    resources: [
      { id: 'r1', title: 'Lesson Video', sub: 'MP4 • 24MB', icon: '🎥' },
      { id: 'r2', title: 'State Management Guide.pdf', sub: 'PDF • 2.4MB', icon: '📄' },
      { id: 'r3', title: 'Lecture Slides', sub: 'PPTX • 4.1MB', icon: '📊' },
      { id: 'r4', title: 'React Docs — State', sub: 'Link', icon: '🔗' },
    ],
  };

  const materials = currentLesson.materials || currentLesson.resources || [];
  const videoMaterials = materials.filter((m: any) => m.type === 'VIDEO' || m.icon === '🎥');
  const videoMaterial = videoMaterials[0];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />

      <Header
        title={initialTitle}
        showBack={true}
        onBackPress={() => navigation?.goBack()}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#064E3B" />
          <Text style={styles.loadingText}>Loading lesson content...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContent} contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}>
          {/* Main Video Player Screen Container / Resource Frame */}
          {renderActiveMaterial()}

          {/* Lesson Headings & Description */}
          <View style={styles.bodyContent}>
            <Text style={styles.moduleSubhead}>{currentLesson.moduleTitle || 'Module 2: Core Concepts'}</Text>
            <Text style={styles.lessonTitle}>{currentLesson.title || 'Lesson 5: State Management'}</Text>
            <Text style={styles.descriptionText}>
              {currentLesson.description ||
                'Learn how to manage application state using React hooks and context API.'}
            </Text>

            {/* Resources Section */}
            <Text style={styles.sectionHeading}>Resources</Text>
            {materials.map((res: any, idx: number) => {
              const resId = res.id || `r_${idx}`;
              const isChecked = completedMaterials.includes(resId);
              const icon = res.icon || getMaterialIcon(res.type);
              const subText = getMaterialSub(res);

              return (
                <TouchableOpacity
                  key={resId}
                  style={[styles.resourceCard, isChecked && styles.resourceCardChecked]}
                  onPress={() => handleOpenMaterial(res)}
                >
                  <Text style={styles.resourceIcon}>{icon}</Text>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.resourceTitle, isChecked && styles.resourceTitleChecked]}>
                      {res.title}
                    </Text>
                    <Text style={styles.resourceSub}>{subText}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      const fileUrl = res.fileUrl || res.externalUrl;
                      handleDownloadMaterial(fileUrl, res.title);
                      toggleMaterialCheck(resId);
                    }}
                    style={{ padding: 6 }}
                  >
                    <Text style={styles.downloadIcon}>{isChecked ? '☑️' : '📥'}</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Footer Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.prevBtn} onPress={() => navigation?.goBack()}>
          <Text style={styles.prevBtnText}>Previous</Text>
        </TouchableOpacity>

        {completing ? (
          <ActivityIndicator color="#064E3B" />
        ) : completed ? (
          <View style={styles.completedTag}>
            <Text style={styles.completedTagText}>Completed ✓</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.completeBtn} onPress={handleMarkComplete}>
            <Text style={styles.completeBtnText}>Mark as Complete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  circleBtnText: { fontSize: 16, color: '#0F172A' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#64748B' },
  scrollContent: { flex: 1, flexGrow: 1 },
  videoPlayerBox: {
    height: 220,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: { fontSize: 22, color: '#064E3B', marginLeft: 4 },
  bodyContent: { paddingHorizontal: 20, paddingTop: 16 },
  moduleSubhead: { fontSize: 13, fontWeight: '600', color: '#166534', marginBottom: 4 },
  lessonTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  descriptionText: { fontSize: 14, color: '#475569', lineHeight: 22, marginBottom: 20 },
  sectionHeading: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 10,
  },
  resourceCardChecked: { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
  resourceIcon: { fontSize: 24 },
  resourceTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  resourceTitleChecked: { textDecorationLine: 'line-through', color: '#15803D' },
  resourceSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  downloadIcon: { fontSize: 18, color: '#64748B' },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  prevBtn: { paddingVertical: 12, paddingHorizontal: 16 },
  prevBtnText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  completeBtn: { backgroundColor: '#064E3B', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 14 },
  completeBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  completedTag: { backgroundColor: '#DCFCE7', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 14 },
  completedTagText: { color: '#15803D', fontSize: 14, fontWeight: '700' },
  webFrameContainer: {
    height: 480,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  openPdfBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#064E3B',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openPdfBannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
