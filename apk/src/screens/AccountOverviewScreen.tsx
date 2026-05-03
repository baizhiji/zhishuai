import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { accountService, AccountInfo, UsageStat, UsageRecord } from '../services/account.service';

interface Props {
  onBack?: () => void;
}

export default function AccountOverviewScreen({ onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStat[]>([]);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [info, stats, records] = await Promise.all([
        accountService.getAccountInfo(),
        accountService.getUsageStats(),
        accountService.getUsageRecords(),
      ]);
      setAccountInfo(info);
      setUsageStats(stats);
      setUsageRecords(records);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 账户基本信息 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>账户信息</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Ionicons name="person-outline" size={20} color="#3B82F6" />
            <Text style={styles.infoLabel}>账户ID</Text>
            <Text style={styles.infoValue}>{accountInfo?.userId}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={20} color="#3B82F6" />
            <Text style={styles.infoLabel}>手机号码</Text>
            <Text style={styles.infoValue}>{accountInfo?.phone}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="card-outline" size={20} color="#faad14" />
            <Text style={styles.infoLabel}>会员类型</Text>
            <Text style={[styles.infoValue, styles.memberValue]}>
              {accountInfo?.memberType}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color="#3B82F6" />
            <Text style={styles.infoLabel}>到期时间</Text>
            <Text style={styles.infoValue}>{accountInfo?.expireDate}</Text>
          </View>
        </View>
      </View>

      {/* 功能使用统计 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>功能使用统计</Text>
        <View style={styles.statsGrid}>
          {usageStats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                <Text style={[styles.statIconText, { color: stat.color }]}>
                  {stat.name.charAt(0)}
                </Text>
              </View>
              <Text style={styles.statName}>{stat.name}</Text>
              <Text style={[styles.statValue, { color: stat.color }]}>
                {stat.value}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 使用记录 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>使用记录</Text>
        <View style={styles.recordsCard}>
          {usageRecords.map((record, index) => (
            <View
              key={record.id}
              style={[
                styles.recordItem,
                index < usageRecords.length - 1 && styles.recordItemBorder,
              ]}
            >
              <View style={styles.recordLeft}>
                <Text style={styles.recordType}>{record.type}</Text>
                <Text style={styles.recordTime}>{record.time}</Text>
              </View>
              <Text style={styles.recordCount}>+{record.count}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
  },
  infoItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 4,
  },
  memberValue: {
    color: '#faad14',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginRight: '4%',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIconText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statName: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  recordsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  recordItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  recordLeft: {
    flex: 1,
  },
  recordType: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  recordTime: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  recordCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22C55E',
  },
  bottomPadding: {
    height: 20,
  },
});
