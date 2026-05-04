import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PageHeader from '../components/PageHeader';

// 推荐记录类型
interface Referral {
  id: string;
  referrer: string;
  referred: string;
  code: string;
  time: string;
  status: 'success' | 'pending' | 'expired';
  phone: string;
}

// 二维码类型
interface QRCode {
  id: string;
  name: string;
  url: string;
  scans: number;
  createdAt: string;
  channel: 'wechat' | 'douyin' | 'xiaohongshu' | 'other';
}

// 统计数据
const stats = {
  totalReferrals: 156,
  activeUsers: 128,
  conversions: 128,
  scanRate: 82,
};

// 渠道分布
const channelData = [
  { channel: '抖音', count: 45, rate: 28.8, color: '#ff4757' },
  { channel: '微信', count: 67, rate: 42.9, color: '#07c160' },
  { channel: '小红书', count: 28, rate: 17.9, color: '#ff6b9d' },
  { channel: '其他', count: 16, rate: 10.3, color: '#64748b' },
];

// 模拟推荐数据
const mockReferrals: Referral[] = [
  { id: '1', referrer: '张三', referred: '李四', code: 'ZHISHUAI2024001', time: '2024-03-25 14:30', status: 'success', phone: '138****1234' },
  { id: '2', referrer: '张三', referred: '王五', code: 'ZHISHUAI2024002', time: '2024-03-24 11:20', status: 'success', phone: '139****5678' },
  { id: '3', referrer: '李四', referred: '赵六', code: 'ZHISHUAI2024003', time: '2024-03-23 09:15', status: 'pending', phone: '137****9012' },
  { id: '4', referrer: '王五', referred: '钱七', code: 'ZHISHUAI2024004', time: '2024-03-22 16:45', status: 'success', phone: '136****3456' },
  { id: '5', referrer: '李四', referred: '孙八', code: 'ZHISHUAI2024005', time: '2024-03-21 10:00', status: 'expired', phone: '135****7890' },
];

// 模拟二维码数据
const mockQRCodes: QRCode[] = [
  { id: '1', name: '产品推广二维码', url: 'https://zhishuai.com/r/abc123', scans: 1256, createdAt: '2024-03-20', channel: 'wechat' },
  { id: '2', name: '活动邀请二维码', url: 'https://zhishuai.com/r/def456', scans: 856, createdAt: '2024-03-18', channel: 'douyin' },
  { id: '3', name: '会员招募二维码', url: 'https://zhishuai.com/r/ghi789', scans: 423, createdAt: '2024-03-15', channel: 'xiaohongshu' },
];

export default function ShareScreen() {
  const [activeTab, setActiveTab] = useState<'stats' | 'referrals' | 'qrcode'>('stats');
  const [referrals, setReferrals] = useState<Referral[]>(mockReferrals);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedQR, setSelectedQR] = useState<QRCode | null>(null);
  const [myReferralCode] = useState('ZHISHUAI2024');
  const [form, setForm] = useState({
    name: '',
    channel: 'wechat' as QRCode['channel'],
  });

  // 获取状态配置
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'success': return { bg: '#dcfce7', text: '#166534' };
      case 'pending': return { bg: '#fef3c7', text: '#92400e' };
      case 'expired': return { bg: '#f1f5f9', text: '#64748b' };
      default: return { bg: '#f1f5f9', text: '#64748b' };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success': return '成功';
      case 'pending': return '待激活';
      case 'expired': return '已失效';
      default: return status;
    }
  };

  // 获取渠道信息
  const getChannelInfo = (channel: string) => {
    switch (channel) {
      case 'wechat': return { name: '微信', icon: 'chatbubble' as const, color: '#07c160' };
      case 'douyin': return { name: '抖音', icon: 'logo-octocat' as const, color: '#ff4757' };
      case 'xiaohongshu': return { name: '小红书', icon: 'book' as const, color: '#ff6b9d' };
      default: return { name: '其他', icon: 'globe' as const, color: '#64748b' };
    }
  };

  // 复制推荐码
  const handleCopyCode = (code: string) => {
    Alert.alert('成功', `推荐码 ${code} 已复制到剪贴板`);
  };

  // 分享推荐码
  const handleShareCode = async (code: string) => {
    try {
      await Share.share({
        message: `邀请码: ${code}\n注册即享好礼！点击链接注册: https://zhishuai.com/register?code=${code}`,
      });
    } catch (error) {
      console.error('分享失败:', error);
    }
  };

  // 创建二维码
  const handleCreateQR = () => {
    if (!form.name) {
      Alert.alert('提示', '请输入二维码名称');
      return;
    }
    const newQR: QRCode = {
      id: Date.now().toString(),
      name: form.name,
      url: `https://zhishuai.com/r/${Math.random().toString(36).substr(2, 6)}`,
      scans: 0,
      createdAt: new Date().toLocaleDateString(),
      channel: form.channel,
    };
    mockQRCodes.unshift(newQR);
    setShowAddModal(false);
    setForm({ name: '', channel: 'wechat' });
    Alert.alert('成功', '二维码已生成');
  };

  // 分享二维码链接
  const handleShareQR = async () => {
    if (!selectedQR) return;
    try {
      await Share.share({
        message: `扫码注册: ${selectedQR.url}`,
      });
    } catch (error) {
      console.error('分享失败:', error);
    }
  };

  return (
    <View style={styles.container}>
      <PageHeader title="推荐分享" />

      {/* Tab栏 */}
      <View style={styles.tabBar}>
        {[
          { key: 'stats', icon: 'stats-chart', label: '数据' },
          { key: 'referrals', icon: 'people', label: '推荐' },
          { key: 'qrcode', icon: 'qr-code', label: '二维码' },
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
            {/* 我的推荐码 */}
            <View style={styles.myCodeCard}>
              <Text style={styles.myCodeLabel}>我的推荐码</Text>
              <Text style={styles.myCodeValue}>{myReferralCode}</Text>
              <View style={styles.codeActions}>
                <TouchableOpacity style={styles.codeBtn} onPress={() => handleCopyCode(myReferralCode)}>
                  <Ionicons name="copy-outline" size={16} color="#4F46E5" />
                  <Text style={styles.codeBtnText}>复制</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.codeBtn, styles.shareBtn]} onPress={() => handleShareCode(myReferralCode)}>
                  <Ionicons name="share-outline" size={16} color="#fff" />
                  <Text style={[styles.codeBtnText, { color: '#fff' }]}>分享</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
                  <Ionicons name="people" size={18} color="#1890ff" />
                </View>
                <Text style={styles.statValue}>{stats.totalReferrals}</Text>
                <Text style={styles.statLabel}>总推荐数</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
                  <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                </View>
                <Text style={styles.statValue}>{stats.conversions}</Text>
                <Text style={styles.statLabel}>成功转化</Text>
              </View>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="person" size={18} color="#f59e0b" />
                </View>
                <Text style={styles.statValue}>{stats.activeUsers}</Text>
                <Text style={styles.statLabel}>活跃用户</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#f3e8ff' }]}>
                  <Ionicons name="scan" size={18} color="#9333ea" />
                </View>
                <Text style={styles.statValue}>{stats.scanRate}%</Text>
                <Text style={styles.statLabel}>扫码率</Text>
              </View>
            </View>

            {/* 渠道分布 */}
            <Text style={styles.sectionTitle}>渠道分布</Text>
            <View style={styles.channelCard}>
              {channelData.map((item, index) => (
                <View key={index} style={styles.channelItem}>
                  <View style={[styles.channelDot, { backgroundColor: item.color }]} />
                  <Text style={styles.channelName}>{item.channel}</Text>
                  <Text style={styles.channelCount}>{item.count}人</Text>
                  <Text style={styles.channelRate}>{item.rate}%</Text>
                </View>
              ))}
            </View>

            {/* 最近推荐 */}
            <Text style={styles.sectionTitle}>最近推荐</Text>
            {referrals.slice(0, 3).map(ref => (
              <View key={ref.id} style={styles.referralCard}>
                <View style={styles.referralHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{ref.referrer[0]}</Text>
                  </View>
                  <View style={styles.referralInfo}>
                    <Text style={styles.referralName}>{ref.referrer} → {ref.referred}</Text>
                    <Text style={styles.referralCode}>{ref.code}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusConfig(ref.status).bg }]}>
                    <Text style={[styles.statusText, { color: getStatusConfig(ref.status).text }]}>{getStatusText(ref.status)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {/* 推荐记录 */}
        {activeTab === 'referrals' && (
          <>
            <Text style={styles.sectionTitle}>推荐记录 ({referrals.length})</Text>
            {referrals.map(ref => (
              <View key={ref.id} style={styles.referralCard}>
                <View style={styles.referralHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{ref.referrer[0]}</Text>
                  </View>
                  <View style={styles.referralInfo}>
                    <Text style={styles.referralName}>{ref.referrer} → {ref.referred}</Text>
                    <Text style={styles.referralCode}>{ref.code}</Text>
                    <Text style={styles.referralPhone}>{ref.phone}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusConfig(ref.status).bg }]}>
                    <Text style={[styles.statusText, { color: getStatusConfig(ref.status).text }]}>{getStatusText(ref.status)}</Text>
                  </View>
                </View>
                <View style={styles.referralFooter}>
                  <Text style={styles.referralTime}>{ref.time}</Text>
                  <View style={styles.referralActions}>
                    <TouchableOpacity style={styles.refActionBtn} onPress={() => handleCopyCode(ref.code)}>
                      <Ionicons name="copy-outline" size={14} color="#64748b" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.refActionBtn} onPress={() => handleShareCode(ref.code)}>
                      <Ionicons name="share-outline" size={14} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {/* 二维码管理 */}
        {activeTab === 'qrcode' && (
          <>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.addBtnText}>生成二维码</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>二维码列表 ({mockQRCodes.length})</Text>
            {mockQRCodes.map(qr => {
              const channelInfo = getChannelInfo(qr.channel);
              return (
                <TouchableOpacity key={qr.id} style={styles.qrCard} onPress={() => { setSelectedQR(qr); setShowShareModal(true); }}>
                  <View style={styles.qrHeader}>
                    <View style={[styles.qrIcon, { backgroundColor: channelInfo.color + '20' }]}>
                      <Ionicons name="qr-code" size={24} color={channelInfo.color} />
                    </View>
                    <View style={styles.qrInfo}>
                      <Text style={styles.qrName}>{qr.name}</Text>
                      <Text style={styles.qrUrl} numberOfLines={1}>{qr.url}</Text>
                    </View>
                  </View>
                  <View style={styles.qrFooter}>
                    <View style={styles.qrMeta}>
                      <Ionicons name="scan-outline" size={14} color="#64748b" />
                      <Text style={styles.qrScans}>{qr.scans} 次扫码</Text>
                    </View>
                    <View style={[styles.channelBadge, { backgroundColor: channelInfo.color + '20' }]}>
                      <Ionicons name={channelInfo.icon} size={12} color={channelInfo.color} />
                      <Text style={[styles.channelText, { color: channelInfo.color }]}>{channelInfo.name}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 创建二维码弹窗 */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>生成二维码</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>二维码名称 *</Text>
              <TextInput style={styles.input} placeholder="例如：产品推广二维码" placeholderTextColor="#94a3b8" value={form.name} onChangeText={t => setForm({ ...form, name: t })} />

              <Text style={styles.inputLabel}>推广渠道 *</Text>
              <View style={styles.channelSelect}>
                {[
                  { key: 'wechat', label: '微信', icon: 'chatbubble' as const, color: '#07c160' },
                  { key: 'douyin', label: '抖音', icon: 'logo-octocat' as const, color: '#ff4757' },
                  { key: 'xiaohongshu', label: '小红书', icon: 'book' as const, color: '#ff6b9d' },
                  { key: 'other', label: '其他', icon: 'globe' as const, color: '#64748b' },
                ].map(item => (
                  <TouchableOpacity key={item.key} style={[styles.channelOption, form.channel === item.key && { borderColor: item.color, backgroundColor: item.color + '10' }]} onPress={() => setForm({ ...form, channel: item.key as QRCode['channel'] })}>
                    <Ionicons name={item.icon} size={20} color={form.channel === item.key ? item.color : '#64748b'} />
                    <Text style={[styles.channelOptionText, form.channel === item.key && { color: item.color }]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>跳转链接</Text>
              <TextInput style={styles.input} placeholder="输入跳转链接（可选）" placeholderTextColor="#94a3b8" />

              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateQR}>
                <Ionicons name="qr-code" size={18} color="#fff" />
                <Text style={styles.submitBtnText}>生成二维码</Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 二维码详情弹窗 */}
      <Modal visible={showShareModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>二维码详情</Text>
              <TouchableOpacity onPress={() => setShowShareModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            {selectedQR && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.qrDetailHeader}>
                  <View style={styles.qrPreview}>
                    <Ionicons name="qr-code" size={120} color="#1e293b" />
                  </View>
                  <Text style={styles.qrDetailName}>{selectedQR.name}</Text>
                  {(() => {
                    const channelInfo = getChannelInfo(selectedQR.channel);
                    return (
                      <View style={[styles.channelBadge, { backgroundColor: channelInfo.color + '20' }]}>
                        <Ionicons name={channelInfo.icon} size={14} color={channelInfo.color} />
                        <Text style={[styles.channelText, { color: channelInfo.color }]}>{channelInfo.name}</Text>
                      </View>
                    );
                  })()}
                </View>

                <View style={styles.qrDetailSection}>
                  <Text style={styles.detailLabel}>推广链接</Text>
                  <View style={styles.urlRow}>
                    <Text style={styles.detailValue} numberOfLines={1}>{selectedQR.url}</Text>
                    <TouchableOpacity onPress={() => handleCopyCode(selectedQR.url)}>
                      <Ionicons name="copy-outline" size={18} color="#4F46E5" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.qrDetailSection}>
                  <Text style={styles.detailLabel}>扫码次数</Text>
                  <Text style={styles.detailValue}>{selectedQR.scans} 次</Text>
                </View>

                <View style={styles.qrDetailSection}>
                  <Text style={styles.detailLabel}>创建时间</Text>
                  <Text style={styles.detailValue}>{selectedQR.createdAt}</Text>
                </View>

                <TouchableOpacity style={styles.shareBtnLarge} onPress={handleShareQR}>
                  <Ionicons name="share-outline" size={20} color="#fff" />
                  <Text style={styles.shareBtnText}>分享二维码</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.downloadBtn}>
                  <Ionicons name="download-outline" size={20} color="#4F46E5" />
                  <Text style={styles.downloadBtnText}>下载二维码</Text>
                </TouchableOpacity>

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
  myCodeCard: { backgroundColor: '#4F46E5', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  myCodeLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  myCodeValue: { fontSize: 24, fontWeight: '700', color: '#fff', letterSpacing: 2, marginBottom: 16 },
  codeActions: { flexDirection: 'row', gap: 12 },
  codeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, gap: 6 },
  codeBtnText: { fontSize: 14, fontWeight: '500', color: '#4F46E5' },
  shareBtn: { backgroundColor: 'rgba(255,255,255,0.2)' },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center' },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 4 },
  channelCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 16 },
  channelItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  channelDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  channelName: { flex: 1, fontSize: 13, color: '#1e293b' },
  channelCount: { fontSize: 13, fontWeight: '600', color: '#1e293b', marginRight: 8 },
  channelRate: { fontSize: 12, color: '#64748b', width: 45 },
  referralCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  referralHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '600', color: '#4F46E5' },
  referralInfo: { flex: 1, marginLeft: 12 },
  referralName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  referralCode: { fontSize: 12, color: '#4F46E5', marginTop: 2 },
  referralPhone: { fontSize: 12, color: '#64748b', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: '500' },
  referralFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  referralTime: { fontSize: 12, color: '#94a3b8' },
  referralActions: { flexDirection: 'row', gap: 12 },
  refActionBtn: { padding: 4 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4F46E5', borderRadius: 10, padding: 14, gap: 8, marginBottom: 16 },
  addBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  qrCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  qrHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  qrIcon: { width: 50, height: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  qrInfo: { flex: 1, marginLeft: 12 },
  qrName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  qrUrl: { fontSize: 12, color: '#64748b', marginTop: 2 },
  qrFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qrMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qrScans: { fontSize: 12, color: '#64748b' },
  channelBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, gap: 4 },
  channelText: { fontSize: 12, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%', paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#1e293b' },
  inputLabel: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f9fafb', borderRadius: 10, padding: 12, fontSize: 14, color: '#1e293b', borderWidth: 1, borderColor: '#e5e7eb' },
  channelSelect: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  channelOption: { flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10, backgroundColor: '#f9fafb', borderWidth: 2, borderColor: '#e5e7eb', gap: 8 },
  channelOptionText: { fontSize: 13, color: '#64748b' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4F46E5', borderRadius: 10, padding: 14, marginTop: 20, gap: 8 },
  submitBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  qrDetailHeader: { alignItems: 'center', paddingVertical: 20 },
  qrPreview: { width: 150, height: 150, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  qrDetailName: { fontSize: 18, fontWeight: '600', color: '#1e293b', marginBottom: 8 },
  qrDetailSection: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  detailLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
  detailValue: { fontSize: 14, color: '#1e293b' },
  urlRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shareBtnLarge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4F46E5', borderRadius: 10, padding: 14, marginHorizontal: 16, marginTop: 20, gap: 8 },
  shareBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 14, marginHorizontal: 16, marginTop: 12, gap: 8, borderWidth: 1, borderColor: '#4F46E5' },
  downloadBtnText: { fontSize: 15, fontWeight: '600', color: '#4F46E5' },
});
