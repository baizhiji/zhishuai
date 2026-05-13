import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, FlatList, Modal, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PageHeader from '../components/PageHeader';
import { recruitmentService, RecruitmentStats, RecruitmentPost, Candidate } from '../services/recruitment.service';

// 职位类型
interface JobPosition {
  id: string;
  title: string;
  department: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
  experience: string;
  education: string;
  description: string;
  requirements: string;
  status: 'active' | 'closed' | 'draft';
  createdAt: string;
  applicants: number;
}

// 简历类型
interface Resume {
  id: string;
  name: string;
  position: string;
  phone: string;
  email: string;
  experience: string;
  education: string;
  matchScore: number;
  status: 'pending' | 'reviewed' | 'interview' | 'rejected' | 'hired';
  source: string;
  applyDate: string;
  skills: string[];
}

// 模拟数据
const mockJobs: JobPosition[] = [
  { id: '1', title: '前端开发工程师', department: '技术部', location: '北京', salaryMin: 15, salaryMax: 25, experience: '3-5年', education: '本科', description: '负责公司前端开发工作', requirements: '熟练掌握React/Vue', status: 'active', createdAt: '2024-03-25', applicants: 42 },
  { id: '2', title: '产品经理', department: '产品部', location: '上海', salaryMin: 20, salaryMax: 35, experience: '5-10年', education: '本科', description: '负责产品规划与设计', requirements: '有B端产品经验', status: 'active', createdAt: '2024-03-24', applicants: 28 },
  { id: '3', title: 'UI设计师', department: '设计部', location: '深圳', salaryMin: 12, salaryMax: 20, experience: '2-3年', education: '本科', description: '负责界面设计', requirements: '熟练使用Figma', status: 'active', createdAt: '2024-03-23', applicants: 15 },
];

const mockResumes: Resume[] = [
  { id: '1', name: '李明', position: '前端开发工程师', phone: '138****1234', email: 'liming@example.com', experience: '5年', education: '本科', matchScore: 95, status: 'pending', source: 'BOSS直聘', applyDate: '2024-03-25', skills: ['React', 'Vue', 'TypeScript'] },
  { id: '2', name: '王芳', position: '前端开发工程师', phone: '139****5678', email: 'wangfang@example.com', experience: '3年', education: '硕士', matchScore: 88, status: 'pending', source: '前程无忧', applyDate: '2024-03-24', skills: ['React', 'JavaScript'] },
  { id: '3', name: '张伟', position: '产品经理', phone: '137****9012', email: 'zhangwei@example.com', experience: '4年', education: '本科', matchScore: 82, status: 'reviewed', source: '智联招聘', applyDate: '2024-03-23', skills: ['产品规划', '需求分析'] },
];

export default function RecruitmentScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'stats' | 'jobs' | 'resumes' | 'interviews'>('stats');
  const [jobs, setJobs] = useState<RecruitmentPost[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stats, setStats] = useState<RecruitmentStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalResumes: 0,
    newResumes: 0,
    totalInterviews: 0,
    pendingInterviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [form, setForm] = useState({
    title: '',
    department: '技术部',
    location: '',
    salaryMin: '',
    salaryMax: '',
    experience: '1-3年',
    education: '本科',
    description: '',
    requirements: '',
  });

  // 加载数据
  const loadData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      
      const [statsData, postsData, candidatesData] = await Promise.all([
        recruitmentService.getStats(),
        recruitmentService.getPosts(),
        recruitmentService.getCandidates(),
      ]);
      
      setStats(statsData);
      setJobs(postsData);
      setCandidates(candidatesData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 发布职位
  const handlePublish = async () => {
    if (!form.title || !form.location || !form.salaryMin || !form.salaryMax) {
      Alert.alert('提示', '请填写必填项');
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
      Alert.alert('错误', '发布失败');
    } finally {
      setLoading(false);
    }
  };

  // 更新简历状态
  const updateResumeStatus = async (id: string, status: Candidate['status']) => {
    try {
      await recruitmentService.updateCandidateStatus(id, status);
      await loadData();
      Alert.alert('成功', '简历状态已更新');
      setShowResumeModal(false);
    } catch (error) {
      Alert.alert('错误', '更新失败');
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'pending': return { bg: '#dcfce7', text: '#166534' };
      case 'closed': case 'rejected': return { bg: '#f1f5f9', text: '#64748b' };
      case 'draft': case 'reviewed': return { bg: '#fef3c7', text: '#92400e' };
      case 'interview': return { bg: '#dbeafe', text: '#1e40af' };
      case 'hired': return { bg: '#d1fae5', text: '#065f46' };
      default: return { bg: '#f1f5f9', text: '#64748b' };
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '招聘中';
      case 'closed': return '已关闭';
      case 'draft': return '草稿';
      case 'pending': return '待处理';
      case 'reviewed': return '已查看';
      case 'interview': return '面试';
      case 'rejected': return '不合适';
      case 'hired': return '已入职';
      default: return status;
    }
  };

  const departments = ['技术部', '产品部', '设计部', '市场部', '运营部', '人事部'];
  const experiences = ['不限', '1年以内', '1-3年', '3-5年', '5-10年', '10年以上'];
  const educations = ['不限', '大专', '本科', '硕士', '博士'];

  return (
    <View style={styles.container}>
      <PageHeader title="招聘助手" />

      {/* Tab栏 */}
      <View style={styles.tabBar}>
        {[
          { key: 'stats', icon: 'stats-chart', label: '数据' },
          { key: 'jobs', icon: 'briefcase', label: '岗位' },
          { key: 'resumes', icon: 'document-text', label: '简历' },
          { key: 'interviews', icon: 'calendar', label: '面试' },
        ].map(tab => (
          <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && styles.tabActive]} onPress={() => setActiveTab(tab.key as any)}>
            <Ionicons name={tab.icon as any} size={18} color={activeTab === tab.key ? '#4F46E5' : '#94a3b8'} />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 数据统计 */}
        {activeTab === 'stats' && (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.activeJobs}</Text>
                <Text style={styles.statLabel}>在招职位</Text>
                <Text style={styles.statSub}>/ {stats.totalJobs} 总计</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: '#22c55e' }]}>{stats.totalResumes}</Text>
                <Text style={styles.statLabel}>简历总数</Text>
                <Text style={[styles.statSub, { color: '#22c55e' }]}>+{stats.newResumes} 新</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats.totalInterviews}</Text>
                <Text style={styles.statLabel}>面试总数</Text>
                <Text style={styles.statSub}>待面试 {stats.pendingInterviews}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>待处理简历 ({candidates.filter(r => r.status === 'pending').length})</Text>
            {candidates.filter(r => r.status === 'pending').slice(0, 3).map(resume => (
              <TouchableOpacity key={resume.id} style={styles.resumeCard} onPress={() => { setSelectedResume(resume); setShowResumeModal(true); }}>
                <View style={styles.resumeHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{resume.name[0]}</Text>
                  </View>
                  <View style={styles.resumeInfo}>
                    <Text style={styles.resumeName}>{resume.name}</Text>
                    <Text style={styles.resumePosition}>{resume.position}</Text>
                  </View>
                  <View style={[styles.matchBadge, { backgroundColor: resume.matchScore >= 90 ? '#dcfce7' : resume.matchScore >= 80 ? '#dbeafe' : '#fef3c7' }]}>
                    <Text style={[styles.matchScore, { color: resume.matchScore >= 90 ? '#166534' : resume.matchScore >= 80 ? '#1e40af' : '#92400e' }]}>{resume.matchScore}%</Text>
                  </View>
                </View>
                <View style={styles.resumeTags}>
                  <Text style={styles.resumeTag}>{resume.experience}</Text>
                  <Text style={styles.resumeTag}>{resume.education}</Text>
                  <Text style={styles.resumeTag}>{resume.source}</Text>
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.viewMoreBtn} onPress={() => setActiveTab('resumes')}>
              <Text style={styles.viewMoreText}>查看全部简历</Text>
              <Ionicons name="chevron-forward" size={16} color="#4F46E5" />
            </TouchableOpacity>
          </>
        )}

        {/* 岗位列表 */}
        {activeTab === 'jobs' && (
          <>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.addBtnText}>发布新职位</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>职位列表 ({jobs.length})</Text>
            {jobs.map(job => (
              <View key={job.id} style={styles.jobCard}>
                <View style={styles.jobHeader}>
                  <Text style={styles.jobTitle}>{job.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status).bg }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(job.status).text }]}>{getStatusText(job.status)}</Text>
                  </View>
                </View>
                <View style={styles.jobMeta}>
                  <View style={styles.metaItem}><Ionicons name="business" size={12} color="#64748b" /><Text style={styles.metaText}>{job.department}</Text></View>
                  <View style={styles.metaItem}><Ionicons name="location" size={12} color="#64748b" /><Text style={styles.metaText}>{job.location}</Text></View>
                </View>
                <View style={styles.jobFooter}>
                  <Text style={styles.salary}>{job.salaryMin}-{job.salaryMax}K</Text>
                  <View style={styles.applicants}>
                    <Ionicons name="people" size={14} color="#64748b" />
                    <Text style={styles.applicantCount}>{job.applicants}人投递</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {/* 简历列表 */}
        {activeTab === 'resumes' && (
          <>
            <Text style={styles.sectionTitle}>简历列表 ({candidates.length})</Text>
            {candidates.map(resume => (
              <TouchableOpacity key={resume.id} style={styles.resumeCard} onPress={() => { setSelectedResume(resume); setShowResumeModal(true); }}>
                <View style={styles.resumeHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{resume.name[0]}</Text>
                  </View>
                  <View style={styles.resumeInfo}>
                    <Text style={styles.resumeName}>{resume.name}</Text>
                    <Text style={styles.resumePosition}>{resume.position}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(resume.status).bg }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(resume.status).text }]}>{getStatusText(resume.status)}</Text>
                  </View>
                </View>
                <View style={styles.resumeMeta}>
                  <Text style={styles.resumeMetaText}>{resume.experience} | {resume.education}</Text>
                  <Text style={styles.resumeMetaText}>{resume.source}</Text>
                </View>
                <View style={styles.resumeTags}>
                  {resume.skills.slice(0, 3).map((skill, i) => (
                    <Text key={i} style={styles.resumeTag}>{skill}</Text>
                  ))}
                </View>
                <View style={styles.resumeFooter}>
                  <View style={[styles.matchBadge, { backgroundColor: resume.matchScore >= 90 ? '#dcfce7' : resume.matchScore >= 80 ? '#dbeafe' : '#fef3c7' }]}>
                    <Text style={[styles.matchScore, { color: resume.matchScore >= 90 ? '#166534' : resume.matchScore >= 80 ? '#1e40af' : '#92400e' }]}>匹配度 {resume.matchScore}%</Text>
                  </View>
                  <Text style={styles.applyDate}>投递: {resume.applyDate}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* 面试安排 */}
        {activeTab === 'interviews' && (
          <>
            <Text style={styles.sectionTitle}>待面试 ({stats.pendingInterviews})</Text>
            <View style={styles.interviewCard}>
              <View style={styles.interviewHeader}>
                <View style={styles.interviewTime}>
                  <Text style={styles.interviewDay}>15</Text>
                  <Text style={styles.interviewMonth}>4月</Text>
                </View>
                <View style={styles.interviewInfo}>
                  <Text style={styles.interviewPosition}>前端开发工程师</Text>
                  <Text style={styles.interviewCandidate}>候选人: 张明</Text>
                  <View style={styles.interviewTags}>
                    <Text style={styles.interviewTag}>初试</Text>
                    <Text style={styles.interviewTime2}>10:00</Text>
                  </View>
                </View>
                <View style={[styles.matchBadge, { backgroundColor: '#dbeafe' }]}>
                  <Text style={[styles.matchScore, { color: '#1e40af' }]}>92%</Text>
                </View>
              </View>
            </View>

            <View style={styles.interviewCard}>
              <View style={styles.interviewHeader}>
                <View style={styles.interviewTime}>
                  <Text style={styles.interviewDay}>15</Text>
                  <Text style={styles.interviewMonth}>4月</Text>
                </View>
                <View style={styles.interviewInfo}>
                  <Text style={styles.interviewPosition}>产品经理</Text>
                  <Text style={styles.interviewCandidate}>候选人: 李华</Text>
                  <View style={styles.interviewTags}>
                    <Text style={[styles.interviewTag, { backgroundColor: '#fef3c7' }]}>复试</Text>
                    <Text style={styles.interviewTime2}>14:00</Text>
                  </View>
                </View>
                <View style={[styles.matchBadge, { backgroundColor: '#dcfce7' }]}>
                  <Text style={[styles.matchScore, { color: '#166534' }]}>88%</Text>
                </View>
              </View>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 发布职位弹窗 */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>发布新职位</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
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

              <Text style={styles.inputLabel}>薪资范围 *</Text>
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
              <TextInput style={[styles.input, styles.textArea]} placeholder="输入职位描述" placeholderTextColor="#94a3b8" multiline value={form.description} onChangeText={t => setForm({ ...form, description: t })} />

              <Text style={styles.inputLabel}>任职要求</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="输入任职要求" placeholderTextColor="#94a3b8" multiline value={form.requirements} onChangeText={t => setForm({ ...form, requirements: t })} />

              <TouchableOpacity style={styles.submitBtn} onPress={handlePublish}>
                <Text style={styles.submitBtnText}>发布职位</Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 简历详情弹窗 */}
      <Modal visible={showResumeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>简历详情</Text>
              <TouchableOpacity onPress={() => setShowResumeModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            {selectedResume && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.resumeDetailHeader}>
                  <View style={styles.avatarLarge}>
                    <Text style={styles.avatarTextLarge}>{selectedResume.name[0]}</Text>
                  </View>
                  <Text style={styles.resumeDetailName}>{selectedResume.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedResume.status).bg }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(selectedResume.status).text }]}>{getStatusText(selectedResume.status)}</Text>
                  </View>
                </View>

                <View style={styles.resumeDetailSection}>
                  <Text style={styles.detailLabel}>应聘职位</Text>
                  <Text style={styles.detailValue}>{selectedResume.position}</Text>
                </View>

                <View style={styles.resumeDetailSection}>
                  <Text style={styles.detailLabel}>联系方式</Text>
                  <Text style={styles.detailValue}>{selectedResume.phone}</Text>
                  <Text style={styles.detailValue}>{selectedResume.email}</Text>
                </View>

                <View style={styles.resumeDetailSection}>
                  <Text style={styles.detailLabel}>基本信息</Text>
                  <Text style={styles.detailValue}>{selectedResume.experience} | {selectedResume.education}</Text>
                </View>

                <View style={styles.resumeDetailSection}>
                  <Text style={styles.detailLabel}>匹配度</Text>
                  <View style={[styles.matchBadgeLarge, { backgroundColor: selectedResume.matchScore >= 90 ? '#dcfce7' : selectedResume.matchScore >= 80 ? '#dbeafe' : '#fef3c7' }]}>
                    <Text style={[styles.matchScoreLarge, { color: selectedResume.matchScore >= 90 ? '#166534' : selectedResume.matchScore >= 80 ? '#1e40af' : '#92400e' }]}>{selectedResume.matchScore}%</Text>
                  </View>
                </View>

                <View style={styles.resumeDetailSection}>
                  <Text style={styles.detailLabel}>技能标签</Text>
                  <View style={styles.skillsRow}>
                    {selectedResume.skills.map((skill, i) => (
                      <Text key={i} style={styles.skillTag}>{skill}</Text>
                    ))}
                  </View>
                </View>

                <View style={styles.resumeDetailSection}>
                  <Text style={styles.detailLabel}>来源</Text>
                  <Text style={styles.detailValue}>{selectedResume.source}</Text>
                </View>

                <Text style={styles.actionTitle}>处理简历</Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#dbeafe' }]} onPress={() => updateResumeStatus(selectedResume.id, 'interview')}>
                    <Ionicons name="calendar" size={18} color="#1e40af" />
                    <Text style={[styles.actionBtnText, { color: '#1e40af' }]}>安排面试</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#dcfce7' }]} onPress={() => updateResumeStatus(selectedResume.id, 'reviewed')}>
                    <Ionicons name="checkmark-circle" size={18} color="#166534" />
                    <Text style={[styles.actionBtnText, { color: '#166534' }]}>已查看</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]} onPress={() => updateResumeStatus(selectedResume.id, 'rejected')}>
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
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#4F46E5' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 4 },
  statSub: { fontSize: 10, color: '#64748b', marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4F46E5', borderRadius: 10, padding: 14, gap: 8, marginBottom: 16 },
  addBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  jobCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  jobHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  jobTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: '500' },
  jobMeta: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#64748b' },
  jobFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  salary: { fontSize: 15, color: '#ef4444', fontWeight: '600' },
  applicants: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  applicantCount: { fontSize: 12, color: '#64748b' },
  resumeCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  resumeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '600', color: '#4F46E5' },
  resumeInfo: { flex: 1, marginLeft: 10 },
  resumeName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  resumePosition: { fontSize: 12, color: '#64748b', marginTop: 2 },
  matchBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  matchScore: { fontSize: 12, fontWeight: '600' },
  resumeTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  resumeTag: { fontSize: 11, color: '#64748b', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  resumeMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  resumeMetaText: { fontSize: 12, color: '#64748b' },
  resumeFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  applyDate: { fontSize: 11, color: '#94a3b8' },
  viewMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 4 },
  viewMoreText: { fontSize: 14, color: '#4F46E5', fontWeight: '500' },
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
  resumeDetailHeader: { alignItems: 'center', paddingVertical: 20 },
  avatarLarge: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarTextLarge: { fontSize: 28, fontWeight: '600', color: '#4F46E5' },
  resumeDetailName: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  resumeDetailSection: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  detailLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
  detailValue: { fontSize: 14, color: '#1e293b', marginTop: 2 },
  matchBadgeLarge: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 4 },
  matchScoreLarge: { fontSize: 18, fontWeight: '700' },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  skillTag: { fontSize: 13, color: '#4F46E5', backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  actionTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginTop: 20, marginBottom: 12, paddingHorizontal: 16 },
  actionRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 6 },
  actionBtnText: { fontSize: 13, fontWeight: '500' },
});
