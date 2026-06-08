'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  message,
  Typography,
  Row,
  Col,
  Statistic,
  Modal,
  Descriptions,
  Avatar,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  TeamOutlined,
  GiftOutlined,
  WarningOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  getPublicPool,
  claimCustomer,
  Customer,
} from '@/services/crm';

const { Title, Text } = Typography;

// 来源映射
const SOURCE_MAP: Record<string, string> = {
  referral: '转介绍',
  marketing: '营销获客',
  cold_call: '电话拓展',
  exhibition: '展会活动',
  other: '其他',
};

export default function PublicPoolPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
  });
  const [searchKeyword, setSearchKeyword] = useState('');
  const [claiming, setClaiming] = useState<string | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // 初始加载
  useEffect(() => {
    fetchCustomers();
  }, []);

  // 获取公海池客户
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await getPublicPool({
        page: pagination.page,
        pageSize: pagination.pageSize,
        keyword: searchKeyword || undefined,
      });
      setCustomers(res.data?.list || []);
      setPagination(prev => ({
        ...prev,
        total: res.data?.total || 0,
      }));
    } catch (error: any) {
      message.error(error?.message || '获取公海池客户失败');
    } finally {
      setLoading(false);
    }
  };

  // 搜索
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchCustomers();
  };

  // 认领客户
  const handleClaim = async (id: string) => {
    setClaiming(id);
    try {
      await claimCustomer(id);
      message.success('认领成功！该客户已添加到您的客户列表');
      fetchCustomers();
    } catch (error: any) {
      message.error(error?.message || '认领失败');
    } finally {
      setClaiming(null);
    }
  };

  // 批量认领
  const handleBatchClaim = () => {
    // 实现批量认领逻辑
    message.info('批量认领功能开发中');
  };

  // 查看详情
  const handleViewDetail = (record: Customer) => {
    setSelectedCustomer(record);
    setDetailModalVisible(true);
  };

  // 计算公海停留天数
  const getDaysInPool = (createdAt: string) => {
    return dayjs().diff(dayjs(createdAt), 'day');
  };

  // 表格列
  const columns: ColumnsType<Customer> = [
    {
      title: '客户信息',
      key: 'customer',
      width: 200,
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ background: '#faad14' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.phone || '-'}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '公司',
      dataIndex: 'company',
      key: 'company',
      render: (company: string) => company || '-',
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (source: string) => SOURCE_MAP[source] || source || '-',
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: string) => {
        const config: Record<string, { color: string; label: string }> = {
          A: { color: 'red', label: 'A级' },
          B: { color: 'orange', label: 'B级' },
          C: { color: 'blue', label: 'C级' },
          D: { color: 'default', label: 'D级' },
        };
        return <Tag color={config[level]?.color}>{config[level]?.label || level}</Tag>;
      },
    },
    {
      title: '公海停留',
      key: 'days',
      width: 120,
      render: (_, record) => {
        const days = getDaysInPool(record.createdAt);
        return (
          <Tooltip title={`进入公海时间: ${dayjs(record.createdAt).format('YYYY-MM-DD')}`}>
            <Space>
              <ClockCircleOutlined style={{ color: days > 7 ? '#f5222d' : '#faad14' }} />
              <Text type={days > 7 ? 'danger' : undefined}>
                {days} 天
              </Text>
            </Space>
          </Tooltip>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<GiftOutlined />}
          loading={claiming === record.id}
          onClick={() => handleClaim(record.id)}
        >
          认领
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={4}>
        <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
        公海池
      </Title>
      <Text type="secondary">
        公海池中的客户未被认领，您可以主动认领。客户超过7天未跟进将被释放到公海。
      </Text>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginTop: 16, marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="公海客户总数"
              value={pagination.total}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="A级客户"
              value={customers.filter(c => c.level === 'A').length}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="B级客户"
              value={customers.filter(c => c.level === 'B').length}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="搜索客户名称/手机号"
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            style={{ width: 200 }}
            allowClear
            prefix={<SearchOutlined />}
            onPressEnter={handleSearch}
          />
          <Button type="primary" onClick={handleSearch}>
            搜索
          </Button>
          <Button onClick={() => {
            setSearchKeyword('');
            fetchCustomers();
          }}>
            重置
          </Button>
        </Space>
      </Card>

      {/* 客户表格 */}
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            共 {pagination.total} 个客户等待认领
          </Text>
        </div>
        <Table
          columns={columns}
          dataSource={customers}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, page, pageSize }));
              fetchCustomers();
            },
          }}
        />
      </Card>

      {/* 客户详情弹窗 */}
      <Modal
        title="公海客户详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          <Button
            key="claim"
            type="primary"
            icon={<GiftOutlined />}
            loading={claiming === selectedCustomer?.id}
            onClick={() => selectedCustomer && handleClaim(selectedCustomer.id)}
          >
            认领此客户
          </Button>,
        ]}
      >
        {selectedCustomer && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="客户名称" span={1}>
              {selectedCustomer.name}
            </Descriptions.Item>
            <Descriptions.Item label="手机号" span={1}>
              {selectedCustomer.phone || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="微信号" span={1}>
              {selectedCustomer.wechat || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="公司" span={1}>
              {selectedCustomer.company || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="职位" span={1}>
              {selectedCustomer.position || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="客户等级" span={1}>
              {selectedCustomer.level}
            </Descriptions.Item>
            <Descriptions.Item label="客户来源" span={2}>
              {SOURCE_MAP[selectedCustomer.source || ''] || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="进入公海时间" span={2}>
              {dayjs(selectedCustomer.createdAt).format('YYYY-MM-DD HH:mm')}（已停留 {getDaysInPool(selectedCustomer.createdAt)} 天）
            </Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>
              {selectedCustomer.remark || '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
