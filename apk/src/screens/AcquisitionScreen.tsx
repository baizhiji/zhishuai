
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { openWebPage } from '../services/webLink.service';

interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  interest: string;
  status: 'new' | 'contacted' | 'followed' | 'converted';
  createTime: string;
}

interface Campaign {
  id: string;
  name: string;
  type: string;
  reach: number;
  clicks: number;
  leads: number;
  status: 'active' | 'paused' | 'ended';
}

const MOCK_LEADS: Lead[] = [
  { id: '1', name: '王先生', phone: '138****1234', source: '抖音广告', interest: '企业营销', status: 'new', createTime: '今天' },
  { id: '2', name: '李女士', phone: '139****5678', source: '朋友圈', interest: 'AI创作', status: 'contacted', createTime: '昨天' },
  { id: '3', name: '张先生', phone: '136****9012', source: '百度推广', interest: '智能获客', status: 'followed', createTime: '3天前' },
  { id: '4', name: '刘女士', phone: '135****3456', source: '小红书', interest: '素材库', status: 'converted', createTime: '1周前' },
];

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: '1', name: '618促销活动', type: '电商促销', reach: 12500, clicks: 890, leads: 56, status: 'active' },
  { id: '2', name: '新品上市推广', type: '产品推广', reach: 8900, clicks: 560, leads: 34, status: 'paused' },
  { id: '3', name: '夏季营销活动', type: '品牌宣传', reach: 15600, clicks: 1200, leads: 78, status: 'ended' },
];

const STATUS_CONFIG = {
  new: { label: '新线索', color: '#3B82F6', icon: 'sparkles' },
  contacted: { label: '已联系', color: '#8B5CF6', icon: 'call-outline' },
  followed: { label: '跟进中', color: '#F59E0B', icon: 'time-outline' },
  converted: { label: '已转化', color: '#22C55E', icon: 'checkmark-circle' },
};

const CAMPAIGN_STATUS_CONFIG = {
  active: { label: '进行中', color: '#22C55E' },
  paused: { label: '已暂停', color: '#F59E0B' },
  ended: { label: '已结束', color: '#94A3B8' },
};

export default function AcquisitionScreen({ navigation }: { navigation: any }) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'leads' | 'campaigns'>('leads');
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filterModal, setFilterModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setLeads(MOCK_LEADS);
    setCampaigns(MOCK_CAMPAIGNS);
    setLoading(false);
  };

  const handleLeadAction = (lead: Lead, action: 'contact' | 'follow' | 'convert') => {
    const statusMap = {
      contact: 'contacted',
      follow: 'followed',
      convert: 'converted',
    };
    setLeads(leads.map(l => l.id === lead.id ? { ...l, status: statusMap[action] } : l));
    Alert.alert('处理成功', `已将「${lead.name}」标记为${STATUS_CONFIG[statusMap[action]].label}`);
  };

  const handleCreateCampaign = () => {
    Alert.alert('提示', '请在Web端创建和管理营销活动');
  };

  const handleOpenWeb = () => {
    openWebPage('acquisition');
  };

  const getTotalStats = () => {
    const totalReach = campaigns.reduce((sum, c) => sum + c.reach, 0);
    const totalLeads = campaigns.reduce((sum, c) => sum + c.leads, 0);
    const newLeads = leads.filter(l => l.status === 'new').length;
    return { totalReach, totalLeads, newLeads };
  };

  const stats = getTotalStats();

  const renderLeadItem = ({ item }: { item: Lead }) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.leadHeader}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
          </View>
          <View style={styles.leadInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.leadName, { color: theme.text }]}>{item.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_CONFIG[item.status].color + '15' }]}>
                <Ionicons name={STATUS_CONFIG[item.status].icon as any} size={12} color={STATUS_CONFIG[item.status].color} />
                <Text style={[styles.statusText, { color: STATUS_CONFIG[item.status].color }]}>
                  {STATUS_CONFIG[item.status].label}
                </Text>
              </View>
            </View>
            <Text style={[styles.leadPhone, { color: theme.textSecondary }]}>{item.phone}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.cardTags}>
        <View style={[styles.tag, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name="globe-outline" size={12} color={theme.primary} />
          <Text style={[styles.tagText, { color: theme.primary }]}>{item.source}</Text>
        </View>
        <View style={[styles.tag, { backgroundColor: theme.background }]}>
          <Ionicons name="star-outline" size={12} color={theme.textSecondary} />
          <Text style={[styles.tagText, { color: theme.textSecondary }]}>{item.interest}</Text>
        </View>
        <Text style={[styles.createTime, { color: theme.textTertiary }]}>{item.createTime}</Text>
      </View>

      {item.status === 'new' && (
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#3B82F615' }]}
            onPress={() => handleLeadAction(item, 'contact')}
          >
            <Ionicons name="call-outline" size={16} color="#3B82F6" />
            <Text style={[styles.actionBtnText, { color: '#3B82F6' }]}>联系</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#F59E0B15' }]}
            onPress={() => handleLeadAction(item, 'follow')}
          >
            <Ionicons name="time-outline" size={16} color="#F59E0B" />
            <Text style={[styles.actionBtnText, { color: '#F59E0B' }]}>跟进</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'contacted' && (
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#22C55E15' }]}
            onPress={() => handleLeadAction(item, 'convert')}
          >
            <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
            <Text style={[styles.actionBtnText, { color: '#22C55E' }]}>转为客户</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#F59E0B15' }]}
            onPress={() => handleLeadAction(item, 'follow')}
          >
            <Ionicons name="time-outline" size={16} color="#F59E0B" />
            <Text style={[styles.actionBtnText, { color: '#F59E0B' }]}>继续跟进</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderCampaignItem = ({ item }: { item: Campaign }) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.campaignHeader}>
          <Text style={[styles.campaignName, { color: theme.text }]}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: CAMPAIGN_STATUS_CONFIG[item.status].color + '15' }]}>
            <Text style={[styles.statusText, { color: CAMPAIGN_STATUS_CONFIG[item.status].color }]}>
              {CAMPAIGN_STATUS_CONFIG[item.status].label}
            </Text>
          </View>
        </View>
        <View style={[styles.campaignType, { backgroundColor: theme.primaryLight }]}>
          <Text style={[styles.campaignTypeText, { color: theme.primary }]}>{item.type}</Text>
        </View>
      </View>
      
      <View style={styles.campaignStats}>
        <View style={styles.campaignStat}>
          <Text style={[styles.campaignStatValue, { color: theme.text }]}>{item.reach.toLocaleString()}</Text>
          <Text style={[styles.campaignStatLabel, { color: theme.textSecondary }]}>曝光</Text>
        </View>
        <View style={styles.campaignStat}>
          <Text style={[styles.campaignStatValue, { color: theme.text }]}>{item.clicks.toLocaleString()}</Text>
          <Text style={[styles.campaignStatLabel, { color: theme.textSecondary }]}>点击</Text>
        </View>
        <View style={styles.campaignStat}>
          <Text style={[styles.campaignStatValue, { color: '#22C55E' }]}>{item.leads}</Text>
          <Text style={[styles.campaignStatLabel, { color: theme.textSecondary }]}>线索</Text>
        </View>
      </View>

      <View style={styles.conversionRate}>
        <Text style={[styles.conversionLabel, { color: theme.textSecondary }]}>转化率</Text>
        <Text style={[styles.conversionValue, { color: theme.text }]}>
          {((item.leads / item.clicks) * 100).toFixed(1)}%
        </Text>
      </View>
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
          style={[styles.tab, activeTab === 'leads' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('leads')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'leads' ? theme.primary : theme.textSecondary }]}>
            客户线索
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'campaigns' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('campaigns')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'campaigns' ? theme.primary : theme.textSecondary }]}>
            营销活动
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 统计概览 */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.totalReach.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>总曝光</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.totalLeads}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>总线索</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.newLeads}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>新线索</Text>
          </View>
        </View>

        {activeTab === 'leads' ? (
          <>
            {/* 筛选按钮 */}
            <TouchableOpacity 
              style={[styles.filterBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => setFilterModal(true)}
            >
              <Ionicons name="filter-outline" size={18} color={theme.primary} />
              <Text style={[styles.filterBtnText, { color: theme.primary }]}>筛选</Text>
            </TouchableOpacity>
            
            {leads.map(lead => renderLeadItem({ item: lead }))}
          </>
        ) : (
          <>
            {/* 创建活动按钮 */}
            <TouchableOpacity 
              style={[styles.createBtn, { backgroundColor: theme.primary }]}
              onPress={handleCreateCampaign}
            >
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.createBtnText}>创建营销活动</Text>
            </TouchableOpacity>
            
            {campaigns.map(campaign => renderCampaignItem({ item: campaign }))}
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

      {/* 筛选弹窗 */}
      <Modal visible={filterModal} animationType="slide" transparent onRequestClose={() => setFilterModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>筛选线索</Text>
              <TouchableOpacity onPress={() => setFilterModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.filterTitle, { color: theme.text }]}>线索状态</Text>
            <View style={styles.filterOptions}>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.filterOption, { borderColor: theme.border }, selectedStatus.includes(key) && { backgroundColor: config.color + '15', borderColor: config.color }]}
                  onPress={() => {
                    if (selectedStatus.includes(key)) {
                      setSelectedStatus(selectedStatus.filter(s => s !== key));
                    } else {
                      setSelectedStatus([...selectedStatus, key]);
                    }
                  }}
                >
                  <Text style={[styles.filterOptionText, { color: selectedStatus.includes(key) ? config.color : theme.textSecondary }]}>
                    {config.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.clearBtn, { borderColor: theme.border }]}
                onPress={() => setSelectedStatus([])}
              >
                <Text style={[styles.clearBtnText, { color: theme.text }]}>清除筛选</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.applyBtn, { backgroundColor: theme.primary }]}
                onPress={() => setFilterModal(false)}
              >
                <Text style={styles.applyBtnText}>应用筛选</Text>
              </TouchableOpacity>
            </View>
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
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  statLabel: { fontSize: 12 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 16, gap: 6 },
  filterBtnText: { fontSize: 14, fontWeight: '500' },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 10, marginBottom: 16, gap: 8 },
  createBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  cardHeader: { marginBottom: 12 },
  leadHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  leadInfo: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  leadName: { fontSize: 16, fontWeight: '600' },
  leadPhone: { fontSize: 13, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, gap: 4 },
  statusText: { fontSize: 11, fontWeight: '500' },
  cardTags: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, gap: 4 },
  tagText: { fontSize: 12 },
  createTime: { fontSize: 12, marginLeft: 'auto' },
  cardActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 6 },
  actionBtnText: { fontSize: 13, fontWeight: '500' },
  campaignHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  campaignName: { fontSize: 16, fontWeight: '600' },
  campaignType: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  campaignTypeText: { fontSize: 12, fontWeight: '500' },
  campaignStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  campaignStat: { alignItems: 'center' },
  campaignStatValue: { fontSize: 18, fontWeight: '700' },
  campaignStatLabel: { fontSize: 12, marginTop: 2 },
  conversionRate: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  conversionLabel: { fontSize: 13 },
  conversionValue: { fontSize: 16, fontWeight: '600' },
  webEntry: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginTop: 12, marginBottom: 20 },
  webEntryContent: { flex: 1, marginLeft: 12 },
  webEntryTitle: { fontSize: 15, fontWeight: '500' },
  webEntrySubtitle: { fontSize: 12, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  filterTitle: { fontSize: 15, fontWeight: '500', marginBottom: 12 },
  filterOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  filterOption: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  filterOptionText: { fontSize: 14 },
  modalFooter: { flexDirection: 'row', gap: 12, marginTop: 24 },
  clearBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  clearBtnText: { fontSize: 15, fontWeight: '500' },
  applyBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  applyBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
