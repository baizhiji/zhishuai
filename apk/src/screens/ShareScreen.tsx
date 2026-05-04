import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function ShareScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'stats' | 'code'>('stats');
  const [showCode, setShowCode] = useState(false);

  const stats = { total: 156, scans: 89, converts: 34, rate: '21.8%' };

  const records = [
    { id: '1', referrer: '张三', code: 'ZS2024001', scans: 12, converts: 3 },
    { id: '2', referrer: '李四', code: 'LS2024002', scans: 8, converts: 2 },
    { id: '3', referrer: '王五', code: 'WW2024003', scans: 5, converts: 1 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>推荐分享</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, activeTab === 'stats' && styles.tabActive]} onPress={() => setActiveTab('stats')}>
          <Ionicons name="stats-chart" size={16} color={activeTab === 'stats' ? '#4F46E5' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>数据统计</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'code' && styles.tabActive]} onPress={() => setActiveTab('code')}>
          <Ionicons name="qr-code" size={16} color={activeTab === 'code' ? '#4F46E5' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'code' && styles.tabTextActive]}>推荐码</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'stats' ? (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}><Text style={styles.statValue}>{stats.total}</Text><Text style={styles.statLabel}>推荐总数</Text></View>
              <View style={styles.statCard}><Text style={styles.statValue}>{stats.scans}</Text><Text style={styles.statLabel}>扫码人数</Text></View>
              <View style={styles.statCard}><Text style={styles.statValue}>{stats.converts}</Text><Text style={styles.statLabel}>成功转化</Text></View>
              <View style={styles.statCard}><Text style={styles.statValue}>{stats.rate}</Text><Text style={styles.statLabel}>转化率</Text></View>
            </View>
            <Text style={styles.sectionTitle}>推荐记录</Text>
            {records.map(r => (
              <View key={r.id} style={styles.recordCard}>
                <View style={styles.recordLeft}>
                  <Text style={styles.recordName}>{r.referrer}</Text>
                  <Text style={styles.recordCode}>{r.code}</Text>
                </View>
                <View style={styles.recordRight}>
                  <Text style={styles.recordStat}>{r.scans}扫码</Text>
                  <Text style={styles.recordStat}>{r.converts}转化</Text>
                </View>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.codeSection}>
            <Text style={styles.sectionTitle}>我的推荐码</Text>
            <View style={styles.codeCard}>
              <Ionicons name="qr-code-outline" size={120} color="#1e293b" />
              <Text style={styles.myCode}>ZS2024001</Text>
              <TouchableOpacity style={styles.copyBtn} onPress={() => Alert.alert('成功', '推荐码已复制')}>
                <Text style={styles.copyBtnText}>复制推荐码</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: { width: '48%', backgroundColor: '#fff', borderRadius: 10, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#4F46E5' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 12, marginTop: 8 },
  recordCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  recordLeft: { flex: 1 },
  recordName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  recordCode: { fontSize: 12, color: '#64748b', marginTop: 2 },
  recordRight: { alignItems: 'flex-end', gap: 4 },
  recordStat: { fontSize: 12, color: '#64748b' },
  codeSection: { alignItems: 'center' },
  codeCard: { backgroundColor: '#fff', borderRadius: 16, padding: 30, alignItems: 'center', width: '100%' },
  myCode: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginTop: 16 },
  copyBtn: { backgroundColor: '#4F46E5', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 30, marginTop: 20 },
  copyBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
