import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PageHeader from '../components/PageHeader';
import { useTheme } from '../context/ThemeContext';
import { dashboardStatsService } from '../services/dashboard-stats.service';

// ==================== 类型 ====================

interface CustomerSummary {
  kpi: {
    materials: { total: number; weekNew: number; trend: number };
    pendingTickets: number;
    aiUsage: { total: number; weekTokens: number };
    leads: { total: number; weekNew: number; converted: number; trend: number };
    shares: { total: number; scans: number; conversions: number };
    candidates: { total: number; weekNew: number; hired: number };
  };
  trend: Array<{ date: string; materials: number }>;
  recentActivities: Array<{ time: string; type: string; content: string; status?: string }>;
  generatedAt: string;
}

const EMPTY_SUMMARY: CustomerSummary = {
  kpi: {
    materials: { total: 0, weekNew: 0, trend: 0 },
    pendingTickets: 0,
    aiUsage: { total: 0, weekTokens: 0 },
    leads: { total: 0, weekNew: 0, converted: 0, trend: 0 },
    shares: { total: 0, scans: 0, conversions: 0 },
    candidates: { total: 0, weekNew: 0, hired: 0 },
  },
  trend: [],
  recentActivities: [],
  generatedAt: new Date().toISOString(),
};

// ==================== 常量 ====================

const numFmt = (n: number) => (n || 0).toLocaleString('zh-CN');

const formatTokens = (n: number) => {
  if (!n) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

const ACTIVITY_LABEL: Record<string, string> = {
  material: '素材',
  ai: 'AI创作',
  ticket: '工单',
  login: '登录',
};

const ACTIVITY_ICON: Record<string, string> = {
  material: 'images-outline',
  ai: 'sparkles-outline',
  ticket: 'document-text-outline',
  login: 'log-in-outline',
};

const ACTIVITY_COLOR: Record<string, string> = {
  material: '#6d28d9',
  ai: '#722ed1',
  ticket: '#fa8c16',
  login: '#8c8c8c',
};

const ACTIVITY_ROUTE: Record<string, string> = {
  material: 'Materials',
  ai: 'AICreateCenter',
  ticket: 'Messages',
  login: 'Messages',
};

// 日期格式化 YYYY-MM-DD
const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// 时间格式化 YYYY-MM-DD HH:mm:ss
const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  return `${fmtDate(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
};

// 最近 N 天的日期数组（用于补全趋势空位）
const lastNDates = (n: number): string[] => {
  const arr: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    arr.push(fmtDate(d));
  }
  return arr;
};

// ==================== 子组件 ====================

function KpiCard({
  icon,
  color,
  label,
  value,
  extra,
  onPress,
  theme,
}: {
  icon: string;
  color: string;
  label: string;
  value: number;
  extra: string;
  onPress?: () => void;
  theme: any;
}) {
  return (
    <TouchableOpacity
      style={[styles.kpiCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.kpiIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.kpiValue, { color: theme.text }]}>{numFmt(value)}</Text>
      {extra ? <Text style={styles.kpiExtra} numberOfLines={1}>{extra}</Text> : null}
    </TouchableOpacity>
  );
}

function TrendChart({ trend, days, theme }: { trend: Array<{ date: string; materials: number }>; days: number; theme: any }) {
  const dates = lastNDates(days);
  const map = new Map(trend.map((t) => [t.date, t.materials]));
  const data = dates.map((d) => ({ date: d, value: map.get(d) || 0 }));
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View>
      <View style={styles.chartArea}>
        {data.map((d, i) => {
          const h = d.value === 0 ? 3 : Math.max(6, Math.round((d.value / max) * 120));
          return (
            <View key={i} style={styles.chartCol}>
              <View style={styles.barWrap}>
                {d.value > 0 && <Text style={styles.barValue}>{d.value}</Text>}
                <View
                  style={[
                    styles.bar,
                    { height: h, backgroundColor: d.value === 0 ? theme.border : theme.primary },
                  ]}
                />
              </View>
              <Text style={styles.barLabel} numberOfLines={1}>
                {d.date.slice(5)}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={styles.chartInfo}>
        <View style={styles.chartDot} />
        <Text style={[styles.chartInfoText, { color: theme.textSecondary }]}>每日新增素材</Text>
      </View>
    </View>
  );
}

// ==================== 主组件 ====================

export default function StatisticsScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<CustomerSummary>(EMPTY_SUMMARY);
  const [tokenStats, setTokenStats] = useState<any>(null);
  const [trendDays, setTrendDays] = useState<number>(7);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const [summary, stats, daily] = await Promise.allSettled([
        dashboardStatsService.getCustomerStats(),
        dashboardStatsService.getTokenStats(),
        dashboardStatsService.getTokenDaily(30),
      ]);

      if (summary.status === 'fulfilled' && summary.value) {
        setData(summary.value);
      } else {
        setData(EMPTY_SUMMARY);
      }

      if (stats.status === 'fulfilled' && stats.value) {
        const todayStr = fmtDate(new Date());
        const monthStartStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
        const dailyData = daily.status === 'fulfilled' && Array.isArray(daily.value) ? daily.value : [];
        const todayTokens = dailyData
          .filter((d: any) => d.date === todayStr)
          .reduce((s: number, d: any) => s + (d.tokens || 0), 0);
        const monthTokens = dailyData
          .filter((d: any) => d.date >= monthStartStr)
          .reduce((s: number, d: any) => s + (d.tokens || 0), 0);
        setTokenStats({
          total: stats.value.total?.totalTokens || 0,
          month: monthTokens,
          today: todayTokens,
          byProvider: stats.value.byProvider || [],
        });
      } else {
        setTokenStats(null);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setData(EMPTY_SUMMARY);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const trendData = (data.trend || []).filter((t) => t.date);
  const isFirstTimeUser =
    !loading && data.kpi.materials.total === 0 && data.kpi.aiUsage.total === 0;

  const goto = (screen: string) => {
    (navigation as any).navigate(screen);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <PageHeader title="数据总览" />
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>正在加载数据...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchAll(true)} tintColor={theme.primary} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* ====== 顶部信息 ====== */}
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>数据总览</Text>
              <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
                素材、创作、客户、Token 消耗等核心数据
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.refreshBtn, { backgroundColor: theme.primary }]}
              onPress={() => fetchAll(true)}
            >
              <Ionicons name="refresh" size={15} color="#fff" />
              <Text style={styles.refreshText}>刷新</Text>
            </TouchableOpacity>
          </View>

          {/* ====== 6 个核心 KPI ====== */}
          <View style={styles.kpiGrid}>
            <KpiCard
              icon="document-text-outline"
              color={theme.primary}
              label="素材总数"
              value={data.kpi.materials.total}
              extra={data.kpi.materials.weekNew > 0 ? `本周新增 ${data.kpi.materials.weekNew}` : '点击查看内容中心'}
              onPress={() => goto('Materials')}
              theme={theme}
            />
            <KpiCard
              icon="sparkles-outline"
              color="#722ed1"
              label="AI 创作次数"
              value={data.kpi.aiUsage.total}
              extra={data.kpi.aiUsage.weekTokens > 0 ? `本周消耗 ${formatTokens(data.kpi.aiUsage.weekTokens)} tokens` : '点击进入 AI 创作工厂'}
              onPress={() => goto('AICreateCenter')}
              theme={theme}
            />
            <KpiCard
              icon="chatbubbles-outline"
              color="#fa8c16"
              label="待处理工单"
              value={data.kpi.pendingTickets}
              extra={data.kpi.pendingTickets > 0 ? '点击处理' : '一切正常'}
              onPress={() => goto('Messages')}
              theme={theme}
            />
            <KpiCard
              icon="locate-outline"
              color="#52c41a"
              label="获客线索"
              value={data.kpi.leads.total}
              extra={
                data.kpi.leads.weekNew > 0 || data.kpi.leads.converted > 0
                  ? `${data.kpi.leads.weekNew > 0 ? `本周新增 ${data.kpi.leads.weekNew}` : ''}${data.kpi.leads.weekNew > 0 && data.kpi.leads.converted > 0 ? ' · ' : ''}${data.kpi.leads.converted > 0 ? `已转化 ${data.kpi.leads.converted}` : ''}`
                  : '点击进入智能获客'
              }
              onPress={() => goto('Acquisition')}
              theme={theme}
            />
            <KpiCard
              icon="share-social-outline"
              color="#13c2c2"
              label="推荐分享"
              value={data.kpi.shares.total}
              extra={
                data.kpi.shares.scans > 0
                  ? `扫码 ${data.kpi.shares.scans} 次${data.kpi.shares.conversions > 0 ? ` · 转化 ${data.kpi.shares.conversions}` : ''}`
                  : '点击进入推荐分享'
              }
              onPress={() => goto('Share')}
              theme={theme}
            />
            <KpiCard
              icon="people-outline"
              color="#faad14"
              label="招聘候选人"
              value={data.kpi.candidates.total}
              extra={
                data.kpi.candidates.weekNew > 0
                  ? `本周新增 ${data.kpi.candidates.weekNew}${data.kpi.candidates.hired > 0 ? ` · 已录用 ${data.kpi.candidates.hired}` : ''}`
                  : '点击进入智能招聘'
              }
              onPress={() => goto('Recruitment')}
              theme={theme}
            />
          </View>

          {/* ====== Tokens 消耗统计 ====== */}
          <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrap}>
                <View style={[styles.sectionDot, { backgroundColor: '#722ed1' }]} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>我的 Token 消耗</Text>
              </View>
              <Text style={[styles.sectionTag, { color: theme.textSecondary }]}>
                {tokenStats ? '实时统计' : '暂无数据'}
              </Text>
            </View>
            {tokenStats ? (
              <View style={styles.tokenGrid}>
                <View style={styles.tokenItem}>
                  <Text style={[styles.tokenLabel, { color: theme.textSecondary }]}>总消耗</Text>
                  <Text style={[styles.tokenValue, { color: '#722ed1' }]}>
                    {formatTokens(tokenStats.total)} <Text style={[styles.tokenUnit, { color: theme.textSecondary }]}>tokens</Text>
                  </Text>
                </View>
                <View style={styles.tokenItem}>
                  <Text style={[styles.tokenLabel, { color: theme.textSecondary }]}>本月消耗</Text>
                  <Text style={[styles.tokenValue, { color: theme.primary }]}>
                    {formatTokens(tokenStats.month)} <Text style={[styles.tokenUnit, { color: theme.textSecondary }]}>tokens</Text>
                  </Text>
                </View>
                <View style={styles.tokenItem}>
                  <Text style={[styles.tokenLabel, { color: theme.textSecondary }]}>今日消耗</Text>
                  <Text style={[styles.tokenValue, { color: '#52c41a' }]}>
                    {formatTokens(tokenStats.today)} <Text style={[styles.tokenUnit, { color: theme.textSecondary }]}>tokens</Text>
                  </Text>
                </View>
                <View style={styles.tokenItem}>
                  <Text style={[styles.tokenLabel, { color: theme.textSecondary }]}>主要功能</Text>
                  <View style={styles.providerList}>
                    {(tokenStats.byProvider || []).slice(0, 2).map((p: any, i: number) => (
                      <Text key={i} style={[styles.providerText, { color: theme.textSecondary }]}>
                        {p.providerName || '服务商'}{' '}
                        {formatTokens(p.totalTokens || 0)}（{p.callCount || 0}次）
                      </Text>
                    ))}
                    {(!tokenStats.byProvider || tokenStats.byProvider.length === 0) && (
                      <Text style={[styles.providerText, { color: theme.textSecondary }]}>暂无</Text>
                    )}
                  </View>
                </View>
              </View>
            ) : (
              <Text style={[styles.emptyTip, { color: theme.textSecondary }]}>
                开始使用 AI 创作工厂后，将在这里显示您的 Token 消耗
              </Text>
            )}
          </View>

          {/* ====== 素材增长趋势 ====== */}
          <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrap}>
                <Ionicons name="trending-up-outline" size={16} color={theme.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>素材增长趋势</Text>
              </View>
              <View style={styles.segmented}>
                {[7, 30].map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.segItem,
                      trendDays === d && { backgroundColor: theme.primary },
                    ]}
                    onPress={() => setTrendDays(d)}
                  >
                    <Text
                      style={[
                        styles.segText,
                        { color: trendDays === d ? '#fff' : theme.textSecondary },
                      ]}
                    >
                      {d}天
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {trendData.length === 0 ? (
              <Text style={[styles.emptyTip, { color: theme.textSecondary }]}>
                暂无趋势数据，开始创作素材后将显示
              </Text>
            ) : (
              <TrendChart trend={trendData} days={trendDays} theme={theme} />
            )}
          </View>

          {/* ====== 今日活动 ====== */}
          <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrap}>
                <Ionicons name="time-outline" size={16} color="#fa8c16" style={{ marginRight: 6 }} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>今日活动</Text>
              </View>
            </View>
            {(data.recentActivities || []).length === 0 ? (
              <Text style={[styles.emptyTip, { color: theme.textSecondary }]}>今日暂无活动</Text>
            ) : (
              <View>
                {(data.recentActivities || []).slice(0, 10).map((a, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.activityItem,
                      i < Math.min((data.recentActivities || []).length, 10) - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
                    ]}
                    onPress={() => ACTIVITY_ROUTE[a.type] && goto(ACTIVITY_ROUTE[a.type])}
                  >
                    <View style={[styles.activityIcon, { backgroundColor: `${ACTIVITY_COLOR[a.type] || '#8c8c8c'}18` }]}>
                      <Ionicons name={(ACTIVITY_ICON[a.type] || 'ellipse-outline') as any} size={16} color={ACTIVITY_COLOR[a.type] || '#8c8c8c'} />
                    </View>
                    <View style={styles.activityBody}>
                      <View style={styles.activityTop}>
                        <View style={[styles.activityTag, { backgroundColor: `${ACTIVITY_COLOR[a.type] || '#8c8c8c'}15` }]}>
                          <Text style={[styles.activityTagText, { color: ACTIVITY_COLOR[a.type] || '#8c8c8c' }]}>
                            {ACTIVITY_LABEL[a.type] || a.type}
                          </Text>
                        </View>
                        <Text style={[styles.activityTime, { color: theme.textSecondary }]}>{a.time}</Text>
                      </View>
                      <Text style={[styles.activityContent, { color: theme.text }]} numberOfLines={2}>
                        {a.content}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* ====== 首次引导 ====== */}
          {isFirstTimeUser && (
            <View style={[styles.onboardCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.onboardTitle, { color: theme.text }]}>欢迎使用智枢 AI</Text>
              <Text style={[styles.onboardDesc, { color: theme.textSecondary }]}>
                三步快速上手：AI 创作工厂 → 内容中心 → 创建 API Key
              </Text>
              <View style={styles.onboardSteps}>
                <TouchableOpacity style={[styles.onboardStep, { borderColor: theme.border }]} onPress={() => goto('AICreateCenter')}>
                  <Ionicons name="sparkles" size={20} color="#722ed1" />
                  <Text style={[styles.onboardStepTitle, { color: theme.text }]}>1. AI 创作工厂</Text>
                  <Text style={[styles.onboardStepDesc, { color: theme.textSecondary }]}>一键生成爆款内容</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.onboardStep, { borderColor: theme.border }]} onPress={() => goto('Materials')}>
                  <Ionicons name="document-text-outline" size={20} color={theme.primary} />
                  <Text style={[styles.onboardStepTitle, { color: theme.text }]}>2. 内容中心</Text>
                  <Text style={[styles.onboardStepDesc, { color: theme.textSecondary }]}>统一管理所有素材</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ====== 底部提示 ====== */}
          <Text style={styles.footerText}>数据更新于 {fmtDateTime(data.generatedAt)}</Text>
        </ScrollView>
      )}
    </View>
  );
}

// ==================== 样式 ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  refreshText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  kpiCard: {
    width: '48.5%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  kpiIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  kpiLabel: {
    fontSize: 12,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
  },
  kpiExtra: {
    fontSize: 11,
    color: '#8c8c8c',
    marginTop: 6,
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  sectionTag: {
    fontSize: 12,
  },
  tokenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tokenItem: {
    width: '50%',
    marginBottom: 12,
  },
  tokenLabel: {
    fontSize: 12,
  },
  tokenValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  tokenUnit: {
    fontSize: 11,
    fontWeight: '400',
  },
  providerList: {
    marginTop: 4,
  },
  providerText: {
    fontSize: 12,
    marginBottom: 2,
  },
  emptyTip: {
    fontSize: 13,
    paddingVertical: 20,
    textAlign: 'center',
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 8,
    padding: 2,
  },
  segItem: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  segText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 150,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
  },
  barWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barValue: {
    fontSize: 9,
    color: '#999',
    marginBottom: 2,
  },
  bar: {
    width: '60%',
    minWidth: 4,
    borderRadius: 3,
  },
  barLabel: {
    fontSize: 9,
    color: '#999',
    marginTop: 6,
  },
  chartInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  chartDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6d28d9',
    marginRight: 6,
  },
  chartInfoText: {
    fontSize: 12,
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  activityBody: {
    flex: 1,
  },
  activityTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  activityTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  activityTime: {
    fontSize: 11,
  },
  activityContent: {
    fontSize: 13,
    marginTop: 4,
  },
  onboardCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  onboardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  onboardDesc: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  onboardSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  onboardStep: {
    width: '48.5%',
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 12,
  },
  onboardStepTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  onboardStepDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  footerText: {
    textAlign: 'center',
    color: '#bfbfbf',
    fontSize: 12,
    marginTop: 8,
  },
});
