'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Input,
  Select,
  Modal,
  Form,
  message,
  Row,
  Col,
  Statistic,
  Drawer,
  Descriptions,
  Spin,
  Empty,
  Typography,
  Tabs,
  Cascader,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  ContactsOutlined,
  DollarOutlined,
  UserOutlined,
  BarChartOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { regionOptions, joinRegion } from '@/lib/china-regions';

const { Title, Text } = Typography;
const { Option } = Select;

const LEVELS_REQUIRING_REGION = ['province', 'city', 'district'];

interface Agent {
  id: string;
  userId: string;
  name: string;
  level: string;
  status: string;
  region?: string;
  commissionRate?: number;
  totalCustomers?: number;
  totalCommission?: number;
  createdAt: string;
  user?: {
    phone: string;
    name: string;
    createdAt: string;
  };
  _count?: { agentRelations: number };
  agentRelations?: Array<{
    user: { id: string; name: string; phone: string; createdAt: string };
  }>;
}

interface AgentStats {
  total: number;
  active: number;
  totalCustomers: number;
  totalCommission: number;
}

const LEVEL_LABELS: Record<string, { label: string; color: string }> = {
  national: { label: '全国代理', color: 'purple' },
  province: { label: '省级代理', color: 'blue' },
  city: { label: '市级代理', color: 'cyan' },
  district: { label: '区级代理', color: 'green' },
  personal: { label: '个人代理', color: 'default' },
};

const STATUS_LABELS: Record<string, { color: string; text: string }> = {
  active: { color: 'green', text: '正常' },
  frozen: { color: 'red', text: '冻结' },
  disabled: { color: 'red', text: '禁用' },
};

export default function AdminAgentsPage() {
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [stats, setStats] = useState<AgentStats>({ total: 0, active: 0, totalCustomers: 0, totalCommission: 0 });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  const [createVisible, setCreateVisible] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm] = Form.useForm();
  const selectedLevel = Form.useWatch('level', createForm);

  const [detailVisible, setDetailVisible] = useState(false);
  const [detailAgent, setDetailAgent] = useState<Agent | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 拉取列表
  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const request = (await import('@/lib/request')).default;
      const params = new URLSearchParams();
      if (searchText) params.set('keyword', searchText);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (levelFilter !== 'all') params.set('level', levelFilter);
      params.set('pageSize', '50');

      const res = (await request.get<{ data: Agent[]; pagination: { total: number } }>(
        `/admin/agents?${params.toString()}`
      )) as unknown as { data: Agent[]; pagination: { total: number } };

      if (res && Array.isArray(res.data)) {
        setAgents(res.data);
        // 计算名下客户总数
        const totalCustomers = res.data.reduce((sum: number, a: Agent) => sum + (a.totalCustomers || 0), 0);
        setStats(prev => ({ ...prev, totalCustomers }));
      } else {
        setAgents([]);
      }
    } catch (err) {
      console.error('获取代理商列表失败', err);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, [searchText, statusFilter, levelFilter]);

  // 拉取统计
  const fetchStats = useCallback(async () => {
    try {
      const request = (await import('@/lib/request')).default;
      const res = (await request.get<{ success: boolean; data: { totalAgents: number; activeAgents: number } }>(
        '/admin/dashboard'
      )) as unknown as { success: boolean; data: { totalAgents: number; activeAgents: number } };
      if (res.success && res.data) {
        setStats(prev => ({
          total: res.data.totalAgents || 0,
          active: res.data.activeAgents || 0,
          totalCustomers: prev.totalCustomers,
          totalCommission: prev.totalCommission,
        }));
      }
    } catch (err) {
      console.error('获取统计失败', err);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
    fetchStats();
  }, [fetchAgents, fetchStats]);

  // 打开详情
  const handleOpenDetail = async (agent: Agent) => {
    setDetailAgent(agent);
    setDetailVisible(true);
    setDetailLoading(true);
    try {
      const request = (await import('@/lib/request')).default;
      const res = (await request.get<{ data: Agent }>(`/admin/agents/${agent.id}`)) as unknown as { data: Agent };
      if (res?.data) {
        setDetailAgent(res.data);
      }
    } catch (err) {
      console.error('获取代理商详情失败', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // 切换状态
  const handleToggleStatus = async (agent: Agent) => {
    try {
      const request = (await import('@/lib/request')).default;
      const nextStatus = agent.status === 'active' ? 'frozen' : 'active';
      const res = (await request.patch<{ error?: string }>(
        `/admin/agents/${agent.id}/status`,
        { status: nextStatus }
      )) as unknown as { error?: string };
      if (!res?.error) {
        message.success(`${agent.name} 已${nextStatus === 'active' ? '解冻' : '冻结'}`);
        fetchAgents();
        fetchStats();
      } else {
        message.error(res.error || '操作失败');
      }
    } catch (err: any) {
      message.error(err?.response?.data?.error || '操作失败');
    }
  };

  // 创建代理商
  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      setCreateLoading(true);

      // 将级联选择值转换为区域路径字符串
      const payload = {
        ...values,
        region: Array.isArray(values.region) ? joinRegion(values.region) : values.region,
      };

      const request = (await import('@/lib/request')).default;
      const res = (await request.post<{ error?: string }>(
        '/admin/agents',
        payload
      )) as unknown as { error?: string };
      if (!res?.error) {
        message.success(`已成功创建代理商：${values.name}，初始密码：123456`);
        setCreateVisible(false);
        createForm.resetFields();
        fetchAgents();
        fetchStats();
      } else {
        message.error(res.error || '创建失败');
      }
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.error || '创建失败');
    } finally {
      setCreateLoading(false);
    }
  };

  const columns: ColumnsType<Agent> = [
    {
      title: '代理商',
      key: 'user',
      width: 200,
      render: (_, r) => (
        <Space>
          <ContactsOutlined style={{ color: '#6d28d9' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{r.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {r.user?.phone || '-'}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: l => {
        const meta = LEVEL_LABELS[l] || { label: l, color: 'default' };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: s => {
        const meta = STATUS_LABELS[s] || { color: 'default', text: s };
        return <Tag color={meta.color}>{meta.text}</Tag>;
      },
    },
    {
      title: '区域',
      dataIndex: 'region',
      key: 'region',
      width: 100,
      render: v => v || <Text type="secondary">-</Text>,
    },
    {
      title: '分成比例',
      dataIndex: 'commissionRate',
      key: 'commissionRate',
      width: 100,
      render: v => v !== undefined ? `${(v * 100).toFixed(0)}%` : '-',
    },
    {
      title: '名下客户',
      key: 'customers',
      width: 100,
      render: (_, r) => (
        <Text strong style={{ color: '#6d28d9' }}>
          {r._count?.agentRelations || 0}
        </Text>
      ),
    },
    {
      title: '加入时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: v => v ? new Date(v).toLocaleDateString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, r) => (
        <Space size={4} wrap>
          <Button type="link" size="small" onClick={() => handleOpenDetail(r)}>
            详情
          </Button>
          <Button
            type="link"
            size="small"
            danger={r.status === 'active'}
            onClick={() => handleToggleStatus(r)}
          >
            {r.status === 'active' ? '冻结' : '解冻'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0 }}>代理商管理</Title>
          <Text type="secondary">统一管理所有代理商账号、业绩与名下客户</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchAgents(); fetchStats(); }}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateVisible(true)}>
            新增代理商
          </Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="代理商总数"
              value={stats.total}
              prefix={<ContactsOutlined style={{ color: '#6d28d9' }} />}
              valueStyle={{ color: '#6d28d9' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic title="正常" value={stats.active} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="名下客户总数"
              value={stats.totalCustomers}
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="累计佣金"
              value={stats.totalCommission}
              prefix={<DollarOutlined style={{ color: '#fa8c16' }} />}
              precision={2}
              suffix="元"
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input
              placeholder="搜索名称或手机号"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onPressEnter={fetchAgents}
              style={{ width: 220 }}
              allowClear
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            />
            <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }}>
              <Option value="all">全部状态</Option>
              <Option value="active">正常</Option>
              <Option value="frozen">已冻结</Option>
            </Select>
            <Select value={levelFilter} onChange={setLevelFilter} style={{ width: 130 }}>
              <Option value="all">全部级别</Option>
              <Option value="national">全国代理</Option>
              <Option value="province">省级</Option>
              <Option value="city">市级</Option>
              <Option value="district">区级</Option>
              <Option value="personal">个人</Option>
            </Select>
            <Button type="primary" onClick={fetchAgents}>查询</Button>
          </Space>
        </div>

        <Spin spinning={loading}>
          {agents.length > 0 ? (
            <Table
              columns={columns}
              dataSource={agents}
              rowKey="id"
              pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条` }}
            />
          ) : (
            <Empty description="暂无代理商" />
          )}
        </Spin>
      </Card>

      {/* 新增代理商 */}
      <Modal
        title="新增代理商"
        open={createVisible}
        onOk={handleCreate}
        onCancel={() => { setCreateVisible(false); createForm.resetFields(); }}
        confirmLoading={createLoading}
        okText="创建"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="代理商名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="如：上海腾盛科技" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="手机号（登录账号）"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
            ]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item
            name="password"
            label="初始密码"
            initialValue="123456"
            rules={[{ required: true, min: 6, message: '至少 6 位' }]}
          >
            <Input.Password placeholder="默认 123456" />
          </Form.Item>
          <Form.Item
            name="level"
            label="代理级别"
            initialValue="district"
            rules={[{ required: true, message: '请选择级别' }]}
          >
            <Select onChange={() => createForm.setFieldsValue({ region: undefined })}>
              <Option value="national">全国代理</Option>
              <Option value="province">省级代理</Option>
              <Option value="city">市级代理</Option>
              <Option value="district">区级代理</Option>
              <Option value="personal">个人代理</Option>
            </Select>
          </Form.Item>
          {selectedLevel && LEVELS_REQUIRING_REGION.includes(selectedLevel) && (
            <Form.Item
              name="region"
              label="代理区域"
              rules={[{ required: true, message: '请选择代理区域' }]}
            >
              <Cascader
                options={regionOptions}
                changeOnSelect
                placeholder={
                  selectedLevel === 'province'
                    ? '请选择省份'
                    : selectedLevel === 'city'
                    ? '请选择省市'
                    : '请选择省市区'
                }
                style={{ width: '100%' }}
              />
            </Form.Item>
          )}
          <Form.Item
            name="commissionRate"
            label="分成比例（0-1）"
            initialValue={0.3}
            rules={[{ required: true, message: '请输入分成比例' }]}
          >
            <Input type="number" step={0.05} min={0} max={1} placeholder="如：0.3 表示 30%" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情 Drawer：合并代理商业绩 */}
      <Drawer
        title={detailAgent ? `代理商详情：${detailAgent.name}` : '代理商详情'}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        width={640}
      >
        {detailAgent && (
          <Spin spinning={detailLoading}>
            <Tabs
              defaultActiveKey="info"
              items={[
                {
                  key: 'info',
                  label: '基本信息',
                  children: (
                    <Descriptions column={1} bordered size="small">
                      <Descriptions.Item label="代理商名称">{detailAgent.name}</Descriptions.Item>
                      <Descriptions.Item label="手机号">{detailAgent.user?.phone || '-'}</Descriptions.Item>
                      <Descriptions.Item label="级别">
                        <Tag color={LEVEL_LABELS[detailAgent.level]?.color || 'default'}>
                          {LEVEL_LABELS[detailAgent.level]?.label || detailAgent.level}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="状态">
                        <Tag color={STATUS_LABELS[detailAgent.status]?.color || 'default'}>
                          {STATUS_LABELS[detailAgent.status]?.text || detailAgent.status}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="区域">{detailAgent.region || '-'}</Descriptions.Item>
                      <Descriptions.Item label="分成比例">
                        {detailAgent.commissionRate !== undefined
                          ? `${(detailAgent.commissionRate * 100).toFixed(0)}%`
                          : '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="加入时间">
                        {detailAgent.createdAt
                          ? new Date(detailAgent.createdAt).toLocaleString('zh-CN')
                          : '-'}
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: 'performance',
                  label: <><BarChartOutlined /> 业绩</>,
                  children: (
                    <Row gutter={16}>
                      <Col span={12}>
                        <Card>
                          <Statistic
                            title="名下客户数"
                            value={detailAgent._count?.agentRelations || 0}
                            prefix={<TeamOutlined />}
                            valueStyle={{ color: '#6d28d9' }}
                          />
                        </Card>
                      </Col>
                      <Col span={12}>
                        <Card>
                          <Statistic
                            title="累计佣金"
                            value={detailAgent.totalCommission || 0}
                            prefix={<DollarOutlined />}
                            precision={2}
                            suffix="元"
                          />
                        </Card>
                      </Col>
                    </Row>
                  ),
                },
                {
                  key: 'customers',
                  label: <><UserOutlined /> 名下客户</>,
                  children: (
                    detailAgent.agentRelations && detailAgent.agentRelations.length > 0 ? (
                      <Table
                        size="small"
                        rowKey={(r: any) => r.user.id}
                        dataSource={detailAgent.agentRelations}
                        pagination={{ pageSize: 10 }}
                        columns={[
                          { title: '客户姓名', dataIndex: ['user', 'name'], key: 'name' },
                          { title: '手机号', dataIndex: ['user', 'phone'], key: 'phone' },
                          {
                            title: '开通时间',
                            dataIndex: ['user', 'createdAt'],
                            key: 'createdAt',
                            render: v => v ? new Date(v).toLocaleDateString('zh-CN') : '-',
                          },
                        ]}
                      />
                    ) : (
                      <Empty description="暂无客户" />
                    )
                  ),
                },
              ]}
            />
          </Spin>
        )}
      </Drawer>
    </div>
  );
}
