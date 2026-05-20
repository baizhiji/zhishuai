'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Form,
  Input,
  Select,
  Checkbox,
  Table,
  Tag,
  message,
  Modal,
  Upload,
  Divider,
  Progress,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  SendOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PictureOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import request from '@/utils/request';
import Link from 'next/link';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface Account {
  id: string;
  platform: string;
  platformName: string;
  accountName: string;
  status: string;
}

interface HistoryItem {
  id: string;
  title: string;
  content?: string;
  platform: string;
  accountName?: string;
  status: string;
  views: number;
  likes: number;
  publishedAt?: string;
  createdAt: string;
}

export default function PublishPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<'publish' | 'history'>('publish');
  const [publishResult, setPublishResult] = useState<any>(null);
  const [userId] = useState('default-user');

  useEffect(() => {
    fetchAccounts();
    fetchHistory();
  }, [userId]);

  const fetchAccounts = async () => {
    try {
      const res = await request.get('/content/accounts', {
        params: { userId }
      });
      if (res.code === 0) {
        setAccounts(res.data);
      }
    } catch (error) {
      console.error('获取账号失败:', error);
      // 使用演示数据
      setAccounts([
        { id: '1', platform: 'douyin', platformName: '抖音', accountName: '智枢AI官方', status: 'active' },
        { id: '2', platform: 'xiaohongshu', platformName: '小红书', accountName: '智枢AI助手', status: 'active' },
      ]);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await request.get('/content/history', {
        params: { userId }
      });
      if (res.code === 0) {
        setHistory(res.data.records || []);
      }
    } catch (error) {
      console.error('获取历史失败:', error);
      // 使用演示数据
      setHistory([
        {
          id: '1',
          title: 'AI赋能企业数字化转型',
          platform: 'douyin',
          accountName: '智枢AI官方',
          status: 'published',
          views: 12580,
          likes: 892,
          publishedAt: '2024-03-25 10:30:00',
          createdAt: '2024-03-25 10:30:00',
        },
      ]);
    }
  };

  const handlePublish = async (values: any) => {
    if (selectedAccounts.length === 0) {
      message.warning('请选择至少一个发布账号');
      return;
    }

    setPublishLoading(true);
    try {
      const res = await request.post('/content/publish', {
        userId,
        title: values.title,
        content: values.content,
        mediaUrls: values.mediaUrls,
        accountIds: selectedAccounts
      });

      if (res.code === 0) {
        setPublishResult(res.data);
        message.success(`发布成功！成功 ${res.data.summary.success} 个，失败 ${res.data.summary.failed} 个`);
        form.resetFields();
        setSelectedAccounts([]);
        fetchHistory();
      } else {
        message.error(res.message || '发布失败');
      }
    } catch (error) {
      message.error('发布失败');
    } finally {
      setPublishLoading(false);
    }
  };

  const handleAccountSelect = (accountId: string, checked: boolean) => {
    if (checked) {
      setSelectedAccounts([...selectedAccounts, accountId]);
    } else {
      setSelectedAccounts(selectedAccounts.filter(id => id !== accountId));
    }
  };

  const platformColumns = [
    {
      title: '平台',
      dataIndex: 'platformName',
      key: 'platformName',
      render: (name: string, record: Account) => (
        <Space>
          <span>{getPlatformIcon(record.platform)}</span>
          <span>{name}</span>
        </Space>
      )
    },
    {
      title: '账号',
      dataIndex: 'accountName',
      key: 'accountName'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '正常' : '异常'}
        </Tag>
      )
    },
    {
      title: '选择',
      key: 'select',
      render: (_: any, record: Account) => (
        <Checkbox
          checked={selectedAccounts.includes(record.id)}
          onChange={(e) => handleAccountSelect(record.id, e.target.checked)}
          disabled={record.status !== 'active'}
        />
      )
    }
  ];

  const historyColumns = [
    {
      title: '内容',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: HistoryItem) => (
        <div>
          <Text strong>{title}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {getPlatformIcon(record.platform)} {record.accountName}
          </Text>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'published' ? 'green' : 'orange'}>
          {status === 'published' ? '已发布' : '发布中'}
        </Tag>
      )
    },
    {
      title: '数据',
      key: 'stats',
      render: (_: any, record: HistoryItem) => (
        <Space>
          <span>👁 {record.views}</span>
          <span>❤️ {record.likes}</span>
        </Space>
      )
    },
    {
      title: '发布时间',
      dataIndex: 'publishedAt',
      key: 'publishedAt',
      render: (time: string) => time || '-'
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/media/matrix">
          <Button type="link">← 返回矩阵管理</Button>
        </Link>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size={0}>
          <Title level={4} style={{ margin: 0 }}>📤 内容发布中心</Title>
          <Text type="secondary">一键发布内容到多个社交平台</Text>
        </Space>
      </Card>

      {/* Tab切换 */}
      <Space style={{ marginBottom: 16 }}>
        <Button
          type={activeTab === 'publish' ? 'primary' : 'default'}
          onClick={() => setActiveTab('publish')}
        >
          发布内容
        </Button>
        <Button
          type={activeTab === 'history' ? 'primary' : 'default'}
          icon={<HistoryOutlined />}
          onClick={() => setActiveTab('history')}
        >
          发布历史
        </Button>
      </Space>

      {activeTab === 'publish' ? (
        <Row gutter={24}>
          {/* 左侧：发布表单 */}
          <Col span={16}>
            <Card title="发布内容">
              <Form
                form={form}
                layout="vertical"
                onFinish={handlePublish}
              >
                <Form.Item
                  name="title"
                  label="标题"
                  rules={[{ required: true, message: '请输入标题' }]}
                >
                  <Input placeholder="输入内容标题" maxLength={100} showCount />
                </Form.Item>

                <Form.Item
                  name="content"
                  label="内容"
                  rules={[{ required: true, message: '请输入内容' }]}
                >
                  <TextArea
                    rows={6}
                    placeholder="输入要发布的内容，支持多行文本..."
                    maxLength={2000}
                    showCount
                  />
                </Form.Item>

                <Form.Item
                  name="mediaUrls"
                  label="媒体附件"
                >
                  <Upload
                    beforeUpload={() => false}
                    multiple
                    listType="picture"
                    maxCount={9}
                  >
                    <Button icon={<UploadOutlined />}>上传图片/视频</Button>
                  </Upload>
                </Form.Item>

                <Form.Item label="发布平台">
                  <Text type="secondary">
                    已选择 {selectedAccounts.length} 个账号
                  </Text>
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SendOutlined />}
                    loading={publishLoading}
                    disabled={selectedAccounts.length === 0}
                    size="large"
                  >
                    立即发布
                  </Button>
                </Form.Item>
              </Form>
            </Card>

            {/* 发布结果 */}
            {publishResult && (
              <Card title="发布结果" style={{ marginTop: 16 }}>
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic
                      title="总计"
                      value={publishResult.summary?.total || 0}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="成功"
                      value={publishResult.summary?.success || 0}
                      valueStyle={{ color: '#52c41a' }}
                      prefix={<CheckCircleOutlined />}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="失败"
                      value={publishResult.summary?.failed || 0}
                      valueStyle={{ color: '#ff4d4f' }}
                      prefix={<CloseCircleOutlined />}
                    />
                  </Col>
                </Row>
              </Card>
            )}
          </Col>

          {/* 右侧：账号选择 */}
          <Col span={8}>
            <Card title="选择发布账号">
              {accounts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <Text type="secondary">暂无可用账号</Text>
                  <br />
                  <Link href="/media/matrix/accounts">
                    <Button type="link">去绑定账号</Button>
                  </Link>
                </div>
              ) : (
                <Table
                  columns={platformColumns}
                  dataSource={accounts}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              )}
            </Card>

            <Card title="发布提示" style={{ marginTop: 16 }}>
              <Space direction="vertical">
                <Paragraph type="secondary" style={{ fontSize: 12 }}>
                  1. 请确保已绑定的账号状态正常
                </Paragraph>
                <Paragraph type="secondary" style={{ fontSize: 12 }}>
                  2. 图片建议尺寸：抖音 1080×1920，快手 1080×1920，小红书 1:1 或 3:4
                </Paragraph>
                <Paragraph type="secondary" style={{ fontSize: 12 }}>
                  3. 视频建议时长：抖音 15秒-3分钟，快手 10秒-10分钟
                </Paragraph>
              </Space>
            </Card>
          </Col>
        </Row>
      ) : (
        /* 发布历史 */
        <Card>
          <Table
            columns={historyColumns}
            dataSource={history}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )}
    </div>
  );
}

function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    douyin: '🎵',
    kuaishou: '📹',
    xiaohongshu: '📕',
    weibo: '🌐'
  };
  return icons[platform] || '📱';
}
