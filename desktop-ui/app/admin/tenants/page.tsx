'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Input,
  Select,
  Modal,
  Form,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Popconfirm,
  Typography,
  Badge,
  Spin,
  Empty,
  Drawer,
  Switch,
  Descriptions,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  LockOutlined,
  UnlockOutlined,
  ReloadOutlined,
  PlusOutlined,
  TeamOutlined,
  UserOutlined,
  PhoneOutlined,
  SettingOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Option } = Select;

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: 'active' | 'disabled' | 'banned';
  agentId?: string;
  agentName?: string;
  createdAt: string;
  features?: Record<string, boolean>;
}

interface CustomerStatistics {
  total: number;
  active: number;
  disabled: number;
  newThisMonth: number;
}

// 功能开关类型（与 FeatureSwitch DB 表对应）
interface CustomerFeature {
  id: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  enabled: boolean;
}

const TAG_COLORS = [
  'cyan', 'purple', 'orange', 'green', 'magenta', 'blue', 'volcano', 'gold',
  'red', 'lime', 'geekblue', 'processing', 'success', 'warning', 'error',
] as const;

export default function AdminCustomersPage() {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [statistics, setStatistics] = useState<CustomerStatistics>({
    total: 0, active: 0, disabled: 0, newThisMonth: 0,
  });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [createVisible, setCreateVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [createForm] = Form.useForm();
  const [agents, setAgents] = useState<Array<{ id: string; name: string }>>([]);
  // 功能开关：从 FeatureSwitch DB 动态获取，每客户粒度控制
  const [customerFeatures, setCustomerFeatures] = useState<CustomerFeature[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [featureDefMap, setFeatureDefMap] = useState<Map<string, { name: string; color: string }>>(new Map());

  // 拉取客户列表
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const request = (await import('@/lib/request')).default;
      const params = new URLSearchParams();
      if (searchText) params.set('keyword', searchText);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      params.set('pageSize', '50');
      const res = (await request.get<{ success: boolean; data: { list: Customer[]; total: number } }>(
        `/admin/customers?${params.toString()}`
      )) as unknown as { success: boolean; data: { list: Customer[]; total: number } };
      if (res.success) {
        setCustomers(res.data?.list || []);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.error('获取客户列表失败', err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [searchText, statusFilter]);

  // 拉取统计
  const fetchStatistics = useCallback(async () => {
    try {
      const request = (await import('@/lib/request')).default;
      const res = (await request.get<{ success: boolean; data: { totalCustomers: number; activeCustomers: number; disabledCustomers: number; newCustomersThisMonth: number } }>(
        '/admin/dashboard'
      )) as unknown as { success: boolean; data: { totalCustomers: number; activeCustomers: number; disabledCustomers: number; newCustomersThisMonth: number } };
      if (res.success && res.data) {
        setStatistics({
          total: res.data.totalCustomers || 0,
          active: res.data.activeCustomers || 0,
          disabled: res.data.disabledCustomers || 0,
          newThisMonth: res.data.newCustomersThisMonth || 0,
        });
      }
    } catch (err) {
      console.error('获取统计失败', err);
    }
  }, []);

  // 拉取代理商列表（开通时选择）
  const fetchAgents = useCallback(async () => {
    try {
      const request = (await import('@/lib/request')).default;
      const res = (await request.get<{ success: boolean; data: { list: any[] } }>(
        '/admin/agents?pageSize=100'
      )) as unknown as { success: boolean; data: { list: any[] } };
      if (res.success) {
        setAgents((res.data?.list || []).map((a: any) => ({
          id: a.id,
          name: a.name || a.phone || a.id,
        })));
      }
    } catch (err) {
      console.error('获取代理商列表失败', err);
    }
  }, []);

  // 获取功能开关定义（用于表格列渲染功能名称/颜色）
  const fetchFeatureDefs = useCallback(async () => {
    try {
      const request = (await import('@/lib/request')).default;
      const res = (await request.get<{ success: boolean; data: CustomerFeature[] }>(
        '/admin/features'
      )) as unknown as { success: boolean; data: CustomerFeature[] };
      if (res.success) {
        const map = new Map<string, { name: string; color: string }>();
        (res.data || []).forEach((f, i) => {
          map.set(f.code, { name: f.name, color: TAG_COLORS[i % TAG_COLORS.length] });
        });
        setFeatureDefMap(map);
      }
    } catch (err) {
      console.error('获取功能开关定义失败', err);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
    fetchStatistics();
    fetchAgents();
    fetchFeatureDefs();
  }, [fetchCustomers, fetchStatistics, fetchAgents, fetchFeatureDefs]);

  // 切换状态
  const handleToggleStatus = async (customer: Customer) => {
    try {
      const request = (await import('@/lib/request')).default;
      const nextStatus = customer.status === 'active' ? 'disabled' : 'active';
      const res = (await request.patch<{ success: boolean; message?: string }>(
        `/admin/customers/${customer.id}/status`,
        { status: nextStatus }
      )) as unknown as { success: boolean; message?: string };
      if (res.success) {
        message.success(`${customer.name} 已${nextStatus === 'active' ? '解冻' : '冻结'}`);
        fetchCustomers();
        fetchStatistics();
      } else {
        message.error(res.message || '操作失败');
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || '操作失败');
    }
  };

  // 重置密码
  const handleResetPassword = async (customer: Customer) => {
    try {
      const request = (await import('@/lib/request')).default;
      const res = (await request.post<{ success: boolean; data?: { newPassword?: string }; message?: string }>(
        `/admin/customers/${customer.id}/reset-password`
      )) as unknown as { success: boolean; data?: { newPassword?: string }; message?: string };
      if (res.success) {
        const pwd = res.data?.newPassword || '123456';
        Modal.info({
          title: '密码重置成功',
          content: (
            <div>
              <p>客户 <strong>{customer.name}</strong> 的密码已重置为：</p>
              <p style={{ fontSize: 18, color: '#6d28d9', fontWeight: 600 }}>{pwd}</p>
              <p style={{ color: '#8c8c8c' }}>请告知客户尽快登录并修改密码。</p>
            </div>
          ),
        });
      } else {
        message.error(res.message || '重置失败');
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || '重置失败');
    }
  };

  // 开通客户
  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      setCreateLoading(true);
      const request = (await import('@/lib/request')).default;
      const res = (await request.post<{ success: boolean; message?: string }>(
        '/admin/customers',
        values
      )) as unknown as { success: boolean; message?: string };
      if (res.success) {
        message.success(`已成功开通客户：${values.name}，初始密码：123456`);
        setCreateVisible(false);
        createForm.resetFields();
        fetchCustomers();
        fetchStatistics();
      } else {
        message.error(res.message || '开通失败');
      }
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.message || '开通失败');
    } finally {
      setCreateLoading(false);
    }
  };

  // 打开详情（含动态获取功能开关）
  const handleOpenDetail = async (customer: Customer) => {
    setDetailCustomer(customer);
    setDetailVisible(true);
    setFeaturesLoading(true);
    try {
      const request = (await import('@/lib/request')).default;
      const res = (await request.get<{ success: boolean; data: CustomerFeature[] }>(
        `/admin/customers/${customer.id}/features`
      )) as unknown as { success: boolean; data: CustomerFeature[] };
      if (res.success) {
        setCustomerFeatures(res.data || []);
      } else {
        setCustomerFeatures([]);
      }
    } catch (err) {
      console.error('获取客户功能开关失败', err);
      setCustomerFeatures([]);
    } finally {
      setFeaturesLoading(false);
    }
  };

  // 切换功能开关
  const handleFeatureToggle = (feature: CustomerFeature, enabled: boolean) => {
    setCustomerFeatures(prev =>
      prev.map(f => {
        if (f.code === feature.code) {
          return { ...f, enabled };
        }
        return f;
      })
    );
  };

  // 保存功能开关（按每客户粒度）
  const handleSaveFeatures = async () => {
    if (!detailCustomer) return;
    try {
      const request = (await import('@/lib/request')).default;
      const features = customerFeatures.map(f => ({ code: f.code, enabled: f.enabled }));
      const res = (await request.put<{ success: boolean; message?: string }>(
        `/admin/customers/${detailCustomer.id}/features`,
        { features }
      )) as unknown as { success: boolean; message?: string };
      if (res.success) {
        message.success('功能权限已更新');
        setDetailVisible(false);
        fetchCustomers();
      } else {
        message.error(res.message || '更新失败');
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || '更新失败');
    }
  };

  const columns: ColumnsType<Customer> = [
    {
      title: '客户',
      key: 'user',
      width: 140,
      render: (_, r) => (
        <Space>
          <UserOutlined style={{ color: '#52c41a' }} />
          <Text strong>{r.name}</Text>
        </Space>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: '所属代理商',
      dataIndex: 'agentName',
      key: 'agentName',
      width: 120,
      render: v => v || <Text type="secondary">-</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: status => (
        <Badge
          status={status === 'active' ? 'success' : 'error'}
          text={status === 'active' ? '正常' : status === 'banned' ? '封禁' : '已冻结'}
        />
      ),
    },
    {
      title: '已开通功能',
      key: 'features',
      width: 220,
      render: (_, r) => {
        const features = r.features || {};
        const enabledEntries = Object.entries(features)
          .filter(([, v]) => v !== false)
          .map(([code]) => {
            const def = featureDefMap.get(code);
            return def ? { code, label: def.name, color: def.color } : null;
          })
          .filter(Boolean) as { code: string; label: string; color: string }[];
        if (enabledEntries.length === 0) return <Text type="secondary">-</Text>;
        return (
          <Space size={2} wrap>
            {enabledEntries.slice(0, 3).map(f => (
              <Tag key={f.code} color={f.color}>{f.label}</Tag>
            ))}
            {enabledEntries.length > 3 && <Tag>+{enabledEntries.length - 3}</Tag>}
          </Space>
        );
      },
    },
    {
      title: '开通时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: v => v ? new Date(v).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
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
          <Popconfirm
            title={`重置 ${r.name} 的密码？`}
            description="重置后初始密码为 123456"
            onConfirm={() => handleResetPassword(r)}
          >
            <Button type="link" size="small" icon={<KeyOutlined />}>
              重置密码
            </Button>
          </Popconfirm>
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
          <Title level={3} style={{ margin: 0 }}>客户管理</Title>
          <Text type="secondary">统一管理所有客户：开通账号、设置功能、冻结/解冻、重置密码</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchCustomers(); fetchStatistics(); }}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateVisible(true)}>
            开通客户
          </Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="客户总数"
              value={statistics.total}
              prefix={<TeamOutlined style={{ color: '#6d28d9' }} />}
              valueStyle={{ color: '#6d28d9' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic title="正常" value={statistics.active} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic title="已冻结" value={statistics.disabled} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="本月新增"
              value={statistics.newThisMonth}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input
              placeholder="搜索姓名或手机号"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onPressEnter={fetchCustomers}
              style={{ width: 220 }}
              allowClear
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
            >
              <Option value="all">全部状态</Option>
              <Option value="active">正常</Option>
              <Option value="disabled">已冻结</Option>
            </Select>
            <Button type="primary" onClick={fetchCustomers}>查询</Button>
          </Space>
        </div>

        <Spin spinning={loading}>
          {customers.length > 0 ? (
            <Table
              columns={columns}
              dataSource={customers}
              rowKey="id"
              pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条` }}
            />
          ) : (
            <Empty description="暂无客户" />
          )}
        </Spin>
      </Card>

      {/* 开通客户弹窗 */}
      <Modal
        title="开通客户"
        open={createVisible}
        onOk={handleCreate}
        onCancel={() => { setCreateVisible(false); createForm.resetFields(); }}
        confirmLoading={createLoading}
        okText="开通"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="客户姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入客户姓名" />
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
            name="agentId"
            label="所属代理商"
          >
            <Select placeholder="不选则直属总后台" allowClear>
              {agents.map(a => (
                <Option key={a.id} value={a.id}>{a.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="openingFee"
            label="开通费用（元）"
            initialValue={0}
            rules={[
              {
                validator(_, value) {
                  if (value === undefined || value === null || value === '') {
                    return Promise.resolve();
                  }
                  const num = parseFloat(value);
                  if (Number.isNaN(num) || num < 0) {
                    return Promise.reject(new Error('请输入非负数'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input type="number" min={0} step={0.01} placeholder="请输入开通费用，0 表示免费" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情 Drawer：含功能开关 */}
      <Drawer
        title={detailCustomer ? `客户详情：${detailCustomer.name}` : '客户详情'}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        width={560}
        extra={
          <Space>
            <Button onClick={() => setDetailVisible(false)}>取消</Button>
            <Button type="primary" onClick={handleSaveFeatures}>保存功能配置</Button>
          </Space>
        }
      >
        {detailCustomer && (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="客户姓名">{detailCustomer.name}</Descriptions.Item>
              <Descriptions.Item label="手机号">{detailCustomer.phone}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Badge
                  status={detailCustomer.status === 'active' ? 'success' : 'error'}
                  text={detailCustomer.status === 'active' ? '正常' : '已冻结'}
                />
              </Descriptions.Item>
              <Descriptions.Item label="所属代理商">
                {detailCustomer.agentName || '直属总后台'}
              </Descriptions.Item>
              <Descriptions.Item label="开通时间">
                {new Date(detailCustomer.createdAt).toLocaleString('zh-CN')}
              </Descriptions.Item>
            </Descriptions>

            <Divider>
              <SettingOutlined /> 功能权限配置
            </Divider>
            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
              关闭后客户在前台将不再看到对应功能模块（从功能开关库动态加载）
            </Text>
            {featuresLoading ? (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Spin tip="加载功能开关..." />
              </div>
            ) : customerFeatures.length === 0 ? (
              <Text type="secondary">暂无可配置的功能模块</Text>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {customerFeatures.map(f => {
                  const featureIndex = customerFeatures.findIndex(x => x.code === f.code);
                  const color = TAG_COLORS[featureIndex % TAG_COLORS.length];
                  return (
                    <div key={f.code}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: '#fafafa',
                        borderRadius: 6,
                        marginBottom: 4,
                      }}>
                        <div>
                          <Tag color={color}>{f.name}</Tag>
                          {f.description && (
                            <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                              {f.description}
                            </Text>
                          )}
                        </div>
                        <Switch
                          checked={f.enabled}
                          onChange={v => handleFeatureToggle(f, v)}
                          checkedChildren="开"
                          unCheckedChildren="关"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
}
