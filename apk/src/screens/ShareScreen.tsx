import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Share,
  Alert,
  Modal,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

const { width } = Dimensions.get('window')

// Mock数据
const mockStats = {
  totalReferrals: 156,
  activeUsers: 128,
  conversions: 128,
  scanRate: 82,
}

const mockTrendData = [
  { date: '周一', 推荐: 23, 扫码: 18, 转化: 15 },
  { date: '周二', 推荐: 25, 扫码: 20, 转化: 17 },
  { date: '周三', 推荐: 21, 扫码: 17, 转化: 14 },
  { date: '周四', 推荐: 28, 扫码: 23, 转化: 19 },
  { date: '周五', 推荐: 32, 扫码: 26, 转化: 22 },
  { date: '周六', 推荐: 15, 扫码: 12, 转化: 10 },
  { date: '周日', 推荐: 12, 扫码: 10, 转化: 8 },
]

const mockChannelData = [
  { channel: '抖音', count: 45, color: '#ff4757' },
  { channel: '微信', count: 67, color: '#07c160' },
  { channel: '小红书', count: 28, color: '#ff2442' },
  { channel: '其他', count: 16, color: '#8e8e93' },
]

const mockRecords = [
  { id: '1', referrer: '张三', referred: '李四', code: 'ZHISHUAI001', time: '2024-03-25 14:30', status: '成功' },
  { id: '2', referrer: '张三', referred: '王五', code: 'ZHISHUAI002', time: '2024-03-24 11:20', status: '成功' },
  { id: '3', referrer: '李四', referred: '赵六', code: 'ZHISHUAI003', time: '2024-03-23 09:15', status: '待激活' },
  { id: '4', referrer: '王五', referred: '钱七', code: 'ZHISHUAI004', time: '2024-03-22 16:45', status: '成功' },
  { id: '5', referrer: '李四', referred: '孙八', code: 'ZHISHUAI005', time: '2024-03-21 10:00', status: '已失效' },
]

const referralCodes = [
  { id: '1', name: '个人推广码', code: 'ZHISHUAI2024', platform: '全平台', status: 'active' },
]

type TabType = 'board' | 'code'

export default function ShareScreen() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('board')
  const [refreshing, setRefreshing] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedCode, setSelectedCode] = useState('')

  const colors = {
    background: theme === 'dark' ? '#1a1a2e' : '#f5f7fa',
    card: theme === 'dark' ? '#16213e' : '#ffffff',
    text: theme === 'dark' ? '#ffffff' : '#1a1a2e',
    textSecondary: theme === 'dark' ? '#a0a0a0' : '#666666',
    primary: '#1890ff',
    accent: '#722ed1',
  }

  const onRefresh = async () => {
    setRefreshing(true)
    // 模拟刷新数据
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  const handleCopyCode = (code: string) => {
    Alert.alert('提示', `推荐码 ${code} 已复制到剪贴板`)
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `我在使用智枢AI，邀请你一起体验！推荐码：ZHISHUAI2024`,
        title: '邀请好友',
      })
    } catch (error) {
      console.error('分享失败:', error)
    }
  }

  const handleGenerateQR = (code: string) => {
    setSelectedCode(code)
    setShowQRModal(true)
  }

  // 渲染统计卡片
  const renderStatCard = (title: string, value: string | number, icon: string, color: string) => (
    <View style={[styles.statCard, { backgroundColor: colors.card }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
      </View>
    </View>
  )

  // 渲染趋势图
  const renderTrendChart = () => {
    const maxValue = Math.max(...mockTrendData.map(d => d.推荐))
    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>推荐趋势</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chartContainer}>
            {mockTrendData.map((item, index) => (
              <View key={index} style={styles.chartBar}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      { height: (item.推荐 / maxValue) * 100, backgroundColor: colors.primary }
                    ]}
                  />
                  <View
                    style={[
                      styles.bar,
                      { height: (item.扫码 / maxValue) * 100, backgroundColor: '#fa8c16', marginTop: 4 }
                    ]}
                  />
                  <View
                    style={[
                      styles.bar,
                      { height: (item.转化 / maxValue) * 100, backgroundColor: colors.accent, marginTop: 4 }
                    ]}
                  />
                </View>
                <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>{item.date}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>推荐</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#fa8c16' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>扫码</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>转化</Text>
          </View>
        </View>
      </View>
    )
  }

  // 渲染渠道分布
  const renderChannelChart = () => {
    const total = mockChannelData.reduce((sum, item) => sum + item.count, 0)
    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>渠道分布</Text>
        {mockChannelData.map((item, index) => (
          <View key={index} style={styles.channelItem}>
            <View style={styles.channelLeft}>
              <Text style={[styles.channelName, { color: colors.text }]}>{item.channel}</Text>
              <Text style={[styles.channelCount, { color: item.color }]}>{item.count}</Text>
            </View>
            <View style={styles.channelRight}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(item.count / total) * 100}%`, backgroundColor: item.color }
                  ]}
                />
              </View>
              <Text style={[styles.channelPercent, { color: colors.textSecondary }]}>
                {((item.count / total) * 100).toFixed(1)}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    )
  }

  // 渲染推荐记录
  const renderRecords = () => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <Text style={[styles.cardTitle, { color: colors.text }]}>推荐记录</Text>
      {mockRecords.map((record, index) => (
        <TouchableOpacity
          key={record.id}
          style={[
            styles.recordItem,
            index < mockRecords.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.textSecondary + '20' }
          ]}
        >
          <View style={styles.recordHeader}>
            <Text style={[styles.recordName, { color: colors.text }]}>{record.referred}</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: record.status === '成功' ? '#52c41a20' : record.status === '待激活' ? '#fa8c1620' : '#8e8e9320' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: record.status === '成功' ? '#52c41a' : record.status === '待激活' ? '#fa8c16' : '#8e8e93' }
              ]}>{record.status}</Text>
            </View>
          </View>
          <View style={styles.recordDetail}>
            <Text style={[styles.recordCode, { color: colors.primary }]}>{record.code}</Text>
            <Text style={[styles.recordTime, { color: colors.textSecondary }]}>{record.time}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  )

  // 渲染推荐码管理
  const renderCodeManagement = () => (
    <View style={styles.codeSection}>
      <View style={[styles.codeCard, { backgroundColor: colors.card }]}>
        <View style={styles.codeHeader}>
          <Text style={[styles.codeTitle, { color: colors.text }]}>我的推荐码</Text>
          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: colors.primary }]}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={18} color="#fff" />
            <Text style={styles.shareButtonText}>分享</Text>
          </TouchableOpacity>
        </View>
        
        {referralCodes.map((item) => (
          <View key={item.id} style={styles.codeItem}>
            <View style={[styles.codeInfo, { borderColor: colors.primary + '40' }]}>
              <View style={styles.codeDetail}>
                <Text style={[styles.codeName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.codeValue, { color: colors.primary }]}>{item.code}</Text>
                <View style={styles.codeMeta}>
                  <Text style={[styles.codePlatform, { color: colors.textSecondary }]}>{item.platform}</Text>
                  <View style={[styles.codeStatus, { backgroundColor: '#52c41a20' }]}>
                    <Text style={[styles.codeStatusText, { color: '#52c41a' }]}>生效中</Text>
                  </View>
                </View>
              </View>
              <View style={[styles.qrIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="qr-code" size={48} color={colors.primary} />
              </View>
            </View>
            
            <View style={styles.codeActions}>
              <TouchableOpacity
                style={styles.codeAction}
                onPress={() => handleCopyCode(item.code)}
              >
                <Ionicons name="copy-outline" size={20} color={colors.primary} />
                <Text style={[styles.codeActionText, { color: colors.primary }]}>复制</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.codeAction}
                onPress={() => handleGenerateQR(item.code)}
              >
                <Ionicons name="qr-code-outline" size={20} color={colors.primary} />
                <Text style={[styles.codeActionText, { color: colors.primary }]}>二维码</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.codeAction}
                onPress={handleShare}
              >
                <Ionicons name="share-outline" size={20} color={colors.primary} />
                <Text style={[styles.codeActionText, { color: colors.primary }]}>分享</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
      
      {/* 二维码说明 */}
      <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
        <View style={styles.infoHeader}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={[styles.infoTitle, { color: colors.text }]}>使用说明</Text>
        </View>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          1. 分享您的推荐码给好友{'\n'}
          2. 好友使用您的推荐码注册{'\n'}
          3. 好友成功注册后，您获得积分奖励{'\n'}
          4. 可在推荐记录中查看推荐详情
        </Text>
      </View>
    </View>
  )

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 头部 */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>推荐分享</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>分享赚积分，好礼等你拿</Text>
      </View>

      {/* Tab切换 */}
      <View style={[styles.tabContainer, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'board' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('board')}
        >
          <Ionicons
            name="stats-chart"
            size={20}
            color={activeTab === 'board' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, { color: activeTab === 'board' ? colors.primary : colors.textSecondary }]}>
            数据看板
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'code' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('code')}
        >
          <Ionicons
            name="qr-code"
            size={20}
            color={activeTab === 'code' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, { color: activeTab === 'code' ? colors.primary : colors.textSecondary }]}>
            推荐码
          </Text>
        </TouchableOpacity>
      </View>

      {/* 内容区域 */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'board' ? (
          <>
            {/* 统计卡片 */}
            <View style={styles.statsGrid}>
              {renderStatCard('总推荐数', mockStats.totalReferrals, 'people', colors.primary)}
              {renderStatCard('活跃用户', mockStats.activeUsers, 'checkmark-circle', '#52c41a')}
              {renderStatCard('成功转化', mockStats.conversions, 'trending-up', '#fa8c16')}
              {renderStatCard('扫码率', mockStats.scanRate + '%', 'scan', colors.accent)}
            </View>

            {/* 趋势图 */}
            {renderTrendChart()}

            {/* 渠道分布 */}
            {renderChannelChart()}

            {/* 推荐记录 */}
            {renderRecords()}
          </>
        ) : (
          renderCodeManagement()
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* 二维码弹窗 */}
      <Modal visible={showQRModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowQRModal(false)}
        >
          <View style={[styles.qrModal, { backgroundColor: colors.card }]}>
            <Text style={[styles.qrModalTitle, { color: colors.text }]}>推荐二维码</Text>
            <View style={styles.qrCode}>
              <Ionicons name="qr-code" size={200} color={colors.text} />
            </View>
            <Text style={[styles.qrCodeText, { color: colors.primary }]}>{selectedCode}</Text>
            <View style={styles.qrActions}>
              <TouchableOpacity
                style={styles.qrActionButton}
                onPress={() => {
                  handleCopyCode(selectedCode)
                  setShowQRModal(false)
                }}
              >
                <Ionicons name="copy-outline" size={24} color="#fff" />
                <Text style={styles.qrActionText}>复制</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.qrActionButton, styles.qrActionButtonPrimary]}
                onPress={() => {
                  Alert.alert('提示', '二维码已保存到相册')
                  setShowQRModal(false)
                }}
              >
                <Ionicons name="download-outline" size={24} color="#fff" />
                <Text style={styles.qrActionText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: (width - 48) / 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 2,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 10,
  },
  chartBar: {
    alignItems: 'center',
    marginHorizontal: 6,
    width: 30,
  },
  barWrapper: {
    alignItems: 'center',
  },
  bar: {
    width: 20,
    borderRadius: 4,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 10,
    marginTop: 8,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  channelLeft: {
    width: 80,
  },
  channelName: {
    fontSize: 14,
  },
  channelCount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  channelRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  channelPercent: {
    width: 50,
    textAlign: 'right',
    fontSize: 12,
    marginLeft: 8,
  },
  recordItem: {
    paddingVertical: 12,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordName: {
    fontSize: 15,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
  },
  recordDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  recordCode: {
    fontSize: 13,
  },
  recordTime: {
    fontSize: 13,
  },
  codeSection: {
    gap: 16,
  },
  codeCard: {
    borderRadius: 12,
    padding: 16,
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  codeTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 13,
  },
  codeItem: {
    marginBottom: 16,
  },
  codeInfo: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  codeDetail: {
    flex: 1,
  },
  codeName: {
    fontSize: 14,
    fontWeight: '500',
  },
  codeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  codeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codePlatform: {
    fontSize: 12,
  },
  codeStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  codeStatusText: {
    fontSize: 11,
  },
  qrIcon: {
    width: 80,
    height: 80,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  codeAction: {
    alignItems: 'center',
    gap: 4,
  },
  codeActionText: {
    fontSize: 12,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 22,
  },
  bottomPadding: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrModal: {
    width: width * 0.85,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  qrModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  qrCode: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  qrCodeText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
  qrActions: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 16,
  },
  qrActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#666',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  qrActionButtonPrimary: {
    backgroundColor: '#1890ff',
  },
  qrActionText: {
    color: '#fff',
    fontSize: 14,
  },
})
