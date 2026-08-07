'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Tag, Space, Typography, Modal, Form, Input, Select, Switch, InputNumber, Popconfirm, message, Row, Col, Statistic, Badge,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, SearchOutlined, RobotOutlined,
  PlayCircleOutlined, PauseCircleOutlined, ThunderboltOutlined, SettingOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '@/lib/api';
import PageContainer from '@/components/customer/PageContainer';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface SearchConfig {
  id: string;
  postId?: string;
  platform?: string;
  keywords?: string;
  location?: string;
  experienceMin?: number;
  experienceMax?: number;
  education?: string;
  salaryMin?: number;
  salaryMax?: number;
  skills?: string;
  autoContact: boolean;
  contactTemplate?: string;
  status: string;
  lastSearchedAt?: string;
  createdAt: string;
}

interface Job {
  id: string;
  title: string;
}

interface SearchResult {
  candidates: unknown[];
  count: number;
  configId: string;
  timestamp: string;
}

const PLATFORM_OPTIONS = [
  { label: 'BOSS直聘', value: 'boss' },
  { label: '智联招聘', value: 'zhilian' },
  { label: '前程无忧', value: '51job' },
  { label: '猎聘', value: 'liepin' },
  { label: '拉勾', value: 'lagou' },
];

export default function AutoRecruitmentPage() {
  const [configs, setConfigs] = useState<SearchConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);

  // 新建/编辑表单
  const [formVisible, setFormVisible] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [configForm] = Form.useForm();

  // 搜索结果
  const [resultVisible, setResultVisible] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const [stats, setStats] = useState({ active: 0, totalSearched: 0, autoContact: 0 });

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/recruitment/search-config') as { configs: SearchConfig[] };
      const list = res.configs || [];
      setConfigs(list);
      setStats({
        active: list.filter(c => c.status === 'active').length,
        totalSearched: list.filter(c => c.lastSearchedAt).length,
        autoContact: list.filter(c => c.autoContact).length,
      });
    } catch { setConfigs([]); } finally { setLoading(false); }
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await apiClient.get('/recruitment/jobs', { params: { pageSize: 200 } }) as { jobs: Job[] };
      setJobs(res.jobs || []);
    } catch { setJobs([]); }
  }, []);

  useEffect(() => { fetchConfigs(); fetchJobs(); }, [fetchConfigs, fetchJobs]);

  const openForm = (config?: SearchConfig) => {
    if (config) {
      setEditingId(config.id);
      configForm.setFieldsValue(config);
    } else {
      setEditingId(null);
      configForm.resetFields();
    }
    setFormVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await configForm.validateFields();
      setFormLoading(true);
      if (editingId) {
        await apiClient.put(`/recruitment/search-config/${editingId}`, values);
        message.success('配置更新成功');
      } else {
        await apiClient.post('/recruitment/search-config', values);
        message.success('搜索配置创建成功');
      }
      setFormVisible(false);
      fetchConfigs();
    } catch (e: unknown) {
      if ((e as Error)?.message) message.error((e as Error).message);
    } finally { setFormLoading(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/recruitment/search-config/${id}`);
      message.success('已删除');
      fetchConfigs();
    } catch (e: unknown) { message.error((e as Error)?.message || '删除失败'); }
  };

  const handleRunSearch = async (config: SearchConfig) => {
    setSearchLoading(true);
    try {
      const res = await apiClient.post(`/recruitment/search-config/${config.id}/run`) as { success: boolean; data: SearchResult };
      setSearchResult({ ...res.data, timestamp: new Date().toISOString() });
      setResultVisible(true);
      message.success(`搜索完成，找到 ${res.data?.count || 0} 个候选人`);
      fetchConfigs();
    } catch (e: unknown) {
      message.error((e as Error)?.message || '搜索失败');
    } finally { setSearchLoading(false); }
  };

  const handleToggleAuto = async (config: SearchConfig) => {
    try {
      const newAutoContact = !config.autoContact;
      await apiClient.put(`/recruitment/search-config/${config.id}`, { autoContact: newAutoContact });
      message.success(newAutoContact ? '已开启自动沟通' : '已关闭自动沟通');
      fetchConfigs();
    } catch (e: unknown) { message.error((e as Error)?.message || '操作失败'); }
  };

  const columns: ColumnsType<SearchConfig> = [
    {
      title: '搜索配置', key: 'config', width: 200,
      render: (_: unknown, r: SearchConfig) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.keywords || '未设置关键词'}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{r.location || '全国'} · {PLATFORM_OPTIONS.find(o => o.value === r.platform)?.label || r.platform || '全部平台'}</div>
        </div>
      ),
    },
    {
      title: '教育/经验', key: 'requirements', width: 140,
      render: (_: unknown, r: SearchConfig) => `${r.education || '不限'} / ${r.experienceMin || 0}-${r.experienceMax || 99}年`,
    },
    {
      title: '自动沟通', dataIndex: 'autoContact', key: 'autoContact', width: 100,
      render: (v: boolean) => v ? <Tag color="green">已开启</Tag> : <Tag color="default">关闭</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (s: string) => s === 'active' ? <Badge status="success" text="启用" /> : <Badge status="default" text="停用" />,
    },
    {
      title: '上次搜索', dataIndex: 'lastSearchedAt', key: 'lastSearchedAt', width: 140,
      render: (v: string) => v ? dayjs(v).format('MM-DD HH:mm') : '未搜索',
    },
    {
      title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 120,
      render: (v: string) => dayjs(v).format('MM-DD'),
    },
    {
      title: '操作', key: 'actions', width: 240, fixed: 'right',
      render: (_: unknown, r: SearchConfig) => (
        <Space size="small">
          <Button type="link" size="small" icon={<SearchOutlined />} loading={searchLoading} onClick={() => handleRunSearch(r)}>搜索</Button>
          <Button type="link" size="small" icon={<SettingOutlined />} onClick={() => handleToggleAuto(r)}>
            {r.autoContact ? '关闭沟通' : '开启沟通'}
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openForm(r)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="自动招聘"
      description="设置 AI 自动搜索条件，系统自动匹配候选人和发送沟通消息"
      breadcrumb={[{ title: '首页', href: '/customer/dashboard' }, { title: '智能招聘', href: '/customer/recruitment' }, { title: '自动招聘' }]}
      loading={false}
      skeletonType="table"
      extra={
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>新建搜索配置</Button>
          <Button icon={<ReloadOutlined />} onClick={fetchConfigs} loading={loading}>刷新</Button>
        </Space>
      }
    >
      {/* 摘要 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={8}><Card size="small"><Statistic title="搜索配置" value={stats.active} suffix={`/ ${configs.length}`} prefix={<SettingOutlined />} valueStyle={{ color: '#1677ff' }} /></Card></Col>
        <Col xs={8}><Card size="small"><Statistic title="已执行搜索" value={stats.totalSearched} prefix={<SearchOutlined />} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={8}><Card size="small"><Statistic title="自动沟通中" value={stats.autoContact} prefix={<RobotOutlined />} valueStyle={{ color: '#722ed1' }} /></Card></Col>
      </Row>

      <Card
        title="搜索配置列表"
        style={{ borderRadius: 8 }}
        extra={<Text type="secondary">配置 AI 自动搜索条件，一键批量匹配候选人</Text>}
      >
        <Table
          columns={columns}
          dataSource={configs}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
          size="middle"
        />
      </Card>

      {/* 新建/编辑 Modal */}
      <Modal
        title={editingId ? '编辑搜索配置' : '新建搜索配置'}
        open={formVisible}
        onCancel={() => setFormVisible(false)}
        onOk={handleSubmit}
        confirmLoading={formLoading}
        okText={editingId ? '保存' : '创建'}
        cancelText="取消"
        width={640}
      >
        <Form form={configForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="platform" label="搜索平台"><Select placeholder="选择平台" options={PLATFORM_OPTIONS} /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="postId" label="关联岗位"><Select placeholder="选择岗位" allowClear options={jobs.map(j => ({ label: j.title, value: j.id }))} /></Form.Item>
            </Col>
          </Row>
          <Form.Item name="keywords" label="搜索关键词" rules={[{ required: true, message: '请输入关键词' }]}>
            <Input placeholder="如：前端开发 React TypeScript" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="location" label="地区"><Input placeholder="如：北京、上海" /></Form.Item></Col>
            <Col span={12}>
              <Form.Item name="education" label="学历"><Select placeholder="选择" allowClear options={[
                { label: '不限', value: '不限' }, { label: '大专', value: '大专' }, { label: '本科', value: '本科' }, { label: '硕士', value: '硕士' },
              ]} /></Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="experienceMin" label="最低年限"><InputNumber style={{ width: '100%' }} min={0} placeholder="0" /></Form.Item></Col>
            <Col span={8}><Form.Item name="experienceMax" label="最高年限"><InputNumber style={{ width: '100%' }} min={0} placeholder="99" /></Form.Item></Col>
            <Col span={8}><Form.Item name="salaryMin" label="最低薪资 (K)"><InputNumber style={{ width: '100%' }} min={0} placeholder="不限" /></Form.Item></Col>
          </Row>
          <Form.Item name="skills" label="技能标签"><Input placeholder="逗号分隔，如：React,Node.js,Python" /></Form.Item>
          <Form.Item name="autoContact" label="自动发送沟通" valuePropName="checked">
            <Switch checkedChildren="开" unCheckedChildren="关" />
          </Form.Item>
          <Form.Item name="contactTemplate" label="沟通模板">
            <TextArea rows={3} placeholder="您好，我是XX公司的招聘负责人，看到您的简历非常匹配我们的岗位需求，方便聊聊吗？" maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 搜索结果 Modal */}
      <Modal
        title={`搜索结果 - 找到 ${searchResult?.count || 0} 个候选人`}
        open={resultVisible}
        onCancel={() => setResultVisible(false)}
        footer={null}
        width={700}
      >
        {searchResult && searchResult.candidates.length > 0 ? (
          <div>
            {searchResult.candidates.map((c: unknown, i: number) => {
              const candidate = c as Record<string, unknown>;
              return (
                <Card key={i} size="small" style={{ marginBottom: 8, borderRadius: 6 }}>
                  <Text strong>{String(candidate.name || '未知')}</Text>
                  <Text type="secondary" style={{ marginLeft: 12 }}>{String(candidate.experience || '')}</Text>
                </Card>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无搜索结果</div>
        )}
      </Modal>
    </PageContainer>
  );
}
