import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, FlatList, Modal, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PageHeader from '../components/PageHeader';
import { recruitmentService, RecruitmentStats, RecruitmentPost, Candidate, Communication, Interview } from '../services/recruitment.service';

export default function RecruitmentScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'stats' | 'jobs' | 'candidates' | 'interviews'>('stats');
  const [jobs, setJobs] = useState<RecruitmentPost[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [stats, setStats] = useState<RecruitmentStats>({
    totalJobs: 0, activeJobs: 0, totalCandidates: 0, newCandidates: 0,
    contactedCandidates: 0, interviewingCandidates: 0, hiredCandidates: 0,
    totalInterviews: 0, pendingInterviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);
  const [showCandidateDetail, setShowCandidateDetail] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  const [jobForm, setJobForm] = useState({
    title: '', department: '', location: '', salaryMin: '', salaryMax: '',
    experience: '1-3年', education: '本科', description: '', requirements: '',
  });
  const [candidateForm, setCandidateForm] = useState({
    name: '', phone: '', email: '', skills: '', experience: '', education: '', source: 'manual', location: '',
  });
  const [interviewForm, setInterviewForm] = useState({
    type: 'video', scheduledAt: '', duration: '60', location: '', interviewer: '', round: '1',
  });

  const loadData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const [statsData, postsData, candidatesData, interviewsData] = await Promise.all([
        recruitmentService.getStats(),
        recruitmentService.getPosts(),
        recruitmentService.getCandidates(),
        recruitmentService.getInterviews(),
      ]);

      setStats(statsData);
      setJobs(postsData);
      setCandidates(candidatesData);
      setInterviews(interviewsData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handlePublishJob = async () => {
    if (!jobForm.title || !jobForm.location) {
      Alert.alert('提示', '请填写职位名称和工作地点');
      return;
    }
    try {
      setLoading(true);
      await recruitmentService.createPost({
        title: jobForm.title,
        department: jobForm.department,
        location: jobForm.location,
        salaryMin: parseInt(jobForm.salaryMin) || undefined,
        salaryMax: parseInt(jobForm.salaryMax) || undefined,
        experience: jobForm.experience,
        education: jobForm.education,
        description: jobForm.description,
        requirements: jobForm.requirements,
      });
      await loadData();
      setShowAddJobModal(false);
      setJobForm({ title: '', department: '', location: '', salaryMin: '', salaryMax: '', experience: '1-3年', education: '本科', description: '', requirements: '' });
      Alert.alert('成功', '职位发布成功');
    } catch (error) {
      Alert.alert('错误', '发布失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCandidate = async () => {
    if (!candidateForm.name || !candidateForm.phone || !selectedPostId) {
      Alert.alert('提示', '请选择岗位并填写候选人姓名和手机号');
      return;
    }
    try {
      setLoading(true);
      const result = await recruitmentService.addCandidate({
        postId: selectedPostId,
        name: candidateForm.name,
        phone: candidateForm.phone,
        email: candidateForm.email || undefined,
        skills: candidateForm.skills || undefined,
        experience: candidateForm.experience || undefined,
        education: candidateForm.education || undefined,
        source: candidateForm.source,
        location: candidateForm.location || undefined,
      });
      await loadData();
      setShowAddCandidateModal(false);
      setCandidateForm({ name: '', phone: '', email: '', skills: '', experience: '', education: '', source: 'manual', location: '' });
      Alert.alert('成功', `候选人已添加，匹配度：${result.candidate?.matchScore || 0}%`);
    } catch (error: any) {
      Alert.alert('错误', error?.message || '添加失败');
    } finally {
      setLoading(false);
    }
  };

  const handleContactCandidate = async (candidate: Candidate) => {
    try {
      setLoading(true);
      const result = await recruitmentService.contactCandidate(candidate.id);
      Alert.alert('联系话术已生成', result.message?.substring(0, 100) + '...');
      await loadCommunications(candidate.id);
      await loadData();
    } catch (error) {
      Alert.alert('错误', '生成联系话术失败');
    } finally {
      setLoading(false);
    }
  };

  const loadCommunications = async (candidateId: string) => {
    try {
      const comms = await recruitmentService.getCommunications(candidateId);
      setCommunications(comms);
    } catch (e) {
      setCommunications([]);
    }
  };

  const handleOpenChat = async (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowChatModal(true);
    await loadCommunications(candidate.id);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedCandidate) return;
    try {
      setSendingMessage(true);
      await recruitmentService.sendMessage(selectedCandidate.id, chatInput.trim());
      setChatInput('');
      await loadCommunications(selectedCandidate.id);
      await loadData();
    } catch (error) {
      Alert.alert('错误', '发送失败');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleScheduleInterview = async () => {
    if (!selectedCandidate || !interviewForm.scheduledAt) {
      Alert.alert('提示', '请选择面试时间');
      return;
    }
    try {
      setLoading(true);
      await recruitmentService.scheduleInterview({
        candidateId: selectedCandidate.id,
        postId: selectedCandidate.post?.id || selectedCandidate.postId || '',
        round: parseInt(interviewForm.round) || 1,
        type: interviewForm.type,
        scheduledAt: interviewForm.scheduledAt,
        duration: parseInt(interviewForm.duration) || 60,
        location: interviewForm.location || undefined,
        interviewer: interviewForm.interviewer || undefined,
      });
      await loadData();
      setShowInterviewModal(false);
      Alert.alert('成功', '面试已安排，邀约消息已发送');
    } catch (error) {
      Alert.alert('错误', '安排面试失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCandidateStatus = async (id: string, status: Candidate['status']) => {
    try {
      await recruitmentService.updateCandidateStatus(id, status);
      await loadData();
      if (showCandidateDetail) setShowCandidateDetail(false);
      Alert.alert('成功', '状态已更新');
    } catch (error) {
      Alert.alert('错误', '更新失败');
    }
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      recruiting: { bg: '#dcfce7', text: '#166534' },
      active: { bg: '#dcfce7', text: '#166534' },
      pending: { bg: '#fef3c7', text: '#92400e' },
      contacted: { bg: '#dbeafe', text: '#1e40af' },
      communicating: { bg: '#c7d2fe', text: '#4338ca' },
      interviewed: { bg: '#e0e7ff', text: '#3730a3' },
      offered: { bg: '#d1fae5', text: '#065f46' },
      hired: { bg: '#bbf7d0', text: '#14532d' },
      closed: { bg: '#f1f5f9', text: '#64748b' },
      rejected: { bg: '#fee2e2', text: '#dc2626' },
      draft: { bg: '#f1f5f9', text: '#64748b' },
      paused: { bg: '#fef3c7', text: '#92400e' },
    };
    return map[status] || { bg: '#f1f5f9', text: '#64748b' };
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      recruiting: '招聘中', active: '招聘中', closed: '已关闭', paused: '已暂停', draft: '草稿',
      pending: '待联系', contacted: '已联系', communicating: '沟通中',
      interviewed: '面试中', offered: '已发Offer', hired: '已入职', rejected: '不合适',
      scheduled: '已安排', confirmed: '已确认', completed: '已完成', cancelled: '已取消',
    };
    return map[status] || status;
  };

  const departments = ['技术部', '产品部', '设计部', '市场部', '运营部', '人事部'];
  const experiences = ['不限', '1年以内', '1-3年', '3-5年', '5-10年', '10年以上'];
  const educations = ['不限', '大专', '本科', '硕士', '博士'];

  return (
    <View style={styles.container}>
      <PageHeader title="招聘助手" />

      <View style={styles.tabBar}>
        {[
          { key: 'stats', icon: 'stats-chart', label: '数据' },
          { key: 'jobs', icon: 'briefcase', label: '岗位' },
          { key: 'candidates', icon: 'people', label: '候选人' },
          { key: 'interviews', icon: 'calendar', label: '面试' },
        ].map(tab => (
          <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && styles.tabActive]} onPress={() => setActiveTab(tab.key as any)}>
            <Ionicons name={tab.icon as any} size={18} color={activeTab === tab.key ? '#4F46E5' : '#94a3b8'} />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}>
        {/* 数据统计 */}
        {activeTab === 'stats' && (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}><Text style={styles.statValue}>{stats.activeJobs}</Text><Text style={styles.statLabel}>在招职位</Text></View>
              <View style={styles.statCard}><Text style={[styles.statValue, { color: '#22c55e' }]}>{stats.totalCandidates}</Text><Text style={styles.statLabel}>候选人</Text></View>
              <View style={styles.statCard}><Text style={[styles.statValue, { color: '#3b82f6' }]}>{stats.contactedCandidates}</Text><Text style={styles.statLabel}>已联系</Text></View>
              <View style={styles.statCard}><Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats.pendingInterviews}</Text><Text style={styles.statLabel}>待面试</Text></View>
            </View>

            <Text style={styles.sectionTitle}>待联系候选人 ({candidates.filter(c => c.status === 'pending').length})</Text>
            {candidates.filter(c => c.status === 'pending').slice(0, 5).map(candidate => (
              <TouchableOpacity key={candidate.id} style={styles.candidateCard} onPress={() => { setSelectedCandidate(candidate); setShowCandidateDetail(true); }}>
                <View style={styles.candidateHeader}>
                  <View style={styles.avatar}><Text style={styles.avatarText}>{candidate.name[0]}</Text></View>
                  <View style={styles.candidateInfo}>
                    <Text style={styles.candidateName}>{candidate.name}</Text>
                    <Text style={styles.candidatePosition}>{candidate.post?.title || '未分配岗位'}</Text>
                  </View>
                  <View style={[styles.matchBadge, { backgroundColor: candidate.matchScore >= 80 ? '#dcfce7' : candidate.matchScore >= 60 ? '#dbeafe' : '#fef3c7' }]}>
                    <Text style={[styles.matchScore, { color: candidate.matchScore >= 80 ? '#166534' : candidate.matchScore >= 60 ? '#1e40af' : '#92400e' }]}>{candidate.matchScore}%</Text>
                  </View>
                </View>
                <View style={styles.candidateActions}>
                  <TouchableOpacity style={styles.actionSmallBtn} onPress={() => handleContactCandidate(candidate)}>
                    <Ionicons name="chatbubble" size={14} color="#4F46E5" />
                    <Text style={styles.actionSmallText}>AI联系</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionSmallBtn, { backgroundColor: '#dcfce7' }]} onPress={() => { setSelectedCandidate(candidate); setShowInterviewModal(true); }}>
                    <Ionicons name="calendar" size={14} color="#166534" />
                    <Text style={[styles.actionSmallText, { color: '#166534' }]}>邀面试</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}

            {stats.hiredCandidates > 0 && (
              <View style={styles.hiredBanner}>
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                <Text style={styles.hiredText}>已成功招聘 {stats.hiredCandidates} 人</Text>
              </View>
            )}
          </>
        )}

        {/* 岗位列表 */}
        {activeTab === 'jobs' && (
          <>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddJobModal(true)}>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.addBtnText}>发布新职位</Text>
            </TouchableOpacity>

            {jobs.map(job => (
              <View key={job.id} style={styles.jobCard}>
                <View style={styles.jobHeader}>
                  <Text style={styles.jobTitle}>{job.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status).bg }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(job.status).text }]}>{getStatusText(job.status)}</Text>
                  </View>
                </View>
                <View style={styles.jobMeta}>
                  <Text style={styles.metaText}>{job.department || ''} {job.location ? `| ${job.location}` : ''}</Text>
                  {(job.salaryMin || job.salaryMax) && <Text style={styles.salary}>{job.salaryMin || '?'}-{job.salaryMax || '?'}K</Text>}
                </View>
                <View style={styles.jobFooter}>
                  <TouchableOpacity style={styles.addCandidateLink} onPress={() => { setSelectedPostId(job.id); setShowAddCandidateModal(true); }}>
                    <Ionicons name="person-add" size={14} color="#4F46E5" />
                    <Text style={styles.addCandidateLinkText}>添加候选人</Text>
                  </TouchableOpacity>
                  <Text style={styles.candidateCount}>{job.candidateCount || 0}位候选人</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* 候选人列表 */}
        {activeTab === 'candidates' && (
          <>
            <TouchableOpacity style={styles.addBtn} onPress={() => { if (jobs.length > 0) { setSelectedPostId(jobs[0].id); setShowAddCandidateModal(true); } else { Alert.alert('提示', '请先发布职位'); } }}>
              <Ionicons name="person-add" size={20} color="#fff" />
              <Text style={styles.addBtnText}>添加候选人</Text>
            </TouchableOpacity>

            {candidates.map(candidate => (
              <TouchableOpacity key={candidate.id} style={styles.candidateCard} onPress={() => { setSelectedCandidate(candidate); setShowCandidateDetail(true); }}>
                <View style={styles.candidateHeader}>
                  <View style={styles.avatar}><Text style={styles.avatarText}>{candidate.name[0]}</Text></View>
                  <View style={styles.candidateInfo}>
                    <Text style={styles.candidateName}>{candidate.name}</Text>
                    <Text style={styles.candidatePosition}>{candidate.post?.title || '未分配'}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(candidate.status).bg }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(candidate.status).text }]}>{getStatusText(candidate.status)}</Text>
                  </View>
                </View>
                <View style={styles.candidateMeta}>
                  <Text style={styles.metaText}>{candidate.experience || ''} | {candidate.education || ''}</Text>
                  <View style={[styles.matchBadge, { backgroundColor: candidate.matchScore >= 80 ? '#dcfce7' : '#fef3c7' }]}>
                    <Text style={[styles.matchScore, { color: candidate.matchScore >= 80 ? '#166534' : '#92400e' }]}>{candidate.matchScore}%匹配</Text>
                  </View>
                </View>
                <View style={styles.candidateActions}>
                  {candidate.status === 'pending' && (
                    <TouchableOpacity style={styles.actionSmallBtn} onPress={() => handleContactCandidate(candidate)}>
                      <Ionicons name="chatbubble" size={14} color="#4F46E5" />
                      <Text style={styles.actionSmallText}>AI联系</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.actionSmallBtn, { backgroundColor: '#e0e7ff' }]} onPress={() => handleOpenChat(candidate)}>
                    <Ionicons name="chatbubbles" size={14} color="#4F46E5" />
                    <Text style={styles.actionSmallText}>沟通</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionSmallBtn, { backgroundColor: '#dcfce7' }]} onPress={() => { setSelectedCandidate(candidate); setShowInterviewModal(true); }}>
                    <Ionicons name="calendar" size={14} color="#166534" />
                    <Text style={[styles.actionSmallText, { color: '#166534' }]}>面试</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* 面试安排 */}
        {activeTab === 'interviews' && (
          <>
            <Text style={styles.sectionTitle}>面试安排 ({interviews.length})</Text>
            {interviews.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>暂无面试安排</Text>
                <Text style={styles.emptySub}>在候选人页面邀约面试</Text>
              </View>
            ) : (
              interviews.map(interview => {
                const scheduledDate = new Date(interview.scheduledAt);
                return (
                  <View key={interview.id} style={styles.interviewCard}>
                    <View style={styles.interviewHeader}>
                      <View style={styles.interviewTime}>
                        <Text style={styles.interviewDay}>{scheduledDate.getDate()}</Text>
                        <Text style={styles.interviewMonth}>{scheduledDate.getMonth() + 1}月</Text>
                      </View>
                      <View style={styles.interviewInfo}>
                        <Text style={styles.interviewPosition}>{interview.post?.title || '未知岗位'}</Text>
                        <Text style={styles.interviewCandidate}>候选人: {interview.candidate?.name || '未知'}</Text>
                        <View style={styles.interviewTags}>
                          <Text style={[styles.interviewTag, interview.type === 'video' ? {} : interview.type === 'onsite' ? { backgroundColor: '#fef3c7', color: '#92400e' } : { backgroundColor: '#e0e7ff', color: '#3730a3' }]}>
                            {interview.type === 'video' ? '视频面试' : interview.type === 'onsite' ? '现场面试' : '电话面试'}
                          </Text>
                          <Text style={styles.interviewTimeText}>{scheduledDate.getHours()}:{String(scheduledDate.getMinutes()).padStart(2, '0')}</Text>
                          <Text style={styles.interviewDuration}>{interview.duration}分钟</Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(interview.status).bg }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(interview.status).text }]}>{getStatusText(interview.status)}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 候选人详情弹窗 */}
      <Modal visible={showCandidateDetail} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>候选人详情</Text>
              <TouchableOpacity onPress={() => setShowCandidateDetail(false)}><Ionicons name="close" size={24} color="#64748b" /></TouchableOpacity>
            </View>
            {selectedCandidate && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailHeader}>
                  <View style={styles.avatarLarge}><Text style={styles.avatarTextLarge}>{selectedCandidate.name[0]}</Text></View>
                  <Text style={styles.detailName}>{selectedCandidate.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedCandidate.status).bg }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(selectedCandidate.status).text }]}>{getStatusText(selectedCandidate.status)}</Text>
                  </View>
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>应聘岗位</Text>
                  <Text style={styles.detailValue}>{selectedCandidate.post?.title || '未知'}</Text>
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>联系方式</Text>
                  <Text style={styles.detailValue}>{selectedCandidate.phone}</Text>
                  {selectedCandidate.email && <Text style={styles.detailValue}>{selectedCandidate.email}</Text>}
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>匹配度</Text>
                  <View style={[styles.matchBadgeLarge, { backgroundColor: selectedCandidate.matchScore >= 80 ? '#dcfce7' : '#fef3c7' }]}>
                    <Text style={[styles.matchScoreLarge, { color: selectedCandidate.matchScore >= 80 ? '#166534' : '#92400e' }]}>{selectedCandidate.matchScore}%</Text>
                  </View>
                </View>
                <Text style={styles.actionTitle}>操作</Text>
                <View style={styles.actionRow}>
                  {selectedCandidate.status === 'pending' && (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#e0e7ff' }]} onPress={() => { handleContactCandidate(selectedCandidate); setShowCandidateDetail(false); }}>
                      <Ionicons name="chatbubble" size={18} color="#4F46E5" />
                      <Text style={[styles.actionBtnText, { color: '#4F46E5' }]}>AI联系</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#dbeafe' }]} onPress={() => { setShowCandidateDetail(false); handleOpenChat(selectedCandidate); }}>
                    <Ionicons name="chatbubbles" size={18} color="#1e40af" />
                    <Text style={[styles.actionBtnText, { color: '#1e40af' }]}>沟通</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#dcfce7' }]} onPress={() => { setShowCandidateDetail(false); setShowInterviewModal(true); }}>
                    <Ionicons name="calendar" size={18} color="#166534" />
                    <Text style={[styles.actionBtnText, { color: '#166534' }]}>面试</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#d1fae5' }]} onPress={() => handleUpdateCandidateStatus(selectedCandidate.id, 'hired')}>
                    <Ionicons name="checkmark-circle" size={18} color="#065f46" />
                    <Text style={[styles.actionBtnText, { color: '#065f46' }]}>已入职</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]} onPress={() => handleUpdateCandidateStatus(selectedCandidate.id, 'rejected')}>
                    <Ionicons name="close-circle" size={18} color="#dc2626" />
                    <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>不合适</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* AI沟通弹窗 */}
      <Modal visible={showChatModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>与 {selectedCandidate?.name} 沟通</Text>
              <TouchableOpacity onPress={() => setShowChatModal(false)}><Ionicons name="close" size={24} color="#64748b" /></TouchableOpacity>
            </View>
            <ScrollView style={styles.chatMessages} showsVerticalScrollIndicator={false}>
              {communications.length === 0 && (
                <View style={styles.chatEmpty}>
                  <Text style={styles.chatEmptyText}>点击下方按钮，AI将生成个性化联系话术</Text>
                </View>
              )}
              {communications.map(comm => (
                <View key={comm.id} style={[styles.chatBubble, comm.direction === 'outbound' ? styles.chatOutbound : styles.chatInbound]}>
                  <Text style={styles.chatBubbleText}>{comm.content}</Text>
                  <View style={styles.chatBubbleMeta}>
                    {comm.aiGenerated && <Text style={styles.aiTag}>AI生成</Text>}
                    <Text style={styles.chatTime}>{new Date(comm.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={styles.chatInputRow}>
              <TextInput style={styles.chatInput} placeholder="输入消息..." placeholderTextColor="#94a3b8" value={chatInput} onChangeText={setChatInput} />
              <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage} disabled={sendingMessage || !chatInput.trim()}>
                <Ionicons name="send" size={20} color={sendingMessage ? '#94a3b8' : '#4F46E5'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 面试邀约弹窗 */}
      <Modal visible={showInterviewModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>安排面试 - {selectedCandidate?.name}</Text>
              <TouchableOpacity onPress={() => setShowInterviewModal(false)}><Ionicons name="close" size={24} color="#64748b" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>面试方式</Text>
              <View style={styles.selectRow}>
                {[{ key: 'video', label: '视频' }, { key: 'phone', label: '电话' }, { key: 'onsite', label: '现场' }].map(t => (
                  <TouchableOpacity key={t.key} style={[styles.selectItem, interviewForm.type === t.key && styles.selectItemActive]} onPress={() => setInterviewForm({ ...interviewForm, type: t.key })}>
                    <Text style={[styles.selectText, interviewForm.type === t.key && styles.selectTextActive]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.inputLabel}>面试轮次</Text>
              <View style={styles.selectRow}>
                {['1', '2', '3'].map(r => (
                  <TouchableOpacity key={r} style={[styles.selectItem, interviewForm.round === r && styles.selectItemActive]} onPress={() => setInterviewForm({ ...interviewForm, round: r })}>
                    <Text style={[styles.selectText, interviewForm.round === r && styles.selectTextActive]}>第{r}轮</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.inputLabel}>面试时间 *</Text>
              <TextInput style={styles.input} placeholder="如: 2024-04-15 14:00" placeholderTextColor="#94a3b8" value={interviewForm.scheduledAt} onChangeText={t => setInterviewForm({ ...interviewForm, scheduledAt: t })} />
              <Text style={styles.inputLabel}>时长(分钟)</Text>
              <TextInput style={styles.input} placeholder="60" placeholderTextColor="#94a3b8" keyboardType="numeric" value={interviewForm.duration} onChangeText={t => setInterviewForm({ ...interviewForm, duration: t })} />
              <Text style={styles.inputLabel}>地点/会议链接</Text>
              <TextInput style={styles.input} placeholder="面试地点或视频会议链接" placeholderTextColor="#94a3b8" value={interviewForm.location} onChangeText={t => setInterviewForm({ ...interviewForm, location: t })} />
              <Text style={styles.inputLabel}>面试官</Text>
              <TextInput style={styles.input} placeholder="面试官姓名" placeholderTextColor="#94a3b8" value={interviewForm.interviewer} onChangeText={t => setInterviewForm({ ...interviewForm, interviewer: t })} />
              <TouchableOpacity style={styles.submitBtn} onPress={handleScheduleInterview}>
                <Text style={styles.submitBtnText}>安排面试并发送邀约</Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 发布职位弹窗 */}
      <Modal visible={showAddJobModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>发布新职位</Text>
              <TouchableOpacity onPress={() => setShowAddJobModal(false)}><Ionicons name="close" size={24} color="#64748b" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>职位名称 *</Text>
              <TextInput style={styles.input} placeholder="例如：前端开发工程师" placeholderTextColor="#94a3b8" value={jobForm.title} onChangeText={t => setJobForm({ ...jobForm, title: t })} />
              <Text style={styles.inputLabel}>所属部门</Text>
              <View style={styles.selectRow}>
                {departments.map(dept => (
                  <TouchableOpacity key={dept} style={[styles.selectItem, jobForm.department === dept && styles.selectItemActive]} onPress={() => setJobForm({ ...jobForm, department: dept })}>
                    <Text style={[styles.selectText, jobForm.department === dept && styles.selectTextActive]}>{dept}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.inputLabel}>工作地点 *</Text>
              <TextInput style={styles.input} placeholder="例如：北京" placeholderTextColor="#94a3b8" value={jobForm.location} onChangeText={t => setJobForm({ ...jobForm, location: t })} />
              <Text style={styles.inputLabel}>薪资范围(K)</Text>
              <View style={styles.salaryRow}>
                <TextInput style={[styles.input, styles.salaryInput]} placeholder="最低" placeholderTextColor="#94a3b8" keyboardType="numeric" value={jobForm.salaryMin} onChangeText={t => setJobForm({ ...jobForm, salaryMin: t })} />
                <Text style={styles.salarySeparator}>-</Text>
                <TextInput style={[styles.input, styles.salaryInput]} placeholder="最高" placeholderTextColor="#94a3b8" keyboardType="numeric" value={jobForm.salaryMax} onChangeText={t => setJobForm({ ...jobForm, salaryMax: t })} />
                <Text style={styles.salaryUnit}>K</Text>
              </View>
              <Text style={styles.inputLabel}>职位描述</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="输入职位描述" placeholderTextColor="#94a3b8" multiline value={jobForm.description} onChangeText={t => setJobForm({ ...jobForm, description: t })} />
              <Text style={styles.inputLabel}>任职要求</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="输入任职要求" placeholderTextColor="#94a3b8" multiline value={jobForm.requirements} onChangeText={t => setJobForm({ ...jobForm, requirements: t })} />
              <TouchableOpacity style={styles.submitBtn} onPress={handlePublishJob}>
                <Text style={styles.submitBtnText}>发布职位</Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 添加候选人弹窗 */}
      <Modal visible={showAddCandidateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>添加候选人</Text>
              <TouchableOpacity onPress={() => setShowAddCandidateModal(false)}><Ionicons name="close" size={24} color="#64748b" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>目标岗位 *</Text>
              {jobs.map(job => (
                <TouchableOpacity key={job.id} style={[styles.selectItem, selectedPostId === job.id && styles.selectItemActive]} onPress={() => setSelectedPostId(job.id)}>
                  <Text style={[styles.selectText, selectedPostId === job.id && styles.selectTextActive]}>{job.title}</Text>
                </TouchableOpacity>
              ))}
              <Text style={styles.inputLabel}>姓名 *</Text>
              <TextInput style={styles.input} placeholder="候选人姓名" placeholderTextColor="#94a3b8" value={candidateForm.name} onChangeText={t => setCandidateForm({ ...candidateForm, name: t })} />
              <Text style={styles.inputLabel}>手机号 *</Text>
              <TextInput style={styles.input} placeholder="候选人手机号" placeholderTextColor="#94a3b8" keyboardType="phone-pad" value={candidateForm.phone} onChangeText={t => setCandidateForm({ ...candidateForm, phone: t })} />
              <Text style={styles.inputLabel}>邮箱</Text>
              <TextInput style={styles.input} placeholder="候选人邮箱" placeholderTextColor="#94a3b8" keyboardType="email-address" value={candidateForm.email} onChangeText={t => setCandidateForm({ ...candidateForm, email: t })} />
              <Text style={styles.inputLabel}>技能（逗号分隔）</Text>
              <TextInput style={styles.input} placeholder="如：React, TypeScript, Node.js" placeholderTextColor="#94a3b8" value={candidateForm.skills} onChangeText={t => setCandidateForm({ ...candidateForm, skills: t })} />
              <Text style={styles.inputLabel}>经验</Text>
              <View style={styles.selectRow}>
                {experiences.filter(e => e !== '不限').map(exp => (
                  <TouchableOpacity key={exp} style={[styles.selectItem, candidateForm.experience === exp && styles.selectItemActive]} onPress={() => setCandidateForm({ ...candidateForm, experience: exp })}>
                    <Text style={[styles.selectText, candidateForm.experience === exp && styles.selectTextActive]}>{exp}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.inputLabel}>来源</Text>
              <View style={styles.selectRow}>
                {[{ key: 'manual', label: '手动添加' }, { key: 'boss', label: 'BOSS直聘' }, { key: 'lagou', label: '拉勾' }, { key: 'referral', label: '内推' }].map(s => (
                  <TouchableOpacity key={s.key} style={[styles.selectItem, candidateForm.source === s.key && styles.selectItemActive]} onPress={() => setCandidateForm({ ...candidateForm, source: s.key })}>
                    <Text style={[styles.selectText, candidateForm.source === s.key && styles.selectTextActive]}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.submitBtn} onPress={handleAddCandidate}>
                <Text style={styles.submitBtnText}>添加候选人</Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, gap: 4 },
  tabActive: { backgroundColor: '#eef2ff', borderRadius: 8 },
  tabText: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  tabTextActive: { color: '#4F46E5', fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#334155', marginBottom: 12, marginTop: 8 },
  statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: '22%', backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#4F46E5' },
  statLabel: { fontSize: 10, color: '#64748b', marginTop: 4 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4F46E5', borderRadius: 10, padding: 14, gap: 8, marginBottom: 16 },
  addBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  jobCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  jobHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  jobTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b', flex: 1 },
  jobMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  metaText: { fontSize: 12, color: '#64748b' },
  jobFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  salary: { fontSize: 15, color: '#ef4444', fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: '500' },
  addCandidateLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addCandidateLinkText: { fontSize: 12, color: '#4F46E5', fontWeight: '500' },
  candidateCount: { fontSize: 12, color: '#64748b' },
  candidateCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  candidateHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '600', color: '#4F46E5' },
  candidateInfo: { flex: 1, marginLeft: 10 },
  candidateName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  candidatePosition: { fontSize: 12, color: '#64748b', marginTop: 2 },
  matchBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  matchScore: { fontSize: 12, fontWeight: '600' },
  candidateMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  candidateActions: { flexDirection: 'row', gap: 8 },
  actionSmallBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#eef2ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  actionSmallText: { fontSize: 12, color: '#4F46E5', fontWeight: '500' },
  interviewCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  interviewHeader: { flexDirection: 'row', alignItems: 'center' },
  interviewTime: { width: 50, alignItems: 'center', backgroundColor: '#eef2ff', borderRadius: 8, paddingVertical: 8 },
  interviewDay: { fontSize: 18, fontWeight: '700', color: '#4F46E5' },
  interviewMonth: { fontSize: 10, color: '#4F46E5' },
  interviewInfo: { flex: 1, marginLeft: 12 },
  interviewPosition: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  interviewCandidate: { fontSize: 12, color: '#64748b', marginTop: 2 },
  interviewTags: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  interviewTag: { fontSize: 11, color: '#1e40af', backgroundColor: '#dbeafe', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  interviewTimeText: { fontSize: 12, color: '#64748b' },
  interviewDuration: { fontSize: 11, color: '#94a3b8' },
  hiredBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f0fdf4', padding: 14, borderRadius: 12, marginTop: 12 },
  hiredText: { fontSize: 14, color: '#166534', fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: '#94a3b8', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#cbd5e1', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%', paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#1e293b' },
  inputLabel: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f9fafb', borderRadius: 10, padding: 12, fontSize: 14, color: '#1e293b', borderWidth: 1, borderColor: '#e5e7eb' },
  textArea: { height: 80, textAlignVertical: 'top' },
  selectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  selectItem: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f1f5f9' },
  selectItemActive: { backgroundColor: '#e0e7ff' },
  selectText: { fontSize: 13, color: '#64748b' },
  selectTextActive: { color: '#4F46E5', fontWeight: '500' },
  salaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  salaryInput: { flex: 1 },
  salarySeparator: { fontSize: 16, color: '#64748b' },
  salaryUnit: { fontSize: 14, color: '#64748b' },
  submitBtn: { backgroundColor: '#4F46E5', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 20 },
  submitBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  detailHeader: { alignItems: 'center', paddingVertical: 20 },
  avatarLarge: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarTextLarge: { fontSize: 28, fontWeight: '600', color: '#4F46E5' },
  detailName: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  detailSection: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  detailLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
  detailValue: { fontSize: 14, color: '#1e293b', marginTop: 2 },
  matchBadgeLarge: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 4 },
  matchScoreLarge: { fontSize: 18, fontWeight: '700' },
  actionTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 12, paddingHorizontal: 16 },
  actionRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 6 },
  actionBtnText: { fontSize: 13, fontWeight: '500' },
  chatMessages: { flex: 1, paddingHorizontal: 16, paddingVertical: 8, maxHeight: 400 },
  chatEmpty: { alignItems: 'center', paddingVertical: 30 },
  chatEmptyText: { fontSize: 14, color: '#94a3b8' },
  chatBubble: { maxWidth: '80%', borderRadius: 12, padding: 10, marginBottom: 8 },
  chatOutbound: { alignSelf: 'flex-end', backgroundColor: '#4F46E5' },
  chatInbound: { alignSelf: 'flex-start', backgroundColor: '#f1f5f9' },
  chatBubbleText: { fontSize: 14, color: '#fff' },
  chatInbound: { alignSelf: 'flex-start', backgroundColor: '#f1f5f9' },
  chatBubbleMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  aiTag: { fontSize: 10, color: '#94a3b8', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 },
  chatTime: { fontSize: 10, color: '#94a3b8' },
  chatInputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  chatInput: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, fontSize: 14, borderWidth: 1, borderColor: '#e5e7eb' },
  sendBtn: { marginLeft: 8, padding: 8 },
});
