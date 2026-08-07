import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Alert, Modal, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PageHeader from '../components/PageHeader';
import {
  recruitmentService, RecruitmentStats, RecruitmentPost, Candidate,
  CandidateStatus, CANDIDATE_STATUS_MAP, JOB_STATUS_MAP,
} from '../services/recruitment.service';

export default function RecruitmentScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'stats' | 'jobs' | 'resumes' | 'interviews'>('stats');
  const [posts, setPosts] = useState<RecruitmentPost[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [stats, setStats] = useState<RecruitmentStats>({
    posts: 0, applications: 0, interviews: 0,
    totalJobs: 0, activeJobs: 0, totalResumes: 0,
    newResumes: 0, totalInterviews: 0, pendingInterviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [matchingJobId, setMatchingJobId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '', department: '技术部', location: '', salaryMin: '', salaryMax: '',
    experience: '1-3年', education: '本科', description: '', requirements: '',
  });

  // ─── 加载数据 ───
  const loadData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const [statsData, postsResult, candidatesResult, interviewsResult] = await Promise.all([
        recruitmentService.getStats(),
        recruitmentService.getPosts(),
        recruitmentService.getCandidates(),
        recruitmentService.getInterviews(),
      ]);

      setStats(statsData);
      setPosts(postsResult.posts);
      setCandidates(candidatesResult.candidates);
      setInterviews(interviewsResult.interviews);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── 发布职位 ───
  const handlePublish = async () => {
    if (!form.title || !form.location || !form.salaryMin || !form.salaryMax) {
      Alert.alert('提示', '请填写必填项（职位名称、工作地点、薪资范围）');
      return;
    }
    try {
      setLoading(true);
      await recruitmentService.createPost({
        title: form.title,
        department: form.department,
        location: form.location,
        salaryMin: parseInt(form.salaryMin),
        salaryMax: parseInt(form.salaryMax),
        experience: form.experience,
        education: form.education,
        description: form.description,
        requirements: form.requirements,
      });
      await loadData();
      setShowAddModal(false);
      setForm({ title: '', department: '技术部', location: '', salaryMin: '', salaryMax: '', experience: '1-3年', education: '本科', description: '', requirements: '' });
      Alert.alert('成功', '职位发布成功');
    } catch (error) {
      Alert.alert('错误', '发布失败，请检查网络后重试');
    } finally {
      setLoading(false);
    }
  };

  // ─── AI 匹配候选人 ───
  const handleMatchCandidates = async (jobId: string) => {
    try {
      setMatchingJobId(jobId);
      const result = await recruitmentService.matchCandidates(jobId);
      Alert.alert('匹配完成', `AI 已为岗位匹配 ${result.count} 位候选人`);
      await loadData();
    } catch (error: any) {
      Alert.alert('匹配失败', error?.message || '请稍后重试');
    } finally {
      setMatchingJobId(null);
    }
  };

  // ─── 更新候选人状态 ───
  const handleUpdateStatus = async (candidateId: string, status: CandidateStatus) => {
    try {
      const statusLabel = CANDIDATE_STATUS_MAP[status]?.label || status;
      await recruitmentService.updateCandidateStatus(candidateId, status, `手动更新为 ${statusLabel}`);
      await loadData();
      setShowDetailModal(false);
      Alert.alert('成功', `候选人状态已更新为「${statusLabel}」`);
    } catch (error: any) {
      Alert.alert('错误', error?.message || '更新失败');
    }
  };

  // ─── 删除岗位 ───
  const handleDeletePost = (jobId: string, title: string) => {
    Alert.alert('确认删除', `确定删除岗位「${title}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除', style: 'destructive',
        onPress: async () => {
          try {
            await recruitmentService.deletePost(jobId);
            await loadData();
          } catch {
            Alert.alert('错误', '删除失败');
          }
        },
      },
    ]);
  };

  // ─── 工具函数 ───
  const getCandidateStatusInfo = (status: string) =>
    CANDIDATE_STATUS_MAP[status as CandidateStatus] || { label: status, color: { bg: '#f1f5f9', text: '#64748b' } };

  const getJobStatusInfo = (status: string) =>
    JOB_STATUS_MAP[status] || { label: status, bg: '#f1f5f9', text: '#64748b' };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const departments = ['技术部', '产品部', '设计部', '市场部', '运营部', '人事部'];
  const experiences = ['不限', '1年以内', '1-3年', '3-5年', '5-10年', '10年以上'];
  const educations = ['不限', '大专', '本科', '硕士', '博士'];

  // ─── 渲染 ───
  return (
    <View style={styles.container}>
      <PageHeader title="智能招聘" />

      {/* Tab 栏 */}
      <View style={styles.tabBar}>
        {([
          { key: 'stats', icon: 'stats-chart', label: '总览' },
          { key: 'jobs', icon: 'briefcase', label: '岗位' },
          { key: 'resumes', icon: 'document-text', label: '候选人' },
          { key: 'interviews', icon: 'calendar', label: '面试' },
        ] as const).map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons name={tab.icon as any} size={18} color={activeTab === tab.key ? '#4F46E5' : '#94a3b8'} />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}
      >
        {loading && <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />}

        {/* ===== 数据总览 ===== */}
        {activeTab === 'stats' && !loading && (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.activeJobs}</Text>
                <Text style={styles.statLabel}>在招职位</Text>
                <Text style={styles.statSub}>/ {stats.totalJobs} 总计</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: '#22c55e' }]}>{stats.totalResumes}</Text>
                <Text style={styles.statLabel}>候选人总数</Text>
                <Text style={[styles.statSub, { color: '#22c55e' }]}>+{stats.newResumes} 新</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats.totalInterviews}</Text>
                <Text style={styles.statLabel}>面试总数</Text>
                <Text style={styles.statSub}>待面试 {stats.pendingInterviews}</Text>
              </View>
            </View>

            {/* 待处理候选人 */}
            <Text style={styles.sectionTitle}>
              待处理候选人 ({candidates.filter(c => c.status === 'matched' || c.status === 'screening').length})
            </Text>
            {candidates
              .filter(c => c.status === 'matched' || c.status === 'screening')
              .slice(0, 5)
              .map(c => {
                const statusInfo = getCandidateStatusInfo(c.status);
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.resumeCard}
                    onPress={() => { setSelectedCandidate(c); setShowDetailModal(true); }}
                  >
                    <View style={styles.resumeHeader}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{c.name?.[0] || '?'}</Text>
                      </View>
                      <View style={styles.resumeInfo}>
                        <Text style={styles.resumeName}>{c.name}</Text>
                        <Text style={styles.resumePosition}>{c.jobTitle || c.location || '未知岗位'}</Text>
                      </View>
                      <View style={[styles.matchBadge, { backgroundColor: (c.matchScore || 0) >= 80 ? '#dcfce7' : (c.matchScore || 0) >= 60 ? '#dbeafe' : '#fef3c7' }]}>
                        <Text style={[styles.matchScore, { color: (c.matchScore || 0) >= 80 ? '#166534' : (c.matchScore || 0) >= 60 ? '#1e40af' : '#92400e' }]}>
                          {c.matchScore || 0}%
                        </Text>
                      </View>
                    </View>
                    <View style={styles.resumeTags}>
                      <Text style={styles.resumeTag}>{c.experience || '未知经验'}</Text>
                      <Text style={styles.resumeTag}>{c.education || '未知学历'}</Text>
                      <Text style={styles.resumeTag}>{statusInfo.label}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

            <TouchableOpacity style={styles.viewMoreBtn} onPress={() => setActiveTab('resumes')}>
              <Text style={styles.viewMoreText}>查看全部候选人</Text>
              <Ionicons name="chevron-forward" size={16} color="#4F46E5" />
            </TouchableOpacity>

            {/* 在招岗位快速浏览 */}
            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
              在招岗位 ({posts.filter(p => p.status === 'recruiting').length})
            </Text>
            {posts.filter(p => p.status === 'recruiting').slice(0, 3).map(job => (
              <View key={job.id} style={styles.jobCardCompact}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobTitleSmall}>{job.title}</Text>
                  <View style={styles.jobMeta}>
                    <View style={styles.metaItem}><Ionicons name="business" size={11} color="#64748b" /><Text style={styles.metaText}>{job.department}</Text></View>
                    <View style={styles.metaItem}><Ionicons name="location" size={11} color="#64748b" /><Text style={styles.metaText}>{job.location}</Text></View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.aiMatchBtn}
                  onPress={() => handleMatchCandidates(job.id)}
                  disabled={matchingJobId === job.id}
                >
                  {matchingJobId === job.id ? (
                    <ActivityIndicator size="small" color="#4F46E5" />
                  ) : (
                    <>
                      <Ionicons name="flash" size={14} color="#4F46E5" />
                      <Text style={styles.aiMatchText}>AI匹配</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* ===== 岗位列表 ===== */}
        {activeTab === 'jobs' && !loading && (
          <>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.addBtnText}>发布新职位</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>职位列表 ({posts.length})</Text>
            {posts.length === 0 && (
              <View style={styles.emptyView}>
                <Ionicons name="briefcase-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>暂无岗位，点击上方按钮发布第一个职位</Text>
              </View>
            )}
            {posts.map(job => {
              const statusInfo = getJobStatusInfo(job.status);
              return (
                <View key={job.id} style={styles.jobCard}>
                  <View style={styles.jobHeader}>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                      <Text style={[styles.statusText, { color: statusInfo.text }]}>{statusInfo.label}</Text>
                    </View>
                  </View>
                  <View style={styles.jobMeta}>
                    <View style={styles.metaItem}><Ionicons name="business" size={13} color="#64748b" /><Text style={styles.metaText}>{job.department}</Text></View>
                    <View style={styles.metaItem}><Ionicons name="location" size={13} color="#64748b" /><Text style={styles.metaText}>{job.location}</Text></View>
                  </View>
                  {job.experience && job.education && (
                    <Text style={styles.jobReqText}>{job.experience} / {job.education}</Text>
                  )}
                  <View style={styles.jobFooter}>
                    <Text style={styles.salary}>
                      {job.salaryMin && job.salaryMax ? `${job.salaryMin}-${job.salaryMax}K` : '薪资面议'}
                    </Text>
                    <View style={styles.jobActions}>
                      <Text style={styles.applicantCount}>{job.candidateCount || 0}人投递</Text>
                      <TouchableOpacity
                        style={styles.aiMatchBtnSmall}
                        onPress={() => handleMatchCandidates(job.id)}
                        disabled={matchingJobId === job.id}
                      >
                        {matchingJobId === job.id ? (
                          <ActivityIndicator size="small" color="#4F46E5" />
                        ) : (
                          <>
                            <Ionicons name="flash" size={12} color="#4F46E5" />
                            <Text style={styles.aiMatchTextSmall}>AI匹配</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeletePost(job.id, job.title)}>
                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* ===== 候选人列表 ===== */}
        {activeTab === 'resumes' && !loading && (
          <>
            <Text style={styles.sectionTitle}>候选人列表 ({candidates.length})</Text>
            {candidates.length === 0 && (
              <View style={styles.emptyView}>
                <Ionicons name="people-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>暂无候选人，在岗位列表中使用 AI 匹配来发现候选人</Text>
              </View>
            )}
            {candidates.map(c => {
              const statusInfo = getCandidateStatusInfo(c.status);
              return (
                <TouchableOpacity
                  key={c.id}
                  style={styles.resumeCard}
                  onPress={() => { setSelectedCandidate(c); setShowDetailModal(true); }}
                >
                  <View style={styles.resumeHeader}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{c.name?.[0] || '?'}</Text>
                    </View>
                    <View style={styles.resumeInfo}>
                      <Text style={styles.resumeName}>{c.name}</Text>
                      <Text style={styles.resumePosition}>{c.jobTitle || c.location || '未知岗位'}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color.bg }]}>
                      <Text style={[styles.statusText, { color: statusInfo.color.text }]}>{statusInfo.label}</Text>
                    </View>
                  </View>
                  <View style={styles.resumeMeta}>
                    <Text style={styles.resumeMetaText}>{c.experience || '未知经验'} | {c.education || '未知学历'}</Text>
                    <Text style={styles.resumeMetaText}>{c.source || 'AI匹配'}</Text>
                  </View>
                  {c.skillsList && c.skillsList.length > 0 && (
                    <View style={styles.resumeTags}>
                      {c.skillsList.slice(0, 5).map((skill, i) => (
                        <Text key={i} style={styles.resumeTag}>{skill}</Text>
                      ))}
                    </View>
                  )}
                  <View style={styles.resumeFooter}>
                    <View style={[styles.matchBadge, { backgroundColor: (c.matchScore || 0) >= 80 ? '#dcfce7' : (c.matchScore || 0) >= 60 ? '#dbeafe' : '#fef3c7' }]}>
                      <Text style={[styles.matchScore, { color: (c.matchScore || 0) >= 80 ? '#166534' : (c.matchScore || 0) >= 60 ? '#1e40af' : '#92400e' }]}>
                        匹配度 {c.matchScore || 0}%
                      </Text>
                    </View>
                    <Text style={styles.applyDate}>{formatDate(c.createdAt)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* ===== 面试列表 ===== */}
        {activeTab === 'interviews' && !loading && (
          <>
            <Text style={styles.sectionTitle}>待面试 ({interviews.length})</Text>
            {interviews.length === 0 && (
              <View style={styles.emptyView}>
                <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>暂无面试安排</Text>
              </View>
            )}
            {interviews.map((item: any, index: number) => {
              const candidate = candidates.find(c => c.id === item.resumeId);
              const job = posts.find(p => p.id === item.jobId);
              return (
                <View key={item.id || index} style={styles.interviewCard}>
                  <View style={styles.interviewHeader}>
                    <View style={styles.interviewTime}>
                      <Text style={styles.interviewDay}>
                        {item.scheduledAt ? new Date(item.scheduledAt).getDate() : '?'}
                      </Text>
                      <Text style={styles.interviewMonth}>
                        {item.scheduledAt ? `${new Date(item.scheduledAt).getMonth() + 1}月` : '待定'}
                      </Text>
                    </View>
                    <View style={styles.interviewInfo}>
                      <Text style={styles.interviewPosition}>{job?.title || '未知岗位'}</Text>
                      <Text style={styles.interviewCandidate}>
                        候选人: {candidate?.name || '未知'}
                      </Text>
                      <View style={styles.interviewTags}>
                        <Text style={styles.interviewTag}>{item.stage === 'interview_scheduled' ? '待面试' : '面试完成'}</Text>
                        <Text style={styles.interviewTime2}>
                          {item.scheduledAt ? new Date(item.scheduledAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.matchBadge, { backgroundColor: (candidate?.matchScore || 0) >= 80 ? '#dcfce7' : '#dbeafe' }]}>
                      <Text style={[styles.matchScore, { color: (candidate?.matchScore || 0) >= 80 ? '#166534' : '#1e40af' }]}>
                        {candidate?.matchScore || 0}%
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ===== 发布职位弹窗 ===== */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>发布新职位</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 16 }}>
              <Text style={styles.inputLabel}>职位名称 *</Text>
              <TextInput style={styles.input} placeholder="例如：前端开发工程师" placeholderTextColor="#94a3b8" value={form.title} onChangeText={t => setForm({ ...form, title: t })} />

              <Text style={styles.inputLabel}>所属部门 *</Text>
              <View style={styles.selectRow}>
                {departments.map(dept => (
                  <TouchableOpacity key={dept} style={[styles.selectItem, form.department === dept && styles.selectItemActive]} onPress={() => setForm({ ...form, department: dept })}>
                    <Text style={[styles.selectText, form.department === dept && styles.selectTextActive]}>{dept}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>工作地点 *</Text>
              <TextInput style={styles.input} placeholder="例如：北京" placeholderTextColor="#94a3b8" value={form.location} onChangeText={t => setForm({ ...form, location: t })} />

              <Text style={styles.inputLabel}>薪资范围 * (K/月)</Text>
              <View style={styles.salaryRow}>
                <TextInput style={[styles.input, styles.salaryInput]} placeholder="最低" placeholderTextColor="#94a3b8" keyboardType="numeric" value={form.salaryMin} onChangeText={t => setForm({ ...form, salaryMin: t })} />
                <Text style={styles.salarySeparator}>-</Text>
                <TextInput style={[styles.input, styles.salaryInput]} placeholder="最高" placeholderTextColor="#94a3b8" keyboardType="numeric" value={form.salaryMax} onChangeText={t => setForm({ ...form, salaryMax: t })} />
                <Text style={styles.salaryUnit}>K</Text>
              </View>

              <Text style={styles.inputLabel}>经验要求</Text>
              <View style={styles.selectRow}>
                {experiences.map(exp => (
                  <TouchableOpacity key={exp} style={[styles.selectItem, form.experience === exp && styles.selectItemActive]} onPress={() => setForm({ ...form, experience: exp })}>
                    <Text style={[styles.selectText, form.experience === exp && styles.selectTextActive]}>{exp}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>学历要求</Text>
              <View style={styles.selectRow}>
                {educations.map(edu => (
                  <TouchableOpacity key={edu} style={[styles.selectItem, form.education === edu && styles.selectItemActive]} onPress={() => setForm({ ...form, education: edu })}>
                    <Text style={[styles.selectText, form.education === edu && styles.selectTextActive]}>{edu}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>职位描述</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="描述该职位的工作内容和职责" placeholderTextColor="#94a3b8" multiline value={form.description} onChangeText={t => setForm({ ...form, description: t })} />

              <Text style={styles.inputLabel}>任职要求</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="列出候选人需要满足的条件" placeholderTextColor="#94a3b8" multiline value={form.requirements} onChangeText={t => setForm({ ...form, requirements: t })} />

              <TouchableOpacity style={styles.submitBtn} onPress={handlePublish} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>发布职位</Text>}
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ===== 候选人详情弹窗 ===== */}
      <Modal visible={showDetailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>候选人详情</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            {selectedCandidate && (() => {
              const statusInfo = getCandidateStatusInfo(selectedCandidate.status);
              return (
                <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 16 }}>
                  {/* 头像和基本信息 */}
                  <View style={styles.resumeDetailHeader}>
                    <View style={styles.avatarLarge}>
                      <Text style={styles.avatarTextLarge}>{selectedCandidate.name?.[0] || '?'}</Text>
                    </View>
                    <Text style={styles.resumeDetailName}>{selectedCandidate.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color.bg }]}>
                      <Text style={[styles.statusText, { color: statusInfo.color.text }]}>{statusInfo.label}</Text>
                    </View>
                  </View>

                  <View style={styles.resumeDetailSection}>
                    <Text style={styles.detailLabel}>应聘岗位</Text>
                    <Text style={styles.detailValue}>{selectedCandidate.jobTitle || '未知'}</Text>
                  </View>

                  <View style={styles.resumeDetailSection}>
                    <Text style={styles.detailLabel}>联系方式</Text>
                    <Text style={styles.detailValue}>{selectedCandidate.phone}</Text>
                    {selectedCandidate.email && <Text style={styles.detailValue}>{selectedCandidate.email}</Text>}
                  </View>

                  <View style={styles.resumeDetailSection}>
                    <Text style={styles.detailLabel}>基本信息</Text>
                    <Text style={styles.detailValue}>
                      {selectedCandidate.experience || '未知经验'} | {selectedCandidate.education || '未知学历'}
                    </Text>
                    {selectedCandidate.location && <Text style={styles.detailValue}>所在地: {selectedCandidate.location}</Text>}
                  </View>

                  <View style={styles.resumeDetailSection}>
                    <Text style={styles.detailLabel}>匹配度</Text>
                    <View style={[styles.matchBadgeLarge, { backgroundColor: (selectedCandidate.matchScore || 0) >= 80 ? '#dcfce7' : (selectedCandidate.matchScore || 0) >= 60 ? '#dbeafe' : '#fef3c7' }]}>
                      <Text style={[styles.matchScoreLarge, { color: (selectedCandidate.matchScore || 0) >= 80 ? '#166534' : (selectedCandidate.matchScore || 0) >= 60 ? '#1e40af' : '#92400e' }]}>
                        {selectedCandidate.matchScore || 0}%
                      </Text>
                    </View>
                  </View>

                  {selectedCandidate.skillsList && selectedCandidate.skillsList.length > 0 && (
                    <View style={styles.resumeDetailSection}>
                      <Text style={styles.detailLabel}>技能标签</Text>
                      <View style={styles.skillsRow}>
                        {selectedCandidate.skillsList.map((skill, i) => (
                          <Text key={i} style={styles.skillTag}>{skill}</Text>
                        ))}
                      </View>
                    </View>
                  )}

                  <View style={styles.resumeDetailSection}>
                    <Text style={styles.detailLabel}>来源</Text>
                    <Text style={styles.detailValue}>{selectedCandidate.source || 'AI匹配'}</Text>
                  </View>

                  <View style={styles.resumeDetailSection}>
                    <Text style={styles.detailLabel}>添加时间</Text>
                    <Text style={styles.detailValue}>
                      {selectedCandidate.createdAt ? new Date(selectedCandidate.createdAt).toLocaleString('zh-CN') : '未知'}
                    </Text>
                  </View>

                  {/* 操作按钮（根据当前状态动态显示） */}
                  <Text style={styles.actionTitle}>处理候选人</Text>
                  <View style={styles.actionRow}>
                    {selectedCandidate.status === 'matched' && (
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#dbeafe' }]} onPress={() => handleUpdateStatus(selectedCandidate.id, 'contacted')}>
                        <Ionicons name="chatbubble-ellipses" size={18} color="#1e40af" />
                        <Text style={[styles.actionBtnText, { color: '#1e40af' }]}>联系候选人</Text>
                      </TouchableOpacity>
                    )}
                    {(selectedCandidate.status === 'matched' || selectedCandidate.status === 'contacted' || selectedCandidate.status === 'replied') && (
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#e0e7ff' }]} onPress={() => handleUpdateStatus(selectedCandidate.id, 'interview_scheduled')}>
                        <Ionicons name="calendar" size={18} color="#3730a3" />
                        <Text style={[styles.actionBtnText, { color: '#3730a3' }]}>安排面试</Text>
                      </TouchableOpacity>
                    )}
                    {selectedCandidate.status === 'interview_scheduled' && (
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#dcfce7' }]} onPress={() => handleUpdateStatus(selectedCandidate.id, 'interview_completed')}>
                        <Ionicons name="checkmark-done" size={18} color="#166534" />
                        <Text style={[styles.actionBtnText, { color: '#166534' }]}>面试完成</Text>
                      </TouchableOpacity>
                    )}
                    {selectedCandidate.status === 'interview_completed' && (
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#d1fae5' }]} onPress={() => handleUpdateStatus(selectedCandidate.id, 'offered')}>
                        <Ionicons name="ribbon" size={18} color="#065f46" />
                        <Text style={[styles.actionBtnText, { color: '#065f46' }]}>发Offer</Text>
                      </TouchableOpacity>
                    )}
                    {selectedCandidate.status === 'offered' && (
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#c7d2fe' }]} onPress={() => handleUpdateStatus(selectedCandidate.id, 'hired')}>
                        <Ionicons name="thumbs-up" size={18} color="#312e81" />
                        <Text style={[styles.actionBtnText, { color: '#312e81' }]}>确认入职</Text>
                      </TouchableOpacity>
                    )}
                    {!['hired', 'rejected', 'expired'].includes(selectedCandidate.status) && (
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]} onPress={() => handleUpdateStatus(selectedCandidate.id, 'rejected')}>
                        <Ionicons name="close-circle" size={18} color="#dc2626" />
                        <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>不合适</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* 面试进度时间线 */}
                  {selectedCandidate.status !== 'screening' && selectedCandidate.status !== 'matched' && (
                    <View style={{ marginTop: 20, marginBottom: 20 }}>
                      <Text style={styles.detailLabel}>招聘进度</Text>
                      <View style={styles.timeline}>
                        {(['matched', 'contacted', 'replied', 'interview_scheduled', 'interview_completed', 'offered', 'hired'] as CandidateStatus[]).map(stage => {
                          const si = getCandidateStatusInfo(stage);
                          const stages: CandidateStatus[] = ['matched', 'contacted', 'replied', 'interview_scheduled', 'interview_completed', 'offered', 'hired'];
                          const stageOrder = stages.indexOf(stage);
                          const currentOrder = stages.indexOf(selectedCandidate.status as any);
                          const isCompleted = stageOrder >= 0 && currentOrder >= 0 && stageOrder <= currentOrder;
                          const isCurrent = stage === selectedCandidate.status;
                          return (
                            <View key={stage} style={styles.timelineItem}>
                              <View style={[styles.timelineDot, isCompleted && styles.timelineDotActive, isCurrent && styles.timelineDotCurrent]} />
                              <Text style={[styles.timelineText, isCompleted && styles.timelineTextActive]}>
                                {si.label}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  <View style={{ height: 40 }} />
                </ScrollView>
              );
            })()}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── 样式 ───
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, gap: 4 },
  tabActive: { backgroundColor: '#eef2ff', borderRadius: 8 },
  tabText: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  tabTextActive: { color: '#4F46E5', fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#334155', marginBottom: 12, marginTop: 8 },

  // 统计卡片
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#4F46E5' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 4 },
  statSub: { fontSize: 10, color: '#64748b', marginTop: 2 },

  // 空状态
  emptyView: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 13, color: '#94a3b8', marginTop: 8 },

  // 岗位卡片
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4F46E5', borderRadius: 10, padding: 14, gap: 8, marginBottom: 16 },
  addBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  jobCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  jobCardCompact: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  jobHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  jobTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b', flex: 1 },
  jobTitleSmall: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: '500' },
  jobMeta: { flexDirection: 'row', gap: 16, marginBottom: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: '#64748b' },
  jobReqText: { fontSize: 12, color: '#94a3b8', marginBottom: 8 },
  jobFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  jobActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  salary: { fontSize: 15, color: '#ef4444', fontWeight: '600' },
  applicantCount: { fontSize: 12, color: '#64748b' },

  // AI 匹配按钮
  aiMatchBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  aiMatchText: { fontSize: 12, color: '#4F46E5', fontWeight: '600' },
  aiMatchBtnSmall: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  aiMatchTextSmall: { fontSize: 11, color: '#4F46E5', fontWeight: '500' },

  // 候选人卡片
  resumeCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  resumeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '600', color: '#4F46E5' },
  resumeInfo: { flex: 1, marginLeft: 10 },
  resumeName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  resumePosition: { fontSize: 12, color: '#64748b', marginTop: 2 },
  matchBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  matchScore: { fontSize: 12, fontWeight: '600' },
  resumeMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  resumeMetaText: { fontSize: 12, color: '#64748b' },
  resumeTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  resumeTag: { fontSize: 11, color: '#64748b', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  resumeFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  applyDate: { fontSize: 11, color: '#94a3b8' },
  viewMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 4 },
  viewMoreText: { fontSize: 14, color: '#4F46E5', fontWeight: '500' },

  // 面试卡片
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
  interviewTime2: { fontSize: 12, color: '#64748b' },

  // 弹窗
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

  // 候选人详情
  resumeDetailHeader: { alignItems: 'center', paddingVertical: 20 },
  avatarLarge: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarTextLarge: { fontSize: 28, fontWeight: '600', color: '#4F46E5' },
  resumeDetailName: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  resumeDetailSection: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  detailLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
  detailValue: { fontSize: 14, color: '#1e293b', marginTop: 2 },
  matchBadgeLarge: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 4 },
  matchScoreLarge: { fontSize: 18, fontWeight: '700' },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  skillTag: { fontSize: 13, color: '#4F46E5', backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  actionTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginTop: 20, marginBottom: 12 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, gap: 6 },
  actionBtnText: { fontSize: 13, fontWeight: '500' },

  // 时间线
  timeline: { flexDirection: 'row', marginTop: 8 },
  timelineItem: { alignItems: 'center', flex: 1 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#e2e8f0' },
  timelineDotActive: { backgroundColor: '#818cf8' },
  timelineDotCurrent: { backgroundColor: '#4F46E5', width: 14, height: 14, borderRadius: 7 },
  timelineText: { fontSize: 9, color: '#94a3b8', marginTop: 4, textAlign: 'center' },
  timelineTextActive: { color: '#4F46E5', fontWeight: '500' },
});
