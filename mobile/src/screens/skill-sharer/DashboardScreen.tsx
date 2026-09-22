import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { courseApi } from '../../api/skill-sharer.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Course { id: string; title: string; description: string; status: string; difficulty: string; createdAt: string; }

export const DashboardScreen = ({ navigation }: any) => {
  const [userName, setUserName] = useState('User');
  const [verifiedBadge, setVerifiedBadge] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadUserData(); loadCourses(); }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) { const user = JSON.parse(userData); setUserName(user.name || 'User'); setVerifiedBadge(Boolean(user.verifiedBadge)); }
    } catch (error) { console.error('Error loading user data:', error); }
  };

  const loadCourses = async () => {
    try {
      const response = await courseApi.getMyCourses();
      if (response && response.success && Array.isArray(response.data)) setCourses(response.data);
      else if (Array.isArray(response)) setCourses(response);
      else if (response && Array.isArray((response as any).data?.data)) setCourses((response as any).data.data);
      else setCourses([]);
    } catch (error) { console.error('Error loading courses:', error); setCourses([]); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const go = (screen: string, params?: object) => navigation.navigate(screen, params);

  const handleSignOut = async () => {
    await AsyncStorage.multiRemove(['token', 'user', 'skill_sharer_profile']);
    const rootNavigation = navigation.getParent?.() || navigation;
    rootNavigation.reset({
      index: 0,
      routes: [{ name: 'Auth', state: { routes: [{ name: 'Login' }] } }],
    });
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color="#B3310D" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadCourses(); }} tintColor="#B3310D" />}>
      <View style={styles.topBar}><View><Text style={styles.eyebrow}>CREATOR STUDIO  ✧</Text><Text style={styles.pageTitle}>Dashboard</Text></View><View style={styles.topActions}><TouchableOpacity style={styles.bell} onPress={() => go('Assignments')}><Ionicons name="notifications-outline" size={22} color="#2A1712" /><View style={styles.dot} /></TouchableOpacity><TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} accessibilityLabel="Sign out"><Ionicons name="log-out-outline" size={21} color="#B3310D" /></TouchableOpacity><TouchableOpacity style={styles.avatar} onPress={() => go('Profile')}><Ionicons name="person-outline" size={21} color="#FFFFFF" /></TouchableOpacity></View></View>
      <View style={styles.welcomeCard}><View style={styles.welcomeAvatar}><Ionicons name="leaf-outline" size={24} color="#FFFFFF" /></View><View style={styles.welcomeCopy}><Text style={styles.welcome}>Welcome back,</Text><Text style={styles.userName} numberOfLines={1}>{userName}</Text></View><View style={styles.verified}><Ionicons name={verifiedBadge ? 'checkmark-circle' : 'time-outline'} size={15} color="#B3310D" /><Text style={styles.verifiedText}>{verifiedBadge ? 'Verified' : 'Pending'}</Text></View><View style={styles.active}><Ionicons name="flame-outline" size={14} color="#8A5600" /><Text style={styles.activeText}>7-Day Active</Text></View></View>
      <View style={styles.stats}><Stat value={courses.length} label="Total Courses" /><Stat value={courses.filter((c) => c.status === 'PUBLISHED').length} label="Published" color="#8A5600" /><Stat value={courses.filter((c) => c.status === 'DRAFT').length} label="Drafts" /></View>
      <View style={styles.section}><View style={styles.heading}><Text style={styles.title}>Quick Actions</Text><Text style={styles.meta}>8 Studio Tools</Text></View><View style={styles.grid}><Action label="Create Course" detail="New micro-module" icon="add-circle-outline" tone="primary" onPress={() => go('CourseCreator')} /><Action label="Recommend" detail="Featured spotlight" icon="trophy-outline" tone="gold" onPress={() => go('Recommendations')} /><Action label="Certificates" detail="Track issued" icon="ribbon-outline" onPress={() => go('CompletionRequests')} /><Action label="My Courses" detail="Manage tracks" icon="book-outline" onPress={() => go('MyCourses')} /><Action label="Assessments" detail="Active tests" icon="clipboard-outline" onPress={() => go('Assessments')} /><Action label="Assignments" detail="Needs review" icon="document-text-outline" onPress={() => go('Assignments')} /><Action label="Qualifications" detail="Keep verified" icon="medal-outline" onPress={() => go('Qualifications')} /><Action label="Profile" detail="Public studio" icon="person-outline" onPress={() => go('Profile')} /></View></View>
      <View style={styles.section}><View style={styles.heading}><Text style={styles.title}>Recent Courses <Text style={styles.count}>{courses.length}</Text></Text><TouchableOpacity onPress={() => go('MyCourses')}><Text style={styles.viewAll}>View All  →</Text></TouchableOpacity></View>{courses.length ? courses.slice(0, 5).map((course) => <TouchableOpacity key={course.id} style={styles.course} onPress={() => go('CourseDetail', { courseId: course.id })}><View style={styles.courseHead}><Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text><View style={styles.badge}><Text style={styles.badgeText}>{course.status}</Text></View></View><Text style={styles.description} numberOfLines={2}>{course.description}</Text><View style={styles.courseFoot}><View style={styles.badge}><Text style={styles.badgeText}>{course.difficulty}</Text></View><Text style={styles.date}>{new Date(course.createdAt).toLocaleDateString()}</Text></View></TouchableOpacity>) : <View style={styles.empty}><Ionicons name="book-outline" size={35} color="#D7A59A" /><Text style={styles.emptyTitle}>No courses yet</Text><Text style={styles.emptyText}>Create your first course and start sharing your knowledge.</Text></View>}</View>
      <View style={styles.tip}><Ionicons name="bulb-outline" size={25} color="#B3310D" /><View><Text style={styles.tipTitle}>Skill Sharer Tip</Text><Text style={styles.tipText}>Adding bite-sized quiz cards boosts engagement.</Text></View></View>
    </ScrollView>
  );
};

function Stat({ value, label, color = '#B3310D' }: { value: number; label: string; color?: string }) { return <View style={styles.stat}><Text style={[styles.statValue, { color }]}>{value}</Text><Text style={styles.statLabel}>{label}</Text><View style={[styles.line, { backgroundColor: color }]} /></View>; }
function Action({ label, detail, icon, tone, onPress }: { label: string; detail: string; icon: any; tone?: string; onPress: () => void }) { const special = tone === 'primary' || tone === 'gold'; return <TouchableOpacity style={[styles.action, tone === 'primary' && styles.primary, tone === 'gold' && styles.gold]} onPress={onPress}><View style={[styles.actionIcon, tone === 'primary' && styles.primaryIcon, tone === 'gold' && styles.goldIcon]}><Ionicons name={icon} size={22} color={tone === 'primary' ? '#FFFFFF' : tone === 'gold' ? '#8A5600' : '#B3310D'} /></View><View style={styles.actionCopy}><Text style={[styles.actionLabel, special && styles.white]}>{label}</Text><Text style={[styles.actionDetail, special && styles.white]}>{detail}</Text></View></TouchableOpacity>; }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F7' }, content: { flexGrow: 1, paddingHorizontal: 19, paddingTop: 10, paddingBottom: 30 }, loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF9F7' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16 }, eyebrow: { color: '#5D2B1E', fontSize: 12, fontWeight: '700', letterSpacing: 1.1 }, pageTitle: { color: '#1D1412', fontSize: 25, fontWeight: '700', marginTop: 2 }, topActions: { flexDirection: 'row', alignItems: 'center', gap: 14 }, bell: { padding: 5, position: 'relative' }, dot: { position: 'absolute', right: 2, top: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#B3310D' }, signOutButton: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: '#F1C6B9', backgroundColor: '#FFF0EC', justifyContent: 'center', alignItems: 'center' }, avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#B3310D', justifyContent: 'center', alignItems: 'center' },
  welcomeCard: { backgroundColor: '#FFFFFF', borderRadius: 17, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 18, shadowColor: '#8B3F2B', shadowOpacity: 0.05, shadowRadius: 12, elevation: 1 }, welcomeAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#D79D68', justifyContent: 'center', alignItems: 'center' }, welcomeCopy: { flex: 1, marginLeft: 12 }, welcome: { fontSize: 15, color: '#553B35' }, userName: { fontSize: 20, fontWeight: '700', color: '#1D1412', marginTop: 2 }, verified: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0EC', borderRadius: 16, paddingHorizontal: 9, paddingVertical: 6, marginRight: 5 }, verifiedText: { color: '#B3310D', fontSize: 11, fontWeight: '700', marginLeft: 4 }, active: { position: 'absolute', right: 14, bottom: -12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFEAC9', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 }, activeText: { color: '#754A00', fontSize: 11, fontWeight: '600', marginLeft: 4 },
  stats: { flexDirection: 'row', gap: 8, marginBottom: 27 }, stat: { flex: 1, minHeight: 104, borderRadius: 16, backgroundColor: '#FFF0EC', justifyContent: 'center', alignItems: 'center' }, statValue: { fontSize: 34, lineHeight: 38, fontWeight: '700' }, statLabel: { color: '#4C3934', fontSize: 13, marginTop: 4 }, line: { width: 20, height: 2, opacity: 0.3, marginTop: 9 },
  section: { marginBottom: 16 }, heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 }, title: { color: '#1D1412', fontSize: 23, fontWeight: '700' }, meta: { color: '#5A4038', fontSize: 13 }, count: { color: '#B3310D', fontSize: 13 }, viewAll: { color: '#B3310D', fontWeight: '600', fontSize: 13 }, grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 9 }, action: { width: '48.5%', minHeight: 70, borderRadius: 15, backgroundColor: '#FFFFFF', padding: 11, flexDirection: 'row', alignItems: 'center', shadowColor: '#6E3828', shadowOpacity: 0.04, shadowRadius: 5, elevation: 1 }, primary: { backgroundColor: '#B3310D' }, gold: { backgroundColor: '#FFDDA3' }, actionIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF0EC', justifyContent: 'center', alignItems: 'center' }, primaryIcon: { backgroundColor: 'rgba(255,255,255,0.2)' }, goldIcon: { backgroundColor: 'rgba(255,255,255,0.38)' }, actionCopy: { flex: 1, marginLeft: 9 }, actionLabel: { color: '#211713', fontSize: 15, fontWeight: '700' }, actionDetail: { color: '#4E3932', fontSize: 12, marginTop: 2 }, white: { color: '#FFFFFF' },
  course: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 19, marginBottom: 12, shadowColor: '#6E3828', shadowOpacity: 0.06, shadowRadius: 8, elevation: 1 }, courseHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }, courseTitle: { flex: 1, color: '#1D1412', fontSize: 18, fontWeight: '700', marginRight: 8 }, badge: { backgroundColor: '#FFE5DE', borderRadius: 14, paddingHorizontal: 9, paddingVertical: 5 }, badgeText: { color: '#B3310D', fontSize: 10, fontWeight: '700' }, description: { color: '#60443B', fontSize: 14, lineHeight: 20, marginBottom: 13 }, courseFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F8E8E3' }, date: { color: '#60443B', fontSize: 12 }, empty: { backgroundColor: '#FFFFFF', alignItems: 'center', padding: 25, borderRadius: 16 }, emptyTitle: { color: '#1D1412', fontSize: 18, fontWeight: '700', marginTop: 8 }, emptyText: { color: '#60443B', textAlign: 'center', marginTop: 5 }, tip: { backgroundColor: '#FFE6DF', borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', marginTop: 4 }, tipTitle: { color: '#211713', fontSize: 15, fontWeight: '700', marginLeft: 14 }, tipText: { color: '#60443B', fontSize: 12, marginLeft: 14, marginTop: 3 },
});
