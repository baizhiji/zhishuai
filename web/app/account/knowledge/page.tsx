'use client'

import { useState } from 'react'
import { Card, Typography, Table, Button, Space, Tag, Modal, Form, Input, Select, message, Popconfirm, Row, Col, Statistic, Upload, Progress, Tabs } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, DatabaseOutlined, FileTextOutlined, UploadOutlined, EyeOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'

const { Title, Text } = Typography
const { TextArea } = Input

interface KnowledgeBase {
  id: string
  name: string
  description: string
  docCount: number
  wordCount: number
  status: 'active' | 'inactive' | 'training'
  type: 'manual' | 'auto'
  createdAt: string
  updatedAt: string
  source?: string
}

interface Document {
  id: string
  name: string
  type: string
  size: string
  status: 'ready' | 'pending' | 'error'
  createdAt: string
}

const knowledgeTypes = [
  { label: '产品介绍', value: 'product', icon: '📦' },
  { label: '常见问题', value: 'faq', icon: '❓' },
  { label: '使用指南', value: 'guide', icon: '📖' },
  { label: '技术文档', value: 'tech', icon: '🔧' },
  { label: '企业信息', value: 'company', icon: '🏢' },
]

export default function KnowledgeBasePage() {
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeBase[]>([
    { id: '1', name: '产品介绍知识库', description: '公司主要产品功能介绍', docCount: 12, wordCount: 35000, status: 'active', type: 'manual', createdAt: '2024-03-15', updatedAt: '2024-04-28', source: '手动录入' },
    { id: '2', name: '常见问题FAQ', description: '用户常见问题及解答', docCount: 45, wordCount: 28000, status: 'active', type: 'auto', createdAt: '2024-02-10', updatedAt: '2024-04-25', source: '批量导入' },
    { id: '3', name: '使用指南', description: '系统使用操作指南', docCount: 8, wordCount: 42000, status: 'training', type: 'manual', createdAt: '2024-04-01', updatedAt: '2024-04-30' },
    { id: '4', name: '技术文档库', description: 'API接口文档和技术说明', docCount: 25, wordCount: 55000, status: 'active', type: 'auto', createdAt: '2024-01-20', updatedAt: '2024-04-20', source: '批量导入' },
  ])

  const [documents, setDocuments] = useState<Document[]>([
    { id: '1', name: '产品功能说明.pdf', type: 'PDF', size: '2.5MB', status: 'ready', createdAt: '2024-04-25' },
    { id: '2', name: '常见问题汇总.docx', type: 'Word', size: '1.2MB', status: 'ready', createdAt: '2024-04-20' },
    { id: '3', name: '使用教程.xlsx', type: 'Excel', size: '856KB', status: 'pending', createdAt: '2024-04-28' },
  ])

  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false)
  const [isDocModalOpen, setIsDocModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedKnowledge, setSelectedKnowledge] = useState<KnowledgeBase | null>(null)
  const [editingKnowledge, setEditingKnowledge] = useState<KnowledgeBase | null>(null)
  const [form] = Form.useForm()
  const [docForm] = Form.useForm()
  const [searchText, setSearchText] = useState('')
  const [activeTab, setActiveTab] = useState('list')

  // 统计
  const stats = {
    total: knowledgeList.length,
    active: knowledgeList.filter(k => k.status === 'active').length,
    totalDocs: knowledgeList.reduce((sum, k) => sum + k.docCount, 0),
    totalWords: knowledgeList.reduce((sum, k) => sum + k.wordCount, 0),
  }

  const columns = [
    {
      title: '知识库名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: KnowledgeBase) => (
        <Space>
          <DatabaseOutlined style={{ color: '#1890ff' }} />
          <div>
            <Text strong>{name}</Text>
            <div><Text type="secondary" style={{ fontSize: '12px' }}>{record.description}</Text></div>
          </div>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'auto' ? 'processing' : 'default'}>
          {type === 'auto' ? '自动学习' : '手动录入'}
        </Tag>
      ),
    },
    { title: '文档数', dataIndex: 'docCount', key: 'docCount', render: (v: number) => <Text>{v} 个</Text> },
    { title: '字数', dataIndex: 'wordCount', key: 'wordCount', render: (v: number) => <Text>{v.toLocaleString()}</Text> },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const map: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
          active: { color: 'success', text: '已启用', icon: <CheckCircleOutlined /> },
          inactive: { color: 'default', text: '已禁用', icon: <ClockCircleOutlined /> },
          training: { color: 'processing', text: '训练中', icon: <ClockCircleOutlined /> },
        }
        const item = map[status]
        return <Tag color={item.color} icon={item.icon}>{item.text}</Tag>
      },
    },
    { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: KnowledgeBase) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            查看
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEditKnowledge(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该知识库？" onConfirm={() => handleDeleteKnowledge(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const docColumns = [
    { title: '文档名称', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type', render: (t: string) => <Tag>{t}</Tag> },
    { title: '大小', dataIndex: 'size', key: 'size' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={s === 'ready' ? 'success' : s === 'pending' ? 'processing' : 'error'}>
          {s === 'ready' ? '已就绪' : s === 'pending' ? '处理中' : '失败'}
        </Tag>
      ),
    },
    { title: '上传时间', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Document) => (
        <Space>
          <Button type="link" size="small">预览</Button>
          <Popconfirm title="确定删除？" onConfirm={() => setDocuments(documents.filter(d => d.id !== record.id))}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const handleView = (knowledge: KnowledgeBase) => {
    setSelectedKnowledge(knowledge)
    setIsDetailModalOpen(true)
  }

  const handleEditKnowledge = (knowledge: KnowledgeBase) => {
    setEditingKnowledge(knowledge)
    form.setFieldsValue(knowledge)
    setIsKnowledgeModalOpen(true)
  }

  const handleDeleteKnowledge = (id: string) => {
    setKnowledgeList(knowledgeList.filter(k => k.id !== id))
    message.success('删除成功')
  }

  const handleKnowledgeSubmit = () => {
    form.validateFields().then(values => {
      if (editingKnowledge) {
        setKnowledgeList(knowledgeList.map(k => k.id === editingKnowledge.id ? { ...k, ...values, updatedAt: new Date().toISOString().split('T')[0] } : k))
        message.success('编辑成功')
      } else {
        setKnowledgeList([{
          id: Date.now().toString(),
          ...values,
          docCount: 0,
          wordCount: 0,
          status: 'active',
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
        }, ...knowledgeList])
        message.success('创建成功')
      }
      setIsKnowledgeModalOpen(false)
      form.resetFields()
    })
  }

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    showUploadList: false,
    beforeUpload: (file) => {
      const newDoc: Document = {
        id: Date.now().toString(),
        name: file.name,
        type: file.name.split('.').pop()?.toUpperCase() || 'Unknown',
        size: (file.size / 1024 / 1024).toFixed(2) + 'MB',
        status: 'pending',
        createdAt: new Date().toISOString().split('T')[0],
      }
      setDocuments([newDoc, ...documents])
      message.success(`${file.name} 上传成功`)
      return false
    },
  }

  const filteredData = knowledgeList.filter(k => !searchText || k.name.includes(searchText) || k.description.includes(searchText))

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">知识库管理</Title>

      {/* 统计卡片 */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card size="small">
            <Statistic title="知识库总数" value={stats.total} prefix={<DatabaseOutlined style={{ color: '#1890ff' }} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="已启用" value={stats.active} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="文档总数" value={stats.totalDocs} prefix={<FileTextOutlined style={{ color: '#722ed1' }} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="知识字数" value={stats.totalWords} suffix="字" valueStyle={{ fontSize: '20px' }} />
          </Card>
        </Col>
      </Row>

      {/* Tab切换 */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="mb-4">
        <Tabs.TabPane tab="知识库列表" key="list">
          {/* 操作栏 */}
          <Card className="mb-4">
            <Row gutter={16} align="middle">
              <Col flex="auto">
                <Space>
                  <Input placeholder="搜索知识库" prefix={<SearchOutlined />} style={{ width: 200 }} value={searchText} onChange={e => setSearchText(e.target.value)} />
                </Space>
              </Col>
              <Col>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingKnowledge(null); form.resetFields(); setIsKnowledgeModalOpen(true) }}>
                  创建知识库
                </Button>
              </Col>
            </Row>
          </Card>

          {/* 表格 */}
          <Card>
            <Table dataSource={filteredData} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} />
          </Card>
        </Tabs.TabPane>

        <Tabs.TabPane tab="文档管理" key="docs">
          <Card>
            <Row gutter={16} className="mb-4">
              <Col flex="auto">
                <Space>
                  <Upload {...uploadProps}>
                    <Button icon={<UploadOutlined />}>上传文档</Button>
                  </Upload>
                  <Text type="secondary">支持 PDF、Word、Excel、TXT 格式</Text>
                </Space>
              </Col>
            </Row>
            <Table dataSource={documents} columns={docColumns} rowKey="id" pagination={false} />
          </Card>
        </Tabs.TabPane>
      </Tabs>

      {/* 创建/编辑知识库 Modal */}
      <Modal title={editingKnowledge ? '编辑知识库' : '创建知识库'} open={isKnowledgeModalOpen} onOk={handleKnowledgeSubmit} onCancel={() => setIsKnowledgeModalOpen(false)} okText="确定" cancelText="取消">
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item label="知识库名称" name="name" rules={[{ required: true, message: '请输入知识库名称' }]}>
            <Input placeholder="请输入知识库名称" />
          </Form.Item>
          <Form.Item label="知识库描述" name="description" rules={[{ required: true, message: '请输入描述' }]}>
            <TextArea rows={3} placeholder="请输入知识库描述" />
          </Form.Item>
          <Form.Item label="知识库类型" name="type" rules={[{ required: true, message: '请选择类型' }]}>
            <Select placeholder="请选择知识库类型" options={[{ label: '手动录入', value: 'manual' }, { label: '自动学习', value: 'auto' }]} />
          </Form.Item>
          <Form.Item label="状态" name="status" initialValue="active">
            <Select options={[{ label: '启用', value: 'active' }, { label: '禁用', value: 'inactive' }]} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 查看详情 Modal */}
      <Modal title="知识库详情" open={isDetailModalOpen} onCancel={() => setIsDetailModalOpen(false)} footer={null} width={700}>
        {selectedKnowledge && (
          <div>
            <Row gutter={[16, 16]} className="mb-4">
              <Col span={12}><Text type="secondary">名称：</Text><Text strong>{selectedKnowledge.name}</Text></Col>
              <Col span={12}><Text type="secondary">类型：</Text><Tag>{selectedKnowledge.type === 'auto' ? '自动学习' : '手动录入'}</Tag></Col>
              <Col span={12}><Text type="secondary">文档数：</Text><Text>{selectedKnowledge.docCount}</Text></Col>
              <Col span={12}><Text type="secondary">字数：</Text><Text>{selectedKnowledge.wordCount.toLocaleString()}</Text></Col>
              <Col span={12}><Text type="secondary">创建时间：</Text><Text>{selectedKnowledge.createdAt}</Text></Col>
              <Col span={12}><Text type="secondary">更新时间：</Text><Text>{selectedKnowledge.updatedAt}</Text></Col>
            </Row>
            <div className="mb-4">
              <Text type="secondary">描述：</Text>
              <div className="mt-1"><Text>{selectedKnowledge.description}</Text></div>
            </div>
            <div>
              <Text type="secondary">训练进度：</Text>
              <Progress percent={selectedKnowledge.status === 'active' ? 100 : selectedKnowledge.status === 'training' ? 65 : 0} status={selectedKnowledge.status === 'active' ? 'success' : 'active'} className="mt-2" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
