import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { courseApi, certificateApi } from '../../api/skill-sharer.service';

export const CompletionRequestsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadRequests(selectedCourse);
    } else {
      setRequests([]);
    }
  }, [selectedCourse]);

  const loadCourses = async () => {
    try {
      const res: any = await courseApi.getMyCourses();
      let myCourses = [];
      if (res && res.success && Array.isArray(res.data)) {
        myCourses = res.data;
      } else if (res && res.data && res.data.success && Array.isArray(res.data.data)) {
        myCourses = res.data.data;
      } else if (Array.isArray(res)) {
        myCourses = res;
      } else if (res && Array.isArray(res.data)) {
        myCourses = res.data;
      }

      setCourses(myCourses);
      if (myCourses && myCourses.length > 0) {
        setSelectedCourse(myCourses[0]?.id || '');
      }
    } catch (err) {
      console.log('Error loading courses:', err);
    }
  };

  const loadRequests = async (courseId: string) => {
    setLoading(true);
    try {
      const res: any = await certificateApi.getCourseCompletionRequests(courseId);
      const data = res?.data || res;
      if (data && (data.success || data.requests)) {
        setRequests(data.requests || []);
      } else if (Array.isArray(data)) {
        setRequests(data);
      }
    } catch (err) {
      console.log('Error loading requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const res: any = await certificateApi.approveCompletionRequest(requestId);
      const data = res?.data || res;
      if (data && data.success) {
        Toast.show({ type: 'success', text1: 'Success', text2: 'Completion request approved and certificate issued.' });
        if (selectedCourse) loadRequests(selectedCourse);
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.response?.data?.error || err.message || 'Failed to approve' });
    }
  };

  const handleReject = async (requestId: string) => {
    if (!rejectReason.trim()) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter a reason for rejection.' });
      return;
    }
    try {
      const res: any = await certificateApi.rejectCompletionRequest(requestId, rejectReason);
      const data = res?.data || res;
      if (data && data.success) {
        Toast.show({ type: 'success', text1: 'Rejected', text2: 'Completion request rejected successfully.' });
        setRejectingId(null);
        setRejectReason('');
        if (selectedCourse) loadRequests(selectedCourse);
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.response?.data?.error || err.message || 'Failed to reject' });
    }
  };

  const renderRequest = ({ item }: { item: any }) => {
    const isRejecting = rejectingId === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.learnerName}>{item.learner?.name || item.learner?.email || 'Unknown Learner'}</Text>
          <View style={[styles.badge, { backgroundColor: item.status === 'PENDING' ? '#FEF3C7' : item.status === 'APPROVED' ? '#D1FAE5' : '#FEE2E2' }]}>
            <Text style={[styles.badgeText, { color: item.status === 'PENDING' ? '#D97706' : item.status === 'APPROVED' ? '#059669' : '#DC2626' }]}>
              {item.status}
            </Text>
          </View>
        </View>
        <Text style={styles.dateText}>Requested: {new Date(item.requestedAt).toLocaleDateString()}</Text>

        {item.status === 'PENDING' && (
          <View style={styles.actionContainer}>
            {isRejecting ? (
              <View style={styles.rejectForm}>
                <TextInput
                  style={styles.input}
                  placeholder="Reason for rejection (e.g. redo assignment)"
                  value={rejectReason}
                  onChangeText={setRejectReason}
                  multiline
                />
                <View style={styles.rejectActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => { setRejectingId(null); setRejectReason(''); }}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmRejectBtn} onPress={() => handleReject(item.id)}>
                    <Text style={styles.confirmRejectBtnText}>Confirm Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.buttonsRow}>
                <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item.id)}>
                  <Text style={styles.approveBtnText}>Approve & Issue Certificate</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => setRejectingId(item.id)}>
                  <Text style={styles.rejectBtnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Completion Requests</Text>
      </View>

      <View style={styles.courseSelector}>
        <Text style={styles.selectorLabel}>Select Course:</Text>
        <FlatList
          horizontal
          data={courses}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.courseChip, selectedCourse === item.id && styles.courseChipActive]}
              onPress={() => setSelectedCourse(item.id)}
            >
              <Text style={[styles.courseChipText, selectedCourse === item.id && styles.courseChipTextActive]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={renderRequest}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No requests for this course.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    marginBottom: 8,
  },
  backBtnText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  courseSelector: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectorLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '600',
  },
  courseChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  courseChipActive: {
    backgroundColor: '#4F46E5',
  },
  courseChipText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  courseChipTextActive: {
    color: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  learnerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  actionContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  approveBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  rejectBtnText: {
    color: '#DC2626',
    fontWeight: 'bold',
  },
  rejectForm: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rejectActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    padding: 10,
    marginRight: 10,
  },
  cancelBtnText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  confirmRejectBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmRejectBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
