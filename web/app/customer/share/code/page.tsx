<<<<<<< HEAD
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
=======
'use client';

import { useState } from 'react';
import {
  Card,
  Typography,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tabs,
  Descriptions,
  Statistic,
  Row,
  Col,
  Space,
  Tag,
  Divider,
  Empty,
} from 'antd';
import { 
  PlusOutlined, 
  QrcodeOutlined, 
  CopyOutlined, 
  DownloadOutlined,
  VideoCameraOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import QRCode from 'qrcode.react';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface VideoShareCode {
  id: string;
  videoTitle: string;
  videoThumbnail: string;
  platforms: string[];
  shareUrl: string;
  code: string;
  scanCount: number;
  publishCount: number;
  createdAt: string;
}

export default function ShareCodePage() {
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isQrModalVisible, setIsQrModalVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoShareCode | null>(null);
  const [form] = Form.useForm();

  // 模拟数据
  const [videoCodes, setVideoCodes] = useState<VideoShareCode[]>([
    {
      id: '1',
      videoTitle: '产品宣传视频',
      videoThumbnail: '',
      platforms: ['douyin', 'kuaishou', 'xiaohongshu', 'video'],
      shareUrl: 'https://baizhiji.net/share/v1',
      code: 'VS20240608A001',
      scanCount: 1258,
      publishCount: 86,
      createdAt: '2024-06-08 10:30',
    },
  ]);

  const platformLabels: Record<string, string> = {
    douyin: '抖音',
    kuaishou: '快手',
    xiaohongshu: '小红书',
    video: '视频号',
  };

  const platformColors: Record<string, string> = {
    douyin: '#ff4d4f',
    kuaishou: '#722ed1',
    xiaohongshu: '#eb2f96',
    video: '#fa8c16',
  };

  const handleCreateCode = (values: { videoTitle: string; videoUrl: string; platforms: string[] }) => {
    const newCode: VideoShareCode = {
      id: Date.now().toString(),
      videoTitle: values.videoTitle,
      videoThumbnail: '',
      platforms: values.platforms,
      shareUrl: `https://baizhiji.net/share/v1?vid=${Date.now()}`,
      code: `VS${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      scanCount: 0,
      publishCount: 0,
      createdAt: new Date().toLocaleString('zh-CN'),
    };
    setVideoCodes([newCode, ...videoCodes]);
    setIsCreateModalVisible(false);
    form.resetFields();
    message.success('短视频分享码生成成功');
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    message.success('链接已复制');
  };

  const handleDownloadQr = (video: VideoShareCode) => {
    const canvas = document.querySelector(`#qr-${video.id} canvas`) as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.download = `${video.videoTitle}-分享码.png`;
      a.href = url;
      a.click();
      message.success('二维码下载成功');
    }
  };

  const columns = [
    {
      title: '短视频标题',
      dataIndex: 'videoTitle',
      key: 'videoTitle',
      width: 200,
    },
    {
      title: '发布平台',
      dataIndex: 'platforms',
      key: 'platforms',
      width: 200,
      render: (platforms: string[]) => (
        <Space size={[0, 4]}>
          {platforms.map(p => (
            <Tag key={p} color={platformColors[p]} style={{ marginRight: 4 }}>
              {platformLabels[p]}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '分享码',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (code: string) => <Text code copyable>{code}</Text>,
    },
    {
      title: '扫码次数',
      dataIndex: 'scanCount',
      key: 'scanCount',
      width: 100,
      render: (count: number) => <Statistic valueStyle={{ fontSize: 16 }} value={count} />,
    },
    {
      title: '发布次数',
      dataIndex: 'publishCount',
      key: 'publishCount',
      width: 100,
      render: (count: number) => <Statistic valueStyle={{ fontSize: 16 }} value={count} />,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: VideoShareCode) => (
        <Space>
          <Button 
            type="link" 
            size="small"
            icon={<QrcodeOutlined />}
            onClick={() => {
              setSelectedVideo(record);
              setIsQrModalVisible(true);
>>>>>>> 962968886be726cd434c792933b5515366d34518
            }}
          >
            二维码
          </Button>
<<<<<<< HEAD
          <Button type="link" icon={<DownloadOutlined />}>下载</Button>
        </Space>
      ),
    },
  ]
=======
          <Button 
            type="link" 
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopyLink(record.shareUrl)}
          >
            复制链接
          </Button>
        </Space>
      ),
    },
  ];
>>>>>>> 962968886be726cd434c792933b5515366d34518

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
<<<<<<< HEAD
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
=======
          <Title level={2} className="mb-2">
            短视频分享码
          </Title>
          <Text type="secondary">
            生成短视频专属二维码，其他人扫码即可一键发布到指定平台
          </Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setIsCreateModalVisible(true)}
        >
          生成新码
        </Button>
      </div>

      <Card className="mb-6">
        <Row gutter={24}>
          <Col span={6}>
            <Statistic 
              title="分享码总数" 
              value={videoCodes.length}
              prefix={<QrcodeOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="总扫码次数" 
              value={videoCodes.reduce((sum, v) => sum + v.scanCount, 0)}
              prefix={<ShareAltOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="总发布次数" 
              value={videoCodes.reduce((sum, v) => sum + v.publishCount, 0)}
              prefix={<VideoCameraOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="平均转化率" 
              value={
                videoCodes.reduce((sum, v) => sum + v.scanCount, 0) > 0
                  ? ((videoCodes.reduce((sum, v) => sum + v.publishCount, 0) / videoCodes.reduce((sum, v) => sum + v.scanCount, 0)) * 100).toFixed(1)
                  : 0
              }
              suffix="%"
            />
          </Col>
        </Row>
      </Card>

      <Card>
        {videoCodes.length > 0 ? (
          <Table 
            dataSource={videoCodes} 
            columns={columns} 
            rowKey="id"
            pagination={false}
          />
        ) : (
          <Empty 
            description="暂无分享码" 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => setIsCreateModalVisible(true)}>
              生成第一个分享码
            </Button>
          </Empty>
        )}
      </Card>

      {/* 生成新码弹窗 */}
      <Modal
        title="生成短视频分享码"
        open={isCreateModalVisible}
        onCancel={() => {
          setIsCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateCode}>
          <Form.Item
            label="短视频标题"
            name="videoTitle"
            rules={[{ required: true, message: '请输入短视频标题' }]}
          >
            <Input placeholder="输入要分享的短视频标题" />
          </Form.Item>

          <Form.Item
            label="短视频链接"
            name="videoUrl"
            rules={[{ required: true, message: '请输入短视频链接' }]}
          >
            <Input placeholder="输入短视频的URL链接" />
          </Form.Item>

          <Form.Item
            label="发布平台"
            name="platforms"
            rules={[{ required: true, message: '请选择至少一个发布平台' }]}
          >
            <Select
              mode="multiple"
              placeholder="选择要发布的平台"
              options={[
                { value: 'douyin', label: '抖音' },
                { value: 'kuaishou', label: '快手' },
                { value: 'xiaohongshu', label: '小红书' },
                { value: 'video', label: '视频号' },
              ]}
            />
          </Form.Item>

          <Form.Item label="备注" name="remark">
            <TextArea rows={2} placeholder="可选备注信息" />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space>
              <Button type="primary" htmlType="submit">
                生成分享码
              </Button>
              <Button onClick={() => setIsCreateModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 二维码预览弹窗 */}
      <Modal
        title="分享二维码"
        open={isQrModalVisible}
        onCancel={() => {
          setIsQrModalVisible(false);
          setSelectedVideo(null);
        }}
        footer={[
          <Button
            key="copy"
            icon={<CopyOutlined />}
            onClick={() => selectedVideo && handleCopyLink(selectedVideo.shareUrl)}
          >
            复制链接
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => selectedVideo && handleDownloadQr(selectedVideo)}
          >
            下载二维码
          </Button>,
        ]}
        width={600}
      >
        {selectedVideo && (
          <div className="text-center">
            <div className="mb-4">
              <Title level={4}>{selectedVideo.videoTitle}</Title>
              <Space className="mb-4">
                {selectedVideo.platforms.map(p => (
                  <Tag key={p} color={platformColors[p]}>
                    {platformLabels[p]}
                  </Tag>
                ))}
              </Space>
            </div>
            
            <div id={`qr-${selectedVideo.id}`} className="mb-4">
              <QRCode 
                value={selectedVideo.shareUrl}
                size={200}
                level="H"
                includeMargin
              />
            </div>

            <Divider />

            <Descriptions column={2} size="small" className="text-left">
              <Descriptions.Item label="分享码">
                <Text copyable code>{selectedVideo.code}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="分享链接">
                <Text copyable>{selectedVideo.shareUrl}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="扫码次数">
                {selectedVideo.scanCount}
              </Descriptions.Item>
              <Descriptions.Item label="发布次数">
                {selectedVideo.publishCount}
              </Descriptions.Item>
            </Descriptions>

            <Text type="secondary" className="block mt-4">
              提示：他人扫码后可直接一键发布短视频到以上平台
            </Text>
          </div>
        )}
      </Modal>
    </div>
  );
>>>>>>> 962968886be726cd434c792933b5515366d34518
}
