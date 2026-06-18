'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Table,
  Tag,
  Select,
  message,
  Modal,
  Checkbox,
  Input,
  Form,
  DatePicker,
  Radio,
  Drawer,
  List,
  Divider,
  Tooltip,
  Popconfirm,
  Avatar,
  Empty,
  Alert,
  Spin,
  Tabs,
  Badge,
  Timeline,
  Statistic,
} from 'antd';
import type { UploadFile } from 'antd';
import {
  SendOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  CalendarOutlined,
  ReloadOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  SyncOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  RocketOutlined,
  SafetyOutlined,
  HeartOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { ContentCategory } from '@/lib/content/types';

// 内容类型配置
const contentTypes = [
  { key: ContentCategory.XIAOHONGSHU, label: '小红书图文', icon: <HeartOutlined />, color: '#FF2442' },
  { key: ContentCategory.VIDEO, label: '短视频', icon: <VideoCameraOutlined />, color: '#1890FF' },
  { key: ContentCategory.DIGITAL_HUMAN, label: '数字人短视频', icon: <RobotOutlined />, color: '#722ED1' },
];

// 内容素材接口
interface Material {
  id: string;
  category: ContentCategory;
  title: string;
  content: string;
  tags?: string[];
  status: 'unused' | 'used';
  timestamp: number;
  mediaUrl?: string;
  thumbnailUrl?: string;
  metadata?: any;
}

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

// 只支持4个平台
const supportedPlatforms = [
  { key: 'douyin', name: '抖音', icon: '🎵', color: '#fe2c55' },
  { key: 'kuaishou', name: '快手', icon: '📹', color: '#ff4906' },
  { key: 'xiaohongshu', name: '小红书', icon: '📕', color: '#ff2442' },
  { key: 'video', name: '视频号', icon: '🎬', color: '#07c160' },
];

// 矩阵账号接口
interface MatrixAccount {
  id: string;
  platform: string;
  platformName: string;
  accountId: string;
  accountName: string;
  avatar?: string;
  fans?: number;
  status: 'active' | 'expired' | 'error';
  isEnabled: boolean;
}

interface PublishTask {
  id: string;
  materialId: string;
  title: string;
  content: string;
  type: ContentCategory;
  tags?: string[];
  thumbnail?: string;
  platforms: PlatformPublish[];
  status: 'pending' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'partially_failed';
  scheduledAt?: string;
  publishedAt?: string;
  results: PublishResult[];
  error?: string;
  createdAt: string;
}

interface PlatformPublish {
  platform: string;
  accountId: string;
  accountName: string;
  status: 'pending' | 'publishing' | 'success' | 'failed';
  error?: string;
  publishedUrl?: string;
  publishedId?: string;
}

interface PublishResult {
  platform: string;
  accountId: string;
  accountName: string;
  status: 'success' | 'failed';
  publishedUrl?: string;
  publishedId?: string;
  error?: string;
  publishedAt?: string;
}

interface Stats {
  totalTasks: number;
  published: number;
  failed: number;
  scheduled: number;
  todayPublished: number;
}

export default function PublishCenterPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [matrixAccounts, setMatrixAccounts] = useState<MatrixAccount[]>([]);
  const [tasks, setTasks] = useState<PublishTask[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // 发布表单状态
  const [publishModalVisible, setPublishModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<Record<string, string[]>>({});
  const [publishMode, setPublishMode] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledTime, setScheduledTime] = useState<Dayjs | null>(null);
  const [publishing, setPublishing] = useState(false);

  // 详情抽屉
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<PublishTask | null>(null);

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 加载素材（从内容工厂）
      const savedMaterials = localStorage.getItem('ai_materials');
      if (savedMaterials) {
        const allMaterials = JSON.parse(savedMaterials);
        const filtered = allMaterials.filter((m: Material) =>
          [ContentCategory.XIAOHONGSHU, ContentCategory.VIDEO, ContentCategory.DIGITAL_HUMAN].includes(m.category)
        );
        setMaterials(filtered);
      }

      // 加载矩阵账号
      const savedAccounts = localStorage.getItem('matrix_accounts');
      if (savedAccounts) {
        const accounts = JSON.parse(savedAccounts);
        // 只保留支持的4个平台
        const filtered = accounts.filter((a: MatrixAccount) =>
          supportedPlatforms.some(p => p.key === a.platform) && a.isEnabled
        );
        setMatrixAccounts(filtered);
      } else {
        // 无本地存储数据时显示空状态
        setMatrixAccounts([]);
      }

      // 加载发布任务
      const savedTasks = localStorage.getItem('publish_tasks');
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      } else {
        setTasks([]);
      }

      // 更新统计
      updateStats();
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStats = () => {
    const savedTasks = localStorage.getItem('publish_tasks');
    const taskList = savedTasks ? JSON.parse(savedTasks) : tasks;

    const today = dayjs().startOf('day');
    setStats({
      totalTasks: taskList.length,
      published: taskList.filter((t: PublishTask) => t.status === 'published').length,
      failed: taskList.filter((t: PublishTask) => t.status === 'failed').length,
      scheduled: taskList.filter((t: PublishTask) => t.status === 'scheduled').length,
      todayPublished: taskList.filter((t: PublishTask) =>
        t.status === 'published' && dayjs(t.publishedAt).isAfter(today)
      ).length,
    });
  };

  // 选择素材
  const handleSelectMaterial = (materialId: string) => {
    const material = materials.find(m => m.id === materialId);
    if (material) {
      setSelectedMaterial(material);
      form.setFieldsValue({
        title: material.title,
        content: material.content,
        tags: material.tags?.join(', '),
      });
    }
  };

  // 平台选择变化
  const handlePlatformChange = (platforms: string[]) => {
    setSelectedPlatforms(platforms);
    // 自动选择每个平台的第一个账号
    const accountsMap: Record<string, string[]> = {};
    platforms.forEach(p => {
      const platformAccounts = matrixAccounts.filter(a => a.platform === p && a.status === 'active');
      if (platformAccounts.length > 0) {
        accountsMap[p] = [platformAccounts[0].id];
      }
    });
    setSelectedAccounts(accountsMap);
  };

  // 发布
  const handlePublish = async () => {
    try {
      const values = await form.validateFields();

      if (!selectedMaterial) {
        message.error('请选择要发布的内容');
        return;
      }

      if (selectedPlatforms.length === 0) {
        message.error('请选择至少一个发布平台');
        return;
      }

      // 检查每个平台是否都选择了账号
      const hasAnyAccount = Object.values(selectedAccounts).some(arr => arr.length > 0);
      if (!hasAnyAccount) {
        message.error('请为每个平台选择至少一个账号');
        return;
      }

      if (publishMode === 'scheduled' && !scheduledTime) {
        message.error('请选择定时发布时间');
        return;
      }

      // 构建发布任务
      const newTask: PublishTask = {
        id: `task_${Date.now()}`,
        materialId: selectedMaterial.id,
        title: selectedMaterial.title,
        content: selectedMaterial.content,
        type: selectedMaterial.category,
        tags: selectedMaterial.tags,
        platforms: selectedPlatforms.flatMap(platform => {
          const accounts = selectedAccounts[platform] || [];
          return accounts.map(accountId => {
            const account = matrixAccounts.find(a => a.id === accountId);
            return {
              platform,
              accountId,
              accountName: account?.accountName || '',
              status: 'pending' as const,
            };
          });
        }),
        status: publishMode === 'immediate' ? 'publishing' : 'scheduled',
        scheduledAt: publishMode === 'scheduled' ? scheduledTime?.toISOString() : undefined,
        results: [],
        createdAt: new Date().toISOString(),
      };

      // 保存任务
      const savedTasks = localStorage.getItem('publish_tasks');
      const taskList = savedTasks ? JSON.parse(savedTasks) : [];
      taskList.unshift(newTask);
      localStorage.setItem('publish_tasks', JSON.stringify(taskList));

      // 更新素材状态
      const savedMaterials = localStorage.getItem('ai_materials');
      if (savedMaterials) {
        const allMaterials = JSON.parse(savedMaterials);
        const updated = allMaterials.map((m: Material) =>
          m.id === selectedMaterial.id ? { ...m, status: 'used' } : m
        );
        localStorage.setItem('ai_materials', JSON.stringify(updated));
      }

      message.success(publishMode === 'immediate' ? '发布任务已创建' : '定时发布任务已创建');
      setPublishModalVisible(false);
      form.resetFields();
      setSelectedMaterial(null);
      setSelectedPlatforms([]);
      setSelectedAccounts({});
      setPublishMode('immediate');
      setScheduledTime(null);
      loadData();
    } catch (error: any) {
      console.error('发布失败:', error);
      message.error(error.message || '创建发布任务失败');
    }
  };

  // 删除任务
  const handleDelete = (taskId: string) => {
    const savedTasks = localStorage.getItem('publish_tasks');
    if (savedTasks) {
      const taskList = JSON.parse(savedTasks);
      const updated = taskList.filter((t: PublishTask) => t.id !== taskId);
      localStorage.setItem('publish_tasks', JSON.stringify(updated));
    }
    setTasks(prev => prev.filter(t => t.id !== taskId));
    message.success('删除成功');
    updateStats();
  };

  // 查看详情
  const handleViewDetail = (task: PublishTask) => {
    setSelectedTask(task);
    setDetailDrawerVisible(true);
  };

  // 获取状态标签
  const getStatusTag = (status: string) => {
    const config: Record<string, { color: string; text: string }> = {
      pending: { color: 'default', text: '待发布' },
      scheduled: { color: 'processing', text: '定时中' },
      publishing: { color: 'processing', text: '发布中' },
      published: { color: 'success', text: '已发布' },
      failed: { color: 'error', text: '失败' },
      partially_failed: { color: 'warning', text: '部分失败' },
    };
    const { color, text } = config[status] || config.pending;
    return <Tag color={color}>{text}</Tag>;
  };

  // 过滤任务
  const filteredTasks = (taskList: PublishTask[]) => {
    if (activeTab === 'all') return taskList;
    if (activeTab === 'published') return taskList.filter(t => t.status === 'published');
    if (activeTab === 'failed') return taskList.filter(t => t.status === 'failed');
    if (activeTab === 'scheduled') return taskList.filter(t => t.status === 'scheduled');
    return taskList;
  };

  // 表格列
  const columns = [
    {
      title: '内容',
      key: 'content',
      render: (_: any, record: PublishTask) => {
        const typeConfig = contentTypes.find(t => t.key === record.type);
        return (
          <div>
            <Text strong>{record.title}</Text>
            <div style={{ marginTop: 4 }}>
              <Space size={4}>
                <Tag icon={typeConfig?.icon} color={typeConfig?.color}>
                  {typeConfig?.label}
                </Tag>
                {record.tags && record.tags.length > 0 && (
                  <Text type="secondary">
                    {record.tags.slice(0, 2).join(', ')}
                    {record.tags.length > 2 && '...'}
                  </Text>
                )}
              </Space>
            </div>
          </div>
        );
      },
    },
    {
      title: '发布平台',
      key: 'platforms',
      width: 280,
      render: (_: any, record: PublishTask) => (
        <Space wrap size={4}>
          {record.platforms.map((p, i) => {
            const platform = supportedPlatforms.find(pl => pl.key === p.platform);
            return (
              <Tag
                key={i}
                color={platform?.color}
                style={{ opacity: p.status === 'failed' ? 0.5 : 1 }}
              >
                {platform?.icon} {p.accountName}
                {p.status === 'success' && ' ✅'}
                {p.status === 'failed' && ' ❌'}
                {p.status === 'publishing' && ' ⏳'}
              </Tag>
            );
          })}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: PublishTask) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Popconfirm
            title="确认删除此发布任务？"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 获取可用素材
  const availableMaterials = materials.filter(m => m.status === 'unused');

  return (
    <div style={{ padding: 24 }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          发布中心
        </Title>
        <Text type="secondary">将内容工厂生成的内容一键发布到各大平台</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card hoverable>
            <Statistic title="总发布任务" value={stats?.totalTasks || 0} prefix={<RocketOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic title="今日发布" value={stats?.todayPublished || 0} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic title="已发布" value={stats?.published || 0} valueStyle={{ color: '#1890ff' }} prefix={<SafetyOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic title="失败" value={stats?.failed || 0} valueStyle={{ color: '#ff4d4f' }} prefix={<ExclamationCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      {/* 快捷操作 */}
      <Card style={{ marginBottom: 24 }}>
        <Space size="large">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setPublishModalVisible(true)}>
            创建发布任务
          </Button>
          <Text type="secondary">|</Text>
          <Text type="secondary">已绑定 {matrixAccounts.filter(a => a.status === 'active').length} 个账号</Text>
          <Text type="secondary">|</Text>
          <Text type="secondary">待发布 {availableMaterials.length} 条内容</Text>
        </Space>
      </Card>

      {/* 发布任务列表 */}
      <Card
        title="发布任务"
        tabList={[
          { key: 'all', tab: '全部' },
          { key: 'published', tab: '已发布' },
          { key: 'failed', tab: '失败' },
          { key: 'scheduled', tab: '定时' },
        ]}
        activeTabKey={activeTab}
        onTabChange={setActiveTab}
        extra={
          <Button icon={<ReloadOutlined />} onClick={loadData}>
            刷新
          </Button>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : filteredTasks(tasks).length === 0 ? (
          <Empty description="暂无发布任务" image={Empty.PRESENTED_IMAGE_SIMPLE}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setPublishModalVisible(true)}>
              创建第一个发布任务
            </Button>
          </Empty>
        ) : (
          <Table
            dataSource={filteredTasks(tasks)}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      {/* 创建发布任务弹窗 - 平铺显示 */}
      <Modal
        title="创建发布任务"
        open={publishModalVisible}
        onCancel={() => {
          setPublishModalVisible(false);
          form.resetFields();
          setSelectedMaterial(null);
          setSelectedPlatforms([]);
          setSelectedAccounts({});
          setPublishMode('immediate');
          setScheduledTime(null);
        }}
        footer={null}
        width={1000}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          {/* 第一行：内容类型 + 内容选择 */}
          <Row gutter={16}>
            {/* 内容类型 */}
            <Col span={6}>
              <Form.Item label="内容类型" required>
                <Select
                  placeholder="选择内容类型"
                  value={selectedMaterial?.category}
                  onChange={(value) => {
                    // 切换类型时清空已选内容
                    setSelectedMaterial(null);
                    form.setFieldValue('title', '');
                    form.setFieldValue('content', '');
                  }}
                >
                  {contentTypes.map(type => (
                    <Select.Option key={type.key} value={type.key}>
                      <Space>
                        <Tag icon={type.icon} color={type.color}>
                          {type.label}
                        </Tag>
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            {/* 内容选择 */}
            <Col span={18}>
              <Form.Item label="选择内容" required>
                <Select
                  placeholder="从素材库选择内容"
                  value={selectedMaterial?.id}
                  onChange={(id) => {
                    const material = availableMaterials.find(m => m.id === id);
                    setSelectedMaterial(material || null);
                    if (material) {
                      form.setFieldValue('title', material.title);
                      form.setFieldValue('content', material.content);
                      form.setFieldValue('tags', material.tags?.join(',') || '');
                    }
                  }}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {availableMaterials.map(material => (
                    <Select.Option key={material.id} value={material.id} label={material.title}>
                      <Space>
                        <Tag color={contentTypes.find(t => t.key === material.category)?.color}>
                          {contentTypes.find(t => t.key === material.category)?.label}
                        </Tag>
                        <Text>{material.title}</Text>
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* 第二行：标题 + 内容 */}
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="title"
                label="标题"
                rules={[{ required: true, message: '请输入标题' }]}
              >
                <Input placeholder="输入内容标题" maxLength={100} showCount />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="content"
                label="内容"
                rules={[{ required: true, message: '请输入内容' }]}
              >
                <TextArea
                  placeholder="输入内容正文..."
                  rows={4}
                  maxLength={2000}
                  showCount
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 第三行：课题/标签 + 发布方式 */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="tags" label="课题/标签">
                <Input placeholder="多个标签用逗号分隔" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="发布方式">
                <Radio.Group value={publishMode} onChange={e => setPublishMode(e.target.value)}>
                  <Space>
                    <Radio value="immediate">
                      <Space>
                        <SendOutlined />
                        <span>立即发布</span>
                      </Space>
                    </Radio>
                    <Radio value="scheduled">
                      <Space>
                        <ClockCircleOutlined />
                        <span>定时发布</span>
                      </Space>
                    </Radio>
                  </Space>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          {/* 定时发布时间 */}
          {publishMode === 'scheduled' && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="定时时间" required>
                  <DatePicker
                    showTime
                    format="YYYY-MM-DD HH:mm"
                    placeholder="选择发布时间"
                    disabledDate={current => current && current < dayjs().endOf('minute')}
                    value={scheduledTime}
                    onChange={setScheduledTime}
                    minuteStep={15}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Divider />

          {/* 第四行：平台选择 */}
          <Form.Item label="选择平台" required>
            <Checkbox.Group
              value={selectedPlatforms}
              onChange={(values) => handlePlatformChange(values as string[])}
            >
              <Row gutter={[16, 8]}>
                {supportedPlatforms.map(platform => {
                  const platformAccounts = matrixAccounts.filter(a => a.platform === platform.key && a.status === 'active');
                  const hasAccounts = platformAccounts.length > 0;
                  return (
                    <Col key={platform.key} span={6}>
                      <Checkbox value={platform.key} disabled={!hasAccounts}>
                        <Space direction="vertical" size={0}>
                          <Space>
                            <span>{platform.icon}</span>
                            <span>{platform.name}</span>
                          </Space>
                          {hasAccounts ? (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {platformAccounts.length}个账号
                            </Text>
                          ) : (
                            <Text type="danger" style={{ fontSize: 12 }}>
                              暂无可用账号
                            </Text>
                          )}
                        </Space>
                      </Checkbox>
                    </Col>
                  );
                })}
              </Row>
            </Checkbox.Group>
          </Form.Item>

          {/* 每个平台的账号选择 */}
          {selectedPlatforms.map(platformKey => {
            const platform = supportedPlatforms.find(p => p.key === platformKey);
            const platformAccounts = matrixAccounts.filter(a => a.platform === platformKey && a.status === 'active');
            return (
              <Form.Item key={platformKey} label={`${platform?.name || platformKey} 账号`}>
                <Checkbox.Group
                  value={selectedAccounts[platformKey] || []}
                  onChange={values => setSelectedAccounts({ ...selectedAccounts, [platformKey]: values as string[] })}
                >
                  <Row gutter={[8, 8]}>
                    {platformAccounts.map(account => (
                      <Col key={account.id} span={8}>
                        <Checkbox value={account.id}>
                          <Space>
                            <Avatar size="small" src={account.avatar}>
                              {platform?.icon}
                            </Avatar>
                            <span>{account.accountName}</span>
                            <Tag>{account.fans?.toLocaleString()}</Tag>
                          </Space>
                        </Checkbox>
                      </Col>
                    ))}
                  </Row>
                </Checkbox.Group>
                {platformAccounts.length === 0 && (
                  <Alert 
                    type="warning" 
                    message={`请先到矩阵管理绑定${platform?.name}账号`}
                    showIcon 
                    style={{ marginTop: 8 }}
                  />
                )}
              </Form.Item>
            );
          })}

          <Divider />

          {/* 操作按钮 */}
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setPublishModalVisible(false)}>
                取消
              </Button>
              <Button 
                type="primary" 
                icon={<SendOutlined />}
                loading={publishing}
                onClick={handlePublish}
              >
                {publishMode === 'immediate' ? '立即发布' : '确认定时'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 发布详情抽屉 */}
      <Drawer
        title="发布详情"
        placement="right"
        width={500}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
      >
        {selectedTask && (
          <div>
            <Card title="基本信息" size="small">
              <p><Text strong>标题：</Text>{selectedTask.title}</p>
              <p>
                <Text strong>类型：</Text>
                <Tag color={contentTypes.find(t => t.key === selectedTask.type)?.color}>
                  {contentTypes.find(t => t.key === selectedTask.type)?.label}
                </Tag>
              </p>
              <p><Text strong>状态：</Text>{getStatusTag(selectedTask.status)}</p>
              <p><Text strong>创建时间：</Text>{dayjs(selectedTask.createdAt).format('YYYY-MM-DD HH:mm:ss')}</p>
              {selectedTask.publishedAt && (
                <p><Text strong>发布时间：</Text>{dayjs(selectedTask.publishedAt).format('YYYY-MM-DD HH:mm:ss')}</p>
              )}
              {selectedTask.scheduledAt && (
                <p><Text strong>定时时间：</Text>{dayjs(selectedTask.scheduledAt).format('YYYY-MM-DD HH:mm:ss')}</p>
              )}
            </Card>

            {selectedTask.tags && selectedTask.tags.length > 0 && (
              <Card title="标签" size="small" style={{ marginTop: 16 }}>
                <Space wrap>
                  {selectedTask.tags.map(tag => (
                    <Tag key={tag} color="blue">{tag}</Tag>
                  ))}
                </Space>
              </Card>
            )}

            <Card title="发布内容" size="small" style={{ marginTop: 16 }}>
              <Text>{selectedTask.content}</Text>
              {selectedTask.thumbnail && (
                <div style={{ marginTop: 8 }}>
                  <img src={selectedTask.thumbnail} alt="缩略图" style={{ maxWidth: '100%', borderRadius: 8 }} />
                </div>
              )}
            </Card>

            <Card title="发布结果" size="small" style={{ marginTop: 16 }}>
              <Timeline
                items={selectedTask.platforms.map(p => {
                  const platform = supportedPlatforms.find(pl => pl.key === p.platform);
                  return {
                    color: p.status === 'success' ? 'green' : p.status === 'failed' ? 'red' : 'blue',
                    children: (
                      <div>
                        <Space>
                          <span style={{ fontSize: 16 }}>{platform?.icon}</span>
                          <Text strong>{p.accountName}</Text>
                          {p.status === 'success' && <Tag color="success">成功</Tag>}
                          {p.status === 'failed' && <Tag color="error">失败</Tag>}
                          {p.status === 'publishing' && <Tag color="processing">发布中</Tag>}
                          {p.status === 'pending' && <Tag color="default">待发布</Tag>}
                        </Space>
                        {p.publishedUrl && (
                          <div style={{ marginTop: 4 }}>
                            <a href={p.publishedUrl} target="_blank" rel="noopener noreferrer">
                              查看链接
                            </a>
                          </div>
                        )}
                        {p.error && (
                          <div style={{ marginTop: 4, color: '#ff4d4f' }}>
                            <Text type="danger">{p.error}</Text>
                          </div>
                        )}
                      </div>
                    ),
                  };
                })}
              />
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
}
