'use client';

import React, { useState } from 'react';
import { Card, Typography, Space, Button, Table, Tag, Switch, Modal, Form, Input, Select, message } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, ClockCircleOutlined, SyncOutlined, PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import Link from 'next/link';

const { Title, Text, Paragraph } = Typography;

interface Task {
  id: string;
  name: string;
  content: string;
  platforms: string[];
  schedule: string;
  status: 'active' | 'paused' | 'completed';
  lastRun?: string;
  nextRun?: string;
}

export default function AutomationPage() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      name: '每日早安发布',
      content: '早安！新的一天，新的开始 #早安#',
      platforms: ['douyin', 'xiaohongshu'],
      schedule: '每天 08:00',
      status: 'active',
      lastRun: '2024-03-25 08:00',
      nextRun: '2024-03-26 08:00',
    },
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const handleToggleTask = (taskId: string, enabled: boolean) => {
    setTasks(tasks.map(t => 
      t.id === taskId ? { ...t, status: enabled ? 'active' : 'paused' } : t
    ));
    message.success(enabled ? '任务已启用' : '任务已暂停');
  };

  const handleAddTask = () => {
    setModalVisible(true);
  };

  const handleSubmitTask = () => {
    form.validateFields().then(values => {
      const newTask: Task = {
        id: Date.now().toString(),
        name: values.name,
        content: values.content,
        platforms: values.platforms,
        schedule: values.schedule,
        status: 'active',
        nextRun: '即将开始',
      };
      setTasks([...tasks, newTask]);
      setModalVisible(false);
      form.resetFields();
      message.success('自动化任务创建成功');
    });
  };

  const columns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: '发布内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '目标平台',
      dataIndex: 'platforms',
      key: 'platforms',
      render: (platforms: string[]) => (
        <Space>
          {platforms.map(p => (
            <Tag key={p} color="blue">{p}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '执行计划',
      dataIndex: 'schedule',
      key: 'schedule',
    },
    {
      title: '下次执行',
      dataIndex: 'nextRun',
      key: 'nextRun',
      render: (time: string) => (
        <Text type="secondary">
          <ClockCircleOutlined /> {time}
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: Task) => (
        <Switch
          checked={status === 'active'}
          onChange={(checked) => handleToggleTask(record.id, checked)}
          checkedChildren="运行中"
          unCheckedChildren="已暂停"
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Task) => (
        <Space>
          <Button type="link" size="small" icon={<PlayCircleOutlined />}>
            立即执行
          </Button>
          <Button type="link" danger size="small">
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/media/matrix">
          <Button type="link" icon={<ArrowLeftOutlined />}>
            返回矩阵管理
          </Button>
        </Link>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size={0}>
          <Title level={4} style={{ margin: 0 }}>⚡ 自动化任务</Title>
          <Text type="secondary">设置自动发布任务，解放双手</Text>
        </Space>
      </Card>

      <Card
        title="我的自动化任务"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTask}>
            创建任务
          </Button>
        }
      >
        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <SyncOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
            <Paragraph>暂无自动化任务</Paragraph>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTask}>
              创建第一个任务
            </Button>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={tasks}
            rowKey="id"
            pagination={false}
          />
        )}
      </Card>

      <Card title="常见自动化场景" style={{ marginTop: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Paragraph>
            <Text strong>📅 定时发布：</Text> 设置固定时间自动发布内容
          </Paragraph>
          <Paragraph>
            <Text strong>⏰ 周期任务：</Text> 每天/每周定时执行发布
          </Paragraph>
          <Paragraph>
            <Text strong>📈 数据触发：</Text> 当粉丝达到某数量时自动发布
          </Paragraph>
        </Space>
      </Card>

      {/* 创建任务弹窗 */}
      <Modal
        title="创建自动化任务"
        open={modalVisible}
        onOk={handleSubmitTask}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="任务名称" rules={[{ required: true }]}>
            <Input placeholder="例如：每日早安发布" />
          </Form.Item>
          <Form.Item name="content" label="发布内容" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="输入要发布的内容" />
          </Form.Item>
          <Form.Item name="platforms" label="目标平台" rules={[{ required: true }]}>
            <Select mode="multiple" placeholder="选择发布平台">
              <Select.Option value="douyin">抖音</Select.Option>
              <Select.Option value="kuaishou">快手</Select.Option>
              <Select.Option value="xiaohongshu">小红书</Select.Option>
              <Select.Option value="weibo">微博</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="schedule" label="执行计划" rules={[{ required: true }]}>
            <Select placeholder="选择执行频率">
              <Select.Option value="daily-8:00">每天 08:00</Select.Option>
              <Select.Option value="daily-12:00">每天 12:00</Select.Option>
              <Select.Option value="daily-20:00">每天 20:00</Select.Option>
              <Select.Option value="weekly">每周</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
