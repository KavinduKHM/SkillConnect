import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService, Qualification } from '../../api/admin.service';
import { StatusBadge } from '../../components/admin/StatusBadge';

export const QualificationsScreen = () => {
  const queryClient = useQueryClient();
  const [selectedQualification, setSelectedQualification] = useState<Qualification | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['pending-qualifications'],
    queryFn: async () => {
      const response = await adminService.getPendingQualifications();
      return response.data;
    },
  });

  const handleVerify = async (id: string) => {
    Alert.alert(
      'Verify Qualification',
      'Are you sure you want to verify this qualification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Verify',
          onPress: async () => {
            try {
              await adminService.verifyQualification(id);
              Alert.alert('Success', 'Qualification verified');
              queryClient.invalidateQueries({ queryKey: ['pending-qualifications'] });
              refetch();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to verify');
            }
          },
        },
      ]
    );
  };

  const handleReject = async (id: string) => {
    Alert.prompt(
      'Reject Qualification',
      'Please enter a reason for rejection:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          onPress: async (reason?: string) => {
            if (!reason) {
              Alert.alert('Error', 'Please provide a reason');
              return;
            }
            try {
              await adminService.rejectQualification(id, reason);
              Alert.alert('Success', 'Qualification rejected');
              queryClient.invalidateQueries({ queryKey: ['pending-qualifications'] });
              refetch();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to reject');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const qualifications = Array.isArray(data) ? data : [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Qualifications</Text>
        <Text style={styles.subtitle}>
          {qualifications.length} pending verification
        </Text>
      </View>

      {qualifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyTitle}>All Clear!</Text>
          <Text style={styles.emptyText}>No pending qualifications to review</Text>
        </View>
      ) : (
        qualifications.map((qual: Qualification) => (
          <View key={qual.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{qual.title}</Text>
              <StatusBadge status={qual.status} />
            </View>

            <Text style={styles.cardInstitution}>{qual.institution}</Text>
            <Text style={styles.cardYear}>Year: {qual.year}</Text>

            <View style={styles.cardUser}>
              <Text style={styles.cardUserLabel}>Submitted by:</Text>
              <Text style={styles.cardUserName}>{qual.user.name}</Text>
              <Text style={styles.cardUserEmail}>{qual.user.email}</Text>
            </View>

            {qual.documents && qual.documents.length > 0 && (
              <View style={styles.documentsContainer}>
                <Text style={styles.documentsLabel}>Documents:</Text>
                {qual.documents.map((doc) => (
                  <Text key={doc.id} style={styles.documentItem}>
                    📎 {doc.fileName}
                  </Text>
                ))}
              </View>
            )}

            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.verifyButton]}
                onPress={() => handleVerify(qual.id)}
              >
                <Text style={styles.verifyButtonText}>✓ Verify</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleReject(qual.id)}
              >
                <Text style={styles.rejectButtonText}>✕ Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  cardInstitution: {
    fontSize: 14,
    color: '#6b7280',
  },
  cardYear: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  cardUser: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cardUserLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  cardUserName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  cardUserEmail: {
    fontSize: 12,
    color: '#6b7280',
  },
  documentsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  documentsLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  documentItem: {
    fontSize: 13,
    color: '#3b82f6',
    paddingVertical: 2,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifyButton: {
    backgroundColor: '#dcfce7',
  },
  verifyButtonText: {
    color: '#16a34a',
    fontWeight: '600',
    fontSize: 14,
  },
  rejectButton: {
    backgroundColor: '#fee2e2',
  },
  rejectButtonText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 14,
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