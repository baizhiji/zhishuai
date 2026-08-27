'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card, Table, Button, Tag, Space, Typography, Select, message, Row, Col, Statistic, Drawer, Descriptions, Empty, Popconfirm,
} from 'antd';
import {
  ReloadOutlined, RobotOutlined, MessageOutlined, LinkOutlined, UserOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '@/lib/api';
import PageContainer from '@/components/customer/PageContainer';
import dayjs from 'dayjs';

const { Text } = Typography;

interface Candidate {
  id: string;
  postId: string;
  name: string;
  phone: string | null;
  email?: string | null;
  resume?: string | null;
  status: string;
  remark?: string | null;
  createdAt: string;
  updatedAt: string;
  education?: string | null;
  experience?: string | null;
  lastContactedAt?: string | null;
  location?: string | null;
  matchScore?: number | null;
  skills?: string | null;
  source?: string | null;
  platform?: string | null;
  sourceUrl?: string | null;
  RecruitmentPost?: { title: string } | null;
}

interface Job {
  id: string;
  title: string;
}

// 阶段状态机（与后端 STAGES 对齐）
const STAGE_META: Record<string, { label: string; color: string }> = {
  screening: { label: '筛选中', color: 'default' },
  matched: { label: '已匹配', color: 'blue' },
  contacted: { label: '已联系', color: 'geekblue' },
  replied: { label: '已回复', color: 'cyan' },
  interview_scheduled: { label: '已约面试', color: 'purple' },
  interview_completed: { label: '面试完成', color: 'magenta' },
  offered: { label: '已发Offer', color: 'gold' },
  hired: { label: '已入职', color: 'green' },
  rejected: { label: '已拒绝', color: 'red' },
  expired: { label: '已过期', color: 'default' },
  failed: { label: '沟通失败', color: 'orange' },
  pending: { label: '待处理', color: 'default' },
};

// 合法状态流转（与后端 VALID_TRANSITIONS 对齐）
const STAGE_TRANSITIONS: Record<string, string[]> = {
  screening: ['matched', 'rejected'],
  matched: ['contacted', 'rejected'],
  contacted: ['replied', 'expired'],
  replied: ['interview_scheduled', 'rejected'],
  interview_scheduled: ['interview_completed', 'rejected'],
  interview_completed: ['offered', 'rejected'],
  offered: ['hired', 'rejected'],
  pending: ['matched', 'rejected'],
};

const PLATFORM_LABELS: Record<string, string> = {
  bosszhipin: 'BOSS直聘',
  boss: 'BOSS直聘',
  zhilian: '智联招聘',
  '51job': '前程无忧',
  liepin: '猎聘',
  lagou: '拉勾',
  manual: '手动录入',
};

export default function CandidatesPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [jobIdFilter, setJobIdFilter] = useState<string | undefined>();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [contactingId, setContactingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Candidate | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await apiClient.get('/recruitment/jobs', { params: { pageSize: 200 } }) as { jobs: Job[] };
      setJobs(res.jobs || []);
    } catch { setJobs([]); }
  }, []);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/recruitment/candidates', {
        params: { page, pageSize, status: statusFilter, jobId: jobIdFilter },
      }) as { candidates: Candidate[]; total: number };
      setCandidates(res.candidates || []);
      setTotal(res.total || 0);
    } catch (e: unknown) {
      message.error((e as Error)?.message || '加载候选人失败');
      setCandidates([]);
    } finally { setLoading(false); }
  }, [page, pageSize, statusFilter, jobIdFilter]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);
  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  const handleContact = async (c: Candidate) => {
    setContactingId(c.id);
    try {
      const res = await apiClient.post(`/recruitment/candidates/${c.id}/contact`, { channel: 'platform' }) as {
        success: boolean; message?: string; newStage?: string; deliveryStatus?: string;
      };
      if (res.success) {
        message.success(res.message || '沟通消息已发送');
      } else {
        message.warning(res.message || '沟通消息未送达');
      }
      fetchCandidates();
    } catch (e: unknown) {
      message.error((e as Error)?.message || '联系失败');
    } finally { setContactingId(null); }
  };

  const handleStatusChange = async (c: Candidate, status: string) => {
    try {
      await apiClient.put(`/recruitment/candidates/${c.id}/status`, { status });
      message.success(`候选人已流转至「${STAGE_META[status]?.label || status}」`);
      fetchCandidates();
    } catch (e: unknown) {
      message.error((e as Error)?.message || '状态更新失败');
    }
  };

  const openDetail = (c: Candidate) => {
    setDetail(c);
    setDetailOpen(true);
  };

  const columns: ColumnsType<Candidate> = [
    {
      title: '候选人', key: 'name', width: 150,
      render: (_: unknown, r: Candidate) => (
        <a onClick={() => openDetail(r)} style={{ fontWeight: 500 }}>{r.name || '未命名'}</a>
      ),
    },
    {
      title: '应聘岗位', key: 'post', width: 160, ellipsis: true,
      render: (_: unknown, r: Candidate) => r.RecruitmentPost?.title || '—',
    },
    {
      title: '学历/经验', key: 'edu', width: 120,
      render: (_: unknown, r: Candidate) => `${r.education || '不限'} / ${r.experience || '—'}`,
    },
    {
      title: '来源', key: 'source', width: 110,
      render: (_: unknown, r: Candidate) => {
        const label = r.platform ? (PLATFORM_LABELS[r.platform] || r.platform) : (r.source === 'ai' ? 'AI推荐' : '手动');
        return <Tag>{label}</Tag>;
      },
    },
    {
      title: '阶段状态', dataIndex: 'status', key: 'status', width: 110,
      render: (v: string) => {
        const meta = STAGE_META[v] || { label: v, color: 'default' };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: '匹配度', dataIndex: 'matchScore', key: 'matchScore', width: 90, align: 'center',
      render: (v: number | null) => (typeof v === 'number' && v > 0 ? `${v}%` : '—'),
    },
    {
      title: '来源链接', key: 'url', width: 90,
      render: (_: unknown, r: Candidate) =>
        r.sourceUrl ? (
          <a href={r.sourceUrl} target="_blank" rel="noreferrer">查看</a>
        ) : '—',
    },
    {
      title: '最近沟通', dataIndex: 'lastContactedAt', key: 'contacted', width: 120,
      render: (v: string | null) => (v ? dayjs(v).format('MM-DD HH:mm') : '—'),
    },
    {
      title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 120,
      render: (v: string) => dayjs(v).format('MM-DD HH:mm'),
    },
    {
      title: '操作', key: 'actions', width: 200, fixed: 'right',
      render: (_: unknown, r: Candidate) => (
        <Space size={0}>
          <Button
            type="link" size="small" icon={<MessageOutlined />}
            loading={contactingId === r.id}
            onClick={() => handleContact(r)}
          >
            联系
          </Button>
          <Select
            size="small"
            placeholder="流转"
            style={{ width: 84 }}
            onChange={(v) => handleStatusChange(r, v)}
            options={(STAGE_TRANSITIONS[r.status] || STAGE_TRANSITIONS.pending || []).map((s) => ({
              label: STAGE_META[s]?.label || s, value: s,
            }))}
          />
          <Popconfirm title="确定将候选人标记为已拒绝？" onConfirm={() => handleStatusChange(r, 'rejected')}>
            <Button type="link" size="small" danger>拒绝</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const stats = {
    contacted: candidates.filter((c) => ['contacted', 'replied'].includes(c.status)).length,
    replied: candidates.filter((c) => ['replied', 'interview_scheduled', 'interview_completed', 'offered', 'hired'].includes(c.status)).length,
    platform: candidates.filter((c) => c.platform).length,
    pending: candidates.filter((c) => ['pending', 'screening', 'matched'].includes(c.status)).length,
  };

  return (
    <PageContainer
      title="候选人库"
      description="系统从招聘平台真实搜索的候选人，支持查看来源、手动联系与阶段流转"
      breadcrumb={[{ title: '首页', href: '/customer/dashboard' }, { title: '智能招聘', href: '/customer/recruitment' }, { title: '候选人库' }]}
      loading={false}
      skeletonType="table"
      extra={
        <Space>
          <Button icon={<RobotOutlined />} onClick={() => router.push('/customer/recruitment/auto')}>自动招聘</Button>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchCandidates(); }} loading={loading}>刷新</Button>
        </Space>
      }
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small"><Statistic title="本页候选人" value={candidates.length} prefix={<UserOutlined />} valueStyle={{ color: '#6d28d9' }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small"><Statistic title="平台来源" value={stats.platform} prefix={<LinkOutlined />} valueStyle={{ color: '#13c2c2' }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small"><Statistic title="已联系/回复" value={stats.contacted} prefix={<MessageOutlined />} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small"><Statistic title="待跟进" value={stats.pending} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#fa8c16' }} /></Card>
        </Col>
      </Row>

      <Card
        title="候选人列表"
        style={{ borderRadius: 8 }}
        extra={
          <Space>
            <Select
              placeholder="筛选阶段"
              allowClear
              style={{ width: 130 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={Object.entries(STAGE_META).map(([k, v]) => ({ label: v.label, value: k }))}
            />
            <Select
              placeholder="筛选岗位"
              allowClear
              style={{ width: 160 }}
              value={jobIdFilter}
              onChange={setJobIdFilter}
              options={jobs.map((j) => ({ label: j.title, value: j.id }))}
            />
          </Space>
        }
      >
        <Table<Candidate>
          columns={columns}
          dataSource={candidates}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无候选人，请先到「自动招聘」创建搜索配置执行搜索" /> }}
          size="middle"
        />
      </Card>

      <Drawer
        title={detail?.name || '候选人详情'}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={480}
      >
        {detail && (
          <Space direction="vertical" style={{ width: '100%' }} size={4}>
            <Text type="secondary">应聘岗位：{detail.RecruitmentPost?.title || '—'}</Text>
            <Text type="secondary">阶段状态：{STAGE_META[detail.status]?.label || detail.status}</Text>
            <Descriptions column={1} size="small" style={{ marginTop: 12 }}>
              <Descriptions.Item label="来源平台">{detail.platform ? (PLATFORM_LABELS[detail.platform] || detail.platform) : '手动录入'}</Descriptions.Item>
              <Descriptions.Item label="匹配度">{typeof detail.matchScore === 'number' && detail.matchScore > 0 ? `${detail.matchScore}%` : '—'}</Descriptions.Item>
              <Descriptions.Item label="手机">{detail.phone || '—'}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{detail.email || '—'}</Descriptions.Item>
              <Descriptions.Item label="地区">{detail.location || '—'}</Descriptions.Item>
              <Descriptions.Item label="学历/经验">{detail.education || '不限'} / {detail.experience || '—'}</Descriptions.Item>
              <Descriptions.Item label="技能">{detail.skills || '—'}</Descriptions.Item>
              <Descriptions.Item label="最近沟通">{detail.lastContactedAt ? dayjs(detail.lastContactedAt).format('YYYY-MM-DD HH:mm') : '—'}</Descriptions.Item>
              <Descriptions.Item label="来源链接">
                {detail.sourceUrl ? <a href={detail.sourceUrl} target="_blank" rel="noreferrer">打开原始链接</a> : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="备注">{detail.remark || '—'}</Descriptions.Item>
              <Descriptions.Item label="简历摘要">{detail.resume || '—'}</Descriptions.Item>
            </Descriptions>
            <Space style={{ marginTop: 16 }}>
              <Button type="primary" icon={<MessageOutlined />} loading={contactingId === detail.id} onClick={() => handleContact(detail)}>
                联系候选人
              </Button>
              <Button onClick={() => router.push('/customer/recruitment/auto')}>去自动招聘</Button>
            </Space>
          </Space>
        )}
      </Drawer>
    </PageContainer>
  );
}
