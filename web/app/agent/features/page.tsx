'use client';

import React, { useState } from 'react';
import {
  Card,
  Table,
  Switch,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Popconfirm,
  message,
  Tooltip,
  Typography,
} from 'antd';
import {
  BulbOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

// 功能开关数据
const initialFeatures = [
  { id: 1, name: '自媒体运营', key: 'media', enabled: true, description: 'AI内容生成、批量发布、数据统计' },
  { id: 2, name: '招聘助手', key: 'recruitment', enabled: true, description: '职位发布、简历筛选、自动回复' },
  { id: 3, name: '智能获客', key: 'acquisition', enabled: true, description: '潜客发现、引流任务、数据分析' },
  { id: 4, name: '推荐分享', key: 'share', enabled: false, description: '二维码生成、推荐追踪' },
  { id: 5, name: '转介绍', key: 'referral', enabled: false, description: '推荐奖励、佣金提现' },
  { id: 6, name: 'AI智能创作', key: 'ai', enabled: true, description: '文本、图片、视频、数字人生成' },
  { id: 7, name: '素材库', key: 'materials', enabled: true, description: '统一素材管理' },
  { id: 8, name: '数字人', key: 'digital_human', enabled: false, description: '数字人视频生成' },
];

export default function AgentFeaturesPage() {
  const [features, setFeatures] = useState(initialFeatures);
  const [searchText, setSearchText] = useState('');

  const handleToggle = (id: number, enabled: boolean) => {
    setFeatures(features.map(f => 
      f.id === id ? { ...f, enabled } : f
    ));
    message.success(enabled ? '功能已开启' : '功能已关闭');
  };

  const handleBatchEnable = (enable: boolean) => {
    setFeatures(features.map(f => ({ ...f, enabled: enable })));
    message.success(enable ? '已批量开启' : '已批量关闭');
  };

  const columns: ColumnsType<any> = [
    {
      title: '功能名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <Space>
          <Text strong>{name}</Text>
          <Tag color={record.enabled ? 'green' : 'default'}>
            {record.enabled ? '已开启' : '已关闭'}
          </Tag>
        </Space>
      ),
    },
    {
      title: '功能说明',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => <Text type="secondary">{desc}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled: boolean) => (
        enabled ? 
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} /> : 
          <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Switch 
          checked={record.enabled} 
          onChange={(checked) => handleToggle(record.id, checked)}
        />
      ),
    },
  ];

  const filteredFeatures = features.filter(f => 
    f.name.includes(searchText) || f.description.includes(searchText)
  );

  const enabledCount = features.filter(f => f.enabled).length;

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <BulbOutlined />
            <span>功能开关管理</span>
          </Space>
        }
        extra={
          <Space>
            <Input
              placeholder="搜索功能"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
            />
            <Popconfirm
              title="确认批量开启所有功能？"
              onConfirm={() => handleBatchEnable(true)}
            >
              <Button type="primary">批量开启</Button>
            </Popconfirm>
            <Popconfirm
              title="确认批量关闭所有功能？"
              onConfirm={() => handleBatchEnable(false)}
            >
              <Button danger>批量关闭</Button>
            </Popconfirm>
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">已开启 {enabledCount}/{features.length} 个功能</Text>
        </div>

        <Table
          columns={columns}
          dataSource={filteredFeatures}
          rowKey="id"
          pagination={false}
        />

        <div style={{ marginTop: 24, padding: 16, background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
          <Title level={5} style={{ margin: 0 }}>💡 说明</Title>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
            <li>开启/关闭功能后，终端客户刷新页面即可看到变化</li>
            <li>批量操作将对所有功能生效，请谨慎操作</li>
            <li>如需更精细的控制，请到租户管理中单独设置</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
