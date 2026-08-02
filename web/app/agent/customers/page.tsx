'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Tag,
  App,
  Popconfirm,
  Typography,
  Row,
  Col,
  Statistic,
  Drawer,
  Descriptions,
  Switch,
  Divider,
  InputNumber,
  Select,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  LockOutlined,
  UnlockOutlined,
  EyeOutlined,
  SearchOutlined,
  TeamOutlined,
  ReloadOutlined,
  UserOutlined,
  CheckCircleOutlined,
  StopOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  toggleCustomerStatus,
  resetCustomerPassword,
  getCustomerFeatures,
  updateCustomerFeatures,
  getCustomerStats,
  Customer,
  CustomerFeature,
} from '@/services/customer';

const { Title } = Typography;

interface AgentStatistics {
  totalCustomers: number;
  activeCustomers: number;
  disabledCustomers: number;
  newCustomersThisMonth: number;
}

const cardBase: React.CSSProperties = {
  borderRadius: 8,
  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
  border: '1px solid #f0f0f0',
};

export default function CustomerManagementPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
  });
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [features, setFeatures] = useState<CustomerFeature[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [statistics, setStatistics] = useState<AgentStatistics>({
    totalCustomers: 0,
    activeCustomers: 0,
    disabledCustomers: 0,
    newCustomersThisMonth: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const fetchStatistics = useCallback(async () => {
    setStatsLoading(true);
    try {
      const request = (await import('@/lib/request')).default;
      const res = (await request.get<{ success: boolean; data: AgentStatistics }>(
        '/api/agent/statistics'
      )) as unknown as { success: boolean; data: AgentStatistics };
      if (res.success && res.data) {
        setStatistics(res.data);
      }
    } catch (err) {
      console.error('获取客户统计失败', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCustomers({
        page: pagination.page,
        pageSize: pagination.pageSize,
        keyword: searchKeyword,
        status: statusFilter,
      });
      setCustomers(res.list || []);
      setPagination(prev => ({
        ...prev,
        total: res.total || 0,
      }));
    } catch (error) {
      message.error('获取客户列表失败');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, searchKeyword, statusFilter, message]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    form.resetFields();
    setCustomerModalVisible(true);
  };

  const handleEdit = (record: Customer) => {
    setEditingCustomer(record);
    form.setFieldsValue(record);
    setCustomerModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, values);
        message.success('更新成功');
      } else {
        await createCustomer(values);
        message.success('客户开通成功');
      }
      setCustomerModalVisible(false);
      fetchCustomers();
      fetchStatistics();
    } catch (error: any) {
      if (!error.errorFields) {
        message.error(error.message || '操作失败');
      }
    }
  };

  const handleToggleStatus = async (record: Customer) => {
    try {
      await toggleCustomerStatus(record.id);
      message.success(record.status === 'active' ? '已冻结' : '已解冻');
      fetchCustomers();
      fetchStatistics();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleResetPassword = async (record: Customer) => {
    try {
      await resetCustomerPassword(record.id);
      message.success('密码已重置为 123456');
    } catch (error) {
      message.error('重置失败');
    }
  };

  const handleViewDetail = async (record: Customer) => {
    setSelectedCustomer(record);
    setDetailDrawerVisible(true);
    fetchCustomerDetail(record.id);
    fetchCustomerFeatures(record.id);
  };

  const fetchCustomerDetail = async (id: string) => {
    try {
      const res = await getCustomerStats(id);
      setSelectedCustomer(prev => (prev ? { ...prev, ...res } : null));
    } catch (error) {
      console.error('获取客户详情失败');
    }
  };

  const fetchCustomerFeatures = async (id: string) => {
    setFeaturesLoading(true);
    try {
      const res = await getCustomerFeatures(id);
      setFeatures(res || []);
    } catch (error) {
      message.error('获取功能开关失败');
    } finally {
      setFeaturesLoading(false);
    }
  };

  const handleFeatureToggle = async (feature: CustomerFeature, enabled: boolean) => {
    try {
      const updatedFeatures = features.map(f => {
        if (f.id === feature.id) {
          return { ...f, enabled };
        }
        return f;
      });
      setFeatures(updatedFeatures);
      await updateCustomerFeatures(selectedCustomer!.id, updatedFeatures);
      message.success('功能开关已更新');
    } catch (error) {
      message.error('更新失败');
      fetchCustomerFeatures(selectedCustomer!.id);
    }
  };

  const columns: ColumnsType<Customer> = [
    {
      title: '客户信息',
      key: 'customer',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.name || '未设置昵称'}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.phone}</div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) =>
        status === 'active' ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            正常
          </Tag>
        ) : (
          <Tag color="error" icon={<StopOutlined />}>
            已冻结
          </Tag>
        ),
    },
    {
      title: '素材',
      dataIndex: 'materialCount',
      key: 'materialCount',
      width: 80,
      render: (count: number) => count || 0,
    },
    {
      title: '账号',
      dataIndex: 'accountCount',
      key: 'accountCount',
      width: 80,
      render: (count: number) => count || 0,
    },
    {
      title: '发布',
      dataIndex: 'publishCount',
      key: 'publishCount',
      width: 80,
      render: (count: number) => count || 0,
    },
    {
      title: '开通时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4} wrap>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger={record.status === 'active'}
            icon={record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
            onClick={() => handleToggleStatus(record)}
          >
            {record.status === 'active' ? '冻结' : '解冻'}
          </Button>
          <Popconfirm
            title="确认重置密码？"
            description="新密码为 123456，请提醒客户及时修改"
            onConfirm={() => handleResetPassword(record)}
          >
            <Button type="link" size="small" danger>
              重置密码
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* 顶部 KPI - 与 admin/tenants 风格一致 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card style={cardBase} styles={{ body: { padding: 18 } }} loading={statsLoading}>
            <Statistic
              title="客户总数"
              value={statistics.totalCustomers}
              prefix={<TeamOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={cardBase} styles={{ body: { padding: 18 } }} loading={statsLoading}>
            <Statistic
              title="正常"
              value={statistics.activeCustomers}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={cardBase} styles={{ body: { padding: 18 } }} loading={statsLoading}>
            <Statistic
              title="已冻结"
              value={statistics.disabledCustomers}
              prefix={<StopOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={cardBase} styles={{ body: { padding: 18 } }} loading={statsLoading}>
            <Statistic
              title="本月新增"
              value={statistics.newCustomersThisMonth}
              prefix={<UserAddOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16', fontSize: 24 }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <TeamOutlined />
            <span>客户管理</span>
            <span style={{ fontSize: 12, color: '#8c8c8c' }}>
              · 开通、设置、查看名下客户
            </span>
          </Space>
        }
        style={cardBase}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => { fetchCustomers(); fetchStatistics(); }}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新建客户
            </Button>
          </Space>
        }
      >
        {/* 搜索栏 */}
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input
              placeholder="搜索手机号/姓名"
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined />}
              style={{ width: 250 }}
              allowClear
            />
            <Select
              placeholder="状态筛选"
              value={statusFilter || undefined}
              onChange={v => setStatusFilter(v || '')}
              allowClear
              style={{ width: 130 }}
              options={[
                { label: '正常', value: 'active' },
                { label: '已冻结', value: 'disabled' },
              ]}
            />
            <Button type="primary" onClick={handleSearch}>
              搜索
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={customers}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination({ page, pageSize, total: pagination.total });
            },
          }}
        />
      </Card>

      {/* 新建/编辑客户弹窗 */}
      <Modal
        title={editingCustomer ? '编辑客户' : '新建客户'}
        open={customerModalVisible}
        onOk={handleSubmit}
        onCancel={() => setCustomerModalVisible(false)}
        width={500}
        okText={editingCustomer ? '保存' : '开通'}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
            ]}
          >
            <Input placeholder="请输入手机号" disabled={!!editingCustomer} />
          </Form.Item>

          <Form.Item name="name" label="姓名">
            <Input placeholder="请输入客户姓名（选填）" />
          </Form.Item>

          {!editingCustomer && (
            <Form.Item
              name="password"
              label="初始密码"
              extra="不填则默认为 123456"
            >
              <Input.Password placeholder="默认 123456" />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* 客户详情抽屉 */}
      <Drawer
        title={
          <Space>
            <UserOutlined />
            <span>客户详情</span>
          </Space>
        }
        placement="right"
        width={640}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
      >
        {selectedCustomer && (
          <>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="姓名">
                {selectedCustomer.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="手机号">
                {selectedCustomer.phone}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag
                  color={selectedCustomer.status === 'active' ? 'success' : 'error'}
                  icon={
                    selectedCustomer.status === 'active' ? (
                      <CheckCircleOutlined />
                    ) : (
                      <StopOutlined />
                    )
                  }
                >
                  {selectedCustomer.status === 'active' ? '正常' : '已冻结'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="开通时间">
                {dayjs(selectedCustomer.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Title level={5} style={{ marginTop: 0 }}>
              数据统计
            </Title>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic title="素材数量" value={selectedCustomer.materialCount || 0} />
              </Col>
              <Col span={8}>
                <Statistic title="账号数量" value={selectedCustomer.accountCount || 0} />
              </Col>
              <Col span={8}>
                <Statistic title="发布数量" value={selectedCustomer.publishCount || 0} />
              </Col>
            </Row>

            <Divider />

            <Title level={5} style={{ marginTop: 0 }}>
              功能开关
            </Title>
            {featuresLoading ? (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <span>加载中...</span>
              </div>
            ) : features.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: '#8c8c8c' }}>
                暂无可配置的功能
              </div>
            ) : (
              <div>
                {features.map(feature => (
                  <Card key={feature.id} size="small" style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{feature.name}</div>
                        {feature.description && (
                          <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 2 }}>
                            {feature.description}
                          </div>
                        )}
                      </div>
                      <Switch
                        checked={feature.enabled}
                        onChange={enabled => handleFeatureToggle(feature, enabled)}
                      />
                    </div>
                    {feature.subSwitches && feature.subSwitches.length > 0 && (
                      <div style={{ marginTop: 12, paddingLeft: 12, borderLeft: '2px solid #f0f0f0' }}>
                        {feature.subSwitches.map(sub => (
                          <div
                            key={sub.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '6px 0',
                            }}
                          >
                            <div>
                              <span>{sub.name}</span>
                              {sub.description && (
                                <span style={{ color: '#bfbfbf', fontSize: 12, marginLeft: 8 }}>
                                  {sub.description}
                                </span>
                              )}
                            </div>
                            <Switch
                              size="small"
                              checked={sub.enabled}
                              onChange={enabled => handleFeatureToggle(sub, enabled)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
}
