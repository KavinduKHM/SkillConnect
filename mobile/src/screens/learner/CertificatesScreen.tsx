import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { fetchMyCertificates, fetchMyCompletionRequests, requestCourseCompletion } from '../../api/learner.service';

export default function CertificatesScreen({ navigation }: any) {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [completionRequests, setCompletionRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requestingCourseId, setRequestingCourseId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [certsRes, reqsRes] = await Promise.all([
        fetchMyCertificates().catch(() => ({ certificates: [] })),
        fetchMyCompletionRequests().catch(() => ({ requests: [] })),
      ]);

      setCertificates(certsRes?.certificates || []);
      const pendingOrRejected = (reqsRes?.requests || []).filter((req: any) => req.status !== 'APPROVED');
      setCompletionRequests(pendingOrRejected);
    } catch (err) {
      console.log('Error fetching certificates:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const downloadCertificate = async (certificate: any) => {
    try {
      const url = `http://localhost:5000/api/certificates/${certificate.id}/download`;
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.log('Error opening PDF download:', error);
      Alert.alert('Download Error', 'Could not download the certificate PDF.');
    }
  };

  const handleResubmitRequest = async (courseId: string) => {
    try {
      setRequestingCourseId(courseId);
      await requestCourseCompletion(courseId);
      Alert.alert('Success', 'Completion request resubmitted to your instructor.');
      loadData();
    } catch (err: any) {
      Alert.alert('Notice', err.response?.data?.error || err.message || 'Failed to resubmit request');
    } finally {
      setRequestingCourseId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Certificates 🎖️</Text>
        <Text style={styles.headerSubtitle}>Your verified credentials and completion certificates</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#064E3B" />
          <Text style={styles.loadingText}>Loading your certificates...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadData();
              }}
            />
          }
        >
          {/* Summary Banner */}
          <View style={styles.summaryBanner}>
            <View style={styles.summaryIconBox}>
              <Ionicons name="ribbon" size={24} color="#15803D" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}>
                {certificates.length} Certificate{certificates.length !== 1 ? 's' : ''} Earned
              </Text>
              <Text style={styles.summarySub}>
                Certificates are issued by your Skill Sharer after completing course requirements.
              </Text>
            </View>
          </View>

          {/* Section 1: Issued Certificates */}
          {certificates.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Issued Certificates ({certificates.length})</Text>
              {certificates.map((cert) => (
                <View key={cert.id} style={styles.certCard}>
                  <View style={styles.certCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.certCourseTitle}>{cert.course?.title || 'Certificate of Completion'}</Text>
                      <Text style={styles.certInstructor}>
                        Instructor: {cert.instructor?.name || cert.course?.creator?.name || 'Skill Sharer'}
                      </Text>
                    </View>
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedBadgeText}>✓ VERIFIED</Text>
                    </View>
                  </View>

                  <View style={styles.certMetaRow}>
                    <View style={styles.certMetaItem}>
                      <Ionicons name="calendar-outline" size={14} color="#64748B" />
                      <Text style={styles.certMetaText}>
                        Issued: {new Date(cert.issueDate || cert.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.certMetaItem}>
                      <Ionicons name="document-text-outline" size={14} color="#64748B" />
                      <Text style={styles.certMetaText}>
                        ID: {cert.certificateNumber ? cert.certificateNumber.slice(0, 10) + '...' : cert.id.slice(0, 8)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.certActions}>
                    <TouchableOpacity
                      style={styles.downloadPdfBtn}
                      onPress={() => downloadCertificate(cert)}
                    >
                      <Ionicons name="download-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.downloadPdfText}>Download PDF Certificate</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.reviewBtn}
                      onPress={() =>
                        navigation?.navigate('CourseReview', {
                          courseId: cert.courseId || cert.course?.id,
                          courseTitle: cert.course?.title,
                          hasCompleted: true,
                        })
                      }
                    >
                      <Ionicons name="star-outline" size={15} color="#B45309" style={{ marginRight: 4 }} />
                      <Text style={styles.reviewBtnText}>Rate & Review Course</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Section 2: Completion Requests */}
          {completionRequests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Verification Requests ({completionRequests.length})</Text>
              {completionRequests.map((req) => {
                const isRejected = req.status === 'REJECTED';
                return (
                  <View key={req.id} style={styles.requestCard}>
                    <View style={styles.requestCardHeader}>
                      <Text style={styles.certCourseTitle} numberOfLines={1}>{req.course?.title || 'Course'}</Text>
                      <View style={[styles.statusPill, isRejected ? styles.statusPillRejected : styles.statusPillPending]}>
                        <Text style={[styles.statusPillText, isRejected ? styles.statusTextRejected : styles.statusTextPending]}>
                          {isRejected ? 'REJECTED' : 'PENDING APPROVAL'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.requestDate}>
                      Requested on {new Date(req.requestedAt || req.createdAt).toLocaleDateString()}
                    </Text>

                    {isRejected && req.rejectionReason && (
                      <View style={styles.rejectionBox}>
                        <Text style={styles.rejectionTitle}>Feedback from Sharer:</Text>
                        <Text style={styles.rejectionText}>{req.rejectionReason}</Text>
                      </View>
                    )}

                    {isRejected ? (
                      <TouchableOpacity
                        style={styles.resubmitBtn}
                        disabled={requestingCourseId === req.courseId}
                        onPress={() => handleResubmitRequest(req.courseId)}
                      >
                        {requestingCourseId === req.courseId ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.resubmitBtnText}>Resubmit Completion Request 🏆</Text>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.pendingHint}>
                        ⏳ Waiting for your Skill Sharer to review and approve. Your certificate will be issued automatically upon approval.
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Empty State if No Certs and No Requests */}
          {certificates.length === 0 && completionRequests.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="ribbon-outline" size={56} color="#CBD5E1" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>No Certificates Yet 🏆</Text>
              <Text style={styles.emptySubtitle}>
                Complete 100% of your enrolled courses to request official verified completion certificates.
              </Text>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => navigation?.navigate('MainTabs', { screen: 'MyLearningTab' })}
              >
                <Text style={styles.exploreBtnText}>Go to My Learning →</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#64748B' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 12,
  },
  summaryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: '#166534', marginBottom: 2 },
  summarySub: { fontSize: 12, color: '#15803D', lineHeight: 17 },
  section: { gap: 12 },
  sectionHeading: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  certCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  certCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  certCourseTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  certInstructor: { fontSize: 13, color: '#64748B' },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  verifiedBadgeText: { fontSize: 11, fontWeight: '800', color: '#15803D' },
  certMetaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  certMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  certMetaText: { fontSize: 12, color: '#64748B' },
  certActions: { gap: 8 },
  downloadPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#064E3B',
    paddingVertical: 12,
    borderRadius: 14,
  },
  downloadPdfText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  reviewBtnText: { color: '#B45309', fontSize: 13, fontWeight: '700' },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  requestCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusPillPending: { backgroundColor: '#FEF3C7' },
  statusPillRejected: { backgroundColor: '#FEE2E2' },
  statusPillText: { fontSize: 11, fontWeight: '800' },
  statusTextPending: { color: '#D97706' },
  statusTextRejected: { color: '#DC2626' },
  requestDate: { fontSize: 12, color: '#94A3B8', marginBottom: 8 },
  rejectionBox: {
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectionTitle: { fontSize: 12, fontWeight: '700', color: '#991B1B', marginBottom: 2 },
  rejectionText: { fontSize: 12, color: '#B91C1C' },
  resubmitBtn: {
    backgroundColor: '#064E3B',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resubmitBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  pendingHint: { fontSize: 12, color: '#64748B', fontStyle: 'italic', lineHeight: 18 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  exploreBtn: { backgroundColor: '#064E3B', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 14 },
  exploreBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
