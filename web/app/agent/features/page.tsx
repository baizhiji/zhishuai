'use client'

import React, { useState } from 'react'
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Switch,
  Input,
  Select,
  Modal,
  Form,
  message,
  Row,
  Col,
  Typography,
  Tooltip,
  Popconfirm,
  Divider
} from 'antd'
import {
  SaveOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography
const { Option } = Select

// 功能类型定义
interface FeatureItem {
  id: string
  name: string
  module: string
  description: string
  enabled: boolean
  defaultEnabled: boolean
}

// 客户功能设置类型
interface ClientFeature {
  clientId: string
  clientName: string
  features: Record<string, boolean>
}

// Mock 功能列表
const mockFeatures: FeatureItem[] = [
  {
    id: '1',
    name: '自媒体运营',
    module: '自媒体',
    description: 'AI内容生成、多平台发布、数据统计',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: '2',
    name: '内容工厂',
    module: '自媒体',
    description: '热点/行业内容批量生成',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: '3',
    name: '矩阵管理',
    module: '自媒体',
    description: '多平台账号统一管理',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: '4',
    name: '发布中心',
    module: '自媒体',
    description: '批量发布、定时发布',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: '5',
    name: '数据报表',
    module: '自媒体',
    description: '发布数据、播放分析、粉丝统计',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: '6',
    name: '数字人仓库',
    module: '自媒体',
    description: '数字人视频管理',
    enabled: false,
    defaultEnabled: false
  },
  {
    id: '7',
    name: '招聘助手',
    module: '招聘',
    description: '职位发布、简历筛选、自动回复',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: '8',
    name: '职位发布',
    module: '招聘',
    description: '一键发布到多招聘平台',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: '9',
    name: '简历筛选',
    module: '招聘',
    description: 'AI智能筛选、自动沟通',
    enabled: true,
    defaultEnabled: false
  },
  {
    id: '10',
    name: '自动回复',
    module: '招聘',
    description: '智能话术、自动回复候选人',
    enabled: true,
    defaultEnabled: false
  },
  {
    id: '11',
    name: '面试管理',
    module: '招聘',
    description: '面试安排、日程提醒',
    enabled: true,
    defaultEnabled: false
  },
  {
    id: '12',
    name: '招聘看板',
    module: '招聘',
    description: '招聘数据统计、分析报表',
    enabled: true,
    defaultEnabled: false
  },
  {
    id: '13',
    name: '智能获客',
    module: '获客',
    description: '潜客发现、精准引流',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: '14',
    name: '潜客发现',
    module: '获客',
    description: '行业采集、关键词搜索',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: '15',
    name: '引流任务',
    module: '获客',
    description: '批量发送、自动化引流',
    enabled: true,
    defaultEnabled: false
  },
  {
    id: '16',
    name: '获客看板',
    module: '获客',
    description: '获客数据、转化分析',
    enabled: true,
    defaultEnabled: false
  },
  {
    id: '17',
    name: '推荐分享',
    module: '推荐',
    description: '二维码生成、推荐追踪',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: '18',
    name: '码生成',
    module: '推荐',
    description: '短视频专属推广二维码',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: '19',
    name: '推荐追踪',
    module: '推荐',
    description: '扫码统计、效果分析',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: '20',
    name: '推荐看板',
    module: '推荐',
    description: '推荐数据统计',
    enabled: true,
    defaultEnabled: false
  },
  {
    id: '21',
    name: '转介绍',
    module: '推荐',
    description: '邀请奖励、佣金提现',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: '22',
    name: '数据大盘',
    module: '数据',
    description: '全模块数据汇总、可视化分析',
    enabled: true,
    defaultEnabled: true
  }
]

// Mock 客户列表
const mockClients = [
  { id: '1', name: '张经理', company: '上海某科技有限公司' },
  { id: '2', name: '李总监', company: '杭州某网络公司' },
  { id: '3', name: '王主管', company: '北京某文化传媒' }
]

// Mock 客户功能设置
const mockClientFeatures: Record<string, Record<string, boolean>> = {
  '1': { '1': true, '2': true, '3': true, '4': true, '5': true, '6': false, '7': true, '8': true, '9': true, '10': true, '11': true, '12': true, '13': true, '14': true, '15': true, '16': true, '17': true, '18': true, '19': true, '20': true, '21': true, '22': true },
  '2': { '1': true, '2': true, '3': true, '4': true, '5': true, '6': true, '7': true, '8': true, '9': true, '10': true, '11': true, '12': true, '13': true, '14': true, '15': true, '16': true, '17': true, '18': true, '19': true, '20': true, '21': true, '22': true },
  '3': { '1': true, '2': true, '3': false, '4': false, '5': false, '6': false, '7': true, '8': true, '9': false, '10': false, '11': false, '12': false, '13': true, '14': true, '15': false, '16': false, '17': true, '18': true, '19': true, '20': false, '21': false, '22': true }
}

export default function FeatureManagement() {
  const [features, setFeatures] = useState<FeatureItem[]>(mockFeatures)
  const [clientFeatures, setClientFeatures] = useState<Record<string, Record<string, boolean>>>(mockClientFeatures)
  const [selectedClient, setSelectedClient] = useState<string>('1')
  const [searchText, setSearchText] = useState('')
  const [moduleFilter, setModuleFilter] = useState<string>('all')
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [form] = Form.useForm()

  // 获取当前选中客户的功能设置
  const currentFeatures = clientFeatures[selectedClient] || {}

  // 按模块分组
  const modules = [...new Set(features.map(f => f.module))]

  // 筛选功能
  const filteredFeatures = features.filter(f => {
    const matchesSearch = searchText === '' || 
      f.name.includes(searchText) ||
      f.description.includes(searchText)
    const matchesModule = moduleFilter === 'all' || f.module === moduleFilter
    return matchesSearch && matchesModule
  })

  // 切换客户功能开关
  const handleToggle = (featureId: string, enabled: boolean) => {
    setClientFeatures(prev => ({
      ...prev,
      [selectedClient]: {
        ...prev[selectedClient],
        [featureId]: enabled
      }
    }))
    message.success(`功能已${enabled ? '开启' : '关闭'}`)
  }

  // 批量开启/关闭
  const handleBatchToggle = (module: string, enabled: boolean) => {
    setClientFeatures(prev => {
      const newFeatures = { ...prev[selectedClient] }
      features
        .filter(f => f.module === module)
        .forEach(f => {
          newFeatures[f.id] = enabled
        })
      return {
        ...prev,
        [selectedClient]: newFeatures
      }
    })
    message.success(`已${enabled ? '开启' : '关闭'}该模块所有功能`)
  }

  // 应用到所有客户
  const handleApplyToAll = () => {
    form.validateFields().then(values => {
      const newClientFeatures: Record<string, Record<string, boolean>> = {}
      mockClients.forEach(c => {
        newClientFeatures[c.id] = {}
        features.forEach(f => {
          newClientFeatures[c.id][f.id] = values.defaultEnabled
        })
      })
      setClientFeatures(newClientFeatures)
      setEditModalVisible(false)
      message.success('已应用为默认设置')
    })
  }

  // 重置为默认
  const handleResetToDefault = () => {
    const newClientFeatures = { ...clientFeatures }
    features.forEach(f => {
      if (!newClientFeatures[selectedClient]) {
        newClientFeatures[selectedClient] = {}
      }
      newClientFeatures[selectedClient][f.id] = f.defaultEnabled
    })
    setClientFeatures(newClientFeatures)
    message.success('已恢复为默认设置')
  }

  const columns: ColumnsType<FeatureItem> = [
    {
      title: '功能名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: FeatureItem) => (
        <div>
          <div style={{ fontWeight: 500 }}>{name}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.description}</Text>
        </div>
      )
    },
    {
      title: '所属模块',
      dataIndex: 'module',
      key: 'module',
      filters: modules.map(m => ({ text: m, value: m })),
      onFilter: (value, record) => record.module === value,
      render: (module: string) => {
        const colors: Record<string, string> = {
          '自媒体': 'blue',
          '招聘': 'purple',
          '获客': 'orange',
          '推荐': 'cyan',
          '数据': 'green'
        }
        return <Tag color={colors[module]}>{module}</Tag>
      }
    },
    {
      title: '默认状态',
      dataIndex: 'defaultEnabled',
      key: 'defaultEnabled',
      render: (enabled: boolean) => (
        enabled ? 
          <Tag color="success" icon={<CheckCircleOutlined />}>默认开启</Tag> :
          <Tag color="default" icon={<CloseCircleOutlined />}>默认关闭</Tag>
      )
    },
    {
      title: '当前状态',
      key: 'currentEnabled',
      render: (_, record) => {
        const enabled = currentFeatures[record.id] ?? record.defaultEnabled
        return (
          <Switch
            checked={enabled}
            onChange={(checked) => handleToggle(record.id, checked)}
            checkedChildren="开"
            unCheckedChildren="关"
          />
        )
      }
    }
  ]

  // 模块统计
  const moduleStats = modules.map(module => ({
    module,
    total: features.filter(f => f.module === module).length,
    enabled: features.filter(f => f.module === module && (currentFeatures[f.id] ?? f.defaultEnabled)).length
  }))

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">功能开关管理</Title>
        <Text type="secondary">为每个客户单独设置功能权限，开关后客户即刻生效</Text>
      </div>

      {/* 客户选择 */}
      <Card className="mb-4">
        <Space>
          <Text>选择客户：</Text>
          <Select 
            value={selectedClient}
            onChange={setSelectedClient}
            style={{ width: 300 }}
            placeholder="请选择客户"
          >
            {mockClients.map(c => (
              <Option key={c.id} value={c.id}>
                {c.name} - {c.company}
              </Option>
            ))}
          </Select>
          <Button icon={<ReloadOutlined />} onClick={handleResetToDefault}>
            恢复默认
          </Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={() => {
            message.success('设置已保存')
          }}>
            保存设置
          </Button>
        </Space>
      </Card>

      {/* 模块统计 */}
      <Row gutter={16} className="mb-4">
        {moduleStats.map(stat => (
          <Col span={4} key={stat.module}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#1890ff' }}>
                  {stat.enabled}/{stat.total}
                </div>
                <div>{stat.module}</div>
                <Space size={4} className="mt-2">
                  <Button size="small" type="link" onClick={() => handleBatchToggle(stat.module, true)}>
                    全开
                  </Button>
                  <Button size="small" type="link" onClick={() => handleBatchToggle(stat.module, false)}>
                    全关
                  </Button>
                </Space>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 功能列表 */}
      <Card>
        <Space className="mb-4">
          <Input 
            placeholder="搜索功能名称/描述" 
            prefix={<SearchOutlined />} 
            style={{ width: 200 }}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
          />
          <Select 
            placeholder="筛选模块" 
            style={{ width: 120 }} 
            value={moduleFilter}
            onChange={setModuleFilter}
          >
            <Option value="all">全部模块</Option>
            {modules.map(m => (
              <Option key={m} value={m}>{m}</Option>
            ))}
          </Select>
        </Space>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredFeatures}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`
          }}
        />
      </Card>

      {/* 默认设置弹窗 */}
      <Modal
        title="设置默认功能"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleApplyToAll}
        okText="应用"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item 
            name="defaultEnabled" 
            label="新客户默认功能"
            valuePropName="checked"
          >
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>
          <Text type="secondary">
            设置后，新注册的客户的默认功能将按此规则自动配置。
            已有的客户不受影响。
          </Text>
        </Form>
      </Modal>
    </div>
  )
}
