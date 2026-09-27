import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Course, CreateCourseInput } from '../../types';

interface CourseFormProps { onSubmit: (data: CreateCourseInput) => void; loading?: boolean; categories?: { id: string; name: string }[]; initialCourse?: Partial<Course>; submitLabel?: string; }

export const CourseForm: React.FC<CourseFormProps> = ({ onSubmit, loading = false, categories = [], initialCourse, submitLabel = 'Create Course Draft  →' }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState('BEGINNER');
  const [duration, setDuration] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [language, setLanguage] = useState('English');
  const [prerequisites, setPrerequisites] = useState('');
  const [learningOutcomes, setLearningOutcomes] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const difficulties = [{ label: 'Beginner', value: 'BEGINNER' }, { label: 'Intermediate', value: 'INTERMEDIATE' }, { label: 'Advanced', value: 'ADVANCED' }];

  React.useEffect(() => {
    if (!initialCourse) return;
    setTitle(initialCourse.title || '');
    setDescription(initialCourse.description || '');
    setCategoryId(initialCourse.categoryId || '');
    setDifficulty(initialCourse.difficulty || 'BEGINNER');
    setDuration(initialCourse.duration || '');
    setEstimatedHours(initialCourse.estimatedHours?.toString() || '');
    setLanguage(initialCourse.language || 'English');
    setPrerequisites(initialCourse.prerequisites || '');
    setLearningOutcomes(Array.isArray(initialCourse.learningOutcomes) ? initialCourse.learningOutcomes.join('\n') : '');
  }, [initialCourse]);

  const handleSubmit = () => {
    const parsedEstimatedHours = estimatedHours.trim() !== '' ? parseInt(estimatedHours, 10) : undefined;
    const data: CreateCourseInput = { title, description, categoryId, difficulty: difficulty as CreateCourseInput['difficulty'], duration, language, prerequisites, learningOutcomes: learningOutcomes.split('\n').map((outcome) => outcome.trim()).filter(Boolean), ...(parsedEstimatedHours !== undefined ? { estimatedHours: parsedEstimatedHours } : {}) };
    onSubmit(data);
  };

  return <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
    <View style={styles.tipCard}><View style={styles.tipIcon}><Ionicons name="bulb-outline" size={20} color="#B3310D" /></View><View style={styles.tipCopy}><View style={styles.tipHeading}><Text style={styles.tipTitle}>MICROLEARNING PRO-TIP</Text><Text style={styles.recommended}>Recommended</Text></View><Text style={styles.tipText}>Keep modules bite-sized. Courses with 5-15 minute lessons achieve a 3.4x higher completion rate!</Text></View></View>
    <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>Course Information</Text><Text style={styles.sectionSubtitle}>Provide basic details to publish your course</Text></View><View style={styles.basicsPill}><Text style={styles.basicsText}>Basics</Text></View></View>
    <View style={styles.fieldCard}><Input label="Course Title" placeholder="e.g., React Native Development Masterclass" value={title} onChangeText={setTitle} required /></View>
    <View style={styles.fieldCard}><Input label="Description" placeholder="Describe what learners will learn in real-world scenarios..." value={description} onChangeText={setDescription} multiline numberOfLines={4} style={styles.textArea} required /></View>
    <View style={styles.fieldCard}><Text style={styles.label}>Category *</Text><TouchableOpacity style={styles.pickerButton} onPress={() => setShowCategoryPicker(!showCategoryPicker)}><Text style={categoryId ? styles.pickerText : styles.pickerPlaceholder}>{categoryId ? categories.find((category) => category.id === categoryId)?.name || 'Select category' : 'Select category'}</Text><Ionicons name="chevron-down-outline" size={18} color="#3B2924" /></TouchableOpacity>{showCategoryPicker && <View style={styles.pickerDropdown}>{categories.map((category) => <TouchableOpacity key={category.id} style={styles.pickerItem} onPress={() => { setCategoryId(category.id); setShowCategoryPicker(false); }}><Text style={styles.pickerItemText}>{category.name}</Text></TouchableOpacity>)}</View>}</View>
    <View style={styles.fieldCard}><Text style={styles.label}>Target Difficulty Level</Text><View style={styles.difficultyContainer}>{difficulties.map((item) => <TouchableOpacity key={item.value} style={[styles.difficultyButton, difficulty === item.value && styles.difficultyButtonActive]} onPress={() => setDifficulty(item.value)}><Text style={[styles.difficultyButtonText, difficulty === item.value && styles.difficultyButtonTextActive]}>{item.label}</Text></TouchableOpacity>)}</View></View>
    <View style={styles.fieldCard}><Input label="Duration" placeholder="e.g. 4 weeks" value={duration} onChangeText={setDuration} /></View>
    <View style={styles.fieldCard}><Input label="Estimated Hours" placeholder="e.g. 12 hours" value={estimatedHours} onChangeText={setEstimatedHours} keyboardType="numeric" /></View>
    <View style={styles.fieldCard}><Input label="Primary Language" placeholder="Course language" value={language} onChangeText={setLanguage} /></View>
    <View style={styles.fieldCard}><Input label="Prerequisites" placeholder="e.g., Basic JavaScript & HTML knowledge" value={prerequisites} onChangeText={setPrerequisites} multiline numberOfLines={2} /></View>
    <View style={styles.fieldCard}><Input label="Learning Outcomes" placeholder="Enter each outcome on a new line" value={learningOutcomes} onChangeText={setLearningOutcomes} multiline numberOfLines={4} style={styles.textArea} /></View>
    <Button title={submitLabel} onPress={handleSubmit} loading={loading} style={styles.submitButton} />
  </ScrollView>;
};

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: '#FFF9F7' }, contentContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40, backgroundColor: '#FFF9F7' },
  tipCard: { flexDirection: 'row', backgroundColor: '#FFF5E8', borderColor: '#F4C98E', borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 27 }, tipIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFE5BD', alignItems: 'center', justifyContent: 'center' }, tipCopy: { flex: 1, marginLeft: 11 }, tipHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 }, tipTitle: { color: '#B3310D', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 }, recommended: { color: '#4C2C1F', backgroundColor: '#FFE5BD', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3, fontSize: 10, fontWeight: '600' }, tipText: { color: '#684A3E', fontSize: 12, lineHeight: 19, marginTop: 3 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1D1412' }, sectionSubtitle: { color: '#8A6B61', fontSize: 12, marginTop: 3 }, basicsPill: { borderWidth: 1, borderColor: '#EEC5B9', borderRadius: 16, paddingHorizontal: 11, paddingVertical: 6 }, basicsText: { color: '#B3310D', fontSize: 11, fontWeight: '600' },
  fieldCard: { backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 16, paddingTop: 15, paddingBottom: 1, marginBottom: 16, shadowColor: '#7D4938', shadowOpacity: 0.05, shadowRadius: 7, elevation: 1 }, label: { fontSize: 13, fontWeight: '600', color: '#40261F', marginBottom: 7 }, textArea: { height: 100, textAlignVertical: 'top' }, pickerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E8D2CC', borderRadius: 12, paddingVertical: 13, paddingHorizontal: 12, backgroundColor: '#FFFCFB' }, pickerText: { fontSize: 15, color: '#1D1412' }, pickerPlaceholder: { fontSize: 15, color: '#B9A29B' }, pickerDropdown: { borderWidth: 1, borderColor: '#E8D2CC', borderRadius: 12, backgroundColor: '#FFFFFF', marginTop: 5, maxHeight: 150 }, pickerItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F8E8E3' }, pickerItemText: { fontSize: 15, color: '#1D1412' }, difficultyContainer: { flexDirection: 'row', gap: 6, borderWidth: 1, borderColor: '#E8D2CC', borderRadius: 12, padding: 4, marginBottom: 14 }, difficultyButton: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center' }, difficultyButtonActive: { backgroundColor: '#B3310D' }, difficultyButtonText: { fontSize: 12, color: '#684A3E' }, difficultyButtonTextActive: { color: '#FFFFFF', fontWeight: '700' }, submitButton: { marginTop: 2, marginBottom: 12, backgroundColor: '#B3310D', borderRadius: 12, minHeight: 50 },
});
