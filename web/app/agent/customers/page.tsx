'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Tag,
  message,
  Popconfirm,
  Typography,
  Row,
  Col,
  Statistic,
  Drawer,
  Descriptions,
  Switch,
  Tree,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  UserOutlined,
  LockOutlined,
  UnlockOutlined,
  EyeOutlined,
  SettingOutlined,
  SearchOutlined,
  TeamOutlined,
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

const { Title, Text } = Typography;

export default function CustomerManagementPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
  });
  const [searchKeyword, setSearchKeyword] = useState('');
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [features, setFeatures] = useState<CustomerFeature[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCustomers();
  }, [pagination.page, pagination.pageSize]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await getCustomers({
        page: pagination.page,
        pageSize: pagination.pageSize,
        keyword: searchKeyword,
      });
      setCustomers(res.data?.list || []);
      setPagination(prev => ({
        ...prev,
        total: res.data?.total || 0,
      }));
    } catch (error) {
      message.error('获取客户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchCustomers();
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
        message.success('创建成功');
      }
      setCustomerModalVisible(false);
      fetchCustomers();
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
      setSelectedCustomer(prev => prev ? { ...prev, ...res.data } : null);
    } catch (error) {
      console.error('获取客户详情失败');
    }
  };

  const fetchCustomerFeatures = async (id: string) => {
    setFeaturesLoading(true);
    try {
      const res = await getCustomerFeatures(id);
      setFeatures(res.data || []);
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
      // 恢复原状态
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
          <div className="font-medium">{record.name || '未设置昵称'}</div>
          <div className="text-gray-500">{record.phone}</div>
        </div>
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
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) =>
        status === 'active' ? (
          <Tag color="success">正常</Tag>
        ) : (
          <Tag color="error">已冻结</Tag>
        ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '月费',
      dataIndex: 'monthlyFee',
      key: 'monthlyFee',
      width: 100,
      render: (fee: number) => fee ? `¥${fee}` : '-',
    },
    {
      title: '累计付费',
      dataIndex: 'totalPaid',
      key: 'totalPaid',
      width: 100,
      render: (amount: number) => amount ? `¥${amount}` : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space>
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
            icon={record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
            onClick={() => handleToggleStatus(record)}
          >
            {record.status === 'active' ? '冻结' : '解冻'}
          </Button>
          <Popconfirm
            title="确认重置密码？"
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
    <div className="p-6">
      <Card
        title={
          <Space>
            <TeamOutlined />
            <span>客户管理</span>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建客户
          </Button>
        }
      >
        {/* 搜索栏 */}
        <div className="mb-4">
          <Space>
            <Input
              placeholder="搜索手机号/姓名"
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined />}
              style={{ width: 250 }}
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
      >
        <Form form={form} layout="vertical">
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
            <Input placeholder="请输入姓名（选填）" />
          </Form.Item>

          <Form.Item label="价格">
            <Space.Compact>
              <Form.Item name="price" noStyle rules={[{ required: true, message: '请输入价格' }]}>
                <Input type="number" prefix="¥" placeholder="金额" min={0} style={{ width: 120 }} />
              </Form.Item>
              <Form.Item name="priceQuantity" noStyle rules={[{ required: true, message: '请输入时间' }]}>
                <InputNumber placeholder="时间" min={1} style={{ width: 80 }} />
              </Form.Item>
              <Form.Item name="priceUnit" noStyle rules={[{ required: true, message: '请选择单位' }]}>
                <Select style={{ width: 80 }} defaultValue="month">
                  <Select.Option value="month">月</Select.Option>
                  <Select.Option value="quarter">季</Select.Option>
                  <Select.Option value="year">年</Select.Option>
                </Select>
              </Form.Item>
            </Space.Compact>
          </Form.Item>

          {!editingCustomer && (
            <Form.Item name="password" label="密码">
              <Input.Password placeholder="默认密码 123456（选填）" />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* 客户详情抽屉 */}
      <Drawer
        title="客户详情"
        placement="right"
        width={600}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
      >
        {selectedCustomer && (
          <>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="姓名">{selectedCustomer.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="手机号">{selectedCustomer.phone}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={selectedCustomer.status === 'active' ? 'success' : 'error'}>
                  {selectedCustomer.status === 'active' ? '正常' : '已冻结'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="注册时间">
                {dayjs(selectedCustomer.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Title level={5}>数据统计</Title>
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

            <Title level={5}>功能开关</Title>
            <div className="space-y-4">
              {features.map(feature => (
                <Card key={feature.id} size="small">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{feature.name}</div>
                      {feature.description && (
                        <div className="text-gray-500 text-sm">{feature.description}</div>
                      )}
                    </div>
                    <Switch
                      checked={feature.enabled}
                      onChange={enabled => handleFeatureToggle(feature, enabled)}
                    />
                  </div>
                  {feature.subSwitches && feature.subSwitches.length > 0 && (
                    <div className="mt-3 pl-4 border-l-2 border-gray-200">
                      {feature.subSwitches.map(sub => (
                        <div key={sub.id} className="flex items-center justify-between py-1">
                          <div>
                            <span>{sub.name}</span>
                            {sub.description && (
                              <span className="text-gray-400 text-sm ml-2">{sub.description}</span>
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
          </>
        )}
      </Drawer>
    </div>
  );
}
