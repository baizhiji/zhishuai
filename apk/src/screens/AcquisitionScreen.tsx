import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert, ActivityIndicator, Dimensions,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import { acquisitionService } from '../services/acquisition.service';
import type { AcquisitionTask, AcquisitionLead, StatsData, LeadStatus } from '../services/acquisition.service';

const { width: SW } = Dimensions.get('window');

// ─── 常量 ──────────────────────────────────────────────────
const TABS = ['数据总览', '获客任务', '潜客管理', 'AI发现'];
const CHANNELS = [
  { key: 'douyin', label: '抖音' },
  { key: 'kuaishou', label: '快手' },
  { key: 'xiaohongshu', label: '小红书' },
  { key: 'weibo', label: '微博' },
  { key: 'bosszhipin', label: 'BOSS直聘' },
  { key: 'zhilian', label: '智联' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: '#faad14', running: '#1890ff', completed: '#52c41a', paused: '#8c8c8c',
  new: '#1890ff', contacted: '#722ed1', qualified: '#13c2c2', converted: '#52c41a',
  invalid: '#8c8c8c', blacklisted: '#ff4d4f',
};

const STATUS_LABELS: Record<string, string> = {
  pending: '待启动', running: '运行中', completed: '已完成', paused: '已暂停',
  new: '新潜客', contacted: '已联系', qualified: '已确认', converted: '已转化',
  invalid: '无效', blacklisted: '已拉黑',
};

// ─── 组件 ──────────────────────────────────────────────────
export default function AcquisitionScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 数据
  const [stats, setStats] = useState<StatsData>({
    totalTasks: 0, runningTasks: 0, totalLeads: 0, newLeads: 0,
    contactedLeads: 0, convertedLeads: 0, invalidLeads: 0, conversionRate: 0,
  });
  const [tasks, setTasks] = useState<AcquisitionTask[]>([]);
  const [leads, setLeads] = useState<AcquisitionLead[]>([]);

  // 弹窗
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showLeadDetail, setShowLeadDetail] = useState(false);
  const [selectedLead, setSelectedLead] = useState<AcquisitionLead | null>(null);

  // 表单
  const [taskName, setTaskName] = useState('');
  const [taskChannel, setTaskChannel] = useState('douyin');
  const [targetCount, setTargetCount] = useState('100');

  // ─── 数据加载 ────────────────────────────────────────
  const loadData = useCallback(async (silent = false) => {
    if (!user?.id) return;
    if (!silent) setLoading(true);
    setRefreshing(true);
    try {
      const [statsRes, tasksRes, leadsRes] = await Promise.all([
        acquisitionService.getStats(),
        acquisitionService.getTasks({ pageSize: 50 }),
        acquisitionService.getLeads({ pageSize: 50 }),
      ]);
      setStats(statsRes ?? {
        totalTasks: 0,
        runningTasks: 0,
        totalLeads: 0,
        newLeads: 0,
        contactedLeads: 0,
        convertedLeads: 0,
        invalidLeads: 0,
        conversionRate: 0,
      });
      setTasks(tasksRes?.tasks ?? []);
      setLeads(leadsRes?.leads ?? []);
    } catch (e: any) {
      if (!silent) Alert.alert('加载失败', e.message || '请稍后重试');
      console.error('获客数据加载失败:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) loadData();
  }, [user?.id, loadData]);

  // ─── 操作 ──────────────────────────────────────────
  const handleCreateTask = async () => {
    if (!taskName.trim()) return Alert.alert('提示', '请输入任务名称');
    try {
      setLoading(true);
      await acquisitionService.createTask({
        name: taskName.trim(),
        channel: taskChannel,
        targetCount: parseInt(targetCount, 10) || 100,
      });
      setShowCreateTask(false);
      setTaskName('');
      setTaskChannel('douyin');
      setTargetCount('100');
      await loadData(true);
    } catch (e: any) {
      Alert.alert('创建失败', e.message || '请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = async (taskId: string) => {
    try {
      setLoading(true);
      await acquisitionService.startTask(taskId);
      await loadData(true);
    } catch (e: any) {
      Alert.alert('启动失败', e.message || '请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLead = async (leadId: string, status: LeadStatus) => {
    try {
      setLoading(true);
      await acquisitionService.updateLead(leadId, { status });
      setShowLeadDetail(false);
      setSelectedLead(null);
      await loadData(true);
    } catch (e: any) {
      Alert.alert('更新失败', e.message || '请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscover = async (taskId: string) => {
    try {
      setLoading(true);
      const result = await acquisitionService.discoverLeads(taskId, 5);
      Alert.alert('发现完成', `AI 发现 ${result.count} 个潜在客户`);
      await loadData(true);
    } catch (e: any) {
      Alert.alert('发现失败', e.message || '请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // ─── 渲染 ──────────────────────────────────────────
  return (
    <View style={styles.container}>
      <PageHeader title="智能获客" />

      {/* Tab 栏 */}
      <View style={styles.tabBar}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === i && styles.tabActive]}
            onPress={() => setActiveTab(i)}
          >
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && tasks.length === 0 ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#1677ff" /></View>
      ) : (
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyInner}>
          {activeTab === 0 && <OverviewTab stats={stats} />}
          {activeTab === 1 && (
            <TasksTab
              tasks={tasks}
              onRefresh={() => loadData(true)}
              onCreate={() => setShowCreateTask(true)}
              onStart={handleStartTask}
              onDiscover={handleDiscover}
              channels={CHANNELS}
            />
          )}
          {activeTab === 2 && (
            <LeadsTab
              leads={leads}
              onRefresh={() => loadData(true)}
              onPress={(lead) => { setSelectedLead(lead); setShowLeadDetail(true); }}
            />
          )}
          {activeTab === 3 && (
            <DiscoverTab
              tasks={tasks}
              onDiscover={handleDiscover}
            />
          )}
        </ScrollView>
      )}

      {/* 创建任务弹窗 */}
      <Modal visible={showCreateTask} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>创建获客任务</Text>
            <Text style={styles.label}>任务名称</Text>
            <TextInput style={styles.input} value={taskName} onChangeText={setTaskName} placeholder="如：母婴产品北京潜在客户" />
            <Text style={styles.label}>获客渠道</Text>
            <View style={styles.chipRow}>
              {CHANNELS.map(c => (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.chip, taskChannel === c.key && styles.chipActive]}
                  onPress={() => setTaskChannel(c.key)}
                >
                  <Text style={[styles.chipText, taskChannel === c.key && styles.chipTextActive]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>目标数量</Text>
            <TextInput style={styles.input} value={targetCount} onChangeText={setTargetCount} keyboardType="numeric" placeholder="100" />
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setShowCreateTask(false)}>
                <Text style={styles.btnCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={handleCreateTask}>
                <Text style={styles.btnPrimaryText}>创建任务</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 潜客详情弹窗 */}
      <Modal visible={showLeadDetail} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedLead && (
              <>
                <Text style={styles.modalTitle}>{selectedLead.name || '未命名'}</Text>
                <InfoRow label="手机号" value={selectedLead.phone} />
                {selectedLead.email ? <InfoRow label="邮箱" value={selectedLead.email} /> : null}
                <InfoRow label="来源" value={selectedLead.source} />
                <InfoRow label="状态" value={STATUS_LABELS[selectedLead.status] || selectedLead.status} />
                {selectedLead.aiScore != null && <InfoRow label="AI评分" value={`${selectedLead.aiScore}`} />}
                {selectedLead.aiQuality && <InfoRow label="线索质量" value={selectedLead.aiQuality} />}
                {selectedLead.aiFollowup && <InfoRow label="跟进建议" value={selectedLead.aiFollowup} />}
                {selectedLead.notes && <InfoRow label="备注" value={selectedLead.notes} />}
                {selectedLead.lastContact && <InfoRow label="最近联系" value={new Date(selectedLead.lastContact).toLocaleString('zh-CN')} />}

                <Text style={[styles.label, { marginTop: 16 }]}>状态操作</Text>
                <View style={styles.chipRow}>
                  {(['contacted', 'qualified', 'converted', 'invalid'] as LeadStatus[]).map(s => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.chip, selectedLead.status === s && styles.chipActive]}
                      onPress={() => handleUpdateLead(selectedLead.id, s)}
                    >
                      <Text style={[styles.chipText, selectedLead.status === s && styles.chipTextActive]}>
                        {STATUS_LABELS[s]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.btnCancel} onPress={() => { setShowLeadDetail(false); setSelectedLead(null); }}>
                    <Text style={styles.btnCancelText}>关闭</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── 子组件: 数据总览 ──────────────────────────────────────
function OverviewTab({ stats }: { stats: StatsData }) {
  const cards = [
    { label: '获客任务', value: stats.totalTasks, sub: `运行中 ${stats.runningTasks}` },
    { label: '潜客总数', value: stats.totalLeads, sub: `新增 ${stats.newLeads}` },
    { label: '已转化', value: stats.convertedLeads, sub: `转化率 ${stats.conversionRate}%` },
    { label: '待跟进', value: stats.contactedLeads + stats.newLeads, sub: `无效 ${stats.invalidLeads}` },
  ];

  return (
    <View>
      <Text style={styles.sectionTitle}>核心指标</Text>
      <View style={styles.cardGrid}>
        {cards.map(c => (
          <View key={c.label} style={styles.statCard}>
            <Text style={styles.statValue}>{c.value}</Text>
            <Text style={styles.statLabel}>{c.label}</Text>
            <Text style={styles.statSub}>{c.sub}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>漏斗概览</Text>
      <View style={styles.funnelCard}>
        <FunnelStep label="潜客总数" count={stats.totalLeads} color="#1890ff" max={stats.totalLeads || 1} />
        <FunnelStep label="已联系" count={stats.contactedLeads} color="#722ed1" max={stats.totalLeads || 1} />
        <FunnelStep label="已确认" count={stats.contactedLeads > 0 ? Math.round(stats.contactedLeads * 0.5) : 0} color="#13c2c2" max={stats.totalLeads || 1} />
        <FunnelStep label="已转化" count={stats.convertedLeads} color="#52c41a" max={stats.totalLeads || 1} />
      </View>
    </View>
  );
}

function FunnelStep({ label, count, color, max }: { label: string; count: number; color: string; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  const barW = Math.max(4, pct);
  return (
    <View style={styles.funnelRow}>
      <Text style={styles.funnelLabel}>{label}</Text>
      <View style={styles.funnelBarOuter}>
        <View style={[styles.funnelBar, { width: `${barW}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.funnelCount}>{count}</Text>
    </View>
  );
}

// ─── 子组件: 任务列表 ──────────────────────────────────────
function TasksTab({
  tasks, onRefresh, onCreate, onStart, onDiscover, channels,
}: {
  tasks: AcquisitionTask[]; onRefresh: () => void; onCreate: () => void; onStart: (id: string) => void;
  onDiscover: (id: string) => void; channels: { key: string; label: string }[];
}) {
  const chLabel = (k: string) => channels.find(c => c.key === k)?.label || k;

  return (
    <View>
      <View style={styles.actionBar}>
        <Text style={styles.sectionTitle}>获客任务 ({tasks.length})</Text>
        <TouchableOpacity style={styles.btnPrimarySm} onPress={onCreate}>
          <Text style={styles.btnPrimarySmText}>+ 创建任务</Text>
        </TouchableOpacity>
      </View>
      {tasks.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>暂无获客任务，点击上方按钮创建</Text>
        </View>
      ) : (
        tasks.map(task => (
          <View key={task.id} style={styles.taskCard}>
            <View style={styles.taskHeader}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[task.status] || '#8c8c8c' }]}>
                <Text style={styles.statusBadgeText}>{STATUS_LABELS[task.status] || task.status}</Text>
              </View>
            </View>
            <Text style={styles.taskMeta}>
              渠道: {chLabel(task.channel)} | 进度: {task.leadsCount}/{task.targetCount} | 完成率: {task.progress || 0}%
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${task.progress || 0}%` }]} />
            </View>
            <View style={styles.taskActions}>
              {task.status === 'pending' && (
                <TouchableOpacity style={styles.btnOutlineSm} onPress={() => onStart(task.id)}>
                  <Text style={styles.btnOutlineSmText}>启动任务</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.btnAiSm} onPress={() => onDiscover(task.id)}>
                <Text style={styles.btnAiSmText}>AI发现潜客</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

// ─── 子组件: 潜客列表 ──────────────────────────────────────
function LeadsTab({
  leads, onRefresh, onPress,
}: {
  leads: AcquisitionLead[]; onRefresh: () => void; onPress: (lead: AcquisitionLead) => void;
}) {
  return (
    <View>
      <View style={styles.actionBar}>
        <Text style={styles.sectionTitle}>潜客列表 ({leads.length})</Text>
      </View>
      {leads.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>暂无潜客，请先创建获客任务并使用 AI 发现</Text>
        </View>
      ) : (
        leads.map(lead => (
          <TouchableOpacity key={lead.id} style={styles.leadCard} onPress={() => onPress(lead)}>
            <View style={styles.leadRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.leadName}>{lead.name || '未命名'}</Text>
                <Text style={styles.leadMeta}>{lead.phone}</Text>
              </View>
              <View style={styles.leadRight}>
                {lead.aiScore != null && (
                  <Text style={[styles.aiScore, { color: lead.aiScore >= 70 ? '#52c41a' : lead.aiScore >= 50 ? '#faad14' : '#ff4d4f' }]}>
                    {lead.aiScore}分
                  </Text>
                )}
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[lead.status] || '#8c8c8c' }]}>
                  <Text style={styles.statusBadgeText}>{STATUS_LABELS[lead.status] || lead.status}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.leadMeta}>{lead.source}{lead.taskName ? ` · ${lead.taskName}` : ''}{lead.aiQuality ? ` · ${lead.aiQuality}级` : ''}</Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

// ─── 子组件: AI发现 ──────────────────────────────────────
function DiscoverTab({
  tasks, onDiscover,
}: {
  tasks: AcquisitionTask[]; onDiscover: (id: string) => void;
}) {
  const activeTasks = tasks.filter(t => t.status === 'running' || t.status === 'pending');

  return (
    <View>
      <Text style={styles.sectionTitle}>AI 潜客发现</Text>
      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          AI 将根据获客任务的目标渠道和关键词，智能匹配并推荐高意向潜在客户，同时生成自动跟进话术。
        </Text>
      </View>

      {activeTasks.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>暂无活跃的获客任务，请先在"获客任务"标签页创建任务</Text>
        </View>
      ) : (
        activeTasks.map(task => (
          <View key={task.id} style={styles.discoverCard}>
            <Text style={styles.discoverTitle}>{task.title}</Text>
            <Text style={styles.discoverMeta}>
              渠道: {task.channel} | 已有潜客: {task.leadsCount} | 目标: {task.targetCount}
            </Text>
            <TouchableOpacity style={styles.btnAiLg} onPress={() => onDiscover(task.id)}>
              <Text style={styles.btnAiLgText}>开始 AI 发现 (每次5人)</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
}

// ─── 公用小组件 ────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// ─── 样式 ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  body: { flex: 1 },
  bodyInner: { padding: 16, paddingBottom: 40 },

  // Tab
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f0f0f0' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#1677ff' },
  tabText: { fontSize: 14, color: '#666' },
  tabTextActive: { color: '#1677ff', fontWeight: '600' },

  // 通用
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 12, marginTop: 8 },
  actionBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },

  // 统计卡片
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { flex: 1, minWidth: (SW - 56) / 2, backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 1 },
  statValue: { fontSize: 28, fontWeight: '700', color: '#1677ff' },
  statLabel: { fontSize: 13, color: '#666', marginTop: 4 },
  statSub: { fontSize: 11, color: '#999', marginTop: 2 },

  // 漏斗
  funnelCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 1 },
  funnelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  funnelLabel: { width: 64, fontSize: 13, color: '#555' },
  funnelBarOuter: { flex: 1, height: 20, backgroundColor: '#f0f0f0', borderRadius: 10, marginHorizontal: 10 },
  funnelBar: { height: 20, borderRadius: 10, minWidth: 4 },
  funnelCount: { width: 40, fontSize: 14, fontWeight: '600', textAlign: 'right', color: '#333' },

  // 任务卡片
  taskCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskTitle: { fontSize: 15, fontWeight: '600', color: '#222', flex: 1 },
  taskMeta: { fontSize: 12, color: '#888', marginTop: 8 },
  progressBar: { height: 6, backgroundColor: '#f0f0f0', borderRadius: 3, marginTop: 8 },
  progressFill: { height: 6, backgroundColor: '#1677ff', borderRadius: 3 },
  taskActions: { flexDirection: 'row', gap: 8, marginTop: 12 },

  // 潜客卡片
  leadCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, elevation: 1 },
  leadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leadName: { fontSize: 15, fontWeight: '600', color: '#222' },
  leadMeta: { fontSize: 12, color: '#888', marginTop: 4 },
  leadRight: { alignItems: 'flex-end' },
  aiScore: { fontSize: 16, fontWeight: '700' },

  // AI发现
  infoCard: { backgroundColor: '#e6f4ff', borderRadius: 12, padding: 16, marginBottom: 16 },
  infoText: { fontSize: 13, color: '#1677ff', lineHeight: 20 },
  discoverCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1 },
  discoverTitle: { fontSize: 15, fontWeight: '600', color: '#222' },
  discoverMeta: { fontSize: 12, color: '#888', marginTop: 6, marginBottom: 12 },

  // 状态徽章
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusBadgeText: { fontSize: 11, color: '#fff', fontWeight: '500' },

  // 空状态
  emptyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#999' },

  // 按钮
  btnPrimarySm: { backgroundColor: '#1677ff', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
  btnPrimarySmText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  btnOutlineSm: { borderWidth: 1, borderColor: '#1677ff', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
  btnOutlineSmText: { color: '#1677ff', fontSize: 13 },
  btnAiSm: { borderWidth: 1, borderColor: '#722ed1', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
  btnAiSmText: { color: '#722ed1', fontSize: 13 },
  btnAiLg: { backgroundColor: '#722ed1', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  btnAiLgText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // 弹窗
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#222', marginBottom: 16 },
  label: { fontSize: 13, color: '#666', marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#d9d9d9', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#d9d9d9' },
  chipActive: { backgroundColor: '#1677ff', borderColor: '#1677ff' },
  chipText: { fontSize: 12, color: '#666' },
  chipTextActive: { color: '#fff' },
  btnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
  btnCancel: { paddingHorizontal: 20, paddingVertical: 10 },
  btnCancelText: { color: '#666', fontSize: 14 },
  btnPrimary: { backgroundColor: '#1677ff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  btnPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  infoLabel: { fontSize: 13, color: '#888' },
  infoValue: { fontSize: 13, color: '#333', flex: 1, textAlign: 'right', marginLeft: 16 },
});
