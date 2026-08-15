import React from 'react';
import { StyleSheet, Text, View, FlatList, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';

const ENROLLED_COURSES = [
  {
    id: 'c1',
    title: 'React Native & Mobile App Development',
    category: 'Software Engineering',
    completedLessons: 16,
    totalLessons: 20,
    progressPercentage: 80,
  },
  {
    id: 'c2',
    title: 'Fullstack Web Development with Node.js & PostgreSQL',
    category: 'Web Development',
    completedLessons: 5,
    totalLessons: 15,
    progressPercentage: 33,
  },
];

export default function MyLearningScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#4F46E5" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          <Text style={styles.backBtnText}>← Back to Browse</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Learning Dashboard 📊</Text>
      </View>

      {/* Course List */}
      <FlatList
        data={ENROLLED_COURSES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.categoryBadge}>{item.category}</Text>
            <Text style={styles.courseTitle}>{item.title}</Text>

            {/* Progress Stats */}
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>
                {item.completedLessons} / {item.totalLessons} lessons completed
              </Text>
              <Text style={styles.percentText}>{item.progressPercentage}%</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${item.progressPercentage}%` }]} />
            </View>

            <TouchableOpacity style={styles.continueBtn}>
              <Text style={styles.continueBtnText}>Continue Learning →</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 20, backgroundColor: '#4F46E5' },
  backBtn: { marginBottom: 8 },
  backBtnText: { color: '#EEF2FF', fontSize: 13, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  listContainer: { padding: 16, gap: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0E7FF',
    color: '#3730A3',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  courseTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressText: { fontSize: 12, color: '#6B7280' },
  percentText: { fontSize: 13, fontWeight: 'bold', color: '#4F46E5' },
  progressBarBackground: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden', marginBottom: 16 },
  progressBarFill: { height: '100%', backgroundColor: '#4F46E5', borderRadius: 4 },
  continueBtn: { backgroundColor: '#F3F4F6', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  continueBtnText: { color: '#4F46E5', fontSize: 13, fontWeight: '700' },
});
