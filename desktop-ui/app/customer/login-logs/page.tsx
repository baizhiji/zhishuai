'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Typography,
  Select,
  DatePicker,
  Button,
  Modal,
  Descriptions,
  Alert,
} from 'antd';
import {
  LoginOutlined,
  LogoutOutlined,
  DesktopOutlined,
  MobileOutlined,
  EnvironmentOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { request } from '@/utils/request';
import PageContainer from '@/components/customer/PageContainer';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface LoginLog {
  id: string;
  userId: string;
  userName: string;
  action: 'login' | 'logout';
  device: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  ip: string;
  location: string;
  status: 'success' | 'failed';
  failReason?: string;
  createdAt: string;
}

export default function LoginLogsPage() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<LoginLog | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [filters, setFilters] = useState({
    action: undefined as string | undefined,
    status: undefined as string | undefined,
    dateRange: undefined as [dayjs.Dayjs, dayjs.Dayjs] | undefined,
  });
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      setUserId(userData.id);
    }
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean> = { userId };
      if (filters.action) params.action = filters.action;
      if (filters.status) params.status = filters.status;
      const res = await request.get('/api/auth/login-logs', { params });
      setLogs(res?.logs || []);
    } catch (error) {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const showDetail = (log: LoginLog) => {
    setSelectedLog(log);
    setDetailVisible(true);
  };

  const getDeviceIcon = (device: string) => {
    const icons: Record<string, React.ReactNode> = {
      desktop: <DesktopOutlined />,
      mobile: <MobileOutlined />,
      tablet: <MobileOutlined />,
    };
    return icons[device] || <DesktopOutlined />;
  };

  // 检测异常登录：查找是否存在非本地位置的登录
  const anomalyLogs = useMemo(() => {
    return logs.filter(l => l.status === 'failed' || (l.location && !l.location.includes('本地')));
  }, [logs]);

  const columns = [
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action: string) => (
        <Tag
          color={action === 'login' ? 'green' : 'orange'}
          icon={action === 'login' ? <LoginOutlined /> : <LogoutOutlined />}
        >
          {action === 'login' ? '登录' : '登出'}
        </Tag>
      ),
    },
    {
      title: '设备',
      key: 'device',
      width: 200,
      render: (_: unknown, record: LoginLog) => (
        <Space direction="vertical" size={0}>
          <Space>
            {getDeviceIcon(record.device)}
            <Text>
              {record.device === 'desktop'
                ? '桌面端'
                : record.device === 'mobile'
                  ? '移动端'
                  : '平板'}
            </Text>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.browser} / {record.os}
          </Text>
        </Space>
      ),
    },
    {
      title: 'IP / 位置',
      key: 'location',
      width: 180,
      render: (_: unknown, record: LoginLog) => (
        <Space direction="vertical" size={0}>
          <Text code>{record.ip}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <EnvironmentOutlined /> {record.location || '未知'}
          </Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string, record: LoginLog) => (
        <Space direction="vertical" size={0}>
          <Tag color={status === 'success' ? 'green' : 'red'}>
            {status === 'success' ? '成功' : '失败'}
          </Tag>
          {record.failReason && (
            <Text type="danger" style={{ fontSize: 12 }}>
              {record.failReason}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      sorter: (a: LoginLog, b: LoginLog) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      defaultSortOrder: 'descend' as const,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action_col',
      width: 80,
      render: (_: unknown, record: LoginLog) => (
        <Button type="link" size="small" onClick={() => showDetail(record)}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="登录日志"
      description="查看您的账号登录记录，守护账号安全"
      breadcrumb={[
        { title: '首页', href: '/customer/dashboard' },
        { title: '登录日志' },
      ]}
      loading={false}
      skeletonType="table"
    >
      {/* 异常登录提醒 */}
      {anomalyLogs.length > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message={`检测到 ${anomalyLogs.length} 条异常登录记录`}
          description="请检查以下登录记录，如非本人操作请立即修改密码"
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
      )}

      {/* 筛选 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="操作类型"
            allowClear
            style={{ width: 120 }}
            value={filters.action}
            onChange={val => setFilters({ ...filters, action: val })}
          >
            <Select.Option value="login">登录</Select.Option>
            <Select.Option value="logout">登出</Select.Option>
          </Select>
          <Select
            placeholder="状态"
            allowClear
            style={{ width: 100 }}
            value={filters.status}
            onChange={val => setFilters({ ...filters, status: val })}
          >
            <Select.Option value="success">成功</Select.Option>
            <Select.Option value="failed">失败</Select.Option>
          </Select>
          <RangePicker
            onChange={dates =>
              setFilters({ ...filters, dateRange: (dates as [dayjs.Dayjs, dayjs.Dayjs]) || undefined })
            }
          />
          <Button type="primary" onClick={fetchLogs}>
            查询
          </Button>
        </Space>
      </Card>

      {/* 日志列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: '暂无登录记录' }}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="登录详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
      >
        {selectedLog && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="操作">
              <Tag color={selectedLog.action === 'login' ? 'green' : 'orange'}>
                {selectedLog.action === 'login' ? '登录' : '登出'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={selectedLog.status === 'success' ? 'green' : 'red'}>
                {selectedLog.status === 'success' ? '成功' : '失败'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="设备类型">
              {selectedLog.device === 'desktop'
                ? '桌面端'
                : selectedLog.device === 'mobile'
                  ? '移动端'
                  : '平板'}
            </Descriptions.Item>
            <Descriptions.Item label="浏览器">{selectedLog.browser}</Descriptions.Item>
            <Descriptions.Item label="操作系统">{selectedLog.os}</Descriptions.Item>
            <Descriptions.Item label="IP地址">{selectedLog.ip}</Descriptions.Item>
            <Descriptions.Item label="登录地点" span={2}>
              <EnvironmentOutlined /> {selectedLog.location || '未知'}
            </Descriptions.Item>
            {selectedLog.failReason && (
              <Descriptions.Item label="失败原因" span={2}>
                <Text type="danger">{selectedLog.failReason}</Text>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="时间" span={2}>
              {dayjs(selectedLog.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </PageContainer>
  );
}
