/**
 * BusinessAssistantScreen - 商业助手主页面
 * 智枢 AI APK - 移动端
 *
 * 功能：
 * 1. 8大商业场景卡片网格
 * 2. 历史方案列表
 * 3. 自由问答入口
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import businessService, { BusinessScenario, BusinessPlan } from '../../services/business.service';
import PageHeader from '../../components/PageHeader';

interface ScenarioIconMap {
  [key: string]: { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string };
}

const SCENARIO_CONFIG: ScenarioIconMap = {
  startup: { icon: 'bulb', color: '#6D28D9', bg: '#F4F1FA' },
  operations: { icon: 'settings', color: '#059669', bg: '#ECFDF5' },
  diagnosis: { icon: 'pulse', color: '#EA580C', bg: '#FFF7ED' },
  media_operations: { icon: 'phone-portrait', color: '#7C3AED', bg: '#F5F3FF' },
  product_promotion: { icon: 'megaphone', color: '#DC2626', bg: '#FEF2F2' },
  competitive_analysis: { icon: 'trophy', color: '#6D28D9', bg: '#F5F3FF' },
  brick_and_mortar: { icon: 'storefront', color: '#0D9488', bg: '#F0FDFA' },
  marketing: { icon: 'trending-up', color: '#D946EF', bg: '#FDF4FF' },
};

const CATEGORY_LABELS: Record<string, string> = {
  planning: '方案策划',
  management: '运营管理',
  analysis: '分析诊断',
  marketing: '营销推广',
};

export default function BusinessAssistantScreen() {
  const navigation = useNavigation<any>();
  const [scenarios, setScenarios] = useState<BusinessScenario[]>([]);
  const [plans, setPlans] = useState<BusinessPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [scenariosData, plansData] = await Promise.all([
        businessService.getScenarios(),
        businessService.getPlans(),
      ]);
      setScenarios(scenariosData);
      setPlans(plansData);
    } catch (err) {
      console.error('加载商业助手数据失败:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const categories = [...new Set(scenarios.map(s => s.category))];

  const filteredScenarios = scenarios.filter(s => {
    if (activeCategory && s.category !== activeCategory) return false;
    if (searchQuery && !s.name.includes(searchQuery) && !s.description.includes(searchQuery)) return false;
    return true;
  });

  const handleScenarioPress = (scenario: BusinessScenario) => {
    navigation.navigate('PlanGeneration', { scenario });
  };

  const handlePlanPress = (plan: BusinessPlan) => {
    navigation.navigate('PlanView', { planId: plan.id, scenarioId: plan.scenarioId });
  };

  const handleFreeChat = () => {
    navigation.navigate('BusinessChat');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <PageHeader title="商业助手" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6D28D9" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader title="商业助手" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* AI 标识横幅 */}
        <View style={styles.heroBanner}>
          <View style={styles.heroLeft}>
            <Ionicons name="flash" size={20} color="#F59E0B" />
            <Text style={styles.heroTitle}>AI 商业智囊</Text>
          </View>
          <Text style={styles.heroSubtitle}>
            集成腾讯云 TokenHub · 阿里云百炼大模型{'\n'}
            8大商业场景，一键生成专业方案
          </Text>
          <TouchableOpacity
            style={styles.apiKeyTip}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="key-outline" size={14} color="#C4B5FD" />
            <Text style={styles.apiKeyTipText}>AI服务已启用，自动复用电脑端配置的API</Text>
            <Ionicons name="chevron-forward" size={14} color="#C4B5FD" />
          </TouchableOpacity>
        </View>

        {/* 搜索 */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索商业场景..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* 分类筛选 */}
        {categories.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContainer}
          >
            <TouchableOpacity
              style={[styles.categoryChip, !activeCategory && styles.categoryChipActive]}
              onPress={() => setActiveCategory(null)}
            >
              <Text style={[styles.categoryText, !activeCategory && styles.categoryTextActive]}>
                全部
              </Text>
            </TouchableOpacity>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
                onPress={() => setActiveCategory(activeCategory === cat ? null : cat)}
              >
                <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>
                  {CATEGORY_LABELS[cat] || cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* 场景网格 */}
        <Text style={styles.sectionTitle}>选择商业场景</Text>
        <View style={styles.grid}>
          {filteredScenarios.map(scenario => {
            const config = SCENARIO_CONFIG[scenario.id] || { icon: 'document-text', color: '#6B7280', bg: '#F9FAFB' };
            return (
              <TouchableOpacity
                key={scenario.id}
                style={styles.scenarioCard}
                activeOpacity={0.7}
                onPress={() => handleScenarioPress(scenario)}
              >
                <View style={[styles.scenarioIcon, { backgroundColor: config.bg }]}>
                  <Ionicons name={config.icon} size={28} color={config.color} />
                </View>
                <Text style={styles.scenarioName} numberOfLines={1}>{scenario.name}</Text>
                <Text style={styles.scenarioDesc} numberOfLines={2}>{scenario.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 自由问答入口 */}
        <TouchableOpacity
          style={styles.freeChatButton}
          activeOpacity={0.7}
          onPress={handleFreeChat}
        >
          <View style={styles.freeChatLeft}>
            <View style={[styles.freeChatIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="chatbubbles" size={24} color="#D97706" />
            </View>
            <View style={styles.freeChatText}>
              <Text style={styles.freeChatTitle}>自由问答</Text>
              <Text style={styles.freeChatSubtitle}>直接与商业助手对话，获取即时建议</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
        </TouchableOpacity>

        {/* 历史方案 */}
        {plans.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>我的方案</Text>
            {plans.map(plan => {
              const config = SCENARIO_CONFIG[plan.scenarioId] || { icon: 'document-text', color: '#6B7280', bg: '#F9FAFB' };
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={styles.planCard}
                  activeOpacity={0.7}
                  onPress={() => handlePlanPress(plan)}
                >
                  <View style={[styles.planIcon, { backgroundColor: config.bg }]}>
                    <Ionicons name={config.icon} size={20} color={config.color} />
                  </View>
                  <View style={styles.planContent}>
                    <Text style={styles.planName} numberOfLines={1}>{plan.businessName}</Text>
                    <View style={styles.planMeta}>
                      <Text style={styles.planScenario}>{plan.scenarioName}</Text>
                      <Text style={styles.planDate}>
                        {new Date(plan.createdAt).toLocaleDateString('zh-CN')}
                      </Text>
                    </View>
                    <Text style={styles.planSummary} numberOfLines={2}>{plan.summary}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                </TouchableOpacity>
              );
            })}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },

  // Hero Banner
  heroBanner: {
    backgroundColor: '#1F1B2E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 20,
    marginBottom: 12,
  },
  apiKeyTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(109,40,217,0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  apiKeyTipText: {
    flex: 1,
    fontSize: 12,
    color: '#C4B5FD',
  },

  // Search
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 44,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#1F2937' },

  // Categories
  categoryScroll: { marginBottom: 20 },
  categoryContainer: { gap: 8, paddingRight: 16 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipActive: {
    backgroundColor: '#6D28D9',
    borderColor: '#6D28D9',
  },
  categoryText: { fontSize: 14, color: '#6B7280' },
  categoryTextActive: { color: '#FFFFFF', fontWeight: '600' },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 14,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  scenarioCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  scenarioIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  scenarioName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  scenarioDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
  },

  // Free Chat Button
  freeChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  freeChatLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  freeChatIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  freeChatText: { flex: 1 },
  freeChatTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 2 },
  freeChatSubtitle: { fontSize: 13, color: '#6B7280' },

  // Plans
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  planIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  planContent: { flex: 1, marginRight: 8 },
  planName: { fontSize: 15, fontWeight: '600', color: '#1F2937', marginBottom: 3 },
  planMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  planScenario: { fontSize: 12, color: '#6D28D9', backgroundColor: '#F4F1FA', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  planDate: { fontSize: 11, color: '#9CA3AF' },
  planSummary: { fontSize: 12, color: '#6B7280', lineHeight: 17 },
});
