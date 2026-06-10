'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Form,
  Input,
  Select,
  Table,
  Tag,
  Statistic,
  Spin,
  Divider,
  Descriptions,
  message,
  Empty,
  Modal,
  List,
  Avatar,
  Badge,
  Tabs,
  Progress,
  Alert,
  Timeline,
} from 'antd';
import {
  VideoCameraOutlined,
  UserOutlined,
  HeartOutlined,
  EyeOutlined,
  MessageOutlined,
  GiftOutlined,
  ShareAltOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  PlusOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ShoppingOutlined,
  StarOutlined,
  SyncOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import request from '@/utils/request';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

interface LiveRoom {
  id: string;
  platform: string;
  roomId: string;
  roomName: string;
  hostName: string;
  coverUrl?: string;
  status: 'live' | 'offline' | 'scheduled';
  startTime?: string;
  viewerCount: number;
  likeCount: number;
  giftCount: number;
  followerCount: number;
  salesAmount?: number;
  productCount?: number;
}

interface LiveProduct {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  soldCount: number;
  image?: string;
  link?: string;
}

interface LiveStats {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalGifts: number;
  peakViewers: number;
  avgViewers: number;
  duration: string;
  salesAmount: number;
}

interface CapturedComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  time: string;
  likes: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  soldCount: number;
  image?: string;
}

// 平台配置
const platformConfig: Record<string, { name: string; color: string; icon: string }> = {
  douyin: { name: '抖音', color: '#fe2c55', icon: '🎵' },
  kuaishou: { name: '快手', color: '#ff4906', icon: '📹' },
  taobao: { name: '淘宝直播', color: '#ff5000', icon: '🛒' },
  bilibili: { name: 'B站直播', color: '#00a1d6', icon: '📺' },
};

export default function LiveRoomCapturePage() {
  const [loading, setLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [rooms, setRooms] = useState<LiveRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<LiveRoom | null>(null);
  const [roomDetailVisible, setRoomDetailVisible] = useState(false);
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [comments, setComments] = useState<CapturedComment[]>([]);
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [activeTab, setActiveTab] = useState('rooms');
  const [platform, setPlatform] = useState('douyin');
  const [roomLink, setRoomLink] = useState('');
  const [captureInterval, setCaptureInterval] = useState<NodeJS.Timeout | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [addRoomModalVisible, setAddRoomModalVisible] = useState(false);
  const [newRoomForm] = Form.useForm();

  // 加载已保存的房间
  useEffect(() => {
    loadRooms();
    return () => {
      if (captureInterval) clearInterval(captureInterval);
    };
  }, []);

  const loadRooms = () => {
    const saved = localStorage.getItem('captured_rooms');
    if (saved) {
      setRooms(JSON.parse(saved));
    }
  };

  const saveRooms = (newRooms: LiveRoom[]) => {
    setRooms(newRooms);
    localStorage.setItem('captured_rooms', JSON.stringify(newRooms));
  };

  // 添加直播间
  const handleAddRoom = async () => {
    try {
      const values = await newRoomForm.validateFields();
      
      // 解析房间链接获取ID
      const roomId = extractRoomId(values.link);
      
      const newRoom: LiveRoom = {
        id: `room_${Date.now()}`,
        platform: platform,
        roomId: roomId,
        roomName: values.name || `直播间-${roomId.slice(0, 8)}`,
        hostName: values.hostName || '未知主播',
        status: 'offline',
        viewerCount: 0,
        likeCount: 0,
        giftCount: 0,
        followerCount: 0,
      };

      saveRooms([...rooms, newRoom]);
      setAddRoomModalVisible(false);
      newRoomForm.resetFields();
      message.success('直播间添加成功');
    } catch (error) {
      console.error('添加失败:', error);
    }
  };

  // 从链接提取房间ID
  const extractRoomId = (link: string): string => {
    // 抖音
    if (link.includes('douyin.com')) {
      const match = link.match(/live\.douyin\.com\/(\d+)/);
      return match ? match[1] : link.slice(-12);
    }
    // 快手
    if (link.includes('kuaishou.com')) {
      const match = link.match(/live\.kuaishou\.com\/(\w+)/);
      return match ? match[1] : link.slice(-10);
    }
    // 淘宝
    if (link.includes('taobao.com') || link.includes('taobao直播')) {
      return 'taobao_' + Math.random().toString(36).slice(-8);
    }
    return Math.random().toString(36).slice(-10);
  };

  // 开始采集
  const handleStartCapture = (room: LiveRoom) => {
    setSelectedRoom(room);
    setRoomDetailVisible(true);
    setIsCapturing(true);

    message.info(`开始采集 ${room.roomName} 的数据...`);

    // 模拟实时采集
    const interval = setInterval(() => {
      captureRoomData(room);
    }, 5000);

    setCaptureInterval(interval);
  };

  // 采集房间数据
  const captureRoomData = (room: LiveRoom) => {
    // 模拟采集到的数据
    const mockComments: CapturedComment[] = [
      { id: '1', userId: 'u1', userName: '用户A', content: '这个产品多少钱？', time: dayjs().format('HH:mm:ss'), likes: 5 },
      { id: '2', userId: 'u2', userName: '用户B', content: '想要！', time: dayjs().format('HH:mm:ss'), likes: 3 },
      { id: '3', userId: 'u3', userName: '用户C', content: '下单了', time: dayjs().format('HH:mm:ss'), likes: 8 },
    ];

    const mockProducts: Product[] = [
      { id: 'p1', name: '智枢AI助手Pro', price: 299, originalPrice: 599, soldCount: 128 },
      { id: 'p2', name: '企业版年度会员', price: 1999, originalPrice: 3999, soldCount: 45 },
      { id: 'p3', name: '数字人定制服务', price: 5999, originalPrice: 9999, soldCount: 12 },
    ];

    setComments(prev => [...mockComments, ...prev].slice(0, 100));
    setLiveProducts(mockProducts);

    // 更新统计
    setStats(prev => ({
      totalViews: (prev?.totalViews || 0) + Math.floor(Math.random() * 100),
      totalLikes: (prev?.totalLikes || 0) + Math.floor(Math.random() * 50),
      totalComments: (prev?.totalComments || 0) + mockComments.length,
      totalGifts: (prev?.totalGifts || 0) + Math.floor(Math.random() * 5),
      peakViewers: Math.max(prev?.peakViewers || 0, Math.floor(Math.random() * 10000)),
      avgViewers: Math.floor(Math.random() * 5000),
      duration: calculateDuration(room.startTime),
      salesAmount: (prev?.salesAmount || 0) + Math.floor(Math.random() * 1000),
    }));

    // 更新房间实时数据
    setSelectedRoom(prev => prev ? {
      ...prev,
      viewerCount: Math.floor(Math.random() * 10000),
      likeCount: (prev.likeCount || 0) + Math.floor(Math.random() * 100),
    } : null);
  };

  const calculateDuration = (startTime?: string): string => {
    if (!startTime) return '00:00:00';
    const seconds = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 停止采集
  const handleStopCapture = () => {
    if (captureInterval) {
      clearInterval(captureInterval);
      setCaptureInterval(null);
    }
    setIsCapturing(false);
    message.success('已停止采集');
  };

  // 删除房间
  const handleDeleteRoom = (roomId: string) => {
    saveRooms(rooms.filter(r => r.id !== roomId));
    message.success('已删除');
  };

  // 导出数据
  const handleExportData = () => {
    const exportData = {
      room: selectedRoom,
      stats,
      comments,
      products: liveProducts,
      exportTime: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `live_capture_${selectedRoom?.roomName}_${Date.now()}.json`;
    a.click();
    message.success('数据导出成功');
  };

  const columns = [
    {
      title: '直播间',
      key: 'room',
      render: (_: any, record: LiveRoom) => {
        const platform = platformConfig[record.platform];
        return (
          <Space>
            <Avatar
              size={48}
              src={record.coverUrl}
              icon={<VideoCameraOutlined />}
              style={{ backgroundColor: platform?.color }}
            />
            <div>
              <div style={{ fontWeight: 500 }}>
                <Space>
                  {platform?.icon} {record.roomName}
                  {record.status === 'live' && <Badge status="processing" text="直播中" />}
                  {record.status === 'offline' && <Badge status="default" text="未开播" />}
                </Space>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {platform?.name} · {record.hostName}
              </Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: '观看人数',
      dataIndex: 'viewerCount',
      key: 'viewerCount',
      render: (v: number) => <Text strong>{v.toLocaleString()}</Text>,
    },
    {
      title: '点赞',
      dataIndex: 'likeCount',
      key: 'likeCount',
      render: (v: number) => <Text><HeartOutlined /> {v.toLocaleString()}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'live' ? 'success' : 'default'}>
          {status === 'live' ? '直播中' : '离线'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: LiveRoom) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={isCapturing && selectedRoom?.id === record.id ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={() => {
              if (isCapturing && selectedRoom?.id === record.id) {
                handleStopCapture();
              } else {
                handleStartCapture(record);
              }
            }}
          >
            {isCapturing && selectedRoom?.id === record.id ? '停止' : '采集'}
          </Button>
          <Button size="small" icon={<DeleteOutlined />} danger onClick={() => handleDeleteRoom(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const commentColumns = [
    { title: '时间', dataIndex: 'time', key: 'time', width: 80 },
    { title: '用户', dataIndex: 'userName', key: 'userName', width: 100 },
    { title: '评论内容', dataIndex: 'content', key: 'content' },
    { title: '点赞', dataIndex: 'likes', key: 'likes', width: 80 },
  ];

  const productColumns = [
    {
      title: '商品',
      key: 'product',
      render: (_: any, record: Product) => (
        <Space>
          <Avatar shape="square" size={48} src={record.image} icon={<ShoppingOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <div>
              <Text type="secondary" delete>¥{record.originalPrice}</Text>
              <Text strong style={{ color: '#ff4d4f', marginLeft: 8 }}>¥{record.price}</Text>
            </div>
          </div>
        </Space>
      ),
    },
    { title: '已售', dataIndex: 'soldCount', key: 'soldCount', render: (v: number) => <Tag>{v}件</Tag> },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <VideoCameraOutlined style={{ color: '#722ED1' }} /> 直播间采集
        </Title>
        <Text type="secondary">实时采集直播间的观众数据、评论弹幕、商品信息等</Text>
      </div>

      {/* 统计概览 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card hoverable>
            <Statistic title="累计观看" value={stats?.totalViews || 0} prefix={<EyeOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card hoverable>
            <Statistic title="累计点赞" value={stats?.totalLikes || 0} prefix={<HeartOutlined />} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card hoverable>
            <Statistic title="累计评论" value={stats?.totalComments || 0} prefix={<MessageOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card hoverable>
            <Statistic title="累计打赏" value={stats?.totalGifts || 0} prefix={<GiftOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card hoverable>
            <Statistic title="峰值观众" value={stats?.peakViewers || 0} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card hoverable>
            <Statistic title="预估销售额" value={stats?.salesAmount || 0} prefix={<DollarOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      {/* 直播间列表 */}
      <Card
        title="监控的直播间"
        extra={
          <Space>
            <Select value={platform} onChange={setPlatform} style={{ width: 120 }}>
              <Select.Option value="douyin">抖音</Select.Option>
              <Select.Option value="kuaishou">快手</Select.Option>
              <Select.Option value="taobao">淘宝直播</Select.Option>
              <Select.Option value="bilibili">B站直播</Select.Option>
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddRoomModalVisible(true)}>
              添加直播间
            </Button>
          </Space>
        }
      >
        {rooms.length === 0 ? (
          <Empty
            description="暂无监控的直播间"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddRoomModalVisible(true)}>
              添加第一个直播间
            </Button>
          </Empty>
        ) : (
          <Table dataSource={rooms} columns={columns} rowKey="id" pagination={false} />
        )}
      </Card>

      {/* 实时数据面板 */}
      {selectedRoom && roomDetailVisible && (
        <Card
          title={
            <Space>
              <VideoCameraOutlined />
              {selectedRoom.roomName}
              {isCapturing && <Badge status="processing" text="采集中" />}
            </Space>
          }
          style={{ marginTop: 24 }}
          extra={
            <Space>
              <Button icon={<ReloadOutlined />} onClick={() => captureRoomData(selectedRoom)}>
                刷新
              </Button>
              <Button icon={<ShareAltOutlined />} onClick={handleExportData}>
                导出数据
              </Button>
              <Button onClick={() => {
                handleStopCapture();
                setRoomDetailVisible(false);
              }}>
                关闭
              </Button>
            </Space>
          }
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'comments',
                label: <span><MessageOutlined /> 弹幕 ({comments.length})</span>,
                children: (
                  <Table
                    dataSource={comments}
                    columns={commentColumns}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 10 }}
                    scroll={{ y: 300 }}
                  />
                ),
              },
              {
                key: 'products',
                label: <span><ShoppingOutlined /> 商品 ({liveProducts.length})</span>,
                children: (
                  <Table
                    dataSource={liveProducts}
                    columns={productColumns}
                    rowKey="id"
                    size="small"
                    pagination={false}
                  />
                ),
              },
              {
                key: 'stats',
                label: <span><LineChartOutlined /> 统计</span>,
                children: (
                  <div>
                    {stats && (
                      <Row gutter={16}>
                        <Col span={8}>
                          <Card size="small">
                            <Statistic title="直播时长" value={stats.duration} prefix={<ClockCircleOutlined />} />
                          </Card>
                        </Col>
                        <Col span={8}>
                          <Card size="small">
                            <Statistic title="平均在线" value={stats.avgViewers} suffix="人" />
                          </Card>
                        </Col>
                        <Col span={8}>
                          <Card size="small">
                            <Statistic title="预估GMV" value={stats.salesAmount} prefix="¥" valueStyle={{ color: '#52c41a' }} />
                          </Card>
                        </Col>
                      </Row>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </Card>
      )}

      {/* 添加直播间弹窗 */}
      <Modal
        title="添加直播间"
        open={addRoomModalVisible}
        onOk={handleAddRoom}
        onCancel={() => setAddRoomModalVisible(false)}
        okText="添加"
      >
        <Form form={newRoomForm} layout="vertical">
          <Form.Item label="平台" name="platform" initialValue={platform}>
            <Select onChange={setPlatform}>
              <Select.Option value="douyin">抖音</Select.Option>
              <Select.Option value="kuaishou">快手</Select.Option>
              <Select.Option value="taobao">淘宝直播</Select.Option>
              <Select.Option value="bilibili">B站直播</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="直播间链接"
            name="link"
            rules={[{ required: true, message: '请输入直播间链接' }]}
          >
            <Input placeholder="粘贴直播间分享链接" />
          </Form.Item>
          <Form.Item label="直播间名称" name="name">
            <Input placeholder="自动识别或手动输入" />
          </Form.Item>
          <Form.Item label="主播名称" name="hostName">
            <Input placeholder="输入主播名称" />
          </Form.Item>
        </Form>
        <Alert
          message="支持的平台"
          description={
            <div>
              <Text>支持抖音、快手、淘宝直播、B站直播等主流平台的直播间数据采集。</Text>
              <br />
              <Text type="secondary">注意：部分平台可能需要登录授权才能获取完整数据。</Text>
            </div>
          }
          type="info"
          style={{ marginTop: 16 }}
        />
      </Modal>
    </div>
  );
}
