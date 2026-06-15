'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Row,
  Col,
  Statistic,
  Tabs,
  Divider,
  Typography,
  Progress,
  Badge,
  Timeline,
  List,
  Avatar,
  Tooltip,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  RobotOutlined,
  BulbOutlined,
  AimOutlined,
  MessageOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
} from '@ant-design/icons';
import request from '@/utils/request';

const { TextArea } = Input;
const { TabPane } = Tabs;
const { Text, Title } = Typography;

interface Lead {
  id: string;
  name?: string;
  phone: string;
  email?: string;
  source: string;
  status: string;
  aiScore?: number;
  aiQuality?: string;
  aiInsights?: string;
  notes?: string;
  createdAt: string;
}

interface Automation {
  id: string;
  name: string;
  platform: string;
  status: string;
  targetLeads: number;
  currentLeads: number;
  productInfo?: string;
  targetAudience?: string;
  strategy?: any;
  schedule?: string;
  createdAt: string;
}

interface Stats {
  totalTasks: number;
  activeTasks: number;
  totalLeads: number;
  newLeads: number;
  totalAutomations: number;
  activeAutomations: number;
}

const AcquisitionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalTasks: 0,
    activeTasks: 0,
    totalLeads: 0,
    newLeads: 0,
    totalAutomations: 0,
    activeAutomations: 0,
  });
  const [loading, setLoading] = useState(false);
  const [leadModalVisible, setLeadModalVisible] = useState(false);
  const [automationModalVisible, setAutomationModalVisible] = useState(false);
  const [strategyModalVisible, setStrategyModalVisible] = useState(false);
  const [contentModalVisible, setContentModalVisible] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [strategyData, setStrategyData] = useState<any>(null);
  const [contentIdeas, setContentIdeas] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [leadForm] = Form.useForm();
  const [automationForm] = Form.useForm();
  const [strategyForm] = Form.useForm();

  useEffect(() => {
    fetchLeads();
    fetchAutomations();
    fetchStats();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await request.get('/api/acquisition/leads');
      if (res.success) {
        setLeads(res.data.list);
      }
    } catch (error) {
      console.error('获取线索列表失败', error);
    }
  };

  const fetchAutomations = async () => {
    try {
      const res = await request.get('/api/acquisition/ai/automations');
      if (res.success) {
        setAutomations(res.data);
      }
    } catch (error) {
      console.error('获取自动化列表失败', error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await request.get('/api/acquisition/stats');
      if (res.success) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('获取统计数据失败', error);
    }
  };

  const handleCreateLead = async (values: any) => {
    try {
      const res = await request.post('/api/acquisition/leads', values);
      if (res.success) {
        message.success('线索添加成功');
        setLeadModalVisible(false);
        leadForm.resetFields();
        fetchLeads();
        fetchStats();
      }
    } catch (error) {
      message.error('添加失败');
    }
  };

  const handleCreateAutomation = async (values: any) => {
    try {
      const res = await request.post('/api/acquisition/ai/automation', values);
      if (res.success) {
        message.success('自动化任务创建成功');
        setAutomationModalVisible(false);
        automationForm.resetFields();
        fetchAutomations();
        fetchStats();
      }
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleGenerateStrategy = async (values: any) => {
    setAiLoading(true);
    try {
      const res = await request.post('/api/acquisition/ai/strategy', values);
      if (res.success) {
        setStrategyData(res.data);
        setStrategyModalVisible(false);
        message.success('策略生成成功');
      }
    } catch (error) {
      message.error('策略生成失败');
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateContent = async () => {
    const productInfo = strategyForm.getFieldValue('productInfo');
    if (!productInfo) {
      message.warning('请先输入产品信息');
      return;
    }

    setAiLoading(true);
    try {
      const res = await request.post('/api/acquisition/ai/content-ideas', {
        productInfo,
        platform: '全平台',
      });
      if (res.success) {
        setContentIdeas(res.data);
        setContentModalVisible(true);
      }
    } catch (error) {
      message.error('内容生成失败');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAnalyzeLead = async (leadId: string) => {
    try {
      const res = await request.post(`/api/acquisition/ai/analyze-lead/${leadId}`);
      if (res.success) {
        message.success(`分析完成，匹配度: ${res.data.score}分`);
        fetchLeads();
      }
    } catch (error) {
      message.error('分析失败');
    }
  };

  const handleGenerateFollowup = async (leadId: string) => {
    try {
      const res = await request.post(`/api/acquisition/ai/followup-message/${leadId}`, {
        productInfo: '智枢AI产品',
      });
      if (res.success) {
        Modal.info({
          title: 'AI 跟进建议',
          content: (
            <div>
<<<<<<< HEAD
              <p><strong>建议消息：</strong>{res.data.message}</p>
              <p><strong>跟进方式：</strong>{res.data.approach}</p>
              <p><strong>技巧提示：</strong></p>
=======
              <p>
                <strong>建议消息：</strong>
                {res.data.message}
              </p>
              <p>
                <strong>跟进方式：</strong>
                {res.data.approach}
              </p>
              <p>
                <strong>技巧提示：</strong>
              </p>
>>>>>>> 962968886be726cd434c792933b5515366d34518
              <ul>
                {res.data.tips?.map((tip: string, i: number) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          ),
        });
      }
    } catch (error) {
      message.error('生成失败');
    }
  };

  const handleBatchAnalyze = async () => {
    setAiLoading(true);
    try {
      const res = await request.post('/api/acquisition/ai/batch-analyze');
      if (res.success) {
        message.success(`批量分析完成，共处理 ${res.data.total} 条线索`);
        fetchLeads();
      }
    } catch (error) {
      message.error('批量分析失败');
    } finally {
      setAiLoading(false);
    }
  };

  const handleUpdateAutomation = async (id: string, status: string) => {
    try {
      const res = await request.put(`/api/acquisition/ai/automation/${id}`, { status });
      if (res.success) {
<<<<<<< HEAD
        message.success(`任务${status === 'running' ? '启动' : status === 'paused' ? '暂停' : '完成'}`);
=======
        message.success(
          `任务${status === 'running' ? '启动' : status === 'paused' ? '暂停' : '完成'}`
        );
>>>>>>> 962968886be726cd434c792933b5515366d34518
        fetchAutomations();
        fetchStats();
      }
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleUpdateLeadStatus = async (leadId: string, status: string) => {
    try {
      const res = await request.put(`/api/acquisition/leads/${leadId}`, { status });
      if (res.success) {
        message.success('状态更新成功');
        fetchLeads();
      }
    } catch (error) {
      message.error('更新失败');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'blue',
      contacted: 'processing',
      qualified: 'success',
      converted: 'purple',
      invalid: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      new: '新线索',
      contacted: '已联系',
      qualified: '已筛选',
      converted: '已转化',
      invalid: '无效',
    };
    return texts[status] || status;
  };

  const getSourceIcon = (source: string) => {
    const icons: Record<string, React.ReactNode> = {
      douyin: <span style={{ fontSize: 16 }}>📱</span>,
      wechat: <span style={{ fontSize: 16 }}>💬</span>,
      xiaohongshu: <span style={{ fontSize: 16 }}>📕</span>,
      sms: <PhoneOutlined />,
      scan_qr: <span style={{ fontSize: 16 }}>📲</span>,
      organic: <UserOutlined />,
    };
    return icons[source] || <UserOutlined />;
  };

  const leadColumns = [
    {
      title: '联系人',
      key: 'contact',
      render: (_: any, record: Lead) => (
        <Space>
          <Avatar icon={<UserOutlined />} size="small" />
          <div>
            <div>{record.name || '未知'}</div>
<<<<<<< HEAD
            <Text type="secondary" style={{ fontSize: 12 }}>{record.phone}</Text>
=======
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.phone}
            </Text>
>>>>>>> 962968886be726cd434c792933b5515366d34518
          </div>
        </Space>
      ),
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      render: (source: string) => (
<<<<<<< HEAD
        <Tag icon={getSourceIcon(source)}>
          {source?.toUpperCase() || 'ORGANIC'}
        </Tag>
=======
        <Tag icon={getSourceIcon(source)}>{source?.toUpperCase() || 'ORGANIC'}</Tag>
>>>>>>> 962968886be726cd434c792933b5515366d34518
      ),
    },
    {
      title: 'AI评分',
      dataIndex: 'aiScore',
      key: 'aiScore',
<<<<<<< HEAD
      render: (score?: number) => (
=======
      render: (score?: number) =>
>>>>>>> 962968886be726cd434c792933b5515366d34518
        score ? (
          <Progress
            percent={score}
            size="small"
<<<<<<< HEAD
            format={(p) => `${p}分`}
=======
            format={p => `${p}分`}
>>>>>>> 962968886be726cd434c792933b5515366d34518
            strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#1890ff' : '#ff4d4f'}
          />
        ) : (
          <Text type="secondary">未分析</Text>
<<<<<<< HEAD
        )
      ),
=======
        ),
>>>>>>> 962968886be726cd434c792933b5515366d34518
    },
    {
      title: '质量',
      dataIndex: 'aiQuality',
      key: 'aiQuality',
<<<<<<< HEAD
      render: (quality?: string) => (
        quality ? (
          <Badge status={
            quality === '高' ? 'success' :
            quality === '中' ? 'processing' : 'default'
          } text={quality} />
        ) : '-'
      ),
=======
      render: (quality?: string) =>
        quality ? (
          <Badge
            status={quality === '高' ? 'success' : quality === '中' ? 'processing' : 'default'}
            text={quality}
          />
        ) : (
          '-'
        ),
>>>>>>> 962968886be726cd434c792933b5515366d34518
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
<<<<<<< HEAD
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
=======
      render: (status: string) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>,
>>>>>>> 962968886be726cd434c792933b5515366d34518
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Lead) => (
        <Space size="small">
          <Tooltip title="AI分析">
            <Button
              size="small"
              icon={<RobotOutlined />}
              onClick={() => handleAnalyzeLead(record.id)}
            />
          </Tooltip>
          <Tooltip title="跟进话术">
            <Button
              size="small"
              icon={<MessageOutlined />}
              onClick={() => handleGenerateFollowup(record.id)}
            />
          </Tooltip>
          <Button
            size="small"
            type="link"
            onClick={() => {
              setSelectedLead(record);
              setLeadModalVisible(true);
            }}
          >
            详情
          </Button>
        </Space>
      ),
    },
  ];

  const automationColumns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
<<<<<<< HEAD
      render: (platform: string) => (
        <Tag color="blue">{platform?.toUpperCase()}</Tag>
      ),
=======
      render: (platform: string) => <Tag color="blue">{platform?.toUpperCase()}</Tag>,
>>>>>>> 962968886be726cd434c792933b5515366d34518
    },
    {
      title: '进度',
      key: 'progress',
      render: (_: any, record: Automation) => (
        <Progress
          percent={Math.round((record.currentLeads / record.targetLeads) * 100)}
          format={() => `${record.currentLeads}/${record.targetLeads}`}
        />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config: Record<string, { color: string; text: string }> = {
          draft: { color: 'default', text: '草稿' },
          scheduled: { color: 'processing', text: '计划中' },
          running: { color: 'success', text: '运行中' },
          paused: { color: 'warning', text: '已暂停' },
          completed: { color: 'purple', text: '已完成' },
        };
        const c = config[status] || config.draft;
        return <Tag color={c.color}>{c.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Automation) => (
        <Space>
          {record.status === 'draft' && (
<<<<<<< HEAD
            <Button size="small" type="primary" icon={<PlayCircleOutlined />}
              onClick={() => handleUpdateAutomation(record.id, 'running')}>
=======
            <Button
              size="small"
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => handleUpdateAutomation(record.id, 'running')}
            >
>>>>>>> 962968886be726cd434c792933b5515366d34518
              启动
            </Button>
          )}
          {record.status === 'running' && (
<<<<<<< HEAD
            <Button size="small" icon={<PauseCircleOutlined />}
              onClick={() => handleUpdateAutomation(record.id, 'paused')}>
=======
            <Button
              size="small"
              icon={<PauseCircleOutlined />}
              onClick={() => handleUpdateAutomation(record.id, 'paused')}
            >
>>>>>>> 962968886be726cd434c792933b5515366d34518
              暂停
            </Button>
          )}
          {record.status === 'paused' && (
<<<<<<< HEAD
            <Button size="small" type="primary" icon={<PlayCircleOutlined />}
              onClick={() => handleUpdateAutomation(record.id, 'running')}>
              继续
            </Button>
          )}
          <Button size="small" type="link">详情</Button>
=======
            <Button
              size="small"
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => handleUpdateAutomation(record.id, 'running')}
            >
              继续
            </Button>
          )}
          <Button size="small" type="link">
            详情
          </Button>
>>>>>>> 962968886be726cd434c792933b5515366d34518
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <AimOutlined />
            智能获客中心
          </Space>
        }
        extra={
          <Space>
<<<<<<< HEAD
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setLeadModalVisible(true)}>
=======
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setLeadModalVisible(true)}
            >
>>>>>>> 962968886be726cd434c792933b5515366d34518
              添加线索
            </Button>
            <Button icon={<ThunderboltOutlined />} onClick={() => setAutomationModalVisible(true)}>
              创建自动化
            </Button>
          </Space>
        }
      >
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={4}>
            <Statistic title="线索总数" value={stats.totalLeads} prefix={<UserOutlined />} />
          </Col>
          <Col span={4}>
            <Statistic title="今日新增" value={stats.newLeads} valueStyle={{ color: '#52c41a' }} />
          </Col>
          <Col span={4}>
            <Statistic title="活跃任务" value={stats.activeTasks} prefix={<PlayCircleOutlined />} />
          </Col>
          <Col span={4}>
<<<<<<< HEAD
            <Statistic title="自动化任务" value={stats.totalAutomations} prefix={<RobotOutlined />} />
          </Col>
          <Col span={4}>
            <Statistic title="进行中" value={stats.activeAutomations} valueStyle={{ color: '#1890ff' }} />
=======
            <Statistic
              title="自动化任务"
              value={stats.totalAutomations}
              prefix={<RobotOutlined />}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="进行中"
              value={stats.activeAutomations}
              valueStyle={{ color: '#1890ff' }}
            />
>>>>>>> 962968886be726cd434c792933b5515366d34518
          </Col>
          <Col span={4}>
            <Button icon={<RobotOutlined />} onClick={handleBatchAnalyze} loading={aiLoading}>
              批量AI分析
            </Button>
          </Col>
        </Row>

        <Divider />

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
<<<<<<< HEAD
          <TabPane tab={<span><UserOutlined /> 线索管理</span>} key="leads">
=======
          <TabPane
            tab={
              <span>
                <UserOutlined /> 线索管理
              </span>
            }
            key="leads"
          >
>>>>>>> 962968886be726cd434c792933b5515366d34518
            <Space style={{ marginBottom: 16 }}>
              <Button icon={<BulbOutlined />} onClick={() => setStrategyModalVisible(true)}>
                AI获客策略
              </Button>
            </Space>
            <Table
              dataSource={leads}
              columns={leadColumns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
<<<<<<< HEAD
          <TabPane tab={<span><RobotOutlined /> 自动化任务</span>} key="automations">
=======
          <TabPane
            tab={
              <span>
                <RobotOutlined /> 自动化任务
              </span>
            }
            key="automations"
          >
>>>>>>> 962968886be726cd434c792933b5515366d34518
            <Table
              dataSource={automations}
              columns={automationColumns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
<<<<<<< HEAD
          <TabPane tab={<span><BulbOutlined /> AI策略</span>} key="strategy">
=======
          <TabPane
            tab={
              <span>
                <BulbOutlined /> AI策略
              </span>
            }
            key="strategy"
          >
>>>>>>> 962968886be726cd434c792933b5515366d34518
            {strategyData ? (
              <div>
                <Card title="目标客户画像" size="small">
                  <Row gutter={16}>
                    <Col span={8}>
                      <Text type="secondary">年龄：</Text>
                      <Text strong>{strategyData.targetProfile?.age || '-'}</Text>
                    </Col>
                    <Col span={8}>
                      <Text type="secondary">性别：</Text>
                      <Text strong>{strategyData.targetProfile?.gender || '-'}</Text>
                    </Col>
                    <Col span={8}>
                      <Text type="secondary">地区：</Text>
                      <Text strong>{strategyData.targetProfile?.location || '-'}</Text>
                    </Col>
                  </Row>
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">兴趣标签：</Text>
                    {strategyData.targetProfile?.interests?.map((tag: string, i: number) => (
<<<<<<< HEAD
                      <Tag key={i} color="blue">{tag}</Tag>
=======
                      <Tag key={i} color="blue">
                        {tag}
                      </Tag>
>>>>>>> 962968886be726cd434c792933b5515366d34518
                    )) || '-'}
                  </div>
                </Card>

                <Card title="获客渠道" size="small" style={{ marginTop: 16 }}>
                  <List
                    dataSource={strategyData.channels}
                    renderItem={(item: any, i: number) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Badge count={i + 1} style={{ backgroundColor: '#1890ff' }} />}
                          title={item.name}
                          description={`权重: ${item.weight}% - ${item.reason}`}
                        />
                      </List.Item>
                    )}
                  />
                </Card>

                <Card title="内容策略" size="small" style={{ marginTop: 16 }}>
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary">推荐标题：</Text>
                    {strategyData.content?.headlines?.map((h: string, i: number) => (
                      <Tag key={i}>{h}</Tag>
                    ))}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary">内容钩子：</Text>
                    {strategyData.content?.hooks?.map((hook: string, i: number) => (
<<<<<<< HEAD
                      <Tag key={i} color="green">{hook}</Tag>
=======
                      <Tag key={i} color="green">
                        {hook}
                      </Tag>
>>>>>>> 962968886be726cd434c792933b5515366d34518
                    ))}
                  </div>
                  <div>
                    <Text type="secondary">行动号召：</Text>
                    <Text>{strategyData.content?.callsToAction}</Text>
                  </div>
                </Card>

                <Card title="标签建议" size="small" style={{ marginTop: 16 }}>
                  {strategyData.hashtags?.map((tag: string, i: number) => (
<<<<<<< HEAD
                    <Tag key={i} color={i < 3 ? 'blue' : 'default'}>#{tag}</Tag>
=======
                    <Tag key={i} color={i < 3 ? 'blue' : 'default'}>
                      #{tag}
                    </Tag>
>>>>>>> 962968886be726cd434c792933b5515366d34518
                  ))}
                </Card>

                <Card title="KPI指标" size="small" style={{ marginTop: 16 }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Statistic
                        title="目标线索成本"
                        value={strategyData.kpis?.cpl}
                        suffix="元/条"
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="预期转化率"
                        value={strategyData.kpis?.conversionRate}
                        suffix="%"
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="预期互动率"
                        value={strategyData.kpis?.engagementRate}
                        suffix="%"
                      />
                    </Col>
                  </Row>
                </Card>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 48 }}>
                <BulbOutlined style={{ fontSize: 48, color: '#ccc' }} />
                <p style={{ marginTop: 16, color: '#999' }}>暂无策略，点击上方按钮生成</p>
              </div>
            )}
          </TabPane>
        </Tabs>
      </Card>

      {/* 添加线索弹窗 */}
      <Modal
        title="添加线索"
        open={leadModalVisible}
        onCancel={() => {
          setLeadModalVisible(false);
          setSelectedLead(null);
        }}
        footer={null}
        width={500}
      >
        <Form form={leadForm} layout="vertical" onFinish={handleCreateLead}>
          <Form.Item name="name" label="姓名">
            <Input placeholder="客户姓名" />
          </Form.Item>
<<<<<<< HEAD
          <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
=======
          <Form.Item
            name="phone"
            label="手机号"
            rules={[{ required: true, message: '请输入手机号' }]}
          >
>>>>>>> 962968886be726cd434c792933b5515366d34518
            <Input placeholder="手机号码" />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input placeholder="电子邮箱" />
          </Form.Item>
          <Form.Item name="source" label="来源">
            <Select placeholder="选择来源">
              <Select.Option value="organic">自然流量</Select.Option>
              <Select.Option value="douyin">抖音</Select.Option>
              <Select.Option value="wechat">微信</Select.Option>
              <Select.Option value="xiaohongshu">小红书</Select.Option>
              <Select.Option value="sms">短信</Select.Option>
              <Select.Option value="scan_qr">扫码</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <TextArea rows={3} placeholder="其他备注信息..." />
          </Form.Item>
<<<<<<< HEAD
          <Button type="primary" htmlType="submit" block>保存</Button>
=======
          <Button type="primary" htmlType="submit" block>
            保存
          </Button>
>>>>>>> 962968886be726cd434c792933b5515366d34518
        </Form>
      </Modal>

      {/* 创建自动化弹窗 */}
      <Modal
        title="创建获客自动化"
        open={automationModalVisible}
        onCancel={() => setAutomationModalVisible(false)}
        onOk={() => automationForm.submit()}
        width={600}
      >
        <Form form={automationForm} layout="vertical" onFinish={handleCreateAutomation}>
          <Form.Item name="name" label="任务名称" rules={[{ required: true }]}>
            <Input placeholder="例如：抖音精准获客活动" />
          </Form.Item>
          <Form.Item name="platform" label="目标平台" rules={[{ required: true }]}>
            <Select placeholder="选择目标平台">
              <Select.Option value="douyin">抖音</Select.Option>
              <Select.Option value="wechat">微信</Select.Option>
              <Select.Option value="xiaohongshu">小红书</Select.Option>
              <Select.Option value="all">全平台</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="targetCount" label="目标线索数">
            <InputNumber min={10} max={10000} defaultValue={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="productInfo" label="产品信息" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="描述您的产品或服务..." />
          </Form.Item>
          <Form.Item name="targetAudience" label="目标受众">
            <TextArea rows={2} placeholder="描述您的目标客户画像..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* AI策略生成弹窗 */}
      <Modal
        title="AI获客策略生成"
        open={strategyModalVisible}
        onCancel={() => setStrategyModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={strategyForm} layout="vertical">
          <Form.Item name="productInfo" label="产品信息" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="详细描述您的产品或服务..." />
          </Form.Item>
          <Form.Item name="targetAudience" label="目标受众" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="描述您希望吸引的客户类型..." />
          </Form.Item>
          <Space>
<<<<<<< HEAD
            <Button type="primary" onClick={() => strategyForm.validateFields().then(handleGenerateStrategy)} loading={aiLoading}>
=======
            <Button
              type="primary"
              onClick={() => strategyForm.validateFields().then(handleGenerateStrategy)}
              loading={aiLoading}
            >
>>>>>>> 962968886be726cd434c792933b5515366d34518
              生成策略
            </Button>
            <Button onClick={handleGenerateContent} loading={aiLoading}>
              生成内容创意
            </Button>
          </Space>
        </Form>
      </Modal>

      {/* 内容创意弹窗 */}
      <Modal
        title="AI生成的内容创意"
        open={contentModalVisible}
        onCancel={() => setContentModalVisible(false)}
        footer={null}
        width={700}
      >
        <Timeline>
          {contentIdeas.map((idea, i) => (
            <Timeline.Item key={i}>
              <Card size="small" title={idea.title}>
                <p>{idea.content}</p>
                <div>
                  {idea.hashtags?.map((tag: string, j: number) => (
<<<<<<< HEAD
                    <Tag key={j} color="blue">#{tag}</Tag>
=======
                    <Tag key={j} color="blue">
                      #{tag}
                    </Tag>
>>>>>>> 962968886be726cd434c792933b5515366d34518
                  ))}
                </div>
              </Card>
            </Timeline.Item>
          ))}
        </Timeline>
      </Modal>
    </div>
  );
};

export default AcquisitionPage;
