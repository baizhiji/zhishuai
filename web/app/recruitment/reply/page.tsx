'use client'

import { useState } from 'react'
import { Card, Row, Col, Typography, Table, Tag, Space, Button, Input, Select, Form, Modal, Switch, Divider, message, Popconfirm } from 'antd'
import { MessageOutlined, SendOutlined, PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, SettingOutlined, RobotOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

interface AutoReply {
  id: string
  name: string
  trigger: string
  replyContent: string
  type: 'greeting' | 'interview' | 'rejection' | 'custom'
  status: boolean
  usageCount: number
  createdAt: string
}

interface ReplyRecord {
  id: string
  candidateName: string
  position: string
  triggerType: string
  replyContent: string
  sentAt: string
  status: 'sent' | 'delivered' | 'read'
}

export default function AutoReplyPage() {
  const [replyList, setReplyList] = useState<AutoReply[]>([
    {
      id: '1',
      name: '收到简历自动回复',
      trigger: '收到新简历',
      replyContent: '您好！感谢您投递简历，我们已收到您的申请。HR会在3个工作日内审核您的简历，通过初审后会电话联系您安排面试。请保持电话畅通！',
      type: 'greeting',
      status: true,
      usageCount: 156,
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      name: '面试邀请模板',
      trigger: '安排面试',
      replyContent: '您好！恭喜您通过简历筛选。我们诚邀您参加面试。\n\n📅 时间：{date}\n📍 地点：{address}\n👔 穿着：商务休闲\n\n请回复“确认参加”，如有疑问请联系 HR。期待与您见面！',
      type: 'interview',
      status: true,
      usageCount: 89,
      createdAt: '2024-01-20',
    },
    {
      id: '3',
      name: '面试提醒',
      trigger: '面试前1天',
      replyContent: '您好！明天就是面试了，请记得：\n1️⃣ 带好身份证和简历\n2️⃣ 提前10分钟到达\n3️⃣ 如有变动请提前告知\n\n期待明天见面！',
      type: 'interview',
      status: true,
      usageCount: 45,
      createdAt: '2024-02-01',
    },
    {
      id: '4',
      name: '感谢投递',
      trigger: '简历不符合',
      replyContent: '您好！感谢您对我们公司的关注。经过认真审核，您的简历与我们当前招聘岗位的要求不太匹配。我们已将您的简历存入人才库，后续有合适岗位会再联系您。祝您早日找到满意的工作！',
      type: 'rejection',
      status: false,
      usageCount: 234,
      createdAt: '2024-01-10',
    },
  ])

  const [records] = useState<ReplyRecord[]>([
    { id: '1', candidateName: '李明', position: '前端开发', triggerType: '收到简历自动回复', replyContent: '您好！感谢您投递简历...', sentAt: '2024-03-25 14:30', status: 'read' },
    { id: '2', candidateName: '王芳', position: '前端开发', triggerType: '面试邀请模板', replyContent: '您好！恭喜您通过简历筛选...', sentAt: '2024-03-24 10:15', status: 'delivered' },
    { id: '3', candidateName: '张伟', position: '前端开发', triggerType: '收到简历自动回复', replyContent: '您好！感谢您投递简历...', sentAt: '2024-03-23 16:45', status: 'sent' },
    { id: '4', candidateName: '刘洋', position: '前端开发', triggerType: '面试提醒', replyContent: '您好！明天就是面试了...', sentAt: '2024-03-22 09:00', status: 'read' },
  ])

  const [modalVisible, setModalVisible] = useState(false)
  const [editingReply, setEditingReply] = useState<AutoReply | null>(null)
  const [sendModalVisible, setSendModalVisible] = useState(false)
  const [sendTarget, setSendTarget] = useState<{ name: string; phone: string } | null>(null)
  const [form] = Form.useForm()

  const typeConfig: Record<string, { label: string; color: string }> = {
    greeting: { label: '问候', color: 'blue' },
    interview: { label: '面试', color: 'green' },
    rejection: { label: '拒绝', color: 'red' },
    custom: { label: '自定义', color: 'purple' },
  }

  const statusConfig: Record<string, { label: string; color: string }> = {
    sent: { label: '已发送', color: 'default' },
    delivered: { label: '已送达', color: 'processing' },
    read: { label: '已读', color: 'success' },
  }

  const columns = [
    {
      title: '话术名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: AutoReply) => (
        <div>
          <div className="font-medium flex items-center gap-2">
            {name}
            <Tag color={typeConfig[record.type].color} className="text-xs">{typeConfig[record.type].label}</Tag>
          </div>
          <div className="text-xs text-gray-400">触发：{record.trigger}</div>
        </div>
      ),
    },
    {
      title: '话术内容',
      dataIndex: 'replyContent',
      key: 'replyContent',
      ellipsis: true,
      render: (content: string) => (
        <Paragraph ellipsis={{ rows: 2 }} className="mb-0">{content.replace(/\n/g, ' ')}</Paragraph>
      ),
    },
    {
      title: '使用次数',
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: 100,
      sorter: (a: AutoReply, b: AutoReply) => a.usageCount - b.usageCount,
      render: (count: number) => (
        <Tag color="orange">{count}次</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: boolean) => (
        <Switch checked={status} checkedChildren="开" unCheckedChildren="关" />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: AutoReply) => (
        <Space size="small">
          <Button type="link" size="small" icon={<SendOutlined />} onClick={() => { setSendTarget({ name: record.name, phone: '' }); setSendModalVisible(true) }}>
            发送
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditingReply(record); form.setFieldsValue(record); setModalVisible(true) }}>
            编辑
          </Button>
          <Popconfirm title="确认删除？" onConfirm={() => { setReplyList(list => list.filter(r => r.id !== record.id)); message.success('已删除') }}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const recordColumns = [
    {
      title: '候选人',
      key: 'candidate',
      render: (_: any, record: ReplyRecord) => (
        <div>
          <div className="font-medium">{record.candidateName}</div>
          <div className="text-xs text-gray-400">{record.position}</div>
        </div>
      ),
    },
    {
      title: '使用话术',
      dataIndex: 'triggerType',
      key: 'triggerType',
      width: 150,
    },
    {
      title: '发送内容',
      dataIndex: 'replyContent',
      key: 'replyContent',
      ellipsis: true,
      width: 250,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={statusConfig[status].color}>{statusConfig[status].label}</Tag>
      ),
    },
    {
      title: '发送时间',
      dataIndex: 'sentAt',
      key: 'sentAt',
      width: 150,
    },
  ]

  const handleSave = () => {
    form.validateFields().then(values => {
      if (editingReply) {
        setReplyList(list => list.map(r => r.id === editingReply.id ? { ...r, ...values } : r))
        message.success('话术已更新')
      } else {
        setReplyList(list => [...list, { ...values, id: Date.now().toString(), usageCount: 0, createdAt: new Date().toISOString().split('T')[0] }])
        message.success('话术已添加')
      }
      setModalVisible(false)
      setEditingReply(null)
      form.resetFields()
    })
  }

  const handleSend = () => {
    if (!sendTarget?.phone) {
      message.warning('请输入手机号')
      return
    }
    message.success(`已发送至 ${sendTarget.name}`)
    setSendModalVisible(false)
  }

  const templates = [
    { title: '面试邀请', content: '您好！恭喜您通过简历筛选。我们诚邀您参加面试。\n\n时间：{date}\n地点：{address}\n\n请回复"确认参加"，期待与您见面！' },
    { title: '面试提醒', content: '您好！明天就是面试了，请记得带好身份证和简历，提前10分钟到达。如有变动请提前告知。' },
    { title: 'offer发放', content: '您好！恭喜您通过所有面试环节，我们正式向您发放offer。\n\n职位：{position}\n薪资：{salary}\n入职日期：{date}\n\n请在3天内回复确认。' },
  ]

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <Title level={2} className="mb-2">自动回复</Title>
        <Text type="secondary">配置智能话术，自动回复候选人，提升招聘效率</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card className="border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <Text type="secondary">话术模板</Text>
                <div className="text-2xl font-bold">{replyList.length}</div>
              </div>
              <MessageOutlined className="text-3xl text-gray-300" />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <Text type="secondary">今日发送</Text>
                <div className="text-2xl font-bold">{records.length}</div>
              </div>
              <SendOutlined className="text-3xl text-gray-300" />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="border-l-4 border-l-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <Text type="secondary">已读率</Text>
                <div className="text-2xl font-bold">78%</div>
              </div>
              <CheckCircleOutlined className="text-3xl text-gray-300" />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <Text type="secondary">总使用次数</Text>
                <div className="text-2xl font-bold">{replyList.reduce((sum, r) => sum + r.usageCount, 0)}</div>
              </div>
              <ClockCircleOutlined className="text-3xl text-gray-300" />
            </div>
          </Card>
        </Col>
      </Row>

      {/* 快捷模板 */}
      <Card title="快捷话术模板" className="mb-6">
        <div className="flex flex-wrap gap-3">
          {templates.map((t, i) => (
            <Tag key={i} className="px-3 py-2 cursor-pointer hover:bg-blue-50" onClick={() => {
              form.setFieldValue('replyContent', t.content)
              form.setFieldValue('type', t.title === '面试邀请' || t.title === '面试提醒' ? 'interview' : 'custom')
              setModalVisible(true)
            }}>
              <PlusOutlined /> {t.title}
            </Tag>
          ))}
          <Tag color="blue" className="px-3 py-2 cursor-pointer" onClick={() => { setEditingReply(null); form.resetFields(); setModalVisible(true) }}>
            <PlusOutlined /> 新建话术
          </Tag>
        </div>
      </Card>

      {/* 话术列表 */}
      <Card title="话术管理" className="mb-6">
        <Table
          columns={columns}
          dataSource={replyList}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* 发送记录 */}
      <Card title="最近发送记录">
        <Table
          columns={recordColumns}
          dataSource={records}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Card>

      {/* 添加/编辑话术弹窗 */}
      <Modal
        title={editingReply ? '编辑话术' : '新建话术'}
        open={modalVisible}
        onCancel={() => { setModalVisible(false); setEditingReply(null); form.resetFields() }}
        onOk={handleSave}
        okText="保存"
        width={600}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="name" label="话术名称" rules={[{ required: true, message: '请输入话术名称' }]}>
            <Input placeholder="如：面试邀请模板" />
          </Form.Item>
          <Form.Item name="type" label="话术类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select options={[
              { value: 'greeting', label: '问候语' },
              { value: 'interview', label: '面试相关' },
              { value: 'rejection', label: '拒绝话术' },
              { value: 'custom', label: '自定义' },
            ]} />
          </Form.Item>
          <Form.Item name="trigger" label="触发条件" rules={[{ required: true, message: '请输入触发条件' }]}>
            <Select options={[
              { value: '收到新简历', label: '收到新简历' },
              { value: '安排面试', label: '安排面试' },
              { value: '面试前1天', label: '面试前1天' },
              { value: '简历不符合', label: '简历不符合' },
              { value: '发放offer', label: '发放offer' },
            ]} placeholder="选择自动触发的条件" />
          </Form.Item>
          <Form.Item name="replyContent" label="话术内容" rules={[{ required: true, message: '请输入话术内容' }]}>
            <TextArea rows={6} placeholder="输入自动回复的内容，支持换行。可使用占位符：{name}、{position}、{date}等" />
          </Form.Item>
          <Divider />
          <div className="bg-gray-50 p-4 rounded">
            <Text type="secondary">占位符说明：</Text>
            <div className="mt-2 text-sm text-gray-600">
              <div>• {'{name}'} - 候选人姓名</div>
              <div>• {'{position}'} - 应聘职位</div>
              <div>• {'{date}'} - 日期/时间</div>
              <div>• {'{address}'} - 面试地点</div>
              <div>• {'{salary}'} - 薪资待遇</div>
            </div>
          </div>
        </Form>
      </Modal>

      {/* 手动发送弹窗 */}
      <Modal
        title="手动发送话术"
        open={sendModalVisible}
        onCancel={() => { setSendModalVisible(false); setSendTarget(null) }}
        onOk={handleSend}
        okText="发送"
      >
        <div className="py-4">
          <div className="mb-4">
            <Text type="secondary">使用话术：</Text>
            <div className="mt-1 p-3 bg-gray-50 rounded">{sendTarget?.name}</div>
          </div>
          <div className="mb-4">
            <Text type="secondary">候选人手机：</Text>
            <Input
              className="mt-1"
              placeholder="输入手机号"
              value={sendTarget?.phone}
              onChange={e => setSendTarget(t => t ? { ...t, phone: e.target.value } : null)}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
