'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Space,
  Typography,
  Empty,
  Tag,
  Progress,
  Skeleton,
  Button,
  Tooltip,
  Avatar,
  Segmented,
  Table,
} from 'antd';
import {
  FileTextOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  ShareAltOutlined,
  RiseOutlined,
  FireOutlined,
  EyeOutlined,
  LikeOutlined,
  MessageOutlined,
  RedoOutlined,
  ClockCircleOutlined,
  CustomerServiceOutlined,
  RobotOutlined,
  AppstoreOutlined,
  AuditOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  RocketOutlined,
  UserOutlined,
  LineChartOutlined,
  PieChartOutlined,
  FunnelPlotOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import dayjs from 'dayjs';
import request from '@/utils/request';

const { Title, Text, Paragraph } = Typography;

// ==================== 类型 ====================

interface CustomerSummary {
  kpi: {
    materials: { total: number; weekNew: number; trend: number };
    published: { total: number; weekNew: number; views: number; likes: number };
    leads: { total: number; weekNew: number; converted: number; trend: number };
    shares: { total: number; scans: number; conversions: number };
    candidates: { total: number; weekNew: number; hired: number };
    crmCustomers: { total: number; active: number; newMonth: number };
    matrixAccounts: number;
    pendingTickets: number;
    aiUsage: { total: number; weekTokens: number };
  };
  trend: Array<{ date: string; materials: number; published: number; leads: number; shares: number }>;
  distribution: {
    materialsByType: Record<string, number>;
    contentByPlatform: Record<string, { count: number; views: number; likes: number; comments: number; shares: number }>;
    leadsBySource: Record<string, number>;
    leadsByStatus: Record<string, number>;
    leadsByQuality: Record<string, number>;
    crmByStatus: Record<string, number>;
    candidatesByStage: Record<string, number>;
  };
  funnel: Array<{ stage: string; count: number; rate: number; color: string }>;
  tables: {
    publishedContent: Array<{
      id: string; title: string; platform: string; accountName?: string | null;
      views: number; likes: number; comments: number; shares: number;
      publishedAt?: string | null; createdAt: string;
    }>;
    recentLeads: Array<{
      id: string; name?: string | null; phone: string; source?: string | null;
      status: string; aiQuality?: string | null; aiScore?: number | null; createdAt: string;
    }>;
    recentMaterials: Array<{
      id: string; type: string; title?: string | null; status: string; usedCount: number; createdAt: string;
    }>;
    topShares: Array<{
      id: string; title: string; scanCount: number; publishCount: number;
      activeCount: number; conversionCount: number; createdAt: string;
    }>;
  };
  recentActivities: Array<{ time: string; type: string; content: string; status?: string }>;
  generatedAt: string;
}

const EMPTY: CustomerSummary = {
  kpi: {
    materials: { total: 0, weekNew: 0, trend: 0 },
    published: { total: 0, weekNew: 0, views: 0, likes: 0 },
    leads: { total: 0, weekNew: 0, converted: 0, trend: 0 },
    shares: { total: 0, scans: 0, conversions: 0 },
    candidates: { total: 0, weekNew: 0, hired: 0 },
    crmCustomers: { total: 0, active: 0, newMonth: 0 },
    matrixAccounts: 0,
    pendingTickets: 0,
    aiUsage: { total: 0, weekTokens: 0 },
  },
  trend: [],
  distribution: {
    materialsByType: {}, contentByPlatform: {},
    leadsBySource: {}, leadsByStatus: {}, leadsByQuality: {},
    crmByStatus: {}, candidatesByStage: {},
  },
  funnel: [
    { stage: '创作素材', count: 0, rate: 100, color: '#1890ff' },
    { stage: '已发布', count: 0, rate: 0, color: '#13c2c2' },
    { stage: '获得线索', count: 0, rate: 0, color: '#722ed1' },
    { stage: '已转化', count: 0, rate: 0, color: '#52c41a' },
  ],
  tables: { publishedContent: [], recentLeads: [], recentMaterials: [], topShares: [] },
  recentActivities: [],
  generatedAt: new Date().toISOString(),
};

// ==================== 常量 ====================

const COLORS = {
  primary: '#1890ff',
  success: '#52c41a',
  warning: '#faad14',
  danger: '#ff4d4f',
  purple: '#722ed1',
  cyan: '#13c2c2',
  pink: '#eb2f96',
  gold: '#fa8c16',
};

const PIE_COLORS = ['#1890ff', '#13c2c2', '#722ed1', '#52c41a', '#faad14', '#eb2f96', '#fa8c16', '#2f54eb'];

const PLATFORM_NAME: Record<string, string> = {
  douyin: '抖音', kuaishou: '快手', xiaohongshu: '小红书',
  wechat: '微信', videoname: '视频号', weibo: '微博',
  bilibili: 'B站', zhihu: '知乎',
};

const PLATFORM_COLOR: Record<string, string> = {
  douyin: '#000000', kuaishou: '#FF6633', xiaohongshu: '#FF2442',
  wechat: '#07C160', videoname: '#FA9D3B', weibo: '#E6162D',
  bilibili: '#FB7299', zhihu: '#0084FF',
};

const LEAD_STATUS_NAME: Record<string, string> = {
  new: '新获取', contacted: '已联系', qualified: '高意向', converted: '已转化', invalid: '无效',
};
const LEAD_STATUS_COLOR: Record<string, string> = {
  new: 'blue', contacted: 'cyan', qualified: 'gold', converted: 'success', invalid: 'default',
};
const LEAD_QUALITY_COLOR: Record<string, string> = { 高: 'success', 中: 'gold', 低: 'default' };
const SOURCE_NAME: Record<string, string> = {
  douyin: '抖音', wechat: '微信', xiaohongshu: '小红书', kuaishou: '快手',
  videoname: '视频号', sms: '短信', scan_qr: '扫码', organic: '自然流量',
  tianyancha: '天眼查', amap: '高德地图',
};
const MATERIAL_TYPE_NAME: Record<string, string> = {
  title: '标题', topic: '选题', copywriter: '文案', image: '图片', video: '视频', audio: '音频',
};
const MATERIAL_TYPE_COLOR: Record<string, string> = {
  title: '#1890ff', topic: '#722ed1', copywriter: '#13c2c2',
  image: '#52c41a', video: '#fa8c16', audio: '#eb2f96',
};
const CRM_STATUS_NAME: Record<string, string> = {
  potential: '潜在客户', active: '活跃客户', inactive: '已流失',
};
const CRM_STATUS_COLOR: Record<string, string> = {
  potential: 'blue', active: 'success', inactive: 'default',
};
const CANDIDATE_STAGE_NAME: Record<string, string> = {
  pending: '待筛选', screening: '筛选中', interview: '面试中',
  offer: '已发offer', hired: '已入职', rejected: '已拒绝',
};

// ==================== 工具 ====================

const cardBase: React.CSSProperties = {
  borderRadius: 12,
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  border: '1px solid #f0f0f0',
};

const numFmt = (n: number) => (n || 0).toLocaleString('zh-CN');

// ==================== 主组件 ====================

export default function CustomerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CustomerSummary>(EMPTY);
  const [trendDays, setTrendDays] = useState<number>(7);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const result = await request.get<CustomerSummary>('/api/dashboard-stats/customer-summary');
      setData(result || EMPTY);
    } catch (error) {
      console.error('Failed to load customer dashboard:', error);
      setData(EMPTY);
    }
    setLoading(false);
  };

  // ==================== 派生数据 ====================

  const trendData = useMemo(() => {
    return (data.trend || []).map(t => ({
      ...t,
      dateLabel: dayjs(t.date).format('MM-DD'),
    }));
  }, [data.trend]);

  const materialsPie = useMemo(() => {
    const map = data.distribution?.materialsByType || {};
    return Object.entries(map).map(([type, count]) => ({
      name: MATERIAL_TYPE_NAME[type] || type,
      value: count,
      color: MATERIAL_TYPE_COLOR[type] || PIE_COLORS[0],
    }));
  }, [data.distribution]);

  const platformRows = useMemo(() => {
    const map = data.distribution?.contentByPlatform || {};
    return Object.entries(map)
      .map(([platform, stats]) => ({
        platform,
        name: PLATFORM_NAME[platform] || platform,
        color: PLATFORM_COLOR[platform] || PIE_COLORS[0],
        ...stats,
      }))
      .sort((a, b) => b.count - a.count);
  }, [data.distribution]);

  const leadsBySourcePie = useMemo(() => {
    const map = data.distribution?.leadsBySource || {};
    return Object.entries(map).map(([s, c], i) => ({
      name: SOURCE_NAME[s] || s, value: c, color: PIE_COLORS[i % PIE_COLORS.length],
    }));
  }, [data.distribution]);

  const isFirstTimeUser = !loading &&
    data.kpi.materials.total === 0 &&
    data.kpi.published.total === 0 &&
    data.kpi.leads.total === 0 &&
    data.kpi.shares.total === 0;

  // ==================== 渲染 ====================

  return (
    <div style={{ padding: '16px 24px 32px', background: '#f5f7fa', minHeight: '100vh' }}>
      {/* ====== 顶部欢迎 ====== */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            欢迎回来，{dayjs().format('YYYY年M月D日 dddd')}
          </Title>
          <Text type="secondary">这是您的业务数据驾驶舱，实时掌握各项核心指标动态</Text>
        </div>
        <Space>
          <Tooltip title="刷新数据">
            <Button icon={<RedoOutlined />} onClick={fetchSummary} loading={loading}>刷新</Button>
          </Tooltip>
        </Space>
      </div>

      {/* ====== KPI 卡片（8 个） ====== */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <KpiCard
            loading={loading}
            icon={<FileTextOutlined />}
            color={COLORS.primary}
            label="素材总数"
            value={data.kpi.materials.total}
            extra={data.kpi.materials.weekNew > 0 ? `本周+${data.kpi.materials.weekNew}` : null}
            onClick={() => router.push('/customer/materials')}
          />
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <KpiCard
            loading={loading}
            icon={<RocketOutlined />}
            color={COLORS.cyan}
            label="已发布内容"
            value={data.kpi.published.total}
            extra={
              data.kpi.published.views > 0
                ? <Text type="secondary" style={{ fontSize: 12 }}>浏览 {numFmt(data.kpi.published.views)}</Text>
                : data.kpi.published.weekNew > 0 ? `本周+${data.kpi.published.weekNew}` : null
            }
            onClick={() => router.push('/customer/content-publish')}
          />
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <KpiCard
            loading={loading}
            icon={<TeamOutlined />}
            color={COLORS.purple}
            label="获客线索"
            value={data.kpi.leads.total}
            extra={
              data.kpi.leads.converted > 0
                ? `已转化 ${data.kpi.leads.converted}`
                : data.kpi.leads.weekNew > 0 ? `本周+${data.kpi.leads.weekNew}` : null
            }
            onClick={() => router.push('/customer/acquisition')}
          />
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <KpiCard
            loading={loading}
            icon={<ShareAltOutlined />}
            color={COLORS.gold}
            label="推荐分享"
            value={data.kpi.shares.total}
            extra={
              data.kpi.shares.scans > 0
                ? `扫码 ${numFmt(data.kpi.shares.scans)} · 转化 ${data.kpi.shares.conversions}`
                : null
            }
            onClick={() => router.push('/customer/share')}
          />
        </Col>
      </Row>

      {/* 第二排 KPI：CRM / 招聘 / 矩阵账号 / AI 用量 */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <KpiCard
            loading={loading}
            icon={<CustomerServiceOutlined />}
            color={COLORS.success}
            label="CRM 客户"
            value={data.kpi.crmCustomers.total}
            extra={
              data.kpi.crmCustomers.active > 0
                ? `活跃 ${data.kpi.crmCustomers.active} · 本月新增 ${data.kpi.crmCustomers.newMonth}`
                : null
            }
            onClick={() => router.push('/customer/crm')}
          />
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <KpiCard
            loading={loading}
            icon={<AuditOutlined />}
            color={COLORS.pink}
            label="招聘候选人"
            value={data.kpi.candidates.total}
            extra={data.kpi.candidates.hired > 0 ? `已入职 ${data.kpi.candidates.hired}` : null}
            onClick={() => router.push('/customer/recruitment')}
          />
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <KpiCard
            loading={loading}
            icon={<AppstoreOutlined />}
            color="#2f54eb"
            label="矩阵账号"
            value={data.kpi.matrixAccounts}
            extra={data.kpi.matrixAccounts > 0 ? '已绑定平台账号' : '未绑定平台账号'}
            onClick={() => router.push('/customer/matrix')}
          />
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <KpiCard
            loading={loading}
            icon={<RobotOutlined />}
            color={COLORS.warning}
            label="AI 创作次数"
            value={data.kpi.aiUsage.total}
            extra={
              data.kpi.aiUsage.weekTokens > 0
                ? `本周消耗 ${(data.kpi.aiUsage.weekTokens / 1000).toFixed(1)}K tokens`
                : data.kpi.pendingTickets > 0 ? `工单待处理 ${data.kpi.pendingTickets}` : null
            }
            onClick={() => router.push('/customer/ai-factory')}
          />
        </Col>
      </Row>

      {/* ====== 趋势 + 分布 ====== */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={16}>
          <Card
            style={cardBase}
            title={
              <Space>
                <LineChartOutlined style={{ color: COLORS.primary }} />
                <Text strong>数据趋势（近 7 天）</Text>
              </Space>
            }
            extra={
              <Segmented
                size="small"
                value={trendDays}
                onChange={(v) => setTrendDays(v as number)}
                options={[
                  { label: '7天', value: 7 },
                  { label: '30天', value: 30 },
                ]}
              />
            }
            bodyStyle={{ padding: '8px 8px 0' }}
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={trendData} margin={{ top: 20, right: 24, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="dateLabel" tick={{ fontSize: 12, fill: '#999' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#999' }} allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#999' }} allowDecimals={false} />
                  <RTooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e8e8e8' }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Line yAxisId="left" type="monotone" dataKey="materials" name="新增素材" stroke={COLORS.primary} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line yAxisId="left" type="monotone" dataKey="published" name="发布内容" stroke={COLORS.cyan} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line yAxisId="right" type="monotone" dataKey="leads" name="获客线索" stroke={COLORS.purple} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line yAxisId="right" type="monotone" dataKey="shares" name="扫码分享" stroke={COLORS.gold} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            style={cardBase}
            title={
              <Space>
                <PieChartOutlined style={{ color: COLORS.purple }} />
                <Text strong>素材类型分布</Text>
              </Space>
            }
            bodyStyle={{ padding: 8, height: 360, display: 'flex', flexDirection: 'column' }}
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : materialsPie.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<Text type="secondary">还没有素材，去创作第一个</Text>}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
              >
                <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/customer/ai-factory')}>
                  开始创作
                </Button>
              </Empty>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie
                      data={materialsPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={(e: any) => `${e.name} ${e.value}`}
                      labelLine={false}
                    >
                      {materialsPie.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <RTooltip formatter={(v: any) => `${v} 个`} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ padding: '0 12px 8px' }}>
                  {materialsPie.map(item => (
                    <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Space size={6}>
                        <span style={{ width: 10, height: 10, background: item.color, borderRadius: 2, display: 'inline-block' }} />
                        <Text style={{ fontSize: 12 }}>{item.name}</Text>
                      </Space>
                      <Text strong style={{ fontSize: 12 }}>{item.value}</Text>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* ====== 转化漏斗 + 今日活动 ====== */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <Card
            style={cardBase}
            title={
              <Space>
                <FunnelPlotOutlined style={{ color: COLORS.success }} />
                <Text strong>业务转化漏斗</Text>
              </Space>
            }
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                从素材创作到最终转化，追踪全链路效率
              </Text>
            }
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
              <Row gutter={[16, 16]}>
                {data.funnel.map((stage, idx) => {
                  const widthPct = Math.max(stage.rate, 8);
                  const prevCount = idx > 0 ? data.funnel[idx - 1].count : null;
                  const convertRate = prevCount !== null && prevCount > 0
                    ? Math.round((stage.count / prevCount) * 100)
                    : null;
                  return (
                    <Col span={6} key={stage.stage}>
                      <div
                        style={{
                          background: '#fafafa',
                          borderRadius: 8,
                          padding: 16,
                          textAlign: 'center',
                          position: 'relative',
                          border: `1px solid ${stage.color}30`,
                        }}
                      >
                        <div style={{
                          position: 'absolute',
                          top: 0, left: 0, right: 0, height: 3,
                          background: stage.color, borderRadius: '8px 8px 0 0',
                        }} />
                        <Text type="secondary" style={{ fontSize: 12 }}>{stage.stage}</Text>
                        <div style={{ fontSize: 26, fontWeight: 600, color: stage.color, margin: '8px 0 4px' }}>
                          {numFmt(stage.count)}
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <Tag color={stage.color}>{stage.rate}%</Tag>
                          {convertRate !== null && stage.rate > 0 && convertRate !== stage.rate && (
                            <Tag>转化 {convertRate}%</Tag>
                          )}
                        </div>
                        <Progress
                          percent={widthPct}
                          strokeColor={stage.color}
                          showInfo={false}
                          size="small"
                        />
                      </div>
                    </Col>
                  );
                })}
              </Row>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            style={cardBase}
            title={
              <Space>
                <ClockCircleOutlined style={{ color: COLORS.warning }} />
                <Text strong>今日活动</Text>
              </Space>
            }
            extra={
              <Tag color="processing">{dayjs().format('M月D日')}</Tag>
            }
            bodyStyle={{ padding: '0 16px 16px', maxHeight: 360, overflowY: 'auto' }}
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : data.recentActivities.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space direction="vertical" size={2}>
                    <Text type="secondary">今天还没有活动记录</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>开启「AI 创作工厂」自动产生内容</Text>
                  </Space>
                }
                style={{ padding: '24px 0' }}
              />
            ) : (
              <Timeline
                items={data.recentActivities.map(act => ({
                  type: act.type,
                  content: act.content,
                  status: act.status,
                  time: act.time,
                }))}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* ====== 各平台发布数据表格 ====== */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={16}>
          <Card
            style={cardBase}
            title={
              <Space>
                <RocketOutlined style={{ color: COLORS.cyan }} />
                <Text strong>各平台发布情况</Text>
              </Space>
            }
            extra={
              <Button type="link" onClick={() => router.push('/customer/content-publish')}>
                查看全部 <ArrowRightOutlined />
              </Button>
            }
            bodyStyle={{ padding: 0 }}
          >
            {loading ? (
              <div style={{ padding: 16 }}><Skeleton active paragraph={{ rows: 4 }} /></div>
            ) : platformRows.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space direction="vertical" size={2}>
                    <Text type="secondary">还没有发布过内容</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>绑定平台账号后即可一键发布</Text>
                  </Space>
                }
                style={{ padding: '32px 0' }}
              >
                <Space>
                  <Button type="primary" onClick={() => router.push('/customer/ai-factory')}>去创作</Button>
                  <Button onClick={() => router.push('/customer/matrix')}>绑定账号</Button>
                </Space>
              </Empty>
            ) : (
              <Table
                size="middle"
                pagination={false}
                rowKey="platform"
                dataSource={platformRows}
                columns={[
                  {
                    title: '平台',
                    dataIndex: 'name',
                    width: 110,
                    render: (name, row) => (
                      <Space>
                        <span style={{
                          width: 28, height: 28, borderRadius: 6,
                          background: row.color, color: '#fff',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 600,
                        }}>{name.charAt(0)}</span>
                        <Text strong>{name}</Text>
                      </Space>
                    ),
                  },
                  { title: '发布数', dataIndex: 'count', width: 80, align: 'center' as const, render: (v: number) => <Text strong>{numFmt(v)}</Text> },
                  {
                    title: '浏览量',
                    dataIndex: 'views',
                    width: 110,
                    align: 'center' as const,
                    render: (v: number) => (
                      <Space size={4}><EyeOutlined style={{ color: '#999' }} /><Text>{numFmt(v)}</Text></Space>
                    ),
                  },
                  {
                    title: '点赞',
                    dataIndex: 'likes',
                    width: 90,
                    align: 'center' as const,
                    render: (v: number) => (
                      <Space size={4}><LikeOutlined style={{ color: COLORS.warning }} /><Text>{numFmt(v)}</Text></Space>
                    ),
                  },
                  {
                    title: '评论',
                    dataIndex: 'comments',
                    width: 90,
                    align: 'center' as const,
                    render: (v: number) => (
                      <Space size={4}><MessageOutlined style={{ color: COLORS.primary }} /><Text>{numFmt(v)}</Text></Space>
                    ),
                  },
                  {
                    title: '互动率',
                    width: 200,
                    render: (_: any, row) => {
                      const total = row.views + row.likes + row.comments + row.shares;
                      const rate = row.views > 0
                        ? Math.round(((row.likes + row.comments + row.shares) / row.views) * 1000) / 10
                        : 0;
                      return (
                        <Tooltip title={`总互动 ${numFmt(total)}`}>
                          <Progress
                            percent={Math.min(rate * 10, 100)}
                            strokeColor={{ '0%': COLORS.cyan, '100%': COLORS.success }}
                            format={() => <Text style={{ fontSize: 12 }}>{rate.toFixed(1)}%</Text>}
                            size="small"
                          />
                        </Tooltip>
                      );
                    },
                  },
                  {
                    title: '操作',
                    width: 80,
                    align: 'center' as const,
                    render: (_: any, row) => (
                      <Button type="link" size="small" onClick={() => router.push(`/customer/content-publish?platform=${row.platform}`)}>
                        查看
                      </Button>
                    ),
                  },
                ]}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            style={cardBase}
            title={
              <Space>
                <FireOutlined style={{ color: COLORS.danger }} />
                <Text strong>获客来源 TOP</Text>
              </Space>
            }
            bodyStyle={{ padding: '12px 16px' }}
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : leadsBySourcePie.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<Text type="secondary">还没有线索来源</Text>}
                style={{ padding: '32px 0' }}
              />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={leadsBySourcePie}
                    cx="50%" cy="50%"
                    innerRadius={40} outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={(e: any) => `${e.name} ${e.value}`}
                    labelLine={false}
                  >
                    {leadsBySourcePie.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <RTooltip formatter={(v: any) => `${v} 条`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
      </Row>

      {/* ====== 第三排：CRM 客户分布 + 招聘流程 + 线索状态 ====== */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card style={cardBase} title={
            <Space><CustomerServiceOutlined style={{ color: COLORS.success }} /><Text strong>CRM 客户分布</Text></Space>
          }>
            {loading ? <Skeleton active paragraph={{ rows: 3 }} /> : (
              <DistributionList
                items={Object.entries(data.distribution?.crmByStatus || {}).map(([k, v]) => ({
                  label: CRM_STATUS_NAME[k] || k,
                  value: v,
                  color: CRM_STATUS_COLOR[k] || COLORS.primary,
                  max: data.kpi.crmCustomers.total,
                }))}
                emptyText="还没有 CRM 客户"
                onAction={() => router.push('/customer/crm')}
                actionText="去管理"
              />
            )}
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card style={cardBase} title={
            <Space><AuditOutlined style={{ color: COLORS.pink }} /><Text strong>招聘流程分布</Text></Space>
          }>
            {loading ? <Skeleton active paragraph={{ rows: 3 }} /> : (
              <DistributionList
                items={Object.entries(data.distribution?.candidatesByStage || {}).map(([k, v]) => ({
                  label: CANDIDATE_STAGE_NAME[k] || k,
                  value: v,
                  color: COLORS.pink,
                  max: data.kpi.candidates.total,
                }))}
                emptyText="还没有招聘数据"
                onAction={() => router.push('/customer/recruitment')}
                actionText="去招聘"
              />
            )}
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card style={cardBase} title={
            <Space><RiseOutlined style={{ color: COLORS.purple }} /><Text strong>线索状态分布</Text></Space>
          }>
            {loading ? <Skeleton active paragraph={{ rows: 3 }} /> : (
              <DistributionList
                items={Object.entries(data.distribution?.leadsByStatus || {}).map(([k, v]) => ({
                  label: LEAD_STATUS_NAME[k] || k,
                  value: v,
                  color: COLORS.purple,
                  max: data.kpi.leads.total,
                }))}
                emptyText="还没有线索"
                onAction={() => router.push('/customer/acquisition')}
                actionText="去获客"
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* ====== 第四排：最近发布内容 + 推荐分享排行 ====== */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <Card
            style={cardBase}
            title={
              <Space><RocketOutlined style={{ color: COLORS.cyan }} /><Text strong>最近发布内容</Text></Space>
            }
            extra={
              <Button type="link" onClick={() => router.push('/customer/content-publish')}>
                查看全部 <ArrowRightOutlined />
              </Button>
            }
            bodyStyle={{ padding: 0 }}
          >
            {loading ? (
              <div style={{ padding: 16 }}><Skeleton active paragraph={{ rows: 3 }} /></div>
            ) : data.tables.publishedContent.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Text type="secondary">还没有发布过内容</Text>
                }
                style={{ padding: '32px 0' }}
              />
            ) : (
              <Table
                size="small"
                pagination={false}
                rowKey="id"
                dataSource={data.tables.publishedContent.slice(0, 6)}
                columns={[
                  {
                    title: '标题',
                    dataIndex: 'title',
                    ellipsis: true,
                    render: (t: string) => <Text>{t}</Text>,
                  },
                  {
                    title: '平台',
                    dataIndex: 'platform',
                    width: 80,
                    render: (p: string) => (
                      <Tag color={PLATFORM_COLOR[p] ? 'default' : 'blue'}>
                        {PLATFORM_NAME[p] || p}
                      </Tag>
                    ),
                  },
                  {
                    title: '浏览',
                    dataIndex: 'views',
                    width: 70,
                    align: 'right' as const,
                    render: (v: number) => numFmt(v),
                  },
                  {
                    title: '点赞',
                    dataIndex: 'likes',
                    width: 70,
                    align: 'right' as const,
                    render: (v: number) => numFmt(v),
                  },
                  {
                    title: '发布时间',
                    dataIndex: 'publishedAt',
                    width: 140,
                    render: (t: string | null) => t ? dayjs(t).format('MM-DD HH:mm') : '-',
                  },
                ]}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            style={cardBase}
            title={
              <Space><ShareAltOutlined style={{ color: COLORS.gold }} /><Text strong>推荐分享 TOP</Text></Space>
            }
            extra={
              <Button type="link" onClick={() => router.push('/customer/share')}>
                管理 <ArrowRightOutlined />
              </Button>
            }
          >
            {loading ? <Skeleton active paragraph={{ rows: 3 }} /> :
              data.tables.topShares.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <Space direction="vertical" size={2}>
                      <Text type="secondary">还没有创建分享码</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>创建分享码追踪视频/海报传播效果</Text>
                    </Space>
                  }
                  style={{ padding: '24px 0' }}
                >
                  <Button type="primary" onClick={() => router.push('/customer/share')}>
                    立即创建
                  </Button>
                </Empty>
              ) : (
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  {data.tables.topShares.map((s, idx) => (
                    <div
                      key={s.id}
                      style={{
                        display: 'flex', alignItems: 'center', padding: '8px 12px',
                        background: idx % 2 === 0 ? '#fafbff' : '#fff',
                        borderRadius: 6,
                        gap: 12,
                      }}
                    >
                      <Avatar
                        size="small"
                        style={{ background: idx === 0 ? COLORS.danger : idx === 1 ? COLORS.warning : COLORS.primary }}
                      >
                        {idx + 1}
                      </Avatar>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text ellipsis style={{ display: 'block' }}>{s.title}</Text>
                        <Space size={12} style={{ fontSize: 12 }}>
                          <Text type="secondary">扫码 {numFmt(s.scanCount)}</Text>
                          <Text type="secondary">发布 {numFmt(s.publishCount)}</Text>
                          <Text type="success">转化 {numFmt(s.conversionCount)}</Text>
                        </Space>
                      </div>
                    </div>
                  ))}
                </Space>
              )
            }
          </Card>
        </Col>
      </Row>

      {/* ====== 第五排：最近线索 + 快捷入口 ====== */}
      <Row gutter={[12, 12]}>
        <Col xs={24} lg={16}>
          <Card
            style={cardBase}
            title={
              <Space><TeamOutlined style={{ color: COLORS.purple }} /><Text strong>最近获客线索</Text></Space>
            }
            extra={
              <Button type="link" onClick={() => router.push('/customer/acquisition')}>
                查看全部 <ArrowRightOutlined />
              </Button>
            }
            bodyStyle={{ padding: 0 }}
          >
            {loading ? <div style={{ padding: 16 }}><Skeleton active paragraph={{ rows: 3 }} /></div> :
              data.tables.recentLeads.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={<Text type="secondary">还没有线索</Text>}
                  style={{ padding: '32px 0' }}
                />
              ) : (
                <Table
                  size="small"
                  pagination={false}
                  rowKey="id"
                  dataSource={data.tables.recentLeads.slice(0, 6)}
                  columns={[
                    {
                      title: '客户',
                      width: 180,
                      render: (_: any, row) => (
                        <Space>
                          <Avatar size="small" icon={<UserOutlined />} style={{ background: COLORS.purple }} />
                          <div>
                            <Text>{row.name || '匿名'}</Text>
                            <div><Text type="secondary" style={{ fontSize: 12 }}>{row.phone}</Text></div>
                          </div>
                        </Space>
                      ),
                    },
                    {
                      title: '来源',
                      dataIndex: 'source',
                      width: 90,
                      render: (s: string) => <Tag>{SOURCE_NAME[s] || s}</Tag>,
                    },
                    {
                      title: 'AI 评分',
                      width: 100,
                      render: (_: any, row) => row.aiScore != null ? (
                        <Tag color={row.aiScore >= 80 ? 'success' : row.aiScore >= 60 ? 'gold' : 'default'}>
                          {row.aiScore} 分
                        </Tag>
                      ) : <Text type="secondary">-</Text>,
                    },
                    {
                      title: '状态',
                      dataIndex: 'status',
                      width: 90,
                      render: (s: string) => <Tag color={LEAD_STATUS_COLOR[s]}>{LEAD_STATUS_NAME[s] || s}</Tag>,
                    },
                    {
                      title: '获取时间',
                      dataIndex: 'createdAt',
                      width: 130,
                      render: (t: string) => dayjs(t).format('MM-DD HH:mm'),
                    },
                  ]}
                />
              )
            }
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            style={cardBase}
            title={
              <Space><ThunderboltOutlined style={{ color: COLORS.warning }} /><Text strong>快捷入口</Text></Space>
            }
          >
            <Row gutter={[8, 8]}>
              {[
                { icon: <ThunderboltOutlined />, label: 'AI 创作工厂', path: '/customer/ai-factory', color: COLORS.primary, desc: '一键生成爆款' },
                { icon: <RocketOutlined />, label: '内容发布', path: '/customer/content-publish', color: COLORS.cyan, desc: '多平台一键发布' },
                { icon: <TeamOutlined />, label: '智能获客', path: '/customer/acquisition', color: COLORS.purple, desc: '采集精准线索' },
                { icon: <AuditOutlined />, label: '招聘助手', path: '/customer/recruitment', color: COLORS.pink, desc: 'AI 简历筛选' },
                { icon: <ShareAltOutlined />, label: '推荐分享', path: '/customer/share', color: COLORS.gold, desc: '裂变式传播' },
                { icon: <CustomerServiceOutlined />, label: 'CRM 客户', path: '/customer/crm', color: COLORS.success, desc: '客户全生命周期' },
              ].map(item => (
                <Col span={12} key={item.path}>
                  <div
                    onClick={() => router.push(item.path)}
                    style={{
                      cursor: 'pointer',
                      padding: 12,
                      borderRadius: 8,
                      background: '#fafafa',
                      border: `1px solid ${item.color}20`,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.background = `${item.color}08`;
                      (e.currentTarget as HTMLDivElement).style.borderColor = item.color;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.background = '#fafafa';
                      (e.currentTarget as HTMLDivElement).style.borderColor = `${item.color}20`;
                    }}
                  >
                    <Space align="start">
                      <div style={{
                        width: 32, height: 32, borderRadius: 6,
                        background: item.color, color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, flexShrink: 0,
                      }}>{item.icon}</div>
                      <div style={{ minWidth: 0 }}>
                        <Text strong style={{ fontSize: 13, display: 'block' }}>{item.label}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{item.desc}</Text>
                      </div>
                    </Space>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* ====== 首次使用引导 ====== */}
      {isFirstTimeUser && (
        <Card
          style={{ ...cardBase, marginTop: 16, background: 'linear-gradient(135deg, #e6f7ff 0%, #f9f0ff 100%)' }}
        >
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <Title level={4} style={{ margin: 0, marginBottom: 8 }}>
                <RocketOutlined style={{ color: COLORS.primary, marginRight: 8 }} />
                开启您的智能营销之旅
              </Title>
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                从「AI 创作工厂」生成第一条爆款内容开始，系统将自动追踪发布、获客、转化全链路数据。
              </Paragraph>
            </Col>
            <Col>
              <Space>
                <Button size="large" icon={<ThunderboltOutlined />} type="primary" onClick={() => router.push('/customer/ai-factory')}>
                  立即创作
                </Button>
                <Button size="large" onClick={() => router.push('/customer/matrix')}>
                  绑定平台
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
}

// ==================== 子组件 ====================

interface KpiCardProps {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: number;
  extra?: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
}

function KpiCard({ icon, color, label, value, extra, loading, onClick }: KpiCardProps) {
  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      style={{
        ...cardBase,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
      }}
      styles={{ body: { padding: 16 } }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 8,
          background: `${color}15`,
          color: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, marginRight: 12, flexShrink: 0,
        }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>{label}</Text>
          {loading ? (
            <Skeleton.Input active size="small" style={{ width: 60, height: 26 }} />
          ) : (
            <div style={{ fontSize: 24, fontWeight: 600, color: '#262626', lineHeight: 1.2 }}>
              {numFmt(value)}
            </div>
          )}
          {!loading && extra && (
            <div style={{ marginTop: 4, fontSize: 12 }}>{extra}</div>
          )}
        </div>
      </div>
    </Card>
  );
}

interface DistributionListProps {
  items: Array<{ label: string; value: number; color: string; max: number }>;
  emptyText: string;
  onAction?: () => void;
  actionText?: string;
}

function DistributionList({ items, emptyText, onAction, actionText }: DistributionListProps) {
  if (items.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={<Text type="secondary">{emptyText}</Text>}
        style={{ padding: '16px 0' }}
      >
        {onAction && <Button type="primary" size="small" onClick={onAction}>{actionText || '去管理'}</Button>}
      </Empty>
    );
  }
  return (
    <Space direction="vertical" size={10} style={{ width: '100%' }}>
      {items.map(item => {
        const pct = item.max > 0 ? Math.round((item.value / item.max) * 100) : 0;
        return (
          <div key={item.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 13 }}>{item.label}</Text>
              <Text strong style={{ fontSize: 13, color: item.color }}>{numFmt(item.value)}</Text>
            </div>
            <Progress
              percent={pct}
              strokeColor={item.color}
              showInfo={false}
              size="small"
            />
          </div>
        );
      })}
    </Space>
  );
}

interface TimelineItem {
  type: string;
  content: string;
  time: string;
  status?: string;
}

function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <div style={{ paddingTop: 8 }}>
      {items.map((item, idx) => {
        const icon = item.type === 'material' ? <FileTextOutlined />
          : item.type === 'lead' ? <TeamOutlined />
          : item.type === 'publish' ? <RocketOutlined />
          : item.type === 'share' ? <ShareAltOutlined />
          : item.type === 'crm' ? <CustomerServiceOutlined />
          : item.type === 'candidate' ? <AuditOutlined />
          : <CheckCircleOutlined />;

        const color = item.type === 'material' ? COLORS.primary
          : item.type === 'lead' ? COLORS.purple
          : item.type === 'publish' ? COLORS.cyan
          : item.type === 'share' ? COLORS.gold
          : item.type === 'crm' ? COLORS.success
          : COLORS.pink;

        return (
          <div key={idx} style={{ display: 'flex', position: 'relative', paddingBottom: 16 }}>
            {idx < items.length - 1 && (
              <div style={{
                position: 'absolute', left: 11, top: 24, bottom: 0,
                width: 2, background: '#f0f0f0',
              }} />
            )}
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: `${color}15`, color: color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, marginRight: 12, flexShrink: 0, zIndex: 1,
            }}>{icon}</div>
            <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
              <Text style={{ fontSize: 13 }}>{item.content}</Text>
              {item.status && (
                <Tag color={LEAD_STATUS_COLOR[item.status] || 'default'} style={{ marginLeft: 8, fontSize: 11 }}>
                  {item.status}
                </Tag>
              )}
              <div><Text type="secondary" style={{ fontSize: 11 }}>{item.time}</Text></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
