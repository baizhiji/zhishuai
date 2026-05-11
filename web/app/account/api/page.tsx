'use client'

import { useState } from 'react'
import { Card, Typography, Table, Tag, Button, Space, Form, Input, Select, Switch, Modal, message, Popconfirm, Tabs, Divider, Alert } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, SettingOutlined, GlobalOutlined } from '@ant-design/icons'

const { Title, Text } = Typography
const { TextArea } = Input

// API服务商配置
interface APIProvider {
  id: string
  name: string
  type: string
  apiKey: string
  baseUrl?: string
  status: 'active' | 'inactive'
  lastUsed?: string
  enabledModels: string[]
}

// 支持的模型配置
const AVAILABLE_MODELS = {
  aliyun: {
    name: '阿里云百炼',
    models: [
      { id: 'qwen-turbo', name: 'qwen-turbo', description: '日常对话、快速响应', type: 'text' },
      { id: 'qwen-plus', name: 'qwen-plus', description: '专业文案、长文本生成', type: 'text' },
      { id: 'qwen-long', name: 'qwen-long', description: '超长文本处理', type: 'text' },
      { id: 'deepseek-r1-0528', name: 'DeepSeek R1', description: '深度思考、复杂推理', type: 'reasoning' },
    ]
  },
  tencent: {
    name: '腾讯云TokenHub',
    models: [
      { id: 'hunyuan-2.0-instruct-20251111', name: '混元指令版', description: '日常对话、智能问答', type: 'text' },
      { id: 'hunyuan-2.0-thinking-20251109', name: '混元思考版', description: '复杂推理、数学问题', type: 'reasoning' },
      { id: 'kimi-k2.6', name: 'Kimi K2.6', description: '超长文本、报告生成', type: 'text' },
      { id: 'glm-5', name: 'GLM-5', description: 'Agent任务、代码生成', type: 'agent' },
      { id: 'glm-5v-turbo', name: 'GLM-5V Turbo', description: '图片理解、多模态', type: 'vision' },
      { id: 'youtu-vita', name: 'youtu-vita', description: '视频理解、视频分析', type: 'video' },
      { id: 'HY-Image-V3.0', name: 'HY-Image-V3.0', description: '高质量图像生成', type: 'image' },
      { id: 'YT-Video-HumanActor', name: '数字人视频', description: '数字人口播视频', type: 'digital_human' },
    ]
  }
}

export default function APIConfigPage() {
  const [form] = Form.useForm()
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingProvider, setEditingProvider] = useState<APIProvider | null>(null)
  const [selectedModels, setSelectedModels] = useState<string[]>([])

  // 初始服务商数据
  const [providers, setProviders] = useState<APIProvider[]>([
    {
      id: 'aliyun',
      name: '阿里云百炼',
      type: 'LLM',
      apiKey: '',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      status: 'inactive',
      enabledModels: ['qwen-turbo', 'qwen-plus', 'deepseek-r1-0528'],
    },
    {
      id: 'tencent',
      name: '腾讯云TokenHub',
      type: 'Multi-Modal',
      apiKey: '',
      baseUrl: 'https://tokenhub.cloud.tencent.com',
      status: 'inactive',
      enabledModels: ['hunyuan-2.0-instruct-20251111', 'glm-5v-turbo', 'youtu-vita', 'HY-Image-V3.0'],
    },
  ])

  // 计算费用统计
  const getUsageStats = () => {
    const activeProviders = providers.filter(p => p.status === 'active' && p.apiKey)
    const totalModels = activeProviders.reduce((acc, p) => acc + p.enabledModels.length, 0)
    return {
      activeProviders: activeProviders.length,
      totalModels,
      status: activeProviders.length > 0 ? '已配置' : '未配置',
    }
  }

  const stats = getUsageStats()

  // 列配置
  const columns = [
    { 
      title: '服务商', 
      dataIndex: 'name', 
      key: 'name',
      render: (name: string, record: APIProvider) => (
        <Space>
          <span>{name}</span>
          <Tag color={record.type === 'LLM' ? 'blue' : 'purple'}>{record.type}</Tag>
        </Space>
      )
    },
    { 
      title: 'API Key', 
      dataIndex: 'apiKey', 
      key: 'apiKey',
      render: (key: string) => key ? `${key.slice(0, 8)}...${key.slice(-4)}` : <Text type="secondary">未配置</Text>
    },
    { 
      title: '已启用模型', 
      dataIndex: 'enabledModels', 
      key: 'enabledModels',
      render: (models: string[]) => (
        <Space wrap>
          {models.slice(0, 3).map(m => <Tag key={m} color="green">{m}</Tag>)}
          {models.length > 3 && <Tag>+{models.length - 3}</Tag>}
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: APIProvider) => (
        <Tag color={record.apiKey && status === 'active' ? 'success' : 'default'}>
          {record.apiKey ? (status === 'active' ? '已启用' : '已禁用') : '未配置'}
        </Tag>
      ),
    },
    { 
      title: '最后使用', 
      dataIndex: 'lastUsed', 
      key: 'lastUsed',
      render: (time: string) => time || '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: APIProvider) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            配置
          </Button>
        </Space>
      ),
    },
  ]

  // 编辑服务商
  const handleEdit = (record: APIProvider) => {
    setEditingProvider(record)
    form.setFieldsValue({
      name: record.name,
      apiKey: record.apiKey,
      baseUrl: record.baseUrl,
      status: record.status === 'active',
      enabledModels: record.enabledModels,
    })
    setSelectedModels(record.enabledModels)
    setEditModalVisible(true)
  }

  // 保存配置
  const handleSave = () => {
    form.validateFields().then(values => {
      const updatedProviders = providers.map(p => {
        if (p.id === editingProvider?.id) {
          return {
            ...p,
            apiKey: values.apiKey,
            baseUrl: values.baseUrl,
            status: values.status ? 'active' as const : 'inactive' as const,
            enabledModels: selectedModels,
            lastUsed: values.apiKey ? new Date().toLocaleString('zh-CN') : p.lastUsed,
          }
        }
        return p
      })
      setProviders(updatedProviders)
      message.success('配置保存成功')
      setEditModalVisible(false)
    })
  }

  // 切换模型选择
  const toggleModel = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId) 
        ? prev.filter(m => m !== modelId)
        : [...prev, modelId]
    )
  }

  // 模型选择列表
  const renderModelSelector = (providerKey: 'aliyun' | 'tencent') => {
    const provider = AVAILABLE_MODELS[providerKey]
    return (
      <div style={{ marginTop: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 12 }}>选择启用模型</Text>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {provider.models.map(model => (
            <Tag
              key={model.id}
              color={selectedModels.includes(model.id) ? 'blue' : 'default'}
              style={{ 
                padding: '4px 12px', 
                cursor: 'pointer',
                border: selectedModels.includes(model.id) ? '2px solid #1890ff' : '1px solid #d9d9d9',
              }}
              onClick={() => toggleModel(model.id)}
            >
              {model.name} {selectedModels.includes(model.id) && <CheckOutlined />}
            </Tag>
          ))}
        </div>
        <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
          已选择 {selectedModels.filter(m => provider.models.some(pm => pm.id === m)).length} 个模型
        </Text>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Title level={2} className="mb-0">API服务商配置</Title>
          <Text type="secondary">配置AI服务商API Key，按实际使用量计费</Text>
        </div>
      </div>

      {/* 使用说明 */}
      <Alert
        message="配置说明"
        description={
          <div>
            <p>• API Key由客户自行在WEB端输入配置，费用由客户自行承担</p>
            <p>• 支持同时配置多个服务商，系统会自动选择最优模型</p>
            <p>• 启用模型后，该模型将可用于AI对话和内容生成</p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card size="small">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.activeProviders}</div>
            <div className="text-gray-500 text-sm">已配置服务商</div>
          </div>
        </Card>
        <Card size="small">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.totalModels}</div>
            <div className="text-gray-500 text-sm">已启用模型</div>
          </div>
        </Card>
        <Card size="small">
          <div className="text-center">
            <div className={`text-2xl font-bold ${stats.status === '已配置' ? 'text-green-600' : 'text-gray-400'}`}>
              {stats.status}
            </div>
            <div className="text-gray-500 text-sm">配置状态</div>
          </div>
        </Card>
      </div>

      {/* 服务商列表 */}
      <Card 
        title={
          <Space>
            <SettingOutlined />
            <span>服务商配置</span>
          </Space>
        }
        extra={
          <Text type="secondary">点击「配置」按钮添加API Key</Text>
        }
      >
        <Table 
          dataSource={providers} 
          columns={columns} 
          rowKey="id" 
          pagination={false}
          rowClassName={(record) => record.apiKey ? '' : 'bg-gray-50'}
        />
      </Card>

      {/* 模型说明 */}
      <Card 
        title={
          <Space>
            <GlobalOutlined />
            <span>支持的模型</span>
          </Space>
        }
        style={{ marginTop: 24 }}
      >
        <Tabs
          defaultActiveKey="aliyun"
          items={[
            {
              key: 'aliyun',
              label: AVAILABLE_MODELS.aliyun.name,
              children: (
                <div>
                  {AVAILABLE_MODELS.aliyun.models.map(model => (
                    <div key={model.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div>
                        <Tag color="blue">{model.id}</Tag>
                        <Text>{model.description}</Text>
                      </div>
                      <Tag color={
                        model.type === 'text' ? 'green' : 
                        model.type === 'reasoning' ? 'orange' : 'purple'
                      }>
                        {model.type === 'text' ? '文本生成' : 
                         model.type === 'reasoning' ? '深度推理' : model.type}
                      </Tag>
                    </div>
                  ))}
                </div>
              ),
            },
            {
              key: 'tencent',
              label: AVAILABLE_MODELS.tencent.name,
              children: (
                <div>
                  {AVAILABLE_MODELS.tencent.models.map(model => (
                    <div key={model.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div>
                        <Tag color="purple">{model.id}</Tag>
                        <Text>{model.description}</Text>
                      </div>
                      <Tag color={
                        model.type === 'text' ? 'green' : 
                        model.type === 'vision' ? 'cyan' :
                        model.type === 'video' ? 'red' :
                        model.type === 'image' ? 'orange' :
                        model.type === 'digital_human' ? 'pink' : 'purple'
                      }>
                        {model.type === 'text' ? '文本' : 
                         model.type === 'vision' ? '图像理解' :
                         model.type === 'video' ? '视频理解' :
                         model.type === 'image' ? '图像生成' :
                         model.type === 'digital_human' ? '数字人' :
                         model.type === 'agent' ? 'Agent' :
                         model.type === 'reasoning' ? '推理' : model.type}
                      </Tag>
                    </div>
                  ))}
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* 编辑弹窗 */}
      <Modal
        title={`配置 ${editingProvider?.name}`}
        open={editModalVisible}
        onOk={handleSave}
        onCancel={() => setEditModalVisible(false)}
        width={700}
        okText="保存配置"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: true,
          }}
        >
          <Form.Item
            name="apiKey"
            label="API Key"
            rules={[
              { required: true, message: '请输入API Key' },
            ]}
            extra={
              editingProvider?.id === 'aliyun' 
                ? '获取地址：阿里云百炼控制台 -> 模型服务 -> API-KEY'
                : '获取地址：腾讯云TokenHub控制台 -> API密钥'
            }
          >
            <Input.Password placeholder="请输入API Key" />
          </Form.Item>

          <Form.Item
            name="baseUrl"
            label="API地址"
          >
            <Input disabled />
          </Form.Item>

          <Form.Item
            name="status"
            valuePropName="checked"
            extra="关闭后该服务商的模型将不可用"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          {editingProvider?.id === 'aliyun' && renderModelSelector('aliyun')}
          {editingProvider?.id === 'tencent' && renderModelSelector('tencent')}
        </Form>
      </Modal>
    </div>
  )
}
