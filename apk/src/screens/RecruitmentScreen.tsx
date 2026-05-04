import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PageHeader from '../components/PageHeader';

export default function RecruitmentScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'list' | 'publish'>('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [jobs, setJobs] = useState([
    { id: '1', title: '产品经理', salary: '15-25K', status: '招聘中', candidates: 12 },
    { id: '2', title: '前端开发', salary: '12-20K', status: '招聘中', candidates: 8 },
    { id: '3', title: 'UI设计师', salary: '10-18K', status: '已暂停', candidates: 5 },
  ]);
  const [form, setForm] = useState({ title: '', salary: '', desc: '', requirements: '' });

  const handleAddJob = () => {
    if (!form.title || !form.salary) { Alert.alert('提示', '请填写职位和薪资'); return; }
    setJobs([...jobs, { id: Date.now().toString(), ...form, status: '招聘中', candidates: 0 }]);
    setShowAddModal(false);
    setForm({ title: '', salary: '', desc: '', requirements: '' });
    Alert.alert('成功', '职位发布成功');
  };

  return (
    <View style={styles.container}>
      <PageHeader title="招聘助手" />

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, activeTab === 'list' && styles.tabActive]} onPress={() => setActiveTab('list')}>
          <Ionicons name="list" size={16} color={activeTab === 'list' ? '#4F46E5' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'list' && styles.tabTextActive]}>岗位列表</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'publish' && styles.tabActive]} onPress={() => setActiveTab('publish')}>
          <Ionicons name="add-circle" size={16} color={activeTab === 'publish' ? '#4F46E5' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'publish' && styles.tabTextActive]}>发布岗位</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'list' ? (
          <>
            <Text style={styles.sectionTitle}>在招岗位 ({jobs.length})</Text>
            {jobs.map(job => (
              <View key={job.id} style={styles.jobCard}>
                <View style={styles.jobInfo}>
                  <Text style={styles.jobTitle}>{job.title}</Text>
                  <View style={styles.jobMeta}>
                    <Text style={styles.jobSalary}>{job.salary}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: job.status === '招聘中' ? '#dcfce7' : '#f1f5f9' }]}>
                      <Text style={[styles.statusText, { color: job.status === '招聘中' ? '#166534' : '#64748b' }]}>{job.status}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.jobRight}>
                  <Ionicons name="people" size={14} color="#94a3b8" />
                  <Text style={styles.candidateCount}>{job.candidates}</Text>
                </View>
              </View>
            ))}
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>职位信息</Text>
            <TextInput style={styles.input} placeholder="职位名称" placeholderTextColor="#94a3b8" value={form.title} onChangeText={t => setForm({ ...form, title: t })} />
            <TextInput style={styles.input} placeholder="薪资范围 (如 15-25K)" placeholderTextColor="#94a3b8" value={form.salary} onChangeText={t => setForm({ ...form, salary: t })} />
            <TextInput style={[styles.input, styles.textArea]} placeholder="职位描述" placeholderTextColor="#94a3b8" value={form.desc} onChangeText={t => setForm({ ...form, desc: t })} multiline />
            <TextInput style={[styles.input, styles.textArea]} placeholder="任职要求" placeholderTextColor="#94a3b8" value={form.requirements} onChangeText={t => setForm({ ...form, requirements: t })} multiline />
            <TouchableOpacity style={styles.submitBtn} onPress={handleAddJob}>
              <Text style={styles.submitBtnText}>发布职位</Text>
            </TouchableOpacity>
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 4 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#4F46E5' },
  tabText: { fontSize: 13, color: '#94a3b8' },
  tabTextActive: { color: '#4F46E5', fontWeight: '500' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 12, marginTop: 8 },
  jobCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  jobInfo: { flex: 1 },
  jobTitle: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  jobMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  jobSalary: { fontSize: 13, color: '#ef4444', fontWeight: '500' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 11 },
  jobRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  candidateCount: { fontSize: 13, color: '#64748b' },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 12, fontSize: 14, color: '#1e293b', marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  textArea: { height: 80, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#4F46E5', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 10 },
  submitBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
