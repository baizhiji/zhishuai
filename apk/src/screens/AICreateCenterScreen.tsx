import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, FlatList, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ContentCategory } from '../../services/content.service';

type RootStackParamList = { MainTabs: undefined; AICreateCenter: undefined };

// 创作类型
const CONTENT_TYPES = [
  { id: 'copywriting', name: '文案', icon: 'create', color: '#4F46E5' },
  { id: 'image', name: '图片', icon: 'image', color: '#7C3AED' },
  { id: 'video', name: '视频', icon: 'videocam', color: '#EC4899' },
  { id: 'title', name: '标题', icon: 'text', color: '#10B981' },
  { id: 'tags', name: '话题', icon: 'pricetag', color: '#F59E0B' },
  { id: 'xhs', name: '小红书', icon: 'book', color: '#EF4444' },
  { id: 'ecommerce', name: '电商', icon: 'cart', color: '#3B82F6' },
  { id: 'digital_human', name: '数字人', icon: 'people', color: '#14B8A6' },
];

// 平台
const PLATFORMS = [
  { id: 'douyin', name: '抖音', color: '#00f2ea' },
  { id: 'kuaishou', name: '快手', color: '#ff4906' },
  { id: 'xiaohongshu', name: '小红书', color: '#fe2c55' },
  { id: 'weixin', name: '微信', color: '#07c160' },
];

export default function AICreateCenterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<'create' | 'data'>('create');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [keywords, setKeywords] = useState('');
  const [content, setContent] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleGenerate = async () => {
    if (!selectedType) { Alert.alert('提示', '请选择创作类型'); return; }
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setContent(`【AI生成内容】\n\n主题：${keywords || '企业数字化转型'}\n\n在当今竞争激烈的商业环境中，智枢AI为企业提供一站式智能营销解决方案，帮助企业提升效率、降低成本。\n\n#AI赋能 #企业数字化 #智能营销`);
    setIsGenerating(false);
  };

  const handleCopy = () => { Alert.alert('提示', '已复制到剪贴板'); };
  const handleSave = () => { Alert.alert('成功', '已保存到素材库'); };
  const handlePublish = () => {
    if (!content || selectedPlatforms.length === 0) { Alert.alert('提示', '请生成内容并选择平台'); return; }
    Alert.alert('成功', `已提交发布到${selectedPlatforms.length}个平台`);
  };

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI创作中心</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tab */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, activeTab === 'create' && styles.tabActive]} onPress={() => setActiveTab('create')}>
          <Ionicons name="bulb" size={16} color={activeTab === 'create' ? '#4F46E5' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>创作</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'data' && styles.tabActive]} onPress={() => setActiveTab('data')}>
          <Ionicons name="stats-chart" size={16} color={activeTab === 'data' ? '#4F46E5' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'data' && styles.tabTextActive]}>数据</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'create' ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 创作类型 */}
          <Text style={styles.sectionTitle}>选择创作类型</Text>
          <View style={styles.typeGrid}>
            {CONTENT_TYPES.map(type => (
              <TouchableOpacity key={type.id} style={[styles.typeCard, selectedType === type.id && { borderColor: type.color, borderWidth: 2 }]} onPress={() => setSelectedType(type.id)}>
                <View style={[styles.typeIcon, { backgroundColor: type.color + '20' }]}>
                  <Ionicons name={type.icon as any} size={20} color={type.color} />
                </View>
                <Text style={styles.typeName}>{type.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 关键词 */}
          <Text style={styles.sectionTitle}>关键词</Text>
          <TextInput style={styles.input} placeholder="输入创作主题或关键词" placeholderTextColor="#94a3b8" value={keywords} onChangeText={setKeywords} />

          {/* 平台 */}
          <Text style={styles.sectionTitle}>发布平台</Text>
          <TouchableOpacity style={styles.platformBtn} onPress={() => setShowPicker(true)}>
            <Text style={styles.platformBtnText}>{selectedPlatforms.length > 0 ? `已选${selectedPlatforms.length}个平台` : '选择平台'}</Text>
            <Ionicons name="chevron-down" size={18} color="#64748b" />
          </TouchableOpacity>

          {/* 生成按钮 */}
          <TouchableOpacity style={[styles.genBtn, !selectedType && styles.genBtnDis]} onPress={handleGenerate} disabled={!selectedType || isGenerating}>
            {isGenerating ? <ActivityIndicator color="#fff" /> : <><Ionicons name="sparkles" size={18} color="#fff" /><Text style={styles.genBtnText}>AI生成</Text></>}
          </TouchableOpacity>

          {/* 结果 */}
          {content && (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>生成结果</Text>
              <Text style={styles.resultText}>{content}</Text>
              <View style={styles.resultActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={handleCopy}><Ionicons name="copy" size={16} color="#4F46E5" /><Text style={styles.actionText}>复制</Text></TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={handleSave}><Ionicons name="bookmark" size={16} color="#4F46E5" /><Text style={styles.actionText}>保存</Text></TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={handlePublish}><Ionicons name="cloud-upload" size={16} color="#4F46E5" /><Text style={styles.actionText}>发布</Text></TouchableOpacity>
              </View>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>数据概览</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}><Text style={styles.statVal}>156</Text><Text style={styles.statLabel}>发布量</Text></View>
            <View style={styles.statCard}><Text style={styles.statVal}>8.2k</Text><Text style={styles.statLabel}>阅读</Text></View>
            <View style={styles.statCard}><Text style={styles.statVal}>89</Text><Text style={styles.statLabel}>获客</Text></View>
          </View>
          <Text style={styles.sectionTitle}>最近发布</Text>
          {[{ title: 'AI赋能企业数字化转型', platform: '抖音', date: '01-15' }, { title: '智枢AI产品介绍', platform: '小红书', date: '01-14' }].map((item, i) => (
            <View key={i} style={styles.listItem}>
              <View style={styles.listInfo}><Text style={styles.listTitle}>{item.title}</Text><Text style={styles.listMeta}>{item.platform} · {item.date}</Text></View>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* 平台选择弹窗 */}
      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>选择平台</Text><TouchableOpacity onPress={() => setShowPicker(false)}><Ionicons name="close" size={22} color="#1e293b" /></TouchableOpacity></View>
            {PLATFORMS.map(p => (
              <TouchableOpacity key={p.id} style={styles.platformItem} onPress={() => togglePlatform(p.id)}>
                <Text style={styles.platformName}>{p.name}</Text>
                <Ionicons name={selectedPlatforms.includes(p.id) ? 'checkbox' : 'square-outline'} size={22} color={selectedPlatforms.includes(p.id) ? '#4F46E5' : '#94a3b8'} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalBtn} onPress={() => setShowPicker(false)}><Text style={styles.modalBtnText}>确定</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 10, marginTop: 12 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeCard: { width: '23%', backgroundColor: '#fff', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  typeIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  typeName: { fontSize: 11, color: '#475569' },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 12, fontSize: 14, color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0' },
  platformBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  platformBtnText: { fontSize: 14, color: '#64748b' },
  genBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#4F46E5', borderRadius: 10, padding: 14, marginTop: 16 },
  genBtnDis: { backgroundColor: '#94a3b8' },
  genBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  resultCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginTop: 16 },
  resultTitle: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 8 },
  resultText: { fontSize: 13, color: '#475569', lineHeight: 22 },
  resultActions: { flexDirection: 'row', gap: 16, marginTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 13, color: '#4F46E5' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 14, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '700', color: '#4F46E5' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  listItem: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  listInfo: { flex: 1 },
  listTitle: { fontSize: 13, color: '#1e293b', fontWeight: '500' },
  listMeta: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  platformItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  platformName: { fontSize: 14, color: '#334155' },
  modalBtn: { backgroundColor: '#4F46E5', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 16 },
  modalBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
