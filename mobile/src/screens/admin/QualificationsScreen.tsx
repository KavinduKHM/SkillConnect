import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService, Qualification } from '../../api/admin.service';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { Header } from '../../components/common/Header';

const openUrlSafely = (url: string | null | undefined) => {
  if (!url) return;
  let cleanUrl = url.trim();
  if (!/^https?:\/\//i.test(cleanUrl)) {
    cleanUrl = `https://${cleanUrl}`;
  }
  Linking.openURL(cleanUrl).catch((err) => {
    console.error('Failed to open URL safely:', err);
  });
};

const LinkButton = ({ url, label, icon, color = '#2563EB', brandIcon = false }: { url: string; label: string; icon: string; color?: string; brandIcon?: boolean }) => {
  let cleanUrl = url.trim();
  if (!/^https?:\/\//i.test(cleanUrl)) {
    cleanUrl = `https://${cleanUrl}`;
  }

  if (Platform.OS === 'web') {
    return (
      <a
        href={cleanUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          window.open(cleanUrl, '_blank', 'noopener,noreferrer');
        }}
        style={{
          textDecoration: 'none',
          display: 'inline-flex',
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#F3F4F6',
          padding: '6px 12px',
          borderRadius: '8px',
          margin: '4px',
          transition: 'background-color 0.2s, border-color 0.2s',
          border: '1px solid #E5E7EB',
          outline: 'none',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = '#E5E7EB';
          (e.currentTarget as HTMLElement).style.borderColor = '#D1D5DB';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = '#F3F4F6';
          (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB';
        }}
      >
        <Ionicons name={icon as any} size={15} color={brandIcon ? color : '#4B5563'} style={{ marginRight: 6 }} />
        <span style={{ fontSize: '13px', color: '#1F2937', fontWeight: '500', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          {label}
        </span>
      </a>
    );
  }

  return (
    <TouchableOpacity 
      onPress={() => openUrlSafely(cleanUrl)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Ionicons name={icon as any} size={15} color={brandIcon ? color : '#4B5563'} style={{ marginRight: 6 }} />
      <Text style={{ fontSize: 13, color: '#1F2937', fontWeight: '500' }}>{label}</Text>
    </TouchableOpacity>
  );
};

export const QualificationsScreen = () => {
  const queryClient = useQueryClient();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmingType, setConfirmingType] = useState<'verify' | 'reject' | null>(null);
  const [reasonInput, setReasonInput] = useState('');

  const { data, isLoading, refetch, isRefetching, status, fetchStatus, error } = useQuery({
    queryKey: ['pending-qualifications'],
    queryFn: async () => {
      const response = await adminService.getPendingQualifications();
      return response.data;
    },
  });

  const handleVerify = async (id: string) => {
    queryClient.setQueryData(['pending-qualifications'], (old: any) => 
      Array.isArray(old) ? old.filter((q: any) => q.id !== id) : old
    );
    try {
      await adminService.verifyQualification(id);
      Toast.show({ type: 'success', text1: 'Success', text2: 'Qualification verified' });
      queryClient.invalidateQueries({ queryKey: ['pending-qualifications'] });
      refetch();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.error || 'Failed to verify' });
      refetch();
    }
  };

  const handleReject = async (id: string, reason: string) => {
    if (!reason.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please provide a reason' });
      return;
    }
    queryClient.setQueryData(['pending-qualifications'], (old: any) => 
      Array.isArray(old) ? old.filter((q: any) => q.id !== id) : old
    );
    try {
      await adminService.rejectQualification(id, reason);
      Toast.show({ type: 'success', text1: 'Success', text2: 'Qualification rejected' });
      queryClient.invalidateQueries({ queryKey: ['pending-qualifications'] });
      refetch();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.error || 'Failed to reject' });
      refetch();
    }
  };

  const qualifications = Array.isArray(data) ? data : [];

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <Header title="Qualifications" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Fetching pending qualifications...</Text>
          </View>
        ) : qualifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="checkbox-outline" size={48} color="#10B981" />
            </View>
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptyText}>No pending qualifications to review</Text>
          </View>
        ) : (
          qualifications.map((qual: Qualification) => (
            <View key={qual.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderTitleBox}>
                  <Ionicons name="medal-outline" size={20} color="#4F46E5" style={{ marginRight: 8 }} />
                  <Text style={styles.cardTitle}>{qual.title}</Text>
                </View>
                <StatusBadge status={qual.status} />
              </View>

              <View style={styles.credRow}>
                <Text style={styles.credInstitution}>{qual.institution}</Text>
                <Text style={styles.credDivider}>•</Text>
                <Text style={styles.credYear}>Year: {qual.year}</Text>
              </View>

              {/* Submitted by: User Card */}
              <View style={styles.userCard}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitials}>
                    {qual.user.name ? qual.user.name.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
                <View style={styles.userMeta}>
                  <Text style={styles.userMetaLabel}>SUBMITTED BY</Text>
                  <Text style={styles.userMetaName}>{qual.user.name}</Text>
                  <Text style={styles.userMetaEmail}>{qual.user.email}</Text>
                </View>
              </View>

              {/* Shared Links */}
              {qual.profile && (qual.profile.website || 
                qual.profile.socialLinks?.linkedin || 
                qual.profile.socialLinks?.github || 
                qual.profile.socialLinks?.twitter || 
                (qual.profile.portfolio && qual.profile.portfolio.length > 0)) ? (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionLabel}>Shared Links & Portfolio:</Text>
                  <View style={styles.linksContainer}>
                    {qual.profile.website && (
                      <LinkButton 
                        url={qual.profile.website}
                        label="Website"
                        icon="globe-outline"
                        color="#10B981"
                        brandIcon
                      />
                    )}
                    {qual.profile.socialLinks?.linkedin && (
                      <LinkButton 
                        url={qual.profile.socialLinks.linkedin}
                        label="LinkedIn"
                        icon="logo-linkedin"
                        color="#0A66C2"
                        brandIcon
                      />
                    )}
                    {qual.profile.socialLinks?.github && (
                      <LinkButton 
                        url={qual.profile.socialLinks.github}
                        label="GitHub"
                        icon="logo-github"
                        color="#24292E"
                        brandIcon
                      />
                    )}
                    {qual.profile.socialLinks?.twitter && (
                      <LinkButton 
                        url={qual.profile.socialLinks.twitter}
                        label="Twitter"
                        icon="logo-twitter"
                        color="#1DA1F2"
                        brandIcon
                      />
                    )}
                    {qual.profile.portfolio && Array.isArray(qual.profile.portfolio) && qual.profile.portfolio.map((url: string, index: number) => {
                      const portLength = qual.profile?.portfolio?.length || 0;
                      return (
                        <LinkButton 
                          key={index}
                          url={url}
                          label={`Portfolio ${portLength > 1 ? `#${index + 1}` : ''}`}
                          icon="link-outline"
                          color="#4F46E5"
                        />
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {/* Skills Tag Cloud */}
              {qual.profile?.skills && qual.profile.skills.length > 0 ? (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionLabel}>Submitted Skills for Verification:</Text>
                  <View style={styles.skillsContainer}>
                    {qual.profile.skills.map((skill: string, index: number) => (
                      <View key={index} style={styles.skillBadge}>
                        <Ionicons name="checkmark-circle-outline" size={13} color="#4F46E5" style={{ marginRight: 4 }} />
                        <Text style={styles.skillBadgeText}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : qual.description ? (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionLabel}>Description:</Text>
                  <Text style={styles.descriptionText}>{qual.description}</Text>
                </View>
              ) : null}

              {/* If custom description submitted, show alongside skills */}
              {qual.description && !qual.description.startsWith('Auto-submitted for skills verification') && qual.profile?.skills && qual.profile.skills.length > 0 && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionLabel}>Additional Details:</Text>
                  <Text style={styles.descriptionText}>{qual.description}</Text>
                </View>
              )}

              {/* Uploaded Documents */}
              {qual.documents && qual.documents.length > 0 && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionLabel}>Documents (Click to view):</Text>
                  <View style={styles.documentsContainer}>
                    {qual.documents.map((doc) => {
                      let fileUrl = doc.fileUrl;
                      if (fileUrl && !fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
                        fileUrl = `http://localhost:5000${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
                      }
                      return (
                        <LinkButton
                          key={doc.id}
                          url={fileUrl}
                          label={doc.fileName}
                          icon="document-text-outline"
                          color="#2563EB"
                        />
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Confirm / Action Dialogs */}
              {confirmingId === qual.id ? (
                <View style={styles.confirmWrapper}>
                  {confirmingType === 'verify' ? (
                    <View style={styles.confirmInner}>
                      <Ionicons name="alert-circle-outline" size={24} color="#10B981" style={{ marginBottom: 6 }} />
                      <Text style={styles.confirmText}>
                        Are you sure you want to verify this qualification?
                      </Text>
                      <View style={styles.confirmActionRow}>
                        <TouchableOpacity
                          style={[styles.confirmBtn, styles.confirmBtnVerify]}
                          onPress={() => {
                            handleVerify(qual.id);
                            setConfirmingId(null);
                            setConfirmingType(null);
                          }}
                        >
                          <Text style={styles.confirmBtnText}>Yes, Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.confirmBtn, styles.confirmBtnCancel]}
                          onPress={() => {
                            setConfirmingId(null);
                            setConfirmingType(null);
                          }}
                        >
                          <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.confirmInner2}>
                      <Ionicons name="alert-circle-outline" size={24} color="#EF4444" style={{ marginBottom: 6 }} />
                      <Text style={styles.confirmText}>
                        Provide rejection reason for this request:
                      </Text>
                      <TextInput
                        style={styles.rejectionInput}
                        value={reasonInput}
                        onChangeText={setReasonInput}
                        placeholder="Reason for rejection..."
                        placeholderTextColor="#9CA3AF"
                      />
                      <View style={styles.confirmActionRow}>
                        <TouchableOpacity
                          style={[styles.confirmBtn, styles.confirmBtnReject]}
                          onPress={() => {
                            handleReject(qual.id, reasonInput);
                            setConfirmingId(null);
                            setConfirmingType(null);
                          }}
                        >
                          <Text style={styles.confirmBtnText}>Yes, Reject</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.confirmBtn, styles.confirmBtnCancel]}
                          onPress={() => {
                            setConfirmingId(null);
                            setConfirmingType(null);
                          }}
                        >
                          <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.mainActionsContainer}>
                  <TouchableOpacity
                    style={[styles.mainActionBtn, styles.mainVerifyBtn]}
                    onPress={() => {
                      setConfirmingId(qual.id);
                      setConfirmingType('verify');
                    }}
                  >
                    <Ionicons name="checkmark-circle-sharp" size={16} color="#059669" style={{ marginRight: 6 }} />
                    <Text style={styles.mainVerifyText}>Verify & Approve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.mainActionBtn, styles.mainRejectBtn]}
                    onPress={() => {
                      setConfirmingId(qual.id);
                      setConfirmingType('reject');
                      setReasonInput('');
                    }}
                  >
                    <Ionicons name="close-circle-sharp" size={16} color="#DC2626" style={{ marginRight: 6 }} />
                    <Text style={styles.mainRejectText}>Reject Request</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 8,
  },
  cardHeaderTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  credRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  credInstitution: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  credDivider: {
    marginHorizontal: 8,
    color: '#D1D5DB',
  },
  credYear: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4F46E5',
  },
  userMeta: {
    flex: 1,
  },
  userMetaLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  userMetaName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  userMetaEmail: {
    fontSize: 12,
    color: '#4B5563',
  },
  sectionContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  linksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  skillBadgeText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  documentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  mainActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  mainActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    fontWeight: '600',
  },
  mainVerifyBtn: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  mainVerifyText: {
    color: '#065F46',
    fontWeight: '700',
    fontSize: 14,
  },
  mainRejectBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  mainRejectText: {
    color: '#991B1B',
    fontWeight: '700',
    fontSize: 14,
  },
  confirmWrapper: {
    marginTop: 18,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  confirmInner: {
    alignItems: 'center',
    textAlign: 'center',
  },
  confirmInner2: {
    alignItems: 'stretch',
  },
  confirmText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmActionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    justifyContent: 'center',
  },
  confirmBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
  },
  confirmBtnVerify: {
    backgroundColor: '#10B981',
  },
  confirmBtnReject: {
    backgroundColor: '#EF4444',
  },
  confirmBtnCancel: {
    backgroundColor: '#E5E7EB',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  cancelBtnText: {
    color: '#4B5563',
    fontWeight: '700',
    fontSize: 14,
  },
  rejectionInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
});