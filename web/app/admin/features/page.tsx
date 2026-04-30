'use client'

import React, { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Typography,
  Table,
  Switch,
  Space,
  Button,
  Tag,
  Modal,
  message,
  Tooltip,
  Divider
} from 'antd'
import {
  AppstoreOutlined,
  GlobalOutlined,
  TeamOutlined,
  TrophyOutlined,
  ShareAltOutlined,
  RobotOutlined,
  QuestionCircleOutlined,
  SaveOutlined,
  UnorderedListOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography

// 功能类型
interface Feature {
  key: string
  name: string
  icon: React.ReactNode
  description: string
  defaultEnabled: boolean
  enabled: boolean
  modules: {
    name: string
    description: string
    enabled: boolean
  }[]
}

// Mock 数据
const mockFeatures: Feature[] = [
  {
    key: 'media',
    name: '自媒体运营',
    icon: <GlobalOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
    description: 'AI内容生成、矩阵管理、批量发布、数据统计',
    defaultEnabled: true,
    enabled: true,
    modules: [
      { name: '内容工厂', description: 'AI批量生成内容', enabled: true },
      { name: '矩阵管理', description: '多平台账号管理', enabled: true },
      { name: '发布中心', description: '批量发布、定时发布', enabled: true },
      { name: '数字人仓库', description: '数字人视频管理', enabled: true },
      { name: '数据报表', description: '发布数据统计', enabled: true }
    ]
  },
  {
    key: 'recruitment',
    name: '招聘助手',
    icon: <TeamOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
    description: '职位发布、简历筛选、自动回复、面试管理',
    defaultEnabled: true,
    enabled: true,
    modules: [
      { name: '职位发布', description: '多平台职位发布', enabled: true },
      { name: '简历筛选', description: 'AI简历匹配', enabled: true },
      { name: '自动回复', description: '话术模板、自动回复', enabled: true },
      { name: '面试管理', description: '面试安排、反馈评估', enabled: true },
      { name: '招聘看板', description: '招聘数据统计', enabled: true }
    ]
  },
  {
    key: 'acquisition',
    name: '智能获客',
    icon: <TrophyOutlined style={{ fontSize: 24, color: '#faad14' }} />,
    description: '潜客发现、引流任务、数据统计',
    defaultEnabled: true,
    enabled: true,
    modules: [
      { name: '潜客发现', description: '行业采集、关键词搜索', enabled: true },
      { name: '引流任务', description: '批量发送、二维码发送', enabled: true },
      { name: '获客看板', description: '转化数据统计', enabled: true }
    ]
  },
  {
    key: 'referral',
    name: '转介绍',
    icon: <ShareAltOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
    description: '推荐码、佣金提现、推荐追踪',
    defaultEnabled: true,
    enabled: true,
    modules: [
      { name: '我的推荐', description: '推荐码、推广链接', enabled: true },
      { name: '佣金提现', description: '提现申请、记录查询', enabled: true },
      { name: '推荐排行榜', description: 'Top排名展示', enabled: true }
    ]
  },
  {
    key: 'share',
    name: '推荐分享',
    icon: <AppstoreOutlined style={{ fontSize: 24, color: '#eb2f96' }} />,
    description: '二维码生成、推荐追踪、分享看板',
    defaultEnabled: true,
    enabled: true,
    modules: [
      { name: '码生成', description: '短视频专属二维码', enabled: true },
      { name: '推荐追踪', description: '扫码数据追踪', enabled: true },
      { name: '推荐看板', description: '分享数据统计', enabled: true }
    ]
  }
]

export default function FeatureControl() {
  const [features, setFeatures] = useState<Feature[]>(mockFeatures)
  const [hasChanges, setHasChanges] = useState(false)

  // 切换功能总开关
  const handleToggleFeature = (key: string) => {
    setFeatures(prev => prev.map(f => 
      f.key === key 
        ? { 
            ...f, 
            enabled: !f.enabled,
            modules: f.modules.map(m => ({ ...m, enabled: !f.enabled }))
          }
        : f
    ))
    setHasChanges(true)
  }

  // 切换子模块
  const handleToggleModule = (featureKey: string, moduleName: string) => {
    setFeatures(prev => prev.map(f => 
      f.key === featureKey 
        ? { 
            ...f, 
            modules: f.modules.map(m => 
              m.name === moduleName ? { ...m, enabled: !m.enabled } : m
            )
          }
        : f
    ))
    setHasChanges(true)
  }

  // 批量开启/关闭
  const handleBatchToggle = (enabled: boolean) => {
    setFeatures(prev => prev.map(f => ({
      ...f,
      enabled,
      modules: f.modules.map(m => ({ ...m, enabled }))
    })))
    setHasChanges(true)
  }

  // 保存
  const handleSave = () => {
    message.success('功能开关配置已保存')
    setHasChanges(false)
  }

  const columns: ColumnsType<Feature> = [
    {
      title: '功能',
      key: 'feature',
      render: (_, record) => (
        <Space>
          {record.icon}
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.description}</Text>
          </div>
        </Space>
      )
    },
    {
      title: '子模块',
      key: 'modules',
      render: (_, record) => (
        <Space size={4} wrap>
          {record.modules.map(m => (
            <Tag 
              key={m.name}
              color={m.enabled ? 'blue' : 'default'}
              style={{ cursor: 'pointer', opacity: record.enabled ? 1 : 0.5 }}
              onClick={() => record.enabled && handleToggleModule(record.key, m.name)}
            >
              {m.name}
            </Tag>
          ))}
        </Space>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Switch 
          checked={record.enabled}
          onChange={() => handleToggleFeature(record.key)}
          checkedChildren="开启"
          unCheckedChildren="关闭"
        />
      )
    }
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">功能开关总控</Title>
        <Text type="secondary">全局功能字典，设置默认对所有租户开放/关闭</Text>
      </div>

      {/* 提示信息 */}
      <Card className="mb-4" style={{ background: '#f6f6f6', border: '1px solid #d9d9d9' }}>
        <Space>
          <QuestionCircleOutlined style={{ color: '#1890ff' }} />
          <Text type="secondary">
            提示：关闭某功能后，所有租户的该功能将被关闭（除非已单独设置）。子模块可以单独控制。
          </Text>
        </Space>
      </Card>

      {/* 批量操作 */}
      <Card className="mb-4" extra={
        <Space>
          <Button onClick={() => handleBatchToggle(true)}>全部开启</Button>
          <Button onClick={() => handleBatchToggle(false)}>全部关闭</Button>
          <Button 
            type="primary" 
            icon={<SaveOutlined />}
            disabled={!hasChanges}
            onClick={handleSave}
          >
            保存配置
          </Button>
        </Space>
      }>
        <Table
          rowKey="key"
          columns={columns}
          dataSource={features}
          pagination={false}
          footer={() => (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>
                共 <Text strong>{features.length}</Text> 个功能模块
              </Text>
              <Text>
                已开启 <Text strong style={{ color: '#52c41a' }}>{features.filter(f => f.enabled).length}</Text> 个
                ，已关闭 <Text strong style={{ color: '#ff4d4f' }}>{features.filter(f => !f.enabled).length}</Text> 个
              </Text>
            </div>
          )}
        />
      </Card>

      {/* 功能详情说明 */}
      <Card title="功能说明">
        <Row gutter={[16, 16]}>
          {features.map(f => (
            <Col span={12} key={f.key}>
              <Card size="small" title={
                <Space>
                  {f.icon}
                  <span>{f.name}</span>
                  <Tag color={f.enabled ? 'green' : 'default'}>
                    {f.enabled ? '已开启' : '已关闭'}
                  </Tag>
                </Space>
              }>
                <ul style={{ margin: 0, paddingLeft: 20, color: '#666' }}>
                  {f.modules.map(m => (
                    <li key={m.name}>
                      {m.name} - {m.description}
                    </li>
                  ))}
                </ul>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  )
}
