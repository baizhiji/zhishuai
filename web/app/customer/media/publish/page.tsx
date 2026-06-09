'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
  Upload,
  DatePicker,
  Radio,
  Drawer,
  List,
  Divider,
  Progress,
  Tooltip,
  Popconfirm,
  Avatar,
  Empty,
  InputNumber,
  Alert,
  Spin,
  Tabs,
  Badge,
  Timeline,
  Statistic,
} from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import {
  SendOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  UploadOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  CalendarOutlined,
  ReloadOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  SyncOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  RocketOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import request from '@/utils/request';
import { useAuth } from '@/contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Dragger } = Upload;

interface PublishTask {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'digital-human';
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

interface Account {
  id: string;
  platform: string;
  platformName: string;
  accountId: string;
  accountName: string;
  avatar?: string;
  fans?: number;
  status: 'active' | 'expired' | 'error';
}

interface Stats {
  totalTasks: number;
  published: number;
  failed: number;
  scheduled: number;
  todayPublished: number;
}

const platformConfig: Record<string, { name: string; icon: string; color: string }> = {
  douyin: { name: '抖音', icon: '🎵', color: '#fe2c55' },
  kuaishou: { name: '快手', icon: '📹', color: '#ff4906' },
  xiaohongshu: { name: '小红书', icon: '📕', color: '#ff2442' },
  weibo: { name: '微博', icon: '🌐', color: '#e6162d' },
  bili: { name: '哔哩哔哩', icon: '📺', color: '#00a1d6' },
  toutiao: { name: '今日头条', icon: '📰', color: '#ff6900' },
};

export default function PublishCenterPage() {
  const { user } = useAuth();
  const userId = user?.id || 'default';
  
  const [tasks, setTasks] = useState<PublishTask[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  
  // 发布表单状态
  const [publishModalVisible, setPublishModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<Record<string, string[]>>({});
  const [contentType, setContentType] = useState<'text' | 'image' | 'video' | 'digital-human'>('text');
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [publishing, setPublishing] = useState(false);
  
  // 详情抽屉
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<PublishTask | null>(null);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, accountsRes, statsRes] = await Promise.all([
        request.get('/publish/tasks', { params: { userId } }),
        request.get('/social/accounts', { params: { userId } }),
        request.get('/publish/stats', { params: { userId } }),
      ]);

      if (tasksRes.success || tasksRes.code === 0) {
        setTasks(tasksRes.data?.list || tasksRes.data || []);
      }
      if (accountsRes.code === 0) {
        setAccounts(accountsRes.data || []);
      }
      if (statsRes.success || statsRes.code === 0) {
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
      // 使用演示数据
      setTasks([
        {
          id: '1',
          title: 'AI创作技巧分享',
          content: '今天分享几个AI创作的小技巧...',
          type: 'text',
          platforms: [
            { platform: 'douyin', accountId: '1', accountName: '智枢AI官方', status: 'success', publishedUrl: 'https://douyin.com/xxx' },
            { platform: 'xiaohongshu', accountId: '2', accountName: 'AI创作助手', status: 'success', publishedUrl: 'https://xiaohongshu.com/xxx' },
          ],
          status: 'published',
          publishedAt: new Date().toISOString(),
          results: [],
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: '新品发布预告',
          content: '智枢AI SaaS系统新品发布...',
          type: 'image',
          thumbnail: 'https://picsum.photos/200',
          platforms: [
            { platform: 'douyin', accountId: '1', accountName: '智枢AI官方', status: 'publishing' },
            { platform: 'kuaishou', accountId: '3', accountName: '快手号', status: 'pending' },
          ],
          status: 'publishing',
          results: [],
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          title: '端午节活动',
          content: '端午节限时优惠活动...',
          type: 'text',
          platforms: [
            { platform: 'weibo', accountId: '4', accountName: '微博账号', status: 'failed', error: '内容审核未通过' },
          ],
          status: 'failed',
          error: '内容审核未通过',
          results: [],
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
      setAccounts([
        { id: '1', platform: 'douyin', platformName: '抖音', accountId: '1', accountName: '智枢AI官方', status: 'active', fans: 12580 },
        { id: '2', platform: 'xiaohongshu', platformName: '小红书', accountId: '2', accountName: 'AI创作助手', status: 'active', fans: 8650 },
        { id: '3', platform: 'kuaishou', platformName: '快手', accountId: '3', accountName: '快手号', status: 'active', fans: 5600 },
        { id: '4', platform: 'weibo', platformName: '微博', accountId: '4', accountName: '微博账号', status: 'expired' },
      ]);
      setStats({
        totalTasks: 3,
        published: 1,
        failed: 1,
        scheduled: 0,
        todayPublished: 2,
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handlePublish = async () => {
    try {
      const values = await form.validateFields();
      
      // 构建发布请求
      const publishData = {
        title: values.title,
        content: values.content,
        type: contentType,
        platforms: selectedAccounts,
        scheduledAt: values.scheduledAt?.toISOString(),
      };

      setPublishing(true);
      
      const res = await request.post('/publish/tasks', publishData);
      
      if (res.success || res.code === 0) {
        message.success('发布任务已创建');
        setPublishModalVisible(false);
        form.resetFields();
        setFiles([]);
        setSelectedPlatforms([]);
        setSelectedAccounts({});
        fetchData();
      } else {
        message.error(res.error || res.message || '创建发布任务失败');
      }
    } catch (error: any) {
      console.error('发布失败:', error);
      message.error(error.message || '创建发布任务失败');
    } finally {
      setPublishing(false);
    }
  };

  const handleRetry = async (taskId: string) => {
    try {
      const res = await request.post(`/publish/tasks/${taskId}/retry`);
      if (res.success || res.code === 0) {
        message.success('重新发布任务已创建');
        fetchData();
      } else {
        message.error(res.error || '重试失败');
      }
    } catch (error) {
      message.error('重试失败');
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      const res = await request.delete(`/publish/tasks/${taskId}`);
      if (res.success || res.code === 0) {
        message.success('删除成功');
        fetchData();
      } else {
        message.error(res.error || '删除失败');
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleViewDetail = (task: PublishTask) => {
    setSelectedTask(task);
    setDetailDrawerVisible(true);
  };

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

  const getPlatformStatus = (status: string) => {
    const config: Record<string, { color: string; icon: React.ReactNode }> = {
      pending: { color: 'default', icon: <ClockCircleOutlined /> },
      publishing: { color: 'processing', icon: <SyncOutlined spin /> },
      success: { color: 'success', icon: <CheckCircleOutlined /> },
      failed: { color: 'error', icon: <ExclamationCircleOutlined /> },
    };
    const { color, icon } = config[status] || config.pending;
    return <Badge status={color as any} icon={icon} text={platformConfig[status]?.name || status} />;
  };

  const filteredTasks = useMemo(() => {
    if (activeTab === 'all') return tasks;
    if (activeTab === 'published') return tasks.filter(t => t.status === 'published');
    if (activeTab === 'failed') return tasks.filter(t => t.status === 'failed');
    if (activeTab === 'scheduled') return tasks.filter(t => t.status === 'scheduled');
    return tasks;
  }, [tasks, activeTab]);

  const columns = [
    {
      title: '内容',
      key: 'content',
      render: (_: any, record: PublishTask) => (
        <div>
          <Text strong>{record.title}</Text>
          <div style={{ marginTop: 4 }}>
            <Space size={4}>
              <Tag icon={record.type === 'text' ? <FileTextOutlined /> : record.type === 'image' ? <PictureOutlined /> : <VideoCameraOutlined />}>
                {record.type === 'text' ? '图文' : record.type === 'image' ? '图片' : record.type === 'video' ? '视频' : '数字人'}
              </Tag>
              <Text type="secondary" ellipsis style={{ maxWidth: 300 }}>
                {record.content.slice(0, 100)}...
              </Text>
            </Space>
          </div>
        </div>
      ),
    },
    {
      title: '发布平台',
      key: 'platforms',
      width: 250,
      render: (_: any, record: PublishTask) => (
        <Space wrap>
          {record.platforms.map((p, i) => (
            <Tag 
              key={i} 
              icon={platformConfig[p.platform]?.icon ? <span>{platformConfig[p.platform]?.icon}</span> : undefined}
              color={platformConfig[p.platform]?.color}
              style={{ opacity: p.status === 'failed' ? 0.5 : 1 }}
            >
              {p.accountName} {p.status === 'success' ? '✅' : p.status === 'failed' ? '❌' : p.status === 'publishing' ? '⏳' : ''}
            </Tag>
          ))}
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
          {record.status === 'failed' && (
            <Button type="link" size="small" icon={<ReloadOutlined />} onClick={() => handleRetry(record.id)}>
              重试
            </Button>
          )}
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

  const handlePlatformChange = (platforms: string[]) => {
    setSelectedPlatforms(platforms);
    // 初始化每个平台的账号选择
    const accountsMap: Record<string, string[]> = {};
    platforms.forEach(p => {
      const platformAccounts = accounts.filter(a => a.platform === p && a.status === 'active');
      if (platformAccounts.length > 0) {
        accountsMap[p] = [platformAccounts[0].id];
      }
    });
    setSelectedAccounts(accountsMap);
  };

  return (
    <div style={{ padding: 24 }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          🚀 内容发布中心
        </Title>
        <Text type="secondary">一键发布内容到多个平台，追踪发布状态和效果数据</Text>
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
          <Text type="secondary">已绑定 {accounts.filter(a => a.status === 'active').length} 个账号</Text>
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
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            刷新
          </Button>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <Empty description="暂无发布任务" image={Empty.PRESENTED_IMAGE_SIMPLE}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setPublishModalVisible(true)}>
              创建第一个发布任务
            </Button>
          </Empty>
        ) : (
          <Table 
            dataSource={filteredTasks} 
            columns={columns} 
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      {/* 创建发布任务弹窗 */}
      <Modal
        title="创建发布任务"
        open={publishModalVisible}
        onCancel={() => setPublishModalVisible(false)}
        onOk={handlePublish}
        okText={publishing ? '发布中...' : '立即发布'}
        confirmLoading={publishing}
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item label="内容类型" required>
            <Radio.Group value={contentType} onChange={e => setContentType(e.target.value)}>
              <Radio.Button value="text"><FileTextOutlined /> 图文</Radio.Button>
              <Radio.Button value="image"><PictureOutlined /> 图片</Radio.Button>
              <Radio.Button value="video"><VideoCameraOutlined /> 视频</Radio.Button>
              <Radio.Button value="digital-human">数字人</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="输入内容标题" maxLength={100} showCount />
          </Form.Item>

          <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入内容' }]}>
            <TextArea 
              placeholder="输入内容正文..." 
              rows={6} 
              maxLength={2000} 
              showCount 
            />
          </Form.Item>

          {(contentType === 'image' || contentType === 'video') && (
            <Form.Item label="上传文件">
              <Dragger
                fileList={files}
                onChange={({ fileList }) => setFiles(fileList)}
                beforeUpload={() => false}
                maxCount={contentType === 'video' ? 1 : 9}
              >
                <p className="ant-upload-drag-icon">
                  {contentType === 'video' ? <VideoCameraOutlined /> : <PictureOutlined />}
                </p>
                <p className="ant-upload-text">点击或拖拽上传{contentType === 'video' ? '视频' : '图片'}</p>
                <p className="ant-upload-hint">
                  {contentType === 'video' ? '支持 MP4 格式，大小不超过 500MB' : '支持 JPG、PNG 格式，最多 9 张'}
                </p>
              </Dragger>
            </Form.Item>
          )}

          <Form.Item label="选择平台" required>
            <Select
              mode="multiple"
              placeholder="选择要发布的平台"
              value={selectedPlatforms}
              onChange={handlePlatformChange}
            >
              {Object.entries(platformConfig).map(([key, config]) => {
                const platformAccounts = accounts.filter(a => a.platform === key && a.status === 'active');
                return (
                  <Select.Option key={key} value={key} disabled={platformAccounts.length === 0}>
                    <Space>
                      <span>{config.icon}</span>
                      <span>{config.name}</span>
                      <Tag>{platformAccounts.length}个账号</Tag>
                    </Space>
                  </Select.Option>
                );
              })}
            </Select>
          </Form.Item>

          {selectedPlatforms.map(platform => (
            <Form.Item key={platform} label={`${platformConfig[platform]?.name || platform} 账号`}>
              <Select
                mode="multiple"
                placeholder={`选择 ${platformConfig[platform]?.name} 账号`}
                value={selectedAccounts[platform]}
                onChange={values => setSelectedAccounts({ ...selectedAccounts, [platform]: values })}
              >
                {accounts
                  .filter(a => a.platform === platform && a.status === 'active')
                  .map(account => (
                    <Select.Option key={account.id} value={account.id}>
                      <Space>
                        <Avatar size="small" src={account.avatar}>
                          {platformConfig[platform]?.icon}
                        </Avatar>
                        <span>{account.accountName}</span>
                        <Tag>{account.fans?.toLocaleString()} 粉丝</Tag>
                      </Space>
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>
          ))}

          <Divider />

          <Form.Item name="scheduledAt" label="定时发布">
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              placeholder="留空则立即发布"
              disabledDate={current => current && current < dayjs().endOf('minute')}
              style={{ width: '100%' }}
            />
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
              <p><Text strong>类型：</Text>{getStatusTag(selectedTask.type)}</p>
              <p><Text strong>状态：</Text>{getStatusTag(selectedTask.status)}</p>
              <p><Text strong>创建时间：</Text>{dayjs(selectedTask.createdAt).format('YYYY-MM-DD HH:mm:ss')}</p>
              {selectedTask.publishedAt && (
                <p><Text strong>发布时间：</Text>{dayjs(selectedTask.publishedAt).format('YYYY-MM-DD HH:mm:ss')}</p>
              )}
            </Card>

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
                items={selectedTask.platforms.map(p => ({
                  color: p.status === 'success' ? 'green' : p.status === 'failed' ? 'red' : 'blue',
                  children: (
                    <div>
                      <Space>
                        <span style={{ fontSize: 16 }}>{platformConfig[p.platform]?.icon}</span>
                        <Text strong>{p.accountName}</Text>
                        {p.status === 'success' && <Tag color="success">成功</Tag>}
                        {p.status === 'failed' && <Tag color="error">失败</Tag>}
                        {p.status === 'publishing' && <Tag color="processing">发布中</Tag>}
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
                }))}
              />
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
}
