import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { referralService, ReferralCode, ReferralRecord } from '../services/referral.service';

export default function ReferralScreen() {
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [records, setRecords] = useState<ReferralRecord[]>([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 获取推荐码
      try {
        const code = await referralService.getMyCode();
        setReferralCode(code);
      } catch (e) {
        console.log('获取推荐码失败');
      }
      // 获取推荐记录
      try {
        const recordList = await referralService.getRecords();
        setRecords(recordList);
      } catch (e) {
        console.log('获取推荐记录失败');
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    setGenerating(true);
    try {
      const code = await referralService.generateCode();
      setReferralCode(code);
      Alert.alert('成功', '推荐码已生成');
    } catch (error) {
      Alert.alert('失败', '生成推荐码失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!referralCode?.code) {
      Alert.alert('提示', '请先生成推荐码');
      return;
    }
    
    const shareUrl = `https://zhishuai.com/register?code=${referralCode.code}`;
    const shareText = `注册智枢AI，享专属优惠！\n邀请码：${referralCode.code}\n${shareUrl}`;
    
    try {
      await Share.share({
        message: shareText,
        title: '邀请好友加入智枢AI',
      });
    } catch (error) {
      console.error('分享失败:', error);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '待注册';
      case 'active': return '已激活';
      case 'expired': return '已过期';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'active': return '#10B981';
      case 'expired': return '#94A3B8';
      default: return '#64748B';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#DBEAFE" />
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#DBEAFE" />
      
      <View style={styles.header}>
        <Text style={styles.title}>转介绍</Text>
        <Text style={styles.subtitle}>邀请好友注册，双方都可获得优惠</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>我的推荐码</Text>
          {referralCode ? (
            <Text style={styles.codeValue}>{referralCode.code}</Text>
          ) : (
            <Text style={styles.codePlaceholder}>暂无可用推荐码</Text>
          )}
          
          <View style={styles.buttonRow}>
            {!referralCode ? (
              <TouchableOpacity 
                style={styles.generateButton}
                onPress={handleGenerateCode}
                disabled={generating}
              >
                {generating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.generateButtonText}>生成推荐码</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.shareButton}
                onPress={handleShare}
              >
                <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
                <Text style={styles.shareButtonText}>分享邀请</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{referralCode?.useCount || 0}</Text>
            <Text style={styles.statLabel}>已邀请</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{referralCode?.rewardAmount || 0}</Text>
            <Text style={styles.statLabel}>已奖励</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>邀请记录</Text>
          {records.length > 0 ? (
            records.map((record, index) => (
              <View key={index} style={styles.recordItem}>
                <View style={styles.recordLeft}>
                  <View style={styles.recordAvatar}>
                    <Text style={styles.recordAvatarText}>
                      {(record.inviteeName || '用').charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.recordInfo}>
                    <Text style={styles.recordName}>
                      {record.inviteeName || '新用户'}
                    </Text>
                    <Text style={styles.recordTime}>
                      {new Date(record.createTime).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={[styles.recordStatus, { backgroundColor: getStatusColor(record.status) + '20' }]}>
                  <Text style={[styles.recordStatusText, { color: getStatusColor(record.status) }]}>
                    {getStatusLabel(record.status)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>暂无邀请记录</Text>
              <Text style={styles.emptySubtext}>分享邀请码给好友，开始邀请吧</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF6FF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  header: {
    backgroundColor: '#DBEAFE',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A5F',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  codeCard: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  codeValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 4,
    marginVertical: 12,
  },
  codePlaceholder: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginVertical: 12,
  },
  buttonRow: {
    marginTop: 8,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  generateButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 6,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  shareButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    marginLeft: 6,
    fontWeight: '500',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A5F',
  },
  statLabel: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 12,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  recordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recordInfo: {
    flex: 1,
  },
  recordName: {
    fontSize: 14,
    color: '#1E3A5F',
    fontWeight: '500',
  },
  recordTime: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  recordStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recordStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 4,
  },
  bottomPadding: {
    height: 40,
  },
});
