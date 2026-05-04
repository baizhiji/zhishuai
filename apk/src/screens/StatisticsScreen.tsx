import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PageHeader from '../components/PageHeader';

export default function StatisticsScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'content' | 'publish'>('content');

  const contentRecords = [
    { id: '1', type: '文案', title: '夏季营销文案', time: '2024-05-01', status: '已发布' },
    { id: '2', type: '图片', title: '产品主图设计', time: '2024-05-01', status: '待发布' },
    { id: '3', type: '视频', title: '品牌宣传片', time: '2024-04-30', status: '已发布' },
  ];

  const publishRecords = [
    { id: '1', title: '夏季营销文案', platform: '抖音', time: '2024-05-01', views: 1250 },
    { id: '2', title: '产品主图设计', platform: '小红书', time: '2024-05-01', views: 890 },
    { id: '3', title: '品牌宣传片', platform: '抖音', time: '2024-04-30', views: 3560 },
  ];

  return (
    <View style={styles.container}>
      <PageHeader title="数据统计" />

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, activeTab === 'content' && styles.tabActive]} onPress={() => setActiveTab('content')}>
          <Text style={[styles.tabText, activeTab === 'content' && styles.tabTextActive]}>创作记录</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'publish' && styles.tabActive]} onPress={() => setActiveTab('publish')}>
          <Text style={[styles.tabText, activeTab === 'publish' && styles.tabTextActive]}>发布记录</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'content' ? (
          contentRecords.map(r => (
            <View key={r.id} style={styles.recordCard}>
              <View style={[styles.typeBadge, { backgroundColor: r.type === '文案' ? '#dbeafe' : r.type === '图片' ? '#dcfce7' : '#fef3c7' }]}>
                <Text style={[styles.typeText, { color: r.type === '文案' ? '#1d4ed8' : r.type === '图片' ? '#166534' : '#b45309' }]}>{r.type}</Text>
              </View>
              <View style={styles.recordInfo}>
                <Text style={styles.recordTitle}>{r.title}</Text>
                <Text style={styles.recordTime}>{r.time}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: r.status === '已发布' ? '#dcfce7' : '#fef3c7' }]}>
                <Text style={[styles.statusText, { color: r.status === '已发布' ? '#166534' : '#b45309' }]}>{r.status}</Text>
              </View>
            </View>
          ))
        ) : (
          publishRecords.map(r => (
            <View key={r.id} style={styles.recordCard}>
              <View style={styles.recordInfo}>
                <Text style={styles.recordTitle}>{r.title}</Text>
                <View style={styles.recordMeta}>
                  <View style={styles.platformBadge}><Text style={styles.platformText}>{r.platform}</Text></View>
                  <Text style={styles.recordTime}>{r.time}</Text>
                </View>
              </View>
              <View style={styles.viewsInfo}>
                <Ionicons name="eye-outline" size={14} color="#64748b" />
                <Text style={styles.viewsText}>{r.views}</Text>
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
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#4F46E5' },
  tabText: { fontSize: 13, color: '#94a3b8' },
  tabTextActive: { color: '#4F46E5', fontWeight: '500' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  recordCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginRight: 12 },
  typeText: { fontSize: 12, fontWeight: '600' },
  recordInfo: { flex: 1 },
  recordTitle: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  recordTime: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  recordMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  platformBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  platformText: { fontSize: 11, color: '#64748b' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '500' },
  viewsInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewsText: { fontSize: 13, color: '#64748b' },
});
