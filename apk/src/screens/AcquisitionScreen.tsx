import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import acquisitionService from '../services/acquisition.service';

// 获客任务类型
interface Task {
  id: string;
  name: string;
  channel: 'douyin' | 'wechat' | 'sms' | 'xiaohongshu';
  status: 'running' | 'completed' | 'paused';
  progress: number;
  sent: number;
  scanned: number;
  converted: number;
  startTime: string;
}

// 线索类型
interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  status: 'new' | 'contacted' | 'converted' | 'invalid';
  createTime: string;
  tags: string[];
}

// 统计数据
const stats = {
  discover: 1256,
  discoverChange: 15.8,
  sent: 45892,
  sentChange: 12.3,
  scanned: 8934,
  scannedChange: 8.5,
  converted: 1523,
  convertedChange: 18.2,
};

// 漏斗数据
const funnelData = [
  { stage: '发送消息', count: 45892, rate: 100 },
  { stage: '查看消息', count: 28934, rate: 63 },
  { stage: '扫码次数', count: 8934, rate: 19 },
  { stage: '成功转化', count: 1523, rate: 3.3 },
];

// 渠道分布
const channelData = [
  { channel: '抖音', count: 1856, rate: 12.2, color: '#ff4757' },
  { channel: '微信', count: 4567, rate: 30.0, color: '#07c160' },
  { channel: '短信', count: 8934, rate: 58.7, color: '#4F46E5' },
  { channel: '小红书', count: 1234, rate: 8.1, color: '#ff6b9d' },
];

// 模拟任务数据
const mockTasks: Task[] = [
  { id: '1', name: '新品推广活动', channel: 'douyin', status: 'running', progress: 78, sent: 1234, scanned: 456, converted: 78, startTime: '2024-03-25 10:30' },
  { id: '2', name: '限时优惠引流', channel: 'wechat', status: 'running', progress: 55, sent: 2345, scanned: 876, converted: 156, startTime: '2024-03-25 09:15' },
  { id: '3', name: '会员招募短信', channel: 'sms', status: 'completed', progress: 100, sent: 5678, scanned: 1234, converted: 234, startTime: '2024-03-24 14:20' },
  { id: '4', name: '新品预约通知', channel: 'douyin', status: 'paused', progress: 45, sent: 987, scanned: 345, converted: 56, startTime: '2024-03-24 11:45' },
];

// 模拟线索数据
const mockLeads: Lead[] = [
  { id: '1', name: '张先生', phone: '138****1234', source: '抖音广告', status: 'new', createTime: '2024-03-25', tags: ['高意向', '北京'] },
  { id: '2', name: '李女士', phone: '139****5678', source: '微信推广', status: 'contacted', createTime: '2024-03-25', tags: ['已咨询', '上海'] },
  { id: '3', name: '王先生', phone: '137****9012', source: '短信链接', status: 'converted', createTime: '2024-03-24', tags: ['已付费', '深圳'] },
  { id: '4', name: '刘女士', phone: '136****3456', source: '小红书', status: 'new', createTime: '2024-03-24', tags: ['高意向'] },
];

export default function AcquisitionScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'stats' | 'tasks' | 'leads'>('stats');
  const [tasks, setTasks] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ discover: 0, sent: 0, scanned: 0, converted: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    channel: 'douyin',
    content: '',
    targetCount: '',
  });

  // 加载数据
  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [tasksData, leadsData, statsData] = await Promise.all([
        acquisitionService.getTasks(user.id),
        acquisitionService.getLeads(user.id),
        acquisitionService.getStats(user.id),
      ]);
      setTasks(tasksData);
      setLeads(leadsData);
      setStats(statsData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // 创建获客任务
  const handleCreateTask = async () => {
    if (!form.name || !form.content || !form.targetCount) {
      Alert.alert('提示', '请填写完整信息');
      return;
    }
    try {
      const newTask = await acquisitionService.createTask(user!.id, {
        name: form.name,
        channel: form.channel,
        content: form.content,
        targetCount: parseInt(form.targetCount),
      });
      setTasks([newTask, ...tasks]);
      setShowAddModal(false);
      setForm({ name: '', channel: 'douyin', content: '', targetCount: '' });
      Alert.alert('成功', '获客任务已创建');
    } catch (error) {
      Alert.alert('错误', '创建任务失败');
    }
  };

  // 更新线索状态
  const updateLeadStatus = async (id: string, status: string) => {
    try {
      await acquisitionService.updateLeadStatus(id, status);
      setLeads(leads.map(l => l.id === id ? { ...l, status } : l));
      Alert.alert('成功', `线索状态已更新`);
      setShowLeadModal(false);
    } catch (error) {
      Alert.alert('错误', '更新状态失败');
    }
  };

  // 获取渠道信息
  const getChannelInfo = (channel: string) => {
    switch (channel) {
      case 'douyin': return { name: '抖音', icon: 'logo-octocat' as const, color: '#ff4757' };
      case 'wechat': return { name: '微信', icon: 'chatbubble' as const, color: '#07c160' };
      case 'sms': return { name: '短信', icon: 'mail' as const, color: '#4F46E5' };
      case 'xiaohongshu': return { name: '小红书', icon: 'book' as const, color: '#ff6b9d' };
      default: return { name: channel, icon: 'globe' as const, color: '#64748b' };
    }
  };

  // 获取状态颜色
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'running': case 'new': return { bg: '#dbeafe', text: '#1e40af' };
      case 'completed': case 'converted': return { bg: '#dcfce7', text: '#166534' };
      case 'paused': case 'contacted': return { bg: '#fef3c7', text: '#92400e' };
      case 'invalid': return { bg: '#fee2e2', text: '#dc2626' };
      default: return { bg: '#f1f5f9', text: '#64748b' };
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'running': return '进行中';
      case 'completed': return '已完成';
      case 'paused': return '已暂停';
      case 'new': return '新线索';
      case 'contacted': return '已联系';
      case 'converted': return '已转化';
      case 'invalid': return '无效';
      default: return status;
    }
  };

  return (
    <View style={styles.container}>
      <PageHeader title="智能获客" />

      {/* Tab栏 */}
      <View style={styles.tabBar}>
        {[
          { key: 'stats', icon: 'stats-chart', label: '数据' },
          { key: 'tasks', icon: 'rocket', label: '任务' },
          { key: 'leads', icon: 'people', label: '线索' },
        ].map(tab => (
          <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && styles.tabActive]} onPress={() => setActiveTab(tab.key as any)}>
            <Ionicons name={tab.icon as any} size={18} color={activeTab === tab.key ? '#4F46E5' : '#94a3b8'} />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* 数据统计 */}
        {activeTab === 'stats' && (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
                  <Ionicons name="eye" size={18} color="#1890ff" />
                </View>
                <Text style={styles.statValue}>{stats.discover.toLocaleString()}</Text>
                <Text style={styles.statLabel}>发现潜客</Text>
                <Text style={[styles.statChange, { color: stats.discoverChange > 0 ? '#22c55e' : '#ef4444' }]}>
                  {stats.discoverChange > 0 ? '↑' : '↓'} {Math.abs(stats.discoverChange)}%
                </Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
                  <Ionicons name="send" size={18} color="#52c41a" />
                </View>
                <Text style={styles.statValue}>{stats.sent > 9999 ? (stats.sent / 1000).toFixed(1) + 'k' : stats.sent}</Text>
                <Text style={styles.statLabel}>发送消息</Text>
                <Text style={[styles.statChange, { color: stats.sentChange > 0 ? '#22c55e' : '#ef4444' }]}>
                  {stats.sentChange > 0 ? '↑' : '↓'} {Math.abs(stats.sentChange)}%
                </Text>
              </View>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="qr-code" size={18} color="#f59e0b" />
                </View>
                <Text style={styles.statValue}>{stats.scanned > 9999 ? (stats.scanned / 1000).toFixed(1) + 'k' : stats.scanned}</Text>
                <Text style={styles.statLabel}>扫码次数</Text>
                <Text style={[styles.statChange, { color: stats.scannedChange > 0 ? '#22c55e' : '#ef4444' }]}>
                  {stats.scannedChange > 0 ? '↑' : '↓'} {Math.abs(stats.scannedChange)}%
                </Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#f3e8ff' }]}>
                  <Ionicons name="checkmark-circle" size={18} color="#9333ea" />
                </View>
                <Text style={styles.statValue}>{stats.converted.toLocaleString()}</Text>
                <Text style={styles.statLabel}>成功转化</Text>
                <Text style={[styles.statChange, { color: stats.convertedChange > 0 ? '#22c55e' : '#ef4444' }]}>
                  {stats.convertedChange > 0 ? '↑' : '↓'} {Math.abs(stats.convertedChange)}%
                </Text>
              </View>
            </View>

            {/* 转化漏斗 */}
            <Text style={styles.sectionTitle}>转化漏斗</Text>
            <View style={styles.funnelCard}>
              {funnelData.map((item, index) => (
                <View key={index} style={styles.funnelItem}>
                  <View style={[styles.funnelBar, { width: `${item.rate}%`, backgroundColor: ['#4F46E5', '#818cf8', '#a5b4fc', '#c7d2fe'][index] }]} />
                  <View style={styles.funnelContent}>
                    <Text style={styles.funnelStage}>{item.stage}</Text>
                    <Text style={styles.funnelCount}>{item.count.toLocaleString()}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* 渠道分布 */}
            <Text style={styles.sectionTitle}>渠道分布</Text>
            <View style={styles.channelCard}>
              {channelData.map((item, index) => (
                <View key={index} style={styles.channelItem}>
                  <View style={[styles.channelDot, { backgroundColor: item.color }]} />
                  <Text style={styles.channelName}>{item.channel}</Text>
                  <Text style={styles.channelCount}>{item.count.toLocaleString()}</Text>
                  <Text style={styles.channelRate}>{item.rate}%</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* 获客任务 */}
        {activeTab === 'tasks' && (
          <>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.addBtnText}>创建获客任务</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>进行中的任务 ({tasks.filter(t => t.status === 'running').length})</Text>
            {tasks.filter(t => t.status === 'running').map(task => {
              const channelInfo = getChannelInfo(task.channel);
              return (
                <View key={task.id} style={styles.taskCard}>
                  <View style={styles.taskHeader}>
                    <View style={styles.taskTitleRow}>
                      <View style={[styles.channelBadge, { backgroundColor: channelInfo.color + '20' }]}>
                        <Ionicons name={channelInfo.icon} size={14} color={channelInfo.color} />
                      </View>
                      <Text style={styles.taskName}>{task.name}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusConfig(task.status).bg }]}>
                      <Text style={[styles.statusText, { color: getStatusConfig(task.status).text }]}>{getStatusText(task.status)}</Text>
                    </View>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${task.progress}%` }]} />
                  </View>
                  <View style={styles.taskStats}>
                    <View style={styles.taskStat}>
                      <Text style={styles.taskStatValue}>{task.sent}</Text>
                      <Text style={styles.taskStatLabel}>发送</Text>
                    </View>
                    <View style={styles.taskStat}>
                      <Text style={styles.taskStatValue}>{task.scanned}</Text>
                      <Text style={styles.taskStatLabel}>扫码</Text>
                    </View>
                    <View style={styles.taskStat}>
                      <Text style={styles.taskStatValue}>{task.converted}</Text>
                      <Text style={styles.taskStatLabel}>转化</Text>
                    </View>
                    <Text style={styles.taskProgress}>{task.progress}%</Text>
                  </View>
                </View>
              );
            })}

            <Text style={styles.sectionTitle}>已完成的任务 ({tasks.filter(t => t.status === 'completed').length})</Text>
            {tasks.filter(t => t.status !== 'running').map(task => {
              const channelInfo = getChannelInfo(task.channel);
              return (
                <View key={task.id} style={styles.taskCard}>
                  <View style={styles.taskHeader}>
                    <View style={styles.taskTitleRow}>
                      <View style={[styles.channelBadge, { backgroundColor: channelInfo.color + '20' }]}>
                        <Ionicons name={channelInfo.icon} size={14} color={channelInfo.color} />
                      </View>
                      <Text style={styles.taskName}>{task.name}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusConfig(task.status).bg }]}>
                      <Text style={[styles.statusText, { color: getStatusConfig(task.status).text }]}>{getStatusText(task.status)}</Text>
                    </View>
                  </View>
                  <View style={styles.taskStats}>
                    <View style={styles.taskStat}>
                      <Text style={styles.taskStatValue}>{task.sent}</Text>
                      <Text style={styles.taskStatLabel}>发送</Text>
                    </View>
                    <View style={styles.taskStat}>
                      <Text style={styles.taskStatValue}>{task.scanned}</Text>
                      <Text style={styles.taskStatLabel}>扫码</Text>
                    </View>
                    <View style={styles.taskStat}>
                      <Text style={styles.taskStatValue}>{task.converted}</Text>
                      <Text style={styles.taskStatLabel}>转化</Text>
                    </View>
                    <Text style={styles.taskTime}>{task.startTime}</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* 线索管理 */}
        {activeTab === 'leads' && (
          <>
            <Text style={styles.sectionTitle}>线索列表 ({leads.length})</Text>
            {leads.map(lead => (
              <TouchableOpacity key={lead.id} style={styles.leadCard} onPress={() => { setSelectedLead(lead); setShowLeadModal(true); }}>
                <View style={styles.leadHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{lead.name[0]}</Text>
                  </View>
                  <View style={styles.leadInfo}>
                    <Text style={styles.leadName}>{lead.name}</Text>
                    <Text style={styles.leadPhone}>{lead.phone}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusConfig(lead.status).bg }]}>
                    <Text style={[styles.statusText, { color: getStatusConfig(lead.status).text }]}>{getStatusText(lead.status)}</Text>
                  </View>
                </View>
                <View style={styles.leadTags}>
                  <Text style={styles.leadSource}>{lead.source}</Text>
                  {lead.tags.map((tag, i) => (
                    <Text key={i} style={styles.leadTag}>{tag}</Text>
                  ))}
                </View>
                <Text style={styles.leadTime}>创建时间: {lead.createTime}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 创建任务弹窗 */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>创建获客任务</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>任务名称 *</Text>
              <TextInput style={styles.input} placeholder="例如：新品推广活动" placeholderTextColor="#94a3b8" value={form.name} onChangeText={t => setForm({ ...form, name: t })} />

              <Text style={styles.inputLabel}>推广渠道 *</Text>
              <View style={styles.channelSelect}>
                {[
                  { key: 'douyin', label: '抖音', icon: 'logo-octocat' as const, color: '#ff4757' },
                  { key: 'wechat', label: '微信', icon: 'chatbubble' as const, color: '#07c160' },
                  { key: 'sms', label: '短信', icon: 'mail' as const, color: '#4F46E5' },
                  { key: 'xiaohongshu', label: '小红书', icon: 'book' as const, color: '#ff6b9d' },
                ].map(item => (
                  <TouchableOpacity key={item.key} style={[styles.channelOption, form.channel === item.key && { borderColor: item.color, backgroundColor: item.color + '10' }]} onPress={() => setForm({ ...form, channel: item.key as Task['channel'] })}>
                    <Ionicons name={item.icon} size={20} color={form.channel === item.key ? item.color : '#64748b'} />
                    <Text style={[styles.channelOptionText, form.channel === item.key && { color: item.color }]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>推广内容 *</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="输入推广内容或上传素材链接" placeholderTextColor="#94a3b8" multiline value={form.content} onChangeText={t => setForm({ ...form, content: t })} />

              <Text style={styles.inputLabel}>目标发送量 *</Text>
              <TextInput style={styles.input} placeholder="输入目标发送数量" placeholderTextColor="#94a3b8" keyboardType="numeric" value={form.targetCount} onChangeText={t => setForm({ ...form, targetCount: t })} />

              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateTask}>
                <Text style={styles.submitBtnText}>创建任务</Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 线索详情弹窗 */}
      <Modal visible={showLeadModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>线索详情</Text>
              <TouchableOpacity onPress={() => setShowLeadModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            {selectedLead && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.leadDetailHeader}>
                  <View style={styles.avatarLarge}>
                    <Text style={styles.avatarTextLarge}>{selectedLead.name[0]}</Text>
                  </View>
                  <Text style={styles.leadDetailName}>{selectedLead.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusConfig(selectedLead.status).bg }]}>
                    <Text style={[styles.statusText, { color: getStatusConfig(selectedLead.status).text }]}>{getStatusText(selectedLead.status)}</Text>
                  </View>
                </View>

                <View style={styles.leadDetailSection}>
                  <Text style={styles.detailLabel}>联系方式</Text>
                  <Text style={styles.detailValue}>{selectedLead.phone}</Text>
                </View>

                <View style={styles.leadDetailSection}>
                  <Text style={styles.detailLabel}>来源渠道</Text>
                  <Text style={styles.detailValue}>{selectedLead.source}</Text>
                </View>

                <View style={styles.leadDetailSection}>
                  <Text style={styles.detailLabel}>标签</Text>
                  <View style={styles.tagsRow}>
                    {selectedLead.tags.map((tag, i) => (
                      <Text key={i} style={styles.tagBadge}>{tag}</Text>
                    ))}
                  </View>
                </View>

                <View style={styles.leadDetailSection}>
                  <Text style={styles.detailLabel}>创建时间</Text>
                  <Text style={styles.detailValue}>{selectedLead.createTime}</Text>
                </View>

                <Text style={styles.actionTitle}>处理线索</Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#dbeafe' }]} onPress={() => updateLeadStatus(selectedLead.id, 'contacted')}>
                    <Ionicons name="call" size={18} color="#1e40af" />
                    <Text style={[styles.actionBtnText, { color: '#1e40af' }]}>联系</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#dcfce7' }]} onPress={() => updateLeadStatus(selectedLead.id, 'converted')}>
                    <Ionicons name="checkmark-circle" size={18} color="#166534" />
                    <Text style={[styles.actionBtnText, { color: '#166534' }]}>转化</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]} onPress={() => updateLeadStatus(selectedLead.id, 'invalid')}>
                    <Ionicons name="close-circle" size={18} color="#dc2626" />
                    <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>无效</Text>
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
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center' },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 4 },
  statChange: { fontSize: 11, marginTop: 2 },
  funnelCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 16 },
  funnelItem: { marginBottom: 12 },
  funnelBar: { height: 24, borderRadius: 6, marginBottom: 4 },
  funnelContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  funnelStage: { fontSize: 12, color: '#64748b' },
  funnelCount: { fontSize: 12, fontWeight: '600', color: '#1e293b' },
  channelCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14 },
  channelItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  channelDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  channelName: { flex: 1, fontSize: 13, color: '#1e293b' },
  channelCount: { fontSize: 13, fontWeight: '600', color: '#1e293b', marginRight: 8 },
  channelRate: { fontSize: 12, color: '#64748b', width: 45 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4F46E5', borderRadius: 10, padding: 14, gap: 8, marginBottom: 16 },
  addBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  taskCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  taskHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  taskTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  channelBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  taskName: { fontSize: 14, fontWeight: '600', color: '#1e293b', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: '500' },
  progressBar: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, marginBottom: 12 },
  progressFill: { height: '100%', backgroundColor: '#4F46E5', borderRadius: 3 },
  taskStats: { flexDirection: 'row', alignItems: 'center' },
  taskStat: { flex: 1, alignItems: 'center' },
  taskStatValue: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  taskStatLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  taskProgress: { fontSize: 14, fontWeight: '600', color: '#4F46E5' },
  taskTime: { fontSize: 11, color: '#94a3b8' },
  leadCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  leadHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '600', color: '#4F46E5' },
  leadInfo: { flex: 1, marginLeft: 12 },
  leadName: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  leadPhone: { fontSize: 13, color: '#64748b', marginTop: 2 },
  leadTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  leadSource: { fontSize: 12, color: '#64748b', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  leadTag: { fontSize: 12, color: '#4F46E5', backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  leadTime: { fontSize: 11, color: '#94a3b8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%', paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#1e293b' },
  inputLabel: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f9fafb', borderRadius: 10, padding: 12, fontSize: 14, color: '#1e293b', borderWidth: 1, borderColor: '#e5e7eb' },
  textArea: { height: 80, textAlignVertical: 'top' },
  channelSelect: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  channelOption: { flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10, backgroundColor: '#f9fafb', borderWidth: 2, borderColor: '#e5e7eb', gap: 8 },
  channelOptionText: { fontSize: 13, color: '#64748b' },
  submitBtn: { backgroundColor: '#4F46E5', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 20 },
  submitBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  leadDetailHeader: { alignItems: 'center', paddingVertical: 20 },
  avatarLarge: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarTextLarge: { fontSize: 28, fontWeight: '600', color: '#4F46E5' },
  leadDetailName: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  leadDetailSection: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  detailLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
  detailValue: { fontSize: 14, color: '#1e293b' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  tagBadge: { fontSize: 13, color: '#4F46E5', backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  actionTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginTop: 20, marginBottom: 12, paddingHorizontal: 16 },
  actionRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 6 },
  actionBtnText: { fontSize: 13, fontWeight: '500' },
});
