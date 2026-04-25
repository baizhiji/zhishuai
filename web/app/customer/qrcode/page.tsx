'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Table,
  Tag,
  Space,
  Typography,
  Message,
  Modal,
  Row,
  Col,
  Badge,
  Divider,
  Upload,
  Image,
  Progress,
  Statistic,
  QRCode,
  DatePicker,
} from 'antd'
import {
  ArrowLeftOutlined,
  QrcodeOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  CopyOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  ScanOutlined,
} from '@ant-design/icons'
import type { UploadFile } from 'antd'

const { Title, Text } = Typography
const { TextArea } = Input

interface QrcodeCampaign {
  id: string
  name: string
  description: string
  targetUrl: string
  platform: string
  qrcodeImage: string
  createdAt: string
  totalSent: number
  totalScanned: number
  scanRate: number
  status: 'active' | 'paused' | 'ended'
}

interface ScanRecord {
  id: string
  campaignName: string
  customerName: string
  customerUsername: string
  platform: string
  scannedAt: string
  location: string
  device: string
}

export default function CustomerQrcodePage() {
  const router = useRouter()
  const [form] = Form.useForm()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [previewModalVisible, setPreviewModalVisible] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<QrcodeCampaign | null>(null)

  // 二维码活动列表
  const [campaigns, setCampaigns] = useState<QrcodeCampaign[]>([
    {
      id: '1',
      name: '2024新年推广活动',
      description: '春节期间品牌推广活动',
      targetUrl: 'https://example.com/promo/newyear',
      platform: 'douyin',
      qrcodeImage: 'https://example.com/qrcode1.png',
      createdAt: '2024-01-15 10:00:00',
      totalSent: 1500,
      totalScanned: 375,
      scanRate: 25.0,
      status: 'active',
    },
    {
      id: '2',
      name: '产品体验活动',
      description: '新用户产品体验邀请',
      targetUrl: 'https://example.com/trial',
      platform: 'xiaohongshu',
      qrcodeImage: 'https://example.com/qrcode2.png',
      createdAt: '2024-01-10 14:30:00',
      totalSent: 800,
      totalScanned: 320,
      scanRate: 40.0,
      status: 'active',
    },
    {
      id: '3',
      name: '周年庆活动',
      description: '品牌三周年庆典活动',
      targetUrl: 'https://example.com/anniversary',
      platform: 'bilibili',
      qrcodeImage: 'https://example.com/qrcode3.png',
      createdAt: '2024-01-01 09:20:00',
      totalSent: 2000,
      totalScanned: 180,
      scanRate: 9.0,
      status: 'ended',
    },
  ])

  // 扫码记录
  const [scanRecords, setScanRecords] = useState<ScanRecord[]>([
    {
      id: '1',
      campaignName: '2024新年推广活动',
      customerName: '科技爱好者',
      customerUsername: '@tech_lover',
      platform: 'douyin',
      scannedAt: '2024-01-16 14:30:00',
      location: '北京市',
      device: 'iPhone 15 Pro',
    },
    {
      id: '2',
      campaignName: '产品体验活动',
      customerName: '生活小能手',
      customerUsername: '@life_hacker',
      platform: 'xiaohongshu',
      scannedAt: '2024-01-16 12:15:00',
      location: '上海市',
      device: 'Android',
    },
    {
      id: '3',
      campaignName: '2024新年推广活动',
      customerName: '数码达人',
      customerUsername: '@digital_master',
      platform: 'douyin',
      scannedAt: '2024-01-16 10:45:00',
      location: '深圳市',
      device: 'iPad Air',
    },
  ])

  // 统计数据
  const stats = {
    totalCampaigns: campaigns.length,
    totalSent: campaigns.reduce((sum, c) => sum + c.totalSent, 0),
    totalScanned: campaigns.reduce((sum, c) => sum + c.totalScanned, 0),
    avgScanRate: campaigns.length > 0
      ? (campaigns.reduce((sum, c) => sum + c.scanRate, 0) / campaigns.length).toFixed(1)
      : '0',
  }

  // 平台选项
  const platforms = [
    { id: 'douyin', name: '抖音', icon: '🎵' },
    { id: 'xiaohongshu', name: '小红书', icon: '📕' },
    { id: 'bilibili', name: 'B站', icon: '📺' },
    { id: 'kuaishou', name: '快手', icon: '📹' },
    { id: 'weibo', name: '微博', icon: '📱' },
  ]

  // 上传配置
  const uploadProps = {
    name: 'file',
    listType: 'picture-card' as const,
    fileList,
    onChange: ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
      setFileList(newFileList)
    },
    beforeUpload: () => false,
    accept: 'image/*',
    maxCount: 1,
  }

  // 创建二维码活动
  const handleCreateCampaign = async (values: any) => {
    try {
      // 模拟创建
      const newCampaign: QrcodeCampaign = {
        id: Date.now().toString(),
        name: values.campaignName,
        description: values.description,
        targetUrl: values.targetUrl,
        platform: values.platform,
        qrcodeImage: fileList[0]?.url || '',
        createdAt: new Date().toLocaleString('zh-CN'),
        totalSent: 0,
        totalScanned: 0,
        scanRate: 0,
        status: 'active',
      }

      setCampaigns([newCampaign, ...campaigns])
      Message.success('二维码活动创建成功！')

      form.resetFields()
      setFileList([])
    } catch (error) {
      Message.error('创建失败，请重试')
    }
  }

  // 查看详情
  const handleViewDetail = (campaign: QrcodeCampaign) => {
    setSelectedCampaign(campaign)
    setPreviewModalVisible(true)
  }

  // 删除活动
  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个活动吗？删除后无法恢复。',
      onOk: () => {
        setCampaigns(campaigns.filter(c => c.id !== id))
        Message.success('活动已删除')
      },
    })
  }

  // 切换状态
  const handleToggleStatus = (id: string) => {
    setCampaigns(campaigns.map(c => {
      if (c.id === id) {
        const newStatus = c.status === 'active' ? 'paused' : 'active'
        Message.success(c.status === 'active' ? '活动已暂停' : '活动已启动')
        return { ...c, status: newStatus as 'active' | 'paused' | 'ended' }
      }
      return c
    }))
  }

  // 下载二维码
  const handleDownloadQrcode = (campaign: QrcodeCampaign) => {
    Message.success('二维码已下载')
  }

  // 复制链接
  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url)
    Message.success('链接已复制到剪贴板')
  }

  const statusMap: Record<string, { text: string; color: string }> = {
    active: { text: '进行中', color: 'success' },
    paused: { text: '已暂停', color: 'warning' },
    ended: { text: '已结束', color: 'default' },
  }

  const campaignColumns = [
    {
      title: '活动名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: QrcodeCampaign) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          <Text type="secondary" className="text-sm">{record.description}</Text>
        </Space>
      ),
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string) => {
        const p = platforms.find(p => p.id === platform)
        return (
          <Space>
            <span className="text-xl">{p?.icon}</span>
            <span>{p?.name}</span>
          </Space>
        )
      },
    },
    {
      title: '发送数',
      dataIndex: 'totalSent',
      key: 'totalSent',
      render: (count: number) => <Text>{count}</Text>,
    },
    {
      title: '扫码数',
      dataIndex: 'totalScanned',
      key: 'totalScanned',
      render: (count: number) => <Text strong>{count}</Text>,
    },
    {
      title: '扫码率',
      dataIndex: 'scanRate',
      key: 'scanRate',
      render: (rate: number) => (
        <Tag color={rate > 30 ? 'green' : rate > 15 ? 'orange' : 'red'}>
          {rate.toFixed(1)}%
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const s = statusMap[status]
        return <Tag color={s.color}>{s.text}</Tag>
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => <Text className="text-sm">{date.split(' ')[0]}</Text>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: QrcodeCampaign) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadQrcode(record)}
          >
            下载
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopyLink(record.targetUrl)}
          >
            复制链接
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  const scanColumns = [
    {
      title: '活动名称',
      dataIndex: 'campaignName',
      key: 'campaignName',
      render: (name: string) => <Tag color="blue">{name}</Tag>,
    },
    {
      title: '客户',
      key: 'customer',
      render: (_: any, record: ScanRecord) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.customerName}</Text>
          <Text type="secondary" className="text-sm">{record.customerUsername}</Text>
        </Space>
      ),
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string) => {
        const p = platforms.find(p => p.id === platform)
        return (
          <Space>
            <span className="text-xl">{p?.icon}</span>
            <span>{p?.name}</span>
          </Space>
        )
      },
    },
    {
      title: '扫码时间',
      dataIndex: 'scannedAt',
      key: 'scannedAt',
      render: (date: string) => <Text>{date}</Text>,
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      render: (location: string) => <Tag color="geekblue">{location}</Tag>,
    },
    {
      title: '设备',
      dataIndex: 'device',
      key: 'device',
      render: (device: string) => <Tag color="purple">{device}</Tag>,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      <div className="container mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/customer')}
          className="mb-6"
        >
          返回客户管理
        </Button>

        {/* 标题 */}
        <div className="mb-8">
          <Title level={2}>二维码发送</Title>
          <Text type="secondary">创建二维码活动，自动发送并追踪扫码效果</Text>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="活动总数"
                value={stats.totalCampaigns}
                prefix={<QrcodeOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="总发送数"
                value={stats.totalSent}
                prefix={<ShareAltOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="总扫码数"
                value={stats.totalScanned}
                prefix={<ScanOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="平均扫码率"
                value={stats.avgScanRate}
                suffix="%"
                prefix={<EyeOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]}>
          {/* 左侧：创建活动 */}
          <Col xs={24} lg={10}>
            <Card
              title="创建二维码活动"
              extra={<Badge count={campaigns.length} showZero color="orange" />}
            >
              <Form form={form} layout="vertical" onFinish={handleCreateCampaign}>
                <Form.Item
                  label="活动名称"
                  name="campaignName"
                  rules={[{ required: true, message: '请输入活动名称' }]}
                >
                  <Input placeholder="例如：2024新年推广活动" />
                </Form.Item>

                <Form.Item
                  label="活动描述"
                  name="description"
                  rules={[{ required: true, message: '请输入活动描述' }]}
                >
                  <TextArea rows={3} placeholder="描述活动的目的和内容" />
                </Form.Item>

                <Form.Item
                  label="目标链接"
                  name="targetUrl"
                  rules={[{ required: true, message: '请输入目标链接' }]}
                  tooltip="扫码后跳转的链接"
                >
                  <Input placeholder="https://example.com/promo" />
                </Form.Item>

                <Form.Item
                  label="选择平台"
                  name="platform"
                  rules={[{ required: true, message: '请选择平台' }]}
                >
                  <Select placeholder="请选择平台">
                    {platforms.map(platform => (
                      <Select.Option key={platform.id} value={platform.id}>
                        <Space>
                          <span>{platform.icon}</span>
                          <span>{platform.name}</span>
                        </Space>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  label="二维码图片"
                  name="qrcodeImage"
                  tooltip="上传自定义二维码图片，或使用系统生成的二维码"
                >
                  <Upload {...uploadProps}>
                    {fileList.length === 0 && (
                      <div>
                        <QrcodeOutlined className="text-3xl mb-2" />
                        <div className="text-sm">点击上传或拖拽二维码</div>
                      </div>
                    )}
                  </Upload>
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  icon={<PlusOutlined />}
                  className="bg-gradient-to-r from-orange-500 to-red-600 border-0"
                >
                  创建活动
                </Button>
              </Form>

              {/* 快速生成二维码 */}
              <Divider>快速生成二维码</Divider>
              <div className="text-center py-4 bg-gray-50 rounded">
                <QRCode
                  value="https://example.com"
                  size={150}
                  icon="/qrcode-icon.png"
                />
                <div className="mt-3">
                  <Text type="secondary">示例二维码</Text>
                </div>
              </div>
            </Card>
          </Col>

          {/* 右侧：活动列表 */}
          <Col xs={24} lg={14}>
            <Card title="二维码活动列表">
              <Table
                columns={campaignColumns}
                dataSource={campaigns}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                scroll={{ x: true }}
              />
            </Card>
          </Col>
        </Row>

        {/* 扫码记录 */}
        <Card
          title="扫码记录"
          className="mt-6"
          extra={
            <Space>
              <Text type="secondary">共 {scanRecords.length} 条记录</Text>
              <Button icon={<DownloadOutlined />}>导出数据</Button>
            </Space>
          }
        >
          <Table
            columns={scanColumns}
            dataSource={scanRecords}
            rowKey="id"
            pagination={{ pageSize: 8 }}
            scroll={{ x: true }}
          />
        </Card>

        {/* 详情弹窗 */}
        <Modal
          title="活动详情"
          open={previewModalVisible}
          onCancel={() => setPreviewModalVisible(false)}
          footer={null}
          width={700}
        >
          {selectedCampaign && (
            <Space direction="vertical" size="large" className="w-full">
              <Card>
                <Space direction="vertical" size="middle" className="w-full">
                  <Space className="w-full justify-between">
                    <Text strong>{selectedCampaign.name}</Text>
                    <Tag color={statusMap[selectedCampaign.status].color}>
                      {statusMap[selectedCampaign.status].text}
                    </Tag>
                  </Space>

                  <Text type="secondary">{selectedCampaign.description}</Text>

                  <Divider />

                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Card size="small">
                        <Space direction="vertical" size={0}>
                          <Text type="secondary">平台</Text>
                          <Text>
                            {platforms.find(p => p.id === selectedCampaign.platform)?.name}
                          </Text>
                        </Space>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small">
                        <Space direction="vertical" size={0}>
                          <Text type="secondary">创建时间</Text>
                          <Text>{selectedCampaign.createdAt}</Text>
                        </Space>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card size="small">
                        <Space direction="vertical" size={0}>
                          <Text type="secondary">发送数</Text>
                          <Text strong>{selectedCampaign.totalSent}</Text>
                        </Space>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card size="small">
                        <Space direction="vertical" size={0}>
                          <Text type="secondary">扫码数</Text>
                          <Text strong>{selectedCampaign.totalScanned}</Text>
                        </Space>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card size="small">
                        <Space direction="vertical" size={0}>
                          <Text type="secondary">扫码率</Text>
                          <Text strong>{selectedCampaign.scanRate.toFixed(1)}%</Text>
                        </Space>
                      </Card>
                    </Col>
                  </Row>

                  <Divider />

                  <Card size="small" title="目标链接">
                    <Space className="w-full justify-between">
                      <Text className="text-sm">{selectedCampaign.targetUrl}</Text>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => handleCopyLink(selectedCampaign.targetUrl)}
                      >
                        复制
                      </Button>
                    </Space>
                  </Card>

                  <div className="text-center">
                    <QRCode value={selectedCampaign.targetUrl} size={200} />
                  </div>
                </Space>
              </Card>

              <Space className="w-full justify-end">
                <Button onClick={() => handleDownloadQrcode(selectedCampaign)}>
                  下载二维码
                </Button>
                <Button
                  type="primary"
                  icon={<ShareAltOutlined />}
                  onClick={() => Message.success('二维码已分享')}
                >
                  分享二维码
                </Button>
              </Space>
            </Space>
          )}
        </Modal>
      </div>
    </div>
  )
}
