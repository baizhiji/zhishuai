'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Select,
  DatePicker,
  Tag,
  Space,
  Typography,
  Progress,
  Button,
  Modal,
  Descriptions,
<<<<<<< HEAD
  Statistic
=======
  Statistic,
>>>>>>> 962968886be726cd434c792933b5515366d34518
} from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  MoneyCollectOutlined,
  RiseOutlined,
  BarChartOutlined,
<<<<<<< HEAD
  EyeOutlined
=======
  EyeOutlined,
>>>>>>> 962968886be726cd434c792933b5515366d34518
} from '@ant-design/icons';
import { request } from '@/utils/request';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface AgentPerformance {
  id: string;
  agentName: string;
  agentPhone: string;
  region: string;
  customers: number;
  newCustomers: number;
  revenue: number;
  commission: number;
  commissionRate: number;
  status: 'active' | 'frozen';
  joinDate: string;
}

interface TrendData {
  date: string;
  revenue: number;
  customers: number;
}

export default function AgentPerformancePage() {
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<AgentPerformance[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentPerformance | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalCustomers: 0,
    totalRevenue: 0,
<<<<<<< HEAD
    totalCommission: 0
=======
    totalCommission: 0,
>>>>>>> 962968886be726cd434c792933b5515366d34518
  });

  useEffect(() => {
    fetchAgentPerformance();
  }, []);

  const fetchAgentPerformance = async () => {
    setLoading(true);
    try {
      const res = await request.get('/api/admin/agents/performance');
      if (res.data) {
        setAgents(res.data.agents || generateMockData());
<<<<<<< HEAD
        setStats(res.data.stats || {
          totalAgents: 12,
          totalCustomers: 456,
          totalRevenue: 1285000,
          totalCommission: 256000
        });
=======
        setStats(
          res.data.stats || {
            totalAgents: 12,
            totalCustomers: 456,
            totalRevenue: 1285000,
            totalCommission: 256000,
          }
        );
>>>>>>> 962968886be726cd434c792933b5515366d34518
      }
    } catch (error) {
      setAgents(generateMockData() as any);
      setStats({
        totalAgents: 12,
        totalCustomers: 456,
        totalRevenue: 1285000,
<<<<<<< HEAD
        totalCommission: 256000
=======
        totalCommission: 256000,
>>>>>>> 962968886be726cd434c792933b5515366d34518
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => [
    {
      id: '1',
      agentName: '张三',
      agentPhone: '13800138001',
      region: '华东区域',
      customers: 120,
      newCustomers: 15,
      revenue: 360000,
      commission: 72000,
      commissionRate: 20,
      status: 'active',
<<<<<<< HEAD
      joinDate: '2023-06-15'
=======
      joinDate: '2023-06-15',
>>>>>>> 962968886be726cd434c792933b5515366d34518
    },
    {
      id: '2',
      agentName: '李四',
      agentPhone: '13800138002',
      region: '华南区域',
      customers: 98,
      newCustomers: 12,
      revenue: 294000,
      commission: 58800,
      commissionRate: 20,
      status: 'active',
<<<<<<< HEAD
      joinDate: '2023-07-20'
=======
      joinDate: '2023-07-20',
>>>>>>> 962968886be726cd434c792933b5515366d34518
    },
    {
      id: '3',
      agentName: '王五',
      agentPhone: '13800138003',
      region: '华北区域',
      customers: 85,
      newCustomers: 8,
      revenue: 255000,
      commission: 51000,
      commissionRate: 20,
      status: 'active',
<<<<<<< HEAD
      joinDate: '2023-08-10'
=======
      joinDate: '2023-08-10',
>>>>>>> 962968886be726cd434c792933b5515366d34518
    },
    {
      id: '4',
      agentName: '赵六',
      agentPhone: '13800138004',
      region: '西南区域',
      customers: 76,
      newCustomers: 10,
      revenue: 228000,
      commission: 45600,
      commissionRate: 20,
      status: 'active',
<<<<<<< HEAD
      joinDate: '2023-09-05'
=======
      joinDate: '2023-09-05',
>>>>>>> 962968886be726cd434c792933b5515366d34518
    },
    {
      id: '5',
      agentName: '钱七',
      agentPhone: '13800138005',
      region: '西北区域',
      customers: 52,
      newCustomers: 5,
      revenue: 156000,
      commission: 31200,
      commissionRate: 20,
      status: 'frozen',
<<<<<<< HEAD
      joinDate: '2023-10-18'
    }
=======
      joinDate: '2023-10-18',
    },
>>>>>>> 962968886be726cd434c792933b5515366d34518
  ];

  const showDetail = (agent: AgentPerformance) => {
    setSelectedAgent(agent);
    setDetailVisible(true);
  };

  const columns = [
    {
      title: '代理商',
      key: 'agent',
      render: (_: any, record: AgentPerformance) => (
        <Space>
          <UserOutlined />
          <div>
            <div className="font-medium">{record.agentName}</div>
            <div className="text-gray-400 text-sm">{record.agentPhone}</div>
          </div>
        </Space>
<<<<<<< HEAD
      )
=======
      ),
>>>>>>> 962968886be726cd434c792933b5515366d34518
    },
    {
      title: '区域',
      dataIndex: 'region',
<<<<<<< HEAD
      key: 'region'
=======
      key: 'region',
>>>>>>> 962968886be726cd434c792933b5515366d34518
    },
    {
      title: '客户数',
      key: 'customers',
      render: (_: any, record: AgentPerformance) => (
        <div>
          <div className="font-medium">{record.customers}</div>
          <div className="text-green-500 text-sm">+{record.newCustomers} 本月新增</div>
        </div>
<<<<<<< HEAD
      )
=======
      ),
>>>>>>> 962968886be726cd434c792933b5515366d34518
    },
    {
      title: '营收',
      dataIndex: 'revenue',
      key: 'revenue',
<<<<<<< HEAD
      render: (val: number) => `¥${val.toLocaleString()}`
=======
      render: (val: number) => `¥${val.toLocaleString()}`,
>>>>>>> 962968886be726cd434c792933b5515366d34518
    },
    {
      title: '分成',
      key: 'commission',
      render: (_: any, record: AgentPerformance) => (
        <div>
          <div className="font-medium text-orange-500">¥{record.commission.toLocaleString()}</div>
          <div className="text-gray-400 text-sm">{record.commissionRate}%</div>
        </div>
<<<<<<< HEAD
      )
=======
      ),
>>>>>>> 962968886be726cd434c792933b5515366d34518
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '正常' : '已冻结'}
        </Tag>
<<<<<<< HEAD
      )
=======
      ),
>>>>>>> 962968886be726cd434c792933b5515366d34518
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: AgentPerformance) => (
        <Button type="link" onClick={() => showDetail(record)}>
          查看详情
        </Button>
<<<<<<< HEAD
      )
    }
=======
      ),
    },
>>>>>>> 962968886be726cd434c792933b5515366d34518
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">代理商业绩统计</h1>
        <p className="text-gray-500">查看各代理商的业绩与分成情况</p>
      </div>

      {/* 总体统计 */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="代理商总数"
              value={stats.totalAgents}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="客户总数"
              value={stats.totalCustomers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="总营收"
              value={stats.totalRevenue}
              prefix={<MoneyCollectOutlined />}
              valueStyle={{ color: '#faad14' }}
<<<<<<< HEAD
              formatter={(value) => `¥${Number(value).toLocaleString()}`}
=======
              formatter={value => `¥${Number(value).toLocaleString()}`}
>>>>>>> 962968886be726cd434c792933b5515366d34518
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="总分成"
              value={stats.totalCommission}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#722ed1' }}
<<<<<<< HEAD
              formatter={(value) => `¥${Number(value).toLocaleString()}`}
=======
              formatter={value => `¥${Number(value).toLocaleString()}`}
>>>>>>> 962968886be726cd434c792933b5515366d34518
            />
          </Card>
        </Col>
      </Row>

      {/* 代理商列表 */}
      <Card title="代理商业绩列表">
        <Table
          columns={columns}
          dataSource={agents}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="代理商详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {selectedAgent && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="代理商姓名" span={2}>
              {selectedAgent.agentName}
            </Descriptions.Item>
<<<<<<< HEAD
            <Descriptions.Item label="手机号">
              {selectedAgent.agentPhone}
            </Descriptions.Item>
            <Descriptions.Item label="负责区域">
              {selectedAgent.region}
            </Descriptions.Item>
            <Descriptions.Item label="客户总数">
              {selectedAgent.customers} 人
            </Descriptions.Item>
=======
            <Descriptions.Item label="手机号">{selectedAgent.agentPhone}</Descriptions.Item>
            <Descriptions.Item label="负责区域">{selectedAgent.region}</Descriptions.Item>
            <Descriptions.Item label="客户总数">{selectedAgent.customers} 人</Descriptions.Item>
>>>>>>> 962968886be726cd434c792933b5515366d34518
            <Descriptions.Item label="本月新增">
              <Text type="success">+{selectedAgent.newCustomers} 人</Text>
            </Descriptions.Item>
            <Descriptions.Item label="总营收">
              ¥{selectedAgent.revenue.toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="分成金额">
              <Text type="warning">¥{selectedAgent.commission.toLocaleString()}</Text>
            </Descriptions.Item>
<<<<<<< HEAD
            <Descriptions.Item label="分成比例">
              {selectedAgent.commissionRate}%
            </Descriptions.Item>
=======
            <Descriptions.Item label="分成比例">{selectedAgent.commissionRate}%</Descriptions.Item>
>>>>>>> 962968886be726cd434c792933b5515366d34518
            <Descriptions.Item label="状态">
              <Tag color={selectedAgent.status === 'active' ? 'green' : 'red'}>
                {selectedAgent.status === 'active' ? '正常' : '已冻结'}
              </Tag>
            </Descriptions.Item>
<<<<<<< HEAD
            <Descriptions.Item label="加入时间">
              {selectedAgent.joinDate}
            </Descriptions.Item>
=======
            <Descriptions.Item label="加入时间">{selectedAgent.joinDate}</Descriptions.Item>
>>>>>>> 962968886be726cd434c792933b5515366d34518
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
