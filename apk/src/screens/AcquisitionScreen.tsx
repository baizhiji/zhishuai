import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function AcquisitionScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'tasks' | 'leads'>('tasks');

  const tasks = [
    { id: '1', name: '抖音推广', platform: '抖音', progress: 78, leads: 45 },
    { id: '2', name: '小红书种草', platform: '小红书', progress: 55, leads: 32 },
    { id: '3', name: '朋友圈广告', platform: '微信', progress: 100, leads: 89 },
  ];

  const leads = [
    { id: '1', name: '张先生', company: '某科技公司', source: '抖音', status: '新线索' },
    { id: '2', name: '李女士', company: '某电商公司', source: '小红书', status: '跟进中' },
    { id: '3', name: '王先生', company: '某贸易公司', source: '抖音', status: '已转化' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>智能获客</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, activeTab === 'tasks' && styles.tabActive]} onPress={() => setActiveTab('tasks')}>
          <Ionicons name="construct" size={16} color={activeTab === 'tasks' ? '#4F46E5' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'tasks' && styles.tabTextActive]}>获客任务</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'leads' && styles.tabActive]} onPress={() => setActiveTab('leads')}>
          <Ionicons name="people" size={16} color={activeTab === 'leads' ? '#4F46E5' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'leads' && styles.tabTextActive]}>线索管理</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>
          {activeTab === 'tasks' ? '进行中的任务' : '线索列表'}
        </Text>

        {activeTab === 'tasks' ? (
          tasks.map(task => (
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskName}>{task.name}</Text>
                <View style={styles.platformBadge}><Text style={styles.platformText}>{task.platform}</Text></View>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: task.progress + '%' }]} />
              </View>
              <View style={styles.taskFooter}>
                <Text style={styles.taskProgress}>进度 {task.progress}%</Text>
                <Text style={styles.taskLeads}>获客 {task.leads}</Text>
              </View>
            </View>
          ))
        ) : (
          leads.map(lead => (
            <View key={lead.id} style={styles.leadCard}>
              <View style={styles.leadInfo}>
                <Text style={styles.leadName}>{lead.name}</Text>
                <Text style={styles.leadCompany}>{lead.company}</Text>
              </View>
              <View style={styles.leadRight}>
                <Text style={styles.leadSource}>{lead.source}</Text>
                <View style={[styles.statusBadge, { backgroundColor: lead.status === '新线索' ? '#dbeafe' : lead.status === '跟进中' ? '#fef3c7' : '#dcfce7' }]}>
                  <Text style={[styles.statusText, { color: lead.status === '新线索' ? '#1d4ed8' : lead.status === '跟进中' ? '#b45309' : '#166534' }]}>{lead.status}</Text>
                </View>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 48, paddingBottom: 10, backgroundColor: '#fff' },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 4 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#4F46E5' },
  tabText: { fontSize: 13, color: '#94a3b8' },
  tabTextActive: { color: '#4F46E5', fontWeight: '500' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 12, marginTop: 8 },
  taskCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  taskName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  platformBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  platformText: { fontSize: 11, color: '#64748b' },
  progressBar: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3 },
  progressFill: { height: '100%', backgroundColor: '#4F46E5', borderRadius: 3 },
  taskFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  taskProgress: { fontSize: 12, color: '#64748b' },
  taskLeads: { fontSize: 12, color: '#4F46E5', fontWeight: '500' },
  leadCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  leadInfo: { flex: 1 },
  leadName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  leadCompany: { fontSize: 12, color: '#64748b', marginTop: 2 },
  leadRight: { alignItems: 'flex-end', gap: 4 },
  leadSource: { fontSize: 11, color: '#94a3b8' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '500' },
});
