'use client'

import { useState } from 'react'
import { Card, Typography, Button, Space, Table, Tag, Modal, Form, Input, message, Image, QRCode } from 'antd'
import { PlusOutlined, ShareAltOutlined, CopyOutlined, DownloadOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface ReferralCode {
  id: string
  name: string
  code: string
  platform: string
  status: 'active' | 'inactive'
  clickCount: number
  conversionCount: number
  createdAt: string
}

export default function ShareCodePage() {
  const [codes] = useState<ReferralCode[]>([
    {
      id: '1',
      name: '个人推广码',
      code: 'ZHISHUAI2024',
      platform: 'all',
      status: 'active',
      clickCount: 1258,
      conversionCount: 86,
      createdAt: '2024-03-25',
    },
  ])

  const [isQrModalVisible, setIsQrModalVisible] = useState(false)
  const [selectedCode, setSelectedCode] = useState<string>('')

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '推荐码',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => (
        <Space>
          <code>{code}</code>
          <Button type="link" icon={<CopyOutlined />} size="small">复制</Button>
        </Space>
      ),
    },
    { title: '平台', dataIndex: 'platform', key: 'platform' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? '生效中' : '已失效'}
        </Tag>
      ),
    },
    { title: '点击次数', dataIndex: 'clickCount', key: 'clickCount' },
    { title: '转化数', dataIndex: 'conversionCount', key: 'conversionCount' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ReferralCode) => (
        <Space>
          <Button
            type="link"
            icon={<ShareAltOutlined />}
            onClick={() => {
              setSelectedCode(record.code)
              setIsQrModalVisible(true)
            }}
          >
            二维码
          </Button>
          <Button type="link" icon={<DownloadOutlined />}>下载</Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Title level={2} className="mb-2">推荐码生成</Title>
          <Text type="secondary">生成个人推荐码和二维码</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />}>生成新码</Button>
      </div>

      <Card>
        <Table dataSource={codes} columns={columns} rowKey="id" />
      </Card>

      <Modal
        title="推荐二维码"
        open={isQrModalVisible}
        onCancel={() => setIsQrModalVisible(false)}
        footer={[
          <Button key="copy" onClick={() => { message.success('已复制图片') }}>复制图片</Button>,
          <Button key="download" type="primary" onClick={() => { message.success('已下载') }}>下载</Button>,
        ]}
      >
        <div className="text-center">
          <QRCode value={selectedCode} size={200} />
          <div className="mt-4">
            <Text code>{selectedCode}</Text>
          </div>
        </div>
      </Modal>
    </div>
  )
}
