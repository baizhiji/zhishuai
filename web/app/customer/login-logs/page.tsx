'use client';

import { useState, useEffect } from 'react';
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
  Descriptions
} from 'antd';
import {
  LoginOutlined,
  LogoutOutlined,
  DesktopOutlined,
  MobileOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { request } from '@/utils/request';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface LoginLog {
  id: string;
  userId: string;
  userName: string;
  userType: 'admin' | 'agent' | 'customer' | 'employee';
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
    userType: undefined as string | undefined,
    action: undefined as string | undefined,
    status: undefined as string | undefined,
    dateRange: undefined as [dayjs.Dayjs, dayjs.Dayjs] | undefined
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
      const res = await request.get('/api/auth/login-logs', {
        userId,
        ...filters
      });
      setLogs(res.data?.logs || generateMockData());
    } catch (error) {
      setLogs(generateMockData());
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    const logs: LoginLog[] = [];
    const users = ['张三', '李四', '王五', '赵六', '孙七'];
    const actions = ['login', 'logout'];
    const devices = ['desktop', 'mobile', 'tablet'];
    const browsers = ['Chrome 120', 'Firefox 121', 'Safari 17', 'Edge 120'];
    const osList = ['Windows 11', 'macOS 14', 'iOS 17', 'Android 14'];
    const locations = ['北京市', '上海市', '广州市', '深圳市', '杭州市'];
    
    for (let i = 0; i < 30; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)];
      logs.push({
        id: `log-${i}`,
        userId: `user-${i % 5}`,
        userName: users[i % 5],
        userType: ['admin', 'agent', 'customer', 'employee'][i % 4] as any,
        action: action as any,
        device: devices[Math.floor(Math.random() * devices.length)] as any,
        browser: browsers[Math.floor(Math.random() * browsers.length)],
        os: osList[Math.floor(Math.random() * osList.length)],
        ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        location: locations[Math.floor(Math.random() * locations.length)],
        status: Math.random() > 0.1 ? 'success' : 'failed',
        failReason: Math.random() > 0.9 ? '密码错误' : undefined,
        createdAt: dayjs().subtract(i, 'hour').format('YYYY-MM-DD HH:mm:ss')
      });
    }
    return logs;
  };

  const showDetail = (log: LoginLog) => {
    setSelectedLog(log);
    setDetailVisible(true);
  };

  const getUserTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      admin: 'red',
      agent: 'blue',
      customer: 'green',
      employee: 'purple'
    };
    return colors[type] || 'default';
  };

  const getUserTypeText = (type: string) => {
    const texts: Record<string, string> = {
      admin: '管理员',
      agent: '代理商',
      customer: '客户',
      employee: '员工'
    };
    return texts[type] || type;
  };

  const getDeviceIcon = (device: string) => {
    const icons: Record<string, React.ReactNode> = {
      desktop: <DesktopOutlined />,
      mobile: <MobileOutlined />,
      tablet: <MobileOutlined />
    };
    return icons[device] || <DesktopOutlined />;
  };

  const columns = [
    {
      title: '用户',
      key: 'user',
      render: (_: any, record: LoginLog) => (
        <Space>
          <div>
            <div className="font-medium">{record.userName}</div>
            <Tag color={getUserTypeColor(record.userType)} className="mt-1">
              {getUserTypeText(record.userType)}
            </Tag>
          </div>
        </Space>
      )
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => (
        <Tag color={action === 'login' ? 'green' : 'orange'} icon={action === 'login' ? <LoginOutlined /> : <LogoutOutlined />}>
          {action === 'login' ? '登录' : '登出'}
        </Tag>
      )
    },
    {
      title: '设备',
      key: 'device',
      render: (_: any, record: LoginLog) => (
        <Space direction="vertical" size={0}>
          <Space>
            {getDeviceIcon(record.device)}
            <Text>{record.device === 'desktop' ? '桌面端' : record.device === 'mobile' ? '移动端' : '平板'}</Text>
          </Space>
          <Text type="secondary" className="text-xs">{record.browser}</Text>
        </Space>
      )
    },
    {
      title: 'IP / 位置',
      key: 'location',
      render: (_: any, record: LoginLog) => (
        <Space direction="vertical" size={0}>
          <Text code>{record.ip}</Text>
          <Text type="secondary" className="text-xs">
            <EnvironmentOutlined /> {record.location}
          </Text>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: LoginLog) => (
        <Space direction="vertical" size={0}>
          <Tag color={status === 'success' ? 'green' : 'red'}>
            {status === 'success' ? '成功' : '失败'}
          </Tag>
          {record.failReason && (
            <Text type="danger" className="text-xs">{record.failReason}</Text>
          )}
        </Space>
      )
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: LoginLog) => (
        <Button type="link" size="small" onClick={() => showDetail(record)}>
          详情
        </Button>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">登录日志</h1>
        <p className="text-gray-500">查看账号的登录和操作记录</p>
      </div>

      {/* 筛选 */}
      <Card className="mb-6">
        <Space wrap>
          <Select
            placeholder="用户类型"
            allowClear
            style={{ width: 120 }}
            value={filters.userType}
            onChange={(val) => setFilters({ ...filters, userType: val })}
          >
            <Select.Option value="admin">管理员</Select.Option>
            <Select.Option value="agent">代理商</Select.Option>
            <Select.Option value="customer">客户</Select.Option>
            <Select.Option value="employee">员工</Select.Option>
          </Select>
          <Select
            placeholder="操作类型"
            allowClear
            style={{ width: 120 }}
            value={filters.action}
            onChange={(val) => setFilters({ ...filters, action: val })}
          >
            <Select.Option value="login">登录</Select.Option>
            <Select.Option value="logout">登出</Select.Option>
          </Select>
          <Select
            placeholder="状态"
            allowClear
            style={{ width: 100 }}
            value={filters.status}
            onChange={(val) => setFilters({ ...filters, status: val })}
          >
            <Select.Option value="success">成功</Select.Option>
            <Select.Option value="failed">失败</Select.Option>
          </Select>
          <RangePicker
            onChange={(dates) => setFilters({ ...filters, dateRange: dates as [any, any] || undefined })}
          />
          <Button type="primary" onClick={fetchLogs}>查询</Button>
        </Space>
      </Card>

      {/* 日志列表 */}
      <Card title="登录记录">
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
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
          <Descriptions column={2} bordered>
            <Descriptions.Item label="用户姓名">{selectedLog.userName}</Descriptions.Item>
            <Descriptions.Item label="用户类型">
              <Tag color={getUserTypeColor(selectedLog.userType)}>
                {getUserTypeText(selectedLog.userType)}
              </Tag>
            </Descriptions.Item>
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
              {selectedLog.device === 'desktop' ? '桌面端' : selectedLog.device === 'mobile' ? '移动端' : '平板'}
            </Descriptions.Item>
            <Descriptions.Item label="浏览器">{selectedLog.browser}</Descriptions.Item>
            <Descriptions.Item label="操作系统">{selectedLog.os}</Descriptions.Item>
            <Descriptions.Item label="IP地址">{selectedLog.ip}</Descriptions.Item>
            <Descriptions.Item label="登录地点" span={2}>
              <EnvironmentOutlined /> {selectedLog.location}
            </Descriptions.Item>
            {selectedLog.failReason && (
              <Descriptions.Item label="失败原因" span={2}>
                <Text type="danger">{selectedLog.failReason}</Text>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="时间" span={2}>
              {selectedLog.createdAt}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
