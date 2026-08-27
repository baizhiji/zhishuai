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
  Skeleton,
  Button,
  Tooltip,
  Segmented,
} from 'antd';
import {
  FileTextOutlined,
  RobotOutlined,
  CustomerServiceOutlined,
  RedoOutlined,
  LineChartOutlined,
  RiseOutlined,
  PlusOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
  AimOutlined,
  ShareAltOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  CommentOutlined,
  ApartmentOutlined,
  QrcodeOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import dayjs from 'dayjs';
import request from '@/utils/request';

const { Title, Text } = Typography;

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

interface TokenStats {
  total: number;
  month: number;
  today: number;
  byProvider: Array<{ providerName: string; totalTokens: number; callCount: number }>;
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

const COLORS = {
  primary: '#6d28d9',
  success: '#52c41a',
  warning: '#faad14',
  purple: '#722ed1',
  cyan: '#13c2c2',
  gold: '#fa8c16',
};

const cardBase: React.CSSProperties = {
  borderRadius: 12,
  boxShadow: '0 2px 12px rgba(76, 29, 149, 0.06)',
  border: '1px solid rgba(109, 40, 217, 0.08)',
};

const numFmt = (n: number) => (n || 0).toLocaleString('zh-CN');

const formatTokens = (n: number) => {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const ACTIVITY_LABEL: Record<string, string> = {
  material: '素材',
  ai: 'AI创作',
  ticket: '工单',
  login: '登录',
};

const ACTIVITY_COLOR: Record<string, string> = {
  material: 'blue',
  ai: 'purple',
  ticket: 'gold',
  login: 'default',
};

// ==================== 子组件 ====================

function KpiCard({
  loading,
  icon,
  color,
  label,
  value,
  extra,
  onClick,
}: {
  loading: boolean;
  icon: React.ReactNode;
  color: string;
  label: string;
  value: number;
  extra?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      style={{ ...cardBase, cursor: onClick ? 'pointer' : 'default' }}
      styles={{ body: { padding: 18 } }}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 1 }} />
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <Text type="secondary" style={{ fontSize: 13 }}>{label}</Text>
              <div style={{ fontSize: 28, fontWeight: 600, color: '#262626', marginTop: 4, lineHeight: 1.2 }}>
                {numFmt(value)}
              </div>
            </div>
            <div
              style={{
                width: 40, height: 40, borderRadius: 10,
                background: `${color}15`, color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}
            >
              {icon}
            </div>
          </div>
          {extra && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>{extra}</div>
          )}
        </div>
      )}
    </Card>
  );
}

// ==================== 主组件 ====================

export default function CustomerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CustomerSummary>(EMPTY_SUMMARY);
  const [tokenStats, setTokenStats] = useState<TokenStats | null>(null);
  const [trendDays, setTrendDays] = useState<number>(7);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [summary, stats, daily] = await Promise.allSettled([
        request.get<CustomerSummary>('/api/dashboard-stats/customer-summary'),
        request.get<{ total: { totalTokens: number }; byProvider: any[] }>('/api/token-stats/stats'),
        request.get<Array<{ date: string; tokens: number; calls: number }>>('/api/token-stats/daily?days=30'),
      ]);
      if (summary.status === 'fulfilled') {
        setData(summary.value || EMPTY_SUMMARY);
      } else {
        setData(EMPTY_SUMMARY);
      }
      if (stats.status === 'fulfilled' && stats.value) {
        const todayStr = dayjs().format('YYYY-MM-DD');
        const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
        const dailyData = daily.status === 'fulfilled' && Array.isArray(daily.value) ? daily.value : [];
        const todayTokens = dailyData.filter(d => d.date === todayStr).reduce((s, d) => s + (d.tokens || 0), 0);
        const monthTokens = dailyData
          .filter(d => d.date >= monthStart)
          .reduce((s, d) => s + (d.tokens || 0), 0);
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
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const trendData = useMemo(() => {
    return (data.trend || []).map(t => ({
      ...t,
      dateLabel: dayjs(t.date).format('MM-DD'),
    }));
  }, [data.trend]);

  const isFirstTimeUser = !loading &&
    data.kpi.materials.total === 0 &&
    data.kpi.aiUsage.total === 0;

  return (
    <div style={{ padding: '16px 24px 32px', background: '#f5f7fa', minHeight: '100vh' }}>
      {/* ====== 顶部欢迎 ====== */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            数据总览 · {dayjs().format('YYYY年M月D日 dddd')}
          </Title>
          <Text type="secondary">这里是您的工作台首页，集中查看素材、创作、客户、Token 消耗等核心数据</Text>
        </div>
        <Space>
          <Tooltip title="刷新数据">
            <Button icon={<RedoOutlined />} onClick={fetchAll} loading={loading}>刷新</Button>
          </Tooltip>
        </Space>
      </div>

      {/* ====== 6 个核心 KPI ====== */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={12} md={8} lg={8} xl={8}>
          <KpiCard
            loading={loading}
            icon={<FileTextOutlined />}
            color={COLORS.primary}
            label="素材总数"
            value={data.kpi.materials.total}
            extra={data.kpi.materials.weekNew > 0 ? <span><RiseOutlined style={{ color: COLORS.success }} /> 本周新增 {data.kpi.materials.weekNew}</span> : '点击查看内容中心'}
            onClick={() => router.push('/customer/materials')}
          />
        </Col>
        <Col xs={12} sm={12} md={8} lg={8} xl={8}>
          <KpiCard
            loading={loading}
            icon={<RobotOutlined />}
            color={COLORS.purple}
            label="AI 创作次数"
            value={data.kpi.aiUsage.total}
            extra={data.kpi.aiUsage.weekTokens > 0 ? `本周消耗 ${formatTokens(data.kpi.aiUsage.weekTokens)} tokens` : '点击进入 AI 创作工厂'}
            onClick={() => router.push('/customer/ai-factory')}
          />
        </Col>
        <Col xs={12} sm={12} md={8} lg={8} xl={8}>
          <KpiCard
            loading={loading}
            icon={<CustomerServiceOutlined />}
            color={COLORS.gold}
            label="待处理工单"
            value={data.kpi.pendingTickets}
            extra={data.kpi.pendingTickets > 0 ? '点击处理' : '一切正常'}
            onClick={() => router.push('/customer/tickets')}
          />
        </Col>
        <Col xs={12} sm={12} md={8} lg={8} xl={8}>
          <KpiCard
            loading={loading}
            icon={<AimOutlined />}
            color={COLORS.success}
            label="获客线索"
            value={data.kpi.leads.total}
            extra={<span>{data.kpi.leads.weekNew > 0 ? <><RiseOutlined style={{ color: COLORS.success }} /> 本周新增 {data.kpi.leads.weekNew} </> : ''}{data.kpi.leads.converted > 0 ? `已转化 ${data.kpi.leads.converted}` : '点击进入智能获客'}</span>}
            onClick={() => router.push('/customer/acquisition/board')}
          />
        </Col>
        <Col xs={12} sm={12} md={8} lg={8} xl={8}>
          <KpiCard
            loading={loading}
            icon={<ShareAltOutlined />}
            color={COLORS.cyan}
            label="推荐分享"
            value={data.kpi.shares.total}
            extra={data.kpi.shares.scans > 0 ? `扫码 ${data.kpi.shares.scans} 次` + (data.kpi.shares.conversions > 0 ? ` · 转化 ${data.kpi.shares.conversions}` : '') : '点击进入推荐分享'}
            onClick={() => router.push('/customer/share/board')}
          />
        </Col>
        <Col xs={12} sm={12} md={8} lg={8} xl={8}>
          <KpiCard
            loading={loading}
            icon={<TeamOutlined />}
            color={COLORS.warning}
            label="招聘候选人"
            value={data.kpi.candidates.total}
            extra={data.kpi.candidates.weekNew > 0 ? <span><RiseOutlined style={{ color: COLORS.success }} /> 本周新增 {data.kpi.candidates.weekNew}{data.kpi.candidates.hired > 0 ? ` · 已录用 ${data.kpi.candidates.hired}` : ''}</span> : '点击进入智能招聘'}
            onClick={() => router.push('/customer/recruitment')}
          />
        </Col>
      </Row>

      {/* ====== Tokens 消耗统计卡片（新增） ====== */}
      <Card
        style={{ ...cardBase, marginBottom: 16 }}
        title={
          <Space>
            <span style={{
              display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
              background: COLORS.purple,
            }} />
            <Text strong>我的 Token 消耗</Text>
          </Space>
        }
        extra={
          tokenStats ? (
            <Tag color="purple">实时统计</Tag>
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>暂无数据</Text>
          )
        }
        styles={{ body: { padding: 18 } }}
      >
        {loading ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : tokenStats ? (
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>总消耗</Text>
                <div style={{ fontSize: 24, fontWeight: 600, color: COLORS.purple, marginTop: 2 }}>
                  {formatTokens(tokenStats.total)} <Text type="secondary" style={{ fontSize: 12 }}>tokens</Text>
                </div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>本月消耗</Text>
                <div style={{ fontSize: 24, fontWeight: 600, color: COLORS.primary, marginTop: 2 }}>
                  {formatTokens(tokenStats.month)} <Text type="secondary" style={{ fontSize: 12 }}>tokens</Text>
                </div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>今日消耗</Text>
                <div style={{ fontSize: 24, fontWeight: 600, color: COLORS.success, marginTop: 2 }}>
                  {formatTokens(tokenStats.today)} <Text type="secondary" style={{ fontSize: 12 }}>tokens</Text>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={6}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>主要功能</Text>
                <div style={{ marginTop: 4 }}>
                  {(tokenStats.byProvider || []).slice(0, 2).map((p, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#595959', marginBottom: 2 }}>
                      <Text style={{ fontSize: 12 }}>{p.providerName || '服务商'}</Text>
                      <Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>
                        {formatTokens(p.totalTokens || 0)} ({p.callCount || 0}次)
                      </Text>
                    </div>
                  ))}
                  {(!tokenStats.byProvider || tokenStats.byProvider.length === 0) && (
                    <Text type="secondary" style={{ fontSize: 12 }}>暂无</Text>
                  )}
                </div>
              </div>
            </Col>
          </Row>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<Text type="secondary">开始使用 AI 创作工厂后，将在这里显示您的 Token 消耗</Text>}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/customer/ai-factory')}>
              立即体验
            </Button>
          </Empty>
        )}
      </Card>

      {/* ====== 趋势 + 活动 ====== */}
      <Row gutter={[12, 12]}>
        <Col xs={24} lg={16}>
          <Card
            style={cardBase}
            title={
              <Space>
                <LineChartOutlined style={{ color: COLORS.primary }} />
                <Text strong>素材增长趋势</Text>
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
            styles={{ body: { padding: '8px 8px 0' } }}
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : trendData.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<Text type="secondary">暂无趋势数据，开始创作素材后将显示</Text>}
                style={{ padding: '40px 0' }}
              />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData} margin={{ top: 20, right: 24, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="dateLabel" tick={{ fontSize: 12, fill: '#999' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#999' }} allowDecimals={false} />
                  <RTooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e8e8e8' }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="materials"
                    name="新增素材"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
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
                <ClockCircleOutlined style={{ color: COLORS.gold }} />
                <Text strong>今日活动</Text>
              </Space>
            }
            styles={{ body: { padding: '8px 0' } }}
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 5 }} style={{ padding: 16 }} />
            ) : (data.recentActivities || []).length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<Text type="secondary">今日暂无活动</Text>}
                style={{ padding: '40px 0' }}
              />
            ) : (
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {(data.recentActivities || []).slice(0, 10).map((a, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '10px 16px',
                      borderBottom: i < (data.recentActivities || []).length - 1 ? '1px solid #f5f5f5' : 'none',
                    }}
                  >
                    <Space size={8} align="start">
                      <Tag color={ACTIVITY_COLOR[a.type] || 'default'} style={{ margin: 0 }}>
                        {ACTIVITY_LABEL[a.type] || a.type}
                      </Tag>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: '#262626' }}>{a.content}</div>
                        <Text type="secondary" style={{ fontSize: 11 }}>{a.time}</Text>
                      </div>
                    </Space>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* ====== 快捷入口 / 首次引导 ====== */}
      {isFirstTimeUser && (
        <Card style={{ ...cardBase, marginTop: 16 }} styles={{ body: { padding: 24 } }}>
          <Title level={4} style={{ marginTop: 0 }}>👋 欢迎使用智枢 AI</Title>
          <Text type="secondary">四大功能模块，覆盖内容创作、智能招聘、智能获客与裂变增长，高级配置均可在电脑端完成：</Text>
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} sm={6}>
              <Card
                hoverable
                style={{ borderRadius: 10, border: '1px dashed #d9d9d9' }}
                styles={{ body: { padding: 16 } }}
                onClick={() => router.push('/customer/ai-factory')}
              >
                <Space>
                  <RobotOutlined style={{ fontSize: 24, color: COLORS.purple }} />
                  <div>
                    <Text strong>AI 创作工厂</Text>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>一键生成爆款内容 <ArrowRightOutlined /></div>
                  </div>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card
                hoverable
                style={{ borderRadius: 10, border: '1px dashed #d9d9d9' }}
                styles={{ body: { padding: 16 } }}
                onClick={() => router.push('/customer/recruitment')}
              >
                <Space>
                  <TeamOutlined style={{ fontSize: 24, color: COLORS.primary }} />
                  <div>
                    <Text strong>智能招聘</Text>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>职位发布 · 自动猎头 <ArrowRightOutlined /></div>
                  </div>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card
                hoverable
                style={{ borderRadius: 10, border: '1px dashed #d9d9d9' }}
                styles={{ body: { padding: 16 } }}
                onClick={() => router.push('/customer/acquisition')}
              >
                <Space>
                  <AimOutlined style={{ fontSize: 24, color: COLORS.success }} />
                  <div>
                    <Text strong>智能获客</Text>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>潜客发现 · 评论获客 <ArrowRightOutlined /></div>
                  </div>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card
                hoverable
                style={{ borderRadius: 10, border: '1px dashed #d9d9d9' }}
                styles={{ body: { padding: 16 } }}
                onClick={() => router.push('/customer/recommendation')}
              >
                <Space>
                  <ShareAltOutlined style={{ fontSize: 24, color: COLORS.warning }} />
                  <div>
                    <Text strong>推荐分享</Text>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>分享裂变 · 推广获益 <ArrowRightOutlined /></div>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </Card>
      )}

      {/* ====== 高级功能入口引导（电脑端完整配置入口） ====== */}
      <Card style={{ ...cardBase, marginTop: 16 }} styles={{ body: { padding: '16px 20px' } }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Space>
            <ThunderboltOutlined style={{ fontSize: 18, color: COLORS.primary }} />
            <div>
              <Text strong>高级功能入口</Text>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                自动招聘、评论获客、平台授权等高级配置均在电脑端完成，手机端仅支持查看和日常操作
              </div>
            </div>
          </Space>
          <Space wrap>
            <Button size="small" icon={<ThunderboltOutlined />} onClick={() => router.push('/customer/recruitment/auto')}>
              自动招聘
            </Button>
            <Button size="small" icon={<CommentOutlined />} onClick={() => router.push('/customer/acquisition/comment')}>
              评论获客
            </Button>
            <Button size="small" icon={<UserAddOutlined />} onClick={() => router.push('/customer/recruitment/candidates')}>
              候选人库
            </Button>
            <Button size="small" icon={<ApartmentOutlined />} onClick={() => router.push('/customer/recruitment/platforms')}>
              招聘平台
            </Button>
            <Button size="small" icon={<QrcodeOutlined />} onClick={() => router.push('/customer/acquisition/accounts')}>
              平台授权
            </Button>
          </Space>
        </div>
      </Card>

      {/* ====== 底部提示 ====== */}
      <div style={{ textAlign: 'center', marginTop: 24, color: '#bfbfbf', fontSize: 12 }}>
        数据更新于 {dayjs(data.generatedAt).format('YYYY-MM-DD HH:mm:ss')}
      </div>
    </div>
  );
}
