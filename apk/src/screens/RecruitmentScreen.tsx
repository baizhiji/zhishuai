
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { openWebPage } from '../services/webLink.service';

interface Job {
  id: string;
  title: string;
  salary: string;
  location: string;
  applicants: number;
  status: 'active' | 'paused' | 'closed';
  postedTime: string;
}

interface Resume {
  id: string;
  name: string;
  position: string;
  experience: string;
  status: 'new' | 'reviewed' | 'interviewed' | 'rejected';
  applyTime: string;
}

const MOCK_JOBS: Job[] = [
  { id: '1', title: '前端开发工程师', salary: '15-25K', location: '北京', applicants: 12, status: 'active', postedTime: '3天前' },
  { id: '2', title: '产品经理', salary: '20-35K', location: '上海', applicants: 8, status: 'active', postedTime: '5天前' },
  { id: '3', title: 'UI设计师', salary: '12-20K', location: '深圳', applicants: 15, status: 'paused', postedTime: '1周前' },
];

const MOCK_RESUMES: Resume[] = [
  { id: '1', name: '张三', position: '前端开发工程师', experience: '3年', status: 'new', applyTime: '今天' },
  { id: '2', name: '李四', position: '产品经理', experience: '5年', status: 'reviewed', applyTime: '昨天' },
  { id: '3', name: '王五', position: '前端开发工程师', experience: '2年', status: 'interviewed', applyTime: '3天前' },
];

const STATUS_CONFIG = {
  active: { label: '招聘中', color: '#22C55E' },
  paused: { label: '已暂停', color: '#F59E0B' },
  closed: { label: '已关闭', color: '#94A3B8' },
};

const RESUME_STATUS_CONFIG = {
  new: { label: '待查看', color: '#3B82F6' },
  reviewed: { label: '已查看', color: '#8B5CF6' },
  interviewed: { label: '面试中', color: '#22C55E' },
  rejected: { label: '不合适', color: '#94A3B8' },
};

export default function RecruitmentScreen({ navigation }: { navigation: any }) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'jobs' | 'resumes'>('jobs');
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [postModal, setPostModal] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobSalary, setJobSalary] = useState('');
  const [jobLocation, setJobLocation] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setJobs(MOCK_JOBS);
    setResumes(MOCK_RESUMES);
    setLoading(false);
  };

  const handlePostJob = () => {
    if (!jobTitle.trim() || !jobSalary.trim() || !jobLocation.trim()) {
      Alert.alert('提示', '请填写完整的岗位信息');
      return;
    }
    
    const newJob: Job = {
      id: Date.now().toString(),
      title: jobTitle,
      salary: jobSalary,
      location: jobLocation,
      applicants: 0,
      status: 'active',
      postedTime: '刚刚',
    };
    
    setJobs([newJob, ...jobs]);
    setPostModal(false);
    setJobTitle('');
    setJobSalary('');
    setJobLocation('');
    Alert.alert('发布成功', '岗位已成功发布');
  };

  const handleToggleJobStatus = (job: Job) => {
    const newStatus = job.status === 'active' ? 'paused' : 'active';
    setJobs(jobs.map(j => j.id === job.id ? { ...j, status: newStatus } : j));
  };

  const handleResumeAction = (resume: Resume, action: 'review' | 'interview' | 'reject') => {
    const statusMap = {
      review: 'reviewed',
      interview: 'interviewed',
      reject: 'rejected',
    };
    setResumes(resumes.map(r => r.id === resume.id ? { ...r, status: statusMap[action] } : r));
    Alert.alert('处理成功', `已将「${resume.name}」标记为${RESUME_STATUS_CONFIG[statusMap[action]].label}`);
  };

  const handleOpenWeb = () => {
    openWebPage('recruitment');
  };

  const renderJobItem = ({ item }: { item: Job }) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_CONFIG[item.status].color + '15' }]}>
            <Text style={[styles.statusText, { color: STATUS_CONFIG[item.status].color }]}>
              {STATUS_CONFIG[item.status].label}
            </Text>
          </View>
        </View>
        <View style={styles.salaryRow}>
          <Ionicons name="cash-outline" size={14} color="#22C55E" />
          <Text style={styles.salary}>{item.salary}</Text>
        </View>
      </View>
      
      <View style={styles.cardInfo}>
        <View style={styles.infoItem}>
          <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>{item.location}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="people-outline" size={14} color={theme.textSecondary} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>{item.applicants} 份简历</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>{item.postedTime}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: theme.primaryLight }]}
          onPress={() => handleToggleJobStatus(item)}
        >
          <Text style={[styles.actionBtnText, { color: theme.primary }]}>
            {item.status === 'active' ? '暂停招聘' : '重新发布'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.background }]}>
          <Text style={[styles.actionBtnText, { color: theme.text }]}>查看简历</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderResumeItem = ({ item }: { item: Resume }) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.resumeHeader}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
          </View>
          <View style={styles.resumeInfo}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{item.name}</Text>
            <Text style={[styles.resumePosition, { color: theme.textSecondary }]}>
              应聘：{item.position} | 经验：{item.experience}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: RESUME_STATUS_CONFIG[item.status].color + '15' }]}>
          <Text style={[styles.statusText, { color: RESUME_STATUS_CONFIG[item.status].color }]}>
            {RESUME_STATUS_CONFIG[item.status].label}
          </Text>
        </View>
      </View>
      
      <Text style={[styles.applyTime, { color: theme.textTertiary }]}>投递时间：{item.applyTime}</Text>

      {item.status === 'new' && (
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#22C55E15' }]}
            onPress={() => handleResumeAction(item, 'interview')}
          >
            <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
            <Text style={[styles.actionBtnText, { color: '#22C55E' }]}>约面试</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#94A3B815' }]}
            onPress={() => handleResumeAction(item, 'reject')}
          >
            <Ionicons name="close-circle" size={16} color="#94A3B8" />
            <Text style={[styles.actionBtnText, { color: '#94A3B8' }]}>不合适</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 标签切换 */}
      <View style={[styles.tabBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'jobs' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('jobs')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'jobs' ? theme.primary : theme.textSecondary }]}>
            岗位管理
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'resumes' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('resumes')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'resumes' ? theme.primary : theme.textSecondary }]}>
            简历管理
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'jobs' ? (
          <>
            {/* 发布岗位按钮 */}
            <TouchableOpacity 
              style={[styles.postBtn, { backgroundColor: theme.primary }]}
              onPress={() => setPostModal(true)}
            >
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.postBtnText}>发布新岗位</Text>
            </TouchableOpacity>
            
            {jobs.map(job => renderJobItem({ item: job }))}
          </>
        ) : (
          <>
            {resumes.map(resume => renderResumeItem({ item: resume }))}
          </>
        )}

        {/* Web端入口 */}
        <TouchableOpacity style={[styles.webEntry, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={handleOpenWeb}>
          <Ionicons name="browsers-outline" size={24} color={theme.primary} />
          <View style={styles.webEntryContent}>
            <Text style={[styles.webEntryTitle, { color: theme.text }]}>Web端管理</Text>
            <Text style={[styles.webEntrySubtitle, { color: theme.textSecondary }]}>
              完整功能，请在Web端操作
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
        </TouchableOpacity>
      </ScrollView>

      {/* 发布岗位弹窗 */}
      <Modal visible={postModal} animationType="slide" transparent onRequestClose={() => setPostModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>发布新岗位</Text>
              <TouchableOpacity onPress={() => setPostModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>岗位名称</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                placeholder="请输入岗位名称"
                placeholderTextColor={theme.textTertiary}
                value={jobTitle}
                onChangeText={setJobTitle}
              />
              
              <Text style={[styles.inputLabel, { color: theme.text }]}>薪资范围</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                placeholder="如：15-25K"
                placeholderTextColor={theme.textTertiary}
                value={jobSalary}
                onChangeText={setJobSalary}
              />
              
              <Text style={[styles.inputLabel, { color: theme.text }]}>工作地点</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                placeholder="请输入工作地点"
                placeholderTextColor={theme.textTertiary}
                value={jobLocation}
                onChangeText={setJobLocation}
              />
            </View>

            <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: theme.primary }]} onPress={handlePostJob}>
              <Text style={styles.confirmBtnText}>确认发布</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabText: { fontSize: 15, fontWeight: '500' },
  content: { flex: 1, padding: 16 },
  postBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 10, marginBottom: 16, gap: 8 },
  postBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  cardHeader: { marginBottom: 12 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '500' },
  salaryRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  salary: { fontSize: 14, color: '#22C55E', fontWeight: '600' },
  cardInfo: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 12 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 13 },
  cardActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 4 },
  actionBtnText: { fontSize: 13, fontWeight: '500' },
  resumeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  resumeInfo: { flex: 1, marginLeft: 12 },
  resumePosition: { fontSize: 13, marginTop: 2 },
  applyTime: { fontSize: 12, marginBottom: 12 },
  webEntry: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginTop: 12, marginBottom: 20 },
  webEntryContent: { flex: 1, marginLeft: 12 },
  webEntryTitle: { fontSize: 15, fontWeight: '500' },
  webEntrySubtitle: { fontSize: 12, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 16, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  modalBody: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, marginBottom: 16 },
  confirmBtn: { paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  confirmBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
