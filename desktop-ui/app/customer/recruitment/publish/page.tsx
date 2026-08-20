'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Tag, Space, Modal, Form, Input, Select, InputNumber, Popconfirm, message, Row, Col, Statistic,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, SendOutlined, PauseCircleOutlined, PlayCircleOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import PageContainer from '@/components/customer/PageContainer';
import dayjs from 'dayjs';

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
  description?: string;
  requirements?: string;
  benefits?: string;
  jobType?: string;
  status: string;
  candidateCount: number;
  createdAt: string;
}

export default function PublishPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  // 详情弹窗
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailJob, setDetailJob] = useState<Job | null>(null);

  // 新建/编辑
  const [formVisible, setFormVisible] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [jobForm] = Form.useForm();

  const [stats, setStats] = useState({ active: 0, paused: 0, closed: 0, total: 0 });

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/recruitment/jobs', {
        params: { page: pagination.page, pageSize: pagination.pageSize, status: statusFilter },
      }) as { jobs: Job[]; total: number };
      const list = res.jobs || [];
      setJobs(list);
      setPagination(prev => ({ ...prev, total: res.total || 0 }));
      setStats({
        total: res.total || 0,
        active: list.filter(j => j.status === 'recruiting').length,
        paused: list.filter(j => j.status === 'paused').length,
        closed: list.filter(j => j.status === 'closed').length,
      });
    } catch { setJobs([]); } finally { setLoading(false); }
  }, [pagination.page, pagination.pageSize, statusFilter]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const openForm = (job?: Job) => {
    if (job) {
      setEditingId(job.id);
      jobForm.setFieldsValue(job);
    } else {
      setEditingId(null);
      jobForm.resetFields();
    }
    setFormVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await jobForm.validateFields();
      setFormLoading(true);
      if (editingId) {
        await apiClient.put(`/recruitment/jobs/${editingId}`, values);
        message.success('岗位更新成功');
      } else {
        await apiClient.post('/recruitment/jobs', values);
        message.success('岗位发布成功');
      }
      setFormVisible(false);
      fetchJobs();
    } catch (e: unknown) {
      if ((e as Error)?.message) message.error((e as Error).message);
    } finally { setFormLoading(false); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await apiClient.put(`/recruitment/jobs/${id}`, { status });
      message.success(status === 'recruiting' ? '已恢复招聘' : status === 'paused' ? '已暂停' : '已关闭');
      fetchJobs();
    } catch (e: unknown) { message.error((e as Error)?.message || '操作失败'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/recruitment/jobs/${id}`);
      message.success('已删除');
      fetchJobs();
    } catch (e: unknown) { message.error((e as Error)?.message || '删除失败'); }
  };

  const viewDetail = async (job: Job) => {
    try {
      const res = await apiClient.get(`/recruitment/jobs/${job.id}`) as Job;
      setDetailJob(res || job);
    } catch { setDetailJob(job); }
    setDetailVisible(true);
  };

  const columns: ColumnsType<Job> = [
    { title: '岗位名称', dataIndex: 'title', key: 'title', width: 200, render: (t: string, r: Job) => <a onClick={() => viewDetail(r)}>{t}</a> },
    {
      title: '薪资', key: 'salary', width: 140,
      render: (_: unknown, r: Job) => r.salaryMin && r.salaryMax ? `${Math.round(r.salaryMin / 1000)}k-${Math.round(r.salaryMax / 1000)}k` : '-',
    },
    { title: '学历', dataIndex: 'education', key: 'education', width: 80, render: (v: string) => v || '-' },
    { title: '经验', dataIndex: 'experience', key: 'experience', width: 80, render: (v: string) => v || '-' },
    { title: '工作类型', dataIndex: 'jobType', key: 'jobType', width: 80, render: (v: string) => v || '-' },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (s: string) => <Tag color={STATUS_CONFIG[s]?.color}>{STATUS_CONFIG[s]?.label || s}</Tag>,
    },
    { title: '候选人', dataIndex: 'candidateCount', key: 'candidateCount', width: 70, align: 'center' },
    {
      title: '发布时间', dataIndex: 'createdAt', key: 'createdAt', width: 120,
      render: (v: string) => v ? dayjs(v).format('MM-DD HH:mm') : '-',
    },
    {
      title: '操作', key: 'actions', width: 220, fixed: 'right',
      render: (_: unknown, r: Job) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => viewDetail(r)}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openForm(r)}>编辑</Button>
          {r.status === 'recruiting' && (
            <Popconfirm title="确定暂停该岗位？" onConfirm={() => handleStatusChange(r.id, 'paused')}>
              <Button type="link" size="small" icon={<PauseCircleOutlined />}>暂停</Button>
            </Popconfirm>
          )}
          {r.status === 'paused' && (
            <Popconfirm title="确定恢复招聘？" onConfirm={() => handleStatusChange(r.id, 'recruiting')}>
              <Button type="link" size="small" icon={<PlayCircleOutlined />}>恢复</Button>
            </Popconfirm>
          )}
          {r.status !== 'closed' && (
            <Popconfirm title="确定关闭该岗位？" onConfirm={() => handleStatusChange(r.id, 'closed')}>
              <Button type="link" size="small" danger icon={<CheckCircleOutlined />}>关闭</Button>
            </Popconfirm>
          )}
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="职位发布"
      description="管理所有招聘岗位，一键发布到多个招聘平台"
      breadcrumb={[{ title: '首页', href: '/customer/dashboard' }, { title: '智能招聘', href: '/customer/recruitment' }, { title: '职位发布' }]}
      loading={false}
      skeletonType="table"
      extra={
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>发布新岗位</Button>
          <Button icon={<ReloadOutlined />} onClick={fetchJobs} loading={loading}>刷新</Button>
        </Space>
      }
    >
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="全部岗位" value={stats.total} valueStyle={{ color: '#6d28d9', fontSize: 22 }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="招聘中" value={stats.active} valueStyle={{ color: '#52c41a', fontSize: 22 }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="已暂停" value={stats.paused} valueStyle={{ color: '#fa8c16', fontSize: 22 }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="已关闭" value={stats.closed} valueStyle={{ color: '#8c8c8c', fontSize: 22 }} /></Card></Col>
      </Row>

      <Card
        title="岗位列表"
        style={{ borderRadius: 8 }}
        extra={
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
        }
      >
        <Table
          columns={columns}
          dataSource={jobs}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => setPagination(prev => ({ ...prev, page: p, pageSize: ps })),
          }}
          size="middle"
        />
      </Card>

      {/* 新建/编辑 Modal */}
      <Modal
        title={editingId ? '编辑岗位' : '发布新岗位'}
        open={formVisible}
        onCancel={() => setFormVisible(false)}
        onOk={handleSubmit}
        confirmLoading={formLoading}
        okText={editingId ? '保存' : '发布'}
        cancelText="取消"
        width={640}
      >
        <Form form={jobForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="岗位名称" rules={[{ required: true, message: '请输入岗位名称' }]}>
            <Input placeholder="如：高级前端工程师" maxLength={100} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="salaryMin" label="最低薪资 (元)"><InputNumber style={{ width: '100%' }} placeholder="15000" min={0} step={1000} /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="salaryMax" label="最高薪资 (元)"><InputNumber style={{ width: '100%' }} placeholder="30000" min={0} step={1000} /></Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="education" label="学历"><Select placeholder="选择" options={[
                { label: '不限', value: '不限' }, { label: '大专', value: '大专' }, { label: '本科', value: '本科' }, { label: '硕士', value: '硕士' },
              ]} /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="experience" label="经验"><Select placeholder="选择" options={[
                { label: '不限', value: '不限' }, { label: '1-3年', value: '1-3年' }, { label: '3-5年', value: '3-5年' }, { label: '5-10年', value: '5-10年' },
              ]} /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="jobType" label="工作类型"><Select placeholder="选择" options={[
                { label: '全职', value: '全职' }, { label: '兼职', value: '兼职' }, { label: '实习', value: '实习' }, { label: '远程', value: '远程' },
              ]} /></Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="岗位描述"><TextArea rows={4} placeholder="岗位职责及工作内容" maxLength={2000} showCount /></Form.Item>
          <Form.Item name="requirements" label="任职要求"><TextArea rows={3} placeholder="技能要求、工作经验等" maxLength={2000} showCount /></Form.Item>
          <Form.Item name="benefits" label="福利待遇"><TextArea rows={2} placeholder="五险一金、年终奖等" maxLength={500} /></Form.Item>
        </Form>
      </Modal>

      {/* 详情 Modal */}
      <Modal title="岗位详情" open={detailVisible} onCancel={() => setDetailVisible(false)} footer={null} width={600}>
        {detailJob && (
          <div style={{ padding: 8 }}>
            <p><strong>岗位名称：</strong>{detailJob.title}</p>
            <p><strong>薪资范围：</strong>{detailJob.salaryMin && detailJob.salaryMax ? `${Math.round(detailJob.salaryMin / 1000)}k-${Math.round(detailJob.salaryMax / 1000)}k` : '面议'}</p>
            <p><strong>学历要求：</strong>{detailJob.education || '不限'}</p>
            <p><strong>经验要求：</strong>{detailJob.experience || '不限'}</p>
            <p><strong>工作类型：</strong>{detailJob.jobType || '全职'}</p>
            <p><strong>候选人：</strong>{detailJob.candidateCount} 人</p>
            <p><strong>状态：</strong><Tag color={STATUS_CONFIG[detailJob.status]?.color}>{STATUS_CONFIG[detailJob.status]?.label}</Tag></p>
            {detailJob.description && <><p><strong>岗位描述：</strong></p><p style={{ whiteSpace: 'pre-wrap', color: '#666' }}>{detailJob.description}</p></>}
            {detailJob.requirements && <><p><strong>任职要求：</strong></p><p style={{ whiteSpace: 'pre-wrap', color: '#666' }}>{detailJob.requirements}</p></>}
            {detailJob.benefits && <><p><strong>福利待遇：</strong></p><p style={{ whiteSpace: 'pre-wrap', color: '#666' }}>{detailJob.benefits}</p></>}
            <p><strong>发布时间：</strong>{detailJob.createdAt ? dayjs(detailJob.createdAt).format('YYYY-MM-DD HH:mm') : '-'}</p>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
