'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Select,
  Tag,
  Space,
  message,
  Popconfirm,
  Statistic,
  Row,
  Col,
  Typography,
  Divider,
  Alert
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  MessageOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import request from '@/utils/request';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// 平台列表
const PLATFORMS = [
  { id: 'douyin', name: '抖音' },
  { id: 'kuaishou', name: '快手' },
  { id: 'xiaohongshu', name: '小红书' },
  { id: 'channels', name: '视频号' },
  { id: 'weibo', name: '微博' },
  { id: 'boss', name: 'BOSS直聘' },
  { id: 'liepin', name: '前程无忧' },
  { id: 'zhilian', name: '智联招聘' },
];

interface ReplyRule {
  id: string;
  platform: string;
  keyword: string;
  replyContent: string;
  enabled: boolean;
  createdAt: string;
  matchCount?: number;
}

export default function AutoReplyPage() {
  const [rules, setRules] = useState<ReplyRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<ReplyRule | null>(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    totalRules: 0,
    activeRules: 0,
    totalReplies: 0,
    todayReplies: 0,
  });

  // 加载规则列表
  const loadRules = async () => {
    setLoading(true);
    try {
      const res = await request.get('/api/auto-reply/rules');
      if (res.code === 0) {
        setRules(res.data.items || []);
      }
    } catch (error) {
      message.error('加载规则失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载统计数据
  const loadStats = async () => {
    try {
      const res = await request.get('/api/auto-reply/stats');
      if (res.code === 0) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('加载统计失败', error);
    }
  };

  useEffect(() => {
    loadRules();
    loadStats();
  }, []);

  // 创建/编辑规则
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const res = editingRule
        ? await request.put(`/api/auto-reply/rules/${editingRule.id}`, values)
        : await request.post('/api/auto-reply/rules', values);
      
      if (res.code === 0) {
        message.success(editingRule ? '规则更新成功' : '规则创建成功');
        setModalVisible(false);
        form.resetFields();
        setEditingRule(null);
        loadRules();
        loadStats();
      } else {
        message.error(res.message || '操作失败');
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 删除规则
  const handleDelete = async (ruleId: string) => {
    try {
      const res = await request.delete(`/api/auto-reply/rules/${ruleId}`);
      if (res.code === 0) {
        message.success('规则删除成功');
        loadRules();
        loadStats();
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 切换启用状态
  const handleToggle = async (ruleId: string, enabled: boolean) => {
    try {
      const res = await request.post(`/api/auto-reply/rules/${ruleId}/toggle`);
      if (res.code === 0) {
        message.success(enabled ? '规则已启用' : '规则已禁用');
        loadRules();
        loadStats();
      } else {
        message.error('操作失败');
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 打开编辑弹窗
  const openEditModal = (rule?: ReplyRule) => {
    if (rule) {
      setEditingRule(rule);
      form.setFieldsValue(rule);
    } else {
      setEditingRule(null);
      form.resetFields();
    }
    setModalVisible(true);
  };

  // 表格列定义
  const columns = [
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string) => {
        const p = PLATFORMS.find(p => p.id === platform);
        return <Tag color="blue">{p?.name || platform}</Tag>;
      },
    },
    {
      title: '关键词',
      dataIndex: 'keyword',
      key: 'keyword',
      render: (keyword: string) => <Text strong>{keyword}</Text>,
    },
    {
      title: '回复内容',
      dataIndex: 'replyContent',
      key: 'replyContent',
      ellipsis: true,
    },
    {
      title: '匹配次数',
      dataIndex: 'matchCount',
      key: 'matchCount',
      render: (count: number) => count || 0,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record: ReplyRule) => (
        <Switch
          checked={enabled}
          onChange={(checked) => handleToggle(record.id, checked)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ReplyRule) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此规则？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={4}>自动回复</Title>
      <Text type="secondary">配置关键词自动回复规则，当用户发送包含关键词的消息时自动回复</Text>
      
      <Divider />

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="规则总数"
              value={stats.totalRules}
              prefix={<MessageOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="启用规则"
              value={stats.activeRules}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总回复次数"
              value={stats.totalReplies}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日回复"
              value={stats.todayReplies}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 提示信息 */}
      <Alert
        message="提示"
        description="自动回复功能正在开发中，请先绑定社交账号并确保平台支持消息接收功能。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* 规则列表 */}
      <Card
        title="回复规则"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditModal()}>
            添加规则
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={rules}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条规则`,
          }}
        />
      </Card>

      {/* 创建/编辑弹窗 */}
      <Modal
        title={editingRule ? '编辑规则' : '添加规则'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingRule(null);
        }}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ enabled: true }}
        >
          <Form.Item
            name="platform"
            label="平台"
            rules={[{ required: true, message: '请选择平台' }]}
          >
            <Select placeholder="请选择平台">
              {PLATFORMS.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="keyword"
            label="关键词"
            rules={[{ required: true, message: '请输入关键词' }]}
          >
            <Input placeholder="当用户发送包含此关键词时触发回复" />
          </Form.Item>

          <Form.Item
            name="replyContent"
            label="回复内容"
            rules={[{ required: true, message: '请输入回复内容' }]}
          >
            <TextArea
              rows={4}
              placeholder="请输入自动回复的内容"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="enabled"
            label="启用状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
