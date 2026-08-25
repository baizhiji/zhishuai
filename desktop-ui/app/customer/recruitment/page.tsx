'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Statistic, Table, Button, Tag, Space, Typography, Segmented, Modal, Form, Input, Select, InputNumber, Popconfirm, message,
} from 'antd';
import {
  PlusOutlined, RobotOutlined, SendOutlined, GlobalOutlined, ReloadOutlined,
  TeamOutlined, UserSwitchOutlined, CalendarOutlined, RiseOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import PageContainer from '@/components/customer/PageContainer';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  recruiting: { label: '招聘中', color: 'blue' },
  paused: { label: '已暂停', color: 'orange' },
  closed: { label: '已关闭', color: 'default' },
};

interface Job {
  id: string;
  title: string;
  salaryMin?: number;
  salaryMax?: number;
  education?: string;
  experience?: string;
  status: string;
  candidateCount: number;
  createdAt: string;
}

interface RecruitmentStats {
  totalJobs: number;
  activeJobs: number;
  totalCandidates: number;
  newCandidatesThisWeek: number;
  scheduledInterviews: number;
}

export default function RecruitmentPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<RecruitmentStats>({ totalJobs: 0, activeJobs: 0, totalCandidates: 0, newCandidatesThisWeek: 0, scheduledInterviews: 0 });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [period, setPeriod] = useState<string>('all');

  // 创建岗位 Modal
  const [createVisible, setCreateVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [createLoading, setCreateLoading] = useState(false);

  // 编辑岗位 Modal
  const [editVisible, setEditVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [editLoading, setEditLoading] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/recruitment/jobs', {
        params: { page: pagination.page, pageSize: pagination.pageSize, status: statusFilter },
      }) as { jobs: Job[]; total: number };
      setJobs(res.jobs || []);
      setPagination(prev => ({ ...prev, total: res.total || 0 }));
    } catch { setJobs([]); } finally { setLoading(false); }
  }, [pagination.page, pagination.pageSize, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient.get('/recruitment/pipeline/stats') as RecruitmentStats;
      if (res) setStats(res);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchJobs(); fetchStats(); }, [fetchJobs, fetchStats]);

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      setCreateLoading(true);
      await apiClient.post('/recruitment/jobs', values);
      message.success('岗位发布成功');
      setCreateVisible(false);
      createForm.resetFields();
      fetchJobs();
      fetchStats();
    } catch (e: unknown) {
      if ((e as Error)?.message) message.error((e as Error).message);
    } finally { setCreateLoading(false); }
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    editForm.setFieldsValue({
      title: job.title,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      education: job.education,
      experience: job.experience,
    });
    setEditVisible(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      setEditLoading(true);
      await apiClient.put(`/recruitment/jobs/${editingJob!.id}`, values);
      message.success('岗位更新成功');
      setEditVisible(false);
      fetchJobs();
    } catch (e: unknown) {
      if ((e as Error)?.message) message.error((e as Error).message);
    } finally { setEditLoading(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/recruitment/jobs/${id}`);
      message.success('岗位已删除');
      fetchJobs();
      fetchStats();
    } catch (e: unknown) { message.error((e as Error)?.message || '删除失败'); }
  };

  const columns: ColumnsType<Job> = [
    { title: '岗位名称', dataIndex: 'title', key: 'title', width: 220, render: (text: string, record: Job) => <a onClick={() => router.push(`/customer/recruitment/publish?id=${record.id}`)}>{text}</a> },
    { title: '薪资范围', key: 'salary', width: 140, render: (_: unknown, r: Job) => r.salaryMin && r.salaryMax ? `${r.salaryMin / 1000}k-${r.salaryMax / 1000}k` : '-' },
    { title: '学历', dataIndex: 'education', key: 'education', width: 100, render: (v: string) => v || '-' },
    { title: '经验', dataIndex: 'experience', key: 'experience', width: 100, render: (v: string) => v || '-' },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: string) => <Tag color={STATUS_CONFIG[s]?.color}>{STATUS_CONFIG[s]?.label || s}</Tag>,
    },
    { title: '候选人', dataIndex: 'candidateCount', key: 'candidateCount', width: 80, align: 'center' },
    {
      title: '发布时间', dataIndex: 'createdAt', key: 'createdAt', width: 120,
      render: (v: string) => v ? dayjs(v).format('MM-DD HH:mm') : '-',
    },
    {
      title: '操作', key: 'actions', width: 140,
      render: (_: unknown, record: Job) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除该岗位？" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="招聘看板"
      description="AI 驱动的智能招聘系统，自动匹配、自动沟通、全流程管理"
      breadcrumb={[{ title: '首页', href: '/customer/dashboard' }, { title: '智能招聘' }]}
      loading={false}
      skeletonType="card"
      extra={
        <Space>
          <Button icon={<SendOutlined />} onClick={() => router.push('/customer/recruitment/publish')}>发布岗位</Button>
          <Button icon={<RobotOutlined />} onClick={() => router.push('/customer/recruitment/auto')}>自动招聘</Button>
          <Button icon={<GlobalOutlined />} onClick={() => router.push('/customer/recruitment/platforms')}>平台管理</Button>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchJobs(); fetchStats(); }}>刷新</Button>
        </Space>
      }
    >
      {/* KPI 卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card><Statistic title="开放岗位" value={stats.activeJobs} prefix={<TeamOutlined />} valueStyle={{ color: '#6d28d9' }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="候选人总数" value={stats.totalCandidates} prefix={<UserSwitchOutlined />} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="待面试" value={stats.scheduledInterviews} prefix={<CalendarOutlined />} valueStyle={{ color: '#fa8c16' }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="本周新增" value={stats.newCandidatesThisWeek} prefix={<RiseOutlined />} valueStyle={{ color: '#722ed1' }} /></Card>
        </Col>
      </Row>

      {/* 岗位列表 */}
      <Card
        title="岗位列表"
        style={{ borderRadius: 8 }}
        extra={
          <Space>
            <Select
              placeholder="筛选状态"
              allowClear
              style={{ width: 120 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: '招聘中', value: 'recruiting' },
                { label: '已暂停', value: 'paused' },
                { label: '已关闭', value: 'closed' },
              ]}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { createForm.resetFields(); setCreateVisible(true); }}>新建岗位</Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={jobs}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => setPagination(prev => ({ ...prev, page, pageSize })),
          }}
          size="middle"
        />
      </Card>

      {/* 快速入口 */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => router.push('/customer/recruitment/publish')} style={{ textAlign: 'center', borderRadius: 8 }}>
            <SendOutlined style={{ fontSize: 36, color: '#6d28d9', marginBottom: 12 }} />
            <Title level={5}>发布新岗位</Title>
            <Text type="secondary">一键发布到多个招聘平台</Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => router.push('/customer/recruitment/auto')} style={{ textAlign: 'center', borderRadius: 8 }}>
            <RobotOutlined style={{ fontSize: 36, color: '#722ed1', marginBottom: 12 }} />
            <Title level={5}>AI 自动招聘</Title>
            <Text type="secondary">智能搜索 & 自动沟通候选人</Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => router.push('/customer/recruitment/platforms')} style={{ textAlign: 'center', borderRadius: 8 }}>
            <GlobalOutlined style={{ fontSize: 36, color: '#13c2c2', marginBottom: 12 }} />
            <Title level={5}>平台管理</Title>
            <Text type="secondary">管理已接入的招聘平台</Text>
          </Card>
        </Col>
      </Row>

      {/* 创建岗位 Modal */}
      <Modal title="发布新岗位" open={createVisible} onCancel={() => setCreateVisible(false)} onOk={handleCreate} confirmLoading={createLoading} okText="发布" cancelText="取消" width={600}>
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="岗位名称" rules={[{ required: true, message: '请输入岗位名称' }]}>
            <Input placeholder="如：高级前端工程师" maxLength={100} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="salaryMin" label="最低薪资 (元)">
                <InputNumber style={{ width: '100%' }} placeholder="如 15000" min={0} step={1000} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="salaryMax" label="最高薪资 (元)">
                <InputNumber style={{ width: '100%' }} placeholder="如 30000" min={0} step={1000} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="education" label="学历要求">
                <Select placeholder="选择学历" options={[
                  { label: '不限', value: '不限' }, { label: '大专', value: '大专' },
                  { label: '本科', value: '本科' }, { label: '硕士', value: '硕士' }, { label: '博士', value: '博士' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="experience" label="经验要求">
                <Select placeholder="选择经验" options={[
                  { label: '不限', value: '不限' }, { label: '1-3年', value: '1-3年' },
                  { label: '3-5年', value: '3-5年' }, { label: '5-10年', value: '5-10年' }, { label: '10年以上', value: '10年以上' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="岗位描述">
            <TextArea rows={4} placeholder="岗位职责及工作内容" maxLength={2000} showCount />
          </Form.Item>
          <Form.Item name="requirements" label="任职要求">
            <TextArea rows={3} placeholder="技能要求、工作经验等" maxLength={2000} showCount />
          </Form.Item>
          <Form.Item name="benefits" label="福利待遇">
            <TextArea rows={2} placeholder="五险一金、年终奖等" maxLength={500} />
          </Form.Item>
          <Form.Item name="jobType" label="工作类型">
            <Select placeholder="选择类型" options={[
              { label: '全职', value: '全职' }, { label: '兼职', value: '兼职' },
              { label: '实习', value: '实习' }, { label: '远程', value: '远程' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑岗位 Modal */}
      <Modal title="编辑岗位" open={editVisible} onCancel={() => setEditVisible(false)} onOk={handleEditSubmit} confirmLoading={editLoading} okText="保存" cancelText="取消" width={600}>
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="岗位名称" rules={[{ required: true }]}>
            <Input maxLength={100} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="salaryMin" label="最低薪资"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={12}><Form.Item name="salaryMax" label="最高薪资"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="education" label="学历"><Select options={[
                { label: '不限', value: '不限' }, { label: '大专', value: '大专' }, { label: '本科', value: '本科' }, { label: '硕士', value: '硕士' },
              ]} /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="experience" label="经验"><Select options={[
                { label: '不限', value: '不限' }, { label: '1-3年', value: '1-3年' }, { label: '3-5年', value: '3-5年' }, { label: '5-10年', value: '5-10年' },
              ]} /></Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </PageContainer>
  );
}
