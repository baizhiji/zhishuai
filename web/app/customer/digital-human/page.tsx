'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Upload,
  message,
  Avatar,
  Typography,
  Statistic,
  Tabs,
  Progress,
  Alert,
  List,
  Badge,
  Timeline,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  VideoCameraOutlined,
  SoundOutlined,
  PictureOutlined,
  PlayCircleOutlined,
  UploadOutlined,
  RobotOutlined,
  ManOutlined,
  WomanOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  AudioOutlined,
  VideoCameraOutlined,
  EyeOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import request from '@/utils/request';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// 数字人类型
interface DigitalHuman {
  id: string;
  name: string;
  avatar: string;
  gender: 'male' | 'female';
  style: string;
  voice: string;
  status: 'active' | 'training' | 'inactive';
  usageCount: number;
  createdAt: string;
  description: string;
}

// 声音克隆类型
interface VoiceClone {
  id: string;
  name: string;
  gender: string;
  description: string;
  audioUrl: string;
  language: string;
  status: 'ready' | 'processing' | 'failed';
  usageCount: number;
  createdAt: string;
}

// 视频克隆类型
interface VideoClone {
  id: string;
  name: string;
  type: string;
  sourceVideoUrl: string;
  sourceImageUrl: string;
  videoUrl: string;
  thumbnail: string;
  description: string;
  status: 'processing' | 'ready' | 'failed';
  progress: number;
  createdAt: string;
}

const STYLE_OPTIONS = [
  { value: 'professional', label: '专业正式', icon: '👔' },
  { value: 'friendly', label: '亲切友好', icon: '🤝' },
  { value: 'casual', label: '轻松活泼', icon: '😊' },
  { value: 'serious', label: '严肃认真', icon: '📋' },
];

const VOICE_OPTIONS = [
  { value: 'female_warm', label: '女声-温暖型', preview: '音色柔和，适合情感类内容' },
  { value: 'female_professional', label: '女声-专业型', preview: '清晰稳重，适合知识科普' },
  { value: 'male_warm', label: '男声-温暖型', preview: '磁性温和，适合励志内容' },
  { value: 'male_professional', label: '男声-专业型', preview: '沉稳有力，适合商务内容' },
];

const VIDEO_TYPES = [
  { value: 'digital_human', label: '数字人视频', desc: '使用数字人形象生成视频' },
  { value: 'talking_photo', label: ' talking photo', desc: '让照片说话' },
  { value: 'lip_sync', label: '唇形同步', desc: '根据音频同步唇形' },
];

export default function DigitalHumanPage() {
  const [activeTab, setActiveTab] = useState('humans');
  const [humans, setHumans] = useState<DigitalHuman[]>([
    {
      id: '1',
      name: '小智助手',
      avatar: '',
      gender: 'female',
      style: 'friendly',
      voice: 'female_warm',
      status: 'active',
      usageCount: 156,
      createdAt: '2024-03-15',
      description: '智能助手形象，适合企业宣传、产品介绍等场景',
    },
    {
      id: '2',
      name: '智囊专家',
      avatar: '',
      gender: 'male',
      style: 'professional',
      voice: 'male_professional',
      status: 'active',
      usageCount: 89,
      createdAt: '2024-03-18',
      description: '专业顾问形象，适合商业分析、咨询服务等场景',
    },
  ]);
  const [voices, setVoices] = useState<VoiceClone[]>([]);
  const [videos, setVideos] = useState<VideoClone[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [editingHuman, setEditingHuman] = useState<DigitalHuman | null>(null);
  const [form] = Form.useForm();
  const [voiceForm] = Form.useForm();
  const [videoForm] = Form.useForm();
  const [generatingVideo, setGeneratingVideo] = useState(false);

  // 加载数据
  useEffect(() => {
    loadVoices();
    loadVideos();
  }, []);

  const loadVoices = async () => {
    try {
      const res = await request.get('/api/voice-clone/voices');
      setVoices(res.voices || []);
    } catch (error) {
      console.error('加载声音列表失败', error);
    }
  };

  const loadVideos = async () => {
    try {
      const res = await request.get('/api/voice-clone/videos');
      setVideos(res.videos || []);
    } catch (error) {
      console.error('加载视频列表失败', error);
    }
  };

  // 数字人表格列
  const humanColumns: ColumnsType<DigitalHuman> = [
    {
      title: '数字人',
      key: 'avatar',
      width: 200,
      render: (_, record) => (
        <Space>
          <Avatar
            size={48}
            icon={record.gender === 'female' ? <WomanOutlined /> : <ManOutlined />}
            style={{ background: record.gender === 'female' ? '#ff6b9d' : '#1890ff' }}
          />
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <Tag color={record.gender === 'female' ? 'pink' : 'blue'}>
              {record.gender === 'female' ? '女' : '男'}
            </Tag>
          </div>
        </Space>
      ),
    },
    {
      title: '风格',
      dataIndex: 'style',
      key: 'style',
      render: (style: string) => (
        <Text>{STYLE_OPTIONS.find(s => s.value === style)?.label || style}</Text>
      ),
    },
    {
      title: '音色',
      dataIndex: 'voice',
      key: 'voice',
      render: (voice: string) => (
        <Text type="secondary">{VOICE_OPTIONS.find(v => v.value === voice)?.label || voice}</Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config: Record<string, { color: string; label: string }> = {
          active: { color: 'success', label: '可用' },
          training: { color: 'processing', label: '训练中' },
          inactive: { color: 'default', label: '停用' },
        };
        return <Tag color={config[status]?.color}>{config[status]?.label || status}</Tag>;
      },
    },
    {
      title: '使用次数',
      dataIndex: 'usageCount',
      key: 'usageCount',
      render: (count: number) => <Text>{count} 次</Text>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<VideoCameraOutlined />}
            onClick={() => {
              videoForm.setFieldsValue({ humanId: record.id });
              setVideoModalVisible(true);
            }}
          >
            生成视频
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => {
            setEditingHuman(record);
            form.setFieldsValue(record);
            setModalVisible(true);
          }}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  // 声音克隆表格列
  const voiceColumns: ColumnsType<VoiceClone> = [
    {
      title: '声音名称',
      key: 'name',
      render: (_, record) => (
        <Space>
          <Avatar icon={<SoundOutlined />} style={{ background: '#722ed1' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.description || '-'}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      render: (gender: string) => (
        <Tag color={gender === 'female' ? 'pink' : 'blue'}>
          {gender === 'female' ? '女' : '男'}
        </Tag>
      ),
    },
    {
      title: '语言',
      dataIndex: 'language',
      key: 'language',
      render: (lang: string) => lang === 'zh-CN' ? '中文' : lang,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config: Record<string, { color: string; label: string }> = {
          ready: { color: 'success', label: '可用' },
          processing: { color: 'processing', label: '处理中' },
          failed: { color: 'error', label: '失败' },
        };
        return <Tag color={config[status]?.color}>{config[status]?.label || status}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<PlayCircleOutlined />} disabled={record.status !== 'ready'}>
            试听
          </Button>
          <Button type="link" size="small" icon={<DeleteOutlined />} danger onClick={() => handleDeleteVoice(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 视频克隆表格列
  const videoColumns: ColumnsType<VideoClone> = [
    {
      title: '视频名称',
      key: 'name',
      render: (_, record) => (
        <Space>
          <Avatar icon={<VideoOutlined />} style={{ background: '#fa8c16' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {VIDEO_TYPES.find(t => t.value === record.type)?.label}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: VideoClone) => {
        const config: Record<string, { color: string; label: string }> = {
          processing: { color: 'processing', label: '处理中' },
          ready: { color: 'success', label: '已完成' },
          failed: { color: 'error', label: '失败' },
        };
        return (
          <Space direction="vertical" size={0}>
            <Tag color={config[status]?.color}>{config[status]?.label || status}</Tag>
            {status === 'processing' && <Progress percent={record.progress} size="small" style={{ width: 80 }} />}
          </Space>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.status === 'ready' && (
            <>
              <Button type="link" size="small" icon={<EyeOutlined />}>预览</Button>
              <Button type="link" size="small" icon={<DownloadOutlined />}>下载</Button>
            </>
          )}
          <Button type="link" size="small" icon={<DeleteOutlined />} danger onClick={() => handleDeleteVideo(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 删除声音
  const handleDeleteVoice = async (id: string) => {
    try {
      await request.delete(`/api/voice-clone/voices/${id}`);
      message.success('删除成功');
      loadVoices();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 删除视频
  const handleDeleteVideo = async (id: string) => {
    try {
      await request.delete(`/api/voice-clone/videos/${id}`);
      message.success('删除成功');
      loadVideos();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 创建声音克隆
  const handleCreateVoice = async () => {
    try {
      const values = await voiceForm.validateFields();
      await request.post('/api/voice-clone/voices', values);
      message.success('声音克隆创建成功，处理中...');
      setVoiceModalVisible(false);
      voiceForm.resetFields();
      loadVoices();
    } catch (error: any) {
      message.error(error?.message || '创建失败');
    }
  };

  // 创建视频克隆
  const handleCreateVideo = async () => {
    try {
      const values = await videoForm.validateFields();
      setGeneratingVideo(true);
      await request.post('/api/voice-clone/videos', values);
      message.success('视频克隆任务已创建，处理中...');
      setVideoModalVisible(false);
      videoForm.resetFields();
      loadVideos();
    } catch (error: any) {
      message.error(error?.message || '创建失败');
    } finally {
      setGeneratingVideo(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={4}>
        <RobotOutlined style={{ marginRight: 8 }} />
        AI 数字人中心
      </Title>
      <Paragraph type="secondary">
        创建专属数字人形象、克隆声音、生成数字人视频，打造独特的AI品牌形象。
      </Paragraph>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'humans',
            label: (
              <span><RobotOutlined /> 数字人形象</span>
            ),
            children: (
              <Card>
                <Row gutter={16} style={{ marginBottom: 24 }}>
                  <Col span={6}>
                    <Statistic title="数字人总数" value={humans.length} prefix={<RobotOutlined />} />
                  </Col>
                  <Col span={6}>
                    <Statistic title="可用形象" value={humans.filter(h => h.status === 'active').length} valueStyle={{ color: '#52c41a' }} />
                  </Col>
                  <Col span={6}>
                    <Statistic title="声音克隆" value={voices.length} prefix={<SoundOutlined />} />
                  </Col>
                  <Col span={6}>
                    <Statistic title="视频克隆" value={videos.filter(v => v.status === 'ready').length} prefix={<VideoOutlined />} />
                  </Col>
                </Row>
                
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)} style={{ marginBottom: 16 }}>
                  创建数字人
                </Button>
                
                <Table columns={humanColumns} dataSource={humans} rowKey="id" />
              </Card>
            ),
          },
          {
            key: 'voices',
            label: (
              <span><SoundOutlined /> 声音克隆</span>
            ),
            children: (
              <Card>
                <Alert
                  message="声音克隆功能"
                  description="上传您的声音样本，系统将学习并生成您专属的AI声音模型。支持中文、英文等多种语言。"
                  type="info"
                  style={{ marginBottom: 16 }}
                />
                
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setVoiceModalVisible(true)} style={{ marginBottom: 16 }}>
                  创建声音克隆
                </Button>
                
                <Table columns={voiceColumns} dataSource={voices} rowKey="id" pagination={{ pageSize: 5 }} />
              </Card>
            ),
          },
          {
            key: 'videos',
            label: (
              <span><VideoOutlined /> 视频克隆</span>
            ),
            children: (
              <Card>
                <Alert
                  message="视频克隆功能"
                  description="支持数字人视频生成、照片说话（talking photo）、唇形同步（lip sync）等多种视频生成能力。"
                  type="info"
                  style={{ marginBottom: 16 }}
                />
                
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setVideoModalVisible(true)} style={{ marginBottom: 16 }}>
                  创建视频克隆
                </Button>
                
                <Table columns={videoColumns} dataSource={videos} rowKey="id" pagination={{ pageSize: 5 }} />
              </Card>
            ),
          },
        ]}
      />

      {/* 创建数字人弹窗 */}
      <Modal
        title={editingHuman ? '编辑数字人' : '创建数字人'}
        open={modalVisible}
        onOk={() => {
          form.validateFields().then(() => {
            message.success(editingHuman ? '更新成功' : '创建成功');
            setModalVisible(false);
          });
        }}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="数字人名称" rules={[{ required: true }]}>
            <Input placeholder="请输入数字人名称" />
          </Form.Item>
          <Form.Item name="gender" label="性别" initialValue="female">
            <Select>
              <Select.Option value="female"><WomanOutlined /> 女性</Select.Option>
              <Select.Option value="male"><ManOutlined /> 男性</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="style" label="风格" initialValue="friendly">
            <Select>
              {STYLE_OPTIONS.map(opt => (
                <Select.Option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="voice" label="音色" initialValue="female_warm">
            <Select>
              {VOICE_OPTIONS.map(opt => (
                <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入数字人描述" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 声音克隆弹窗 */}
      <Modal
        title="创建声音克隆"
        open={voiceModalVisible}
        onOk={handleCreateVoice}
        onCancel={() => setVoiceModalVisible(false)}
      >
        <Alert
          message="请上传清晰的声音样本"
          description="建议上传30秒以上的人声音频，格式支持MP3、WAV，时长建议1-3分钟效果更佳。"
          type="info"
          style={{ marginBottom: 16 }}
        />
        <Form form={voiceForm} layout="vertical">
          <Form.Item name="name" label="声音名称" rules={[{ required: true }]}>
            <Input placeholder="请输入声音名称，如：我的声音" />
          </Form.Item>
          <Form.Item name="gender" label="性别" initialValue="female">
            <Select>
              <Select.Option value="female">女性</Select.Option>
              <Select.Option value="male">男性</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="language" label="语言" initialValue="zh-CN">
            <Select>
              <Select.Option value="zh-CN">中文</Select.Option>
              <Select.Option value="en-US">英文</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="audioUrl" label="声音样本">
            <Upload maxCount={1} accept="audio/*">
              <Button icon={<UploadOutlined />}>上传音频</Button>
            </Upload>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={2} placeholder="请输入声音描述（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 视频克隆弹窗 */}
      <Modal
        title="创建视频克隆"
        open={videoModalVisible}
        onOk={handleCreateVideo}
        onCancel={() => setVideoModalVisible(false)}
        width={700}
        confirmLoading={generatingVideo}
      >
        <Alert
          message="视频克隆说明"
          description="根据选择的类型，上传相应的源素材。处理时间取决于视频长度和服务器负载，通常需要3-10分钟。"
          type="info"
          style={{ marginBottom: 16 }}
        />
        <Form form={videoForm} layout="vertical">
          <Form.Item name="name" label="视频名称" rules={[{ required: true }]}>
            <Input placeholder="请输入视频名称" />
          </Form.Item>
          <Form.Item name="type" label="克隆类型" initialValue="digital_human" rules={[{ required: true }]}>
            <Select>
              {VIDEO_TYPES.map(type => (
                <Select.Option key={type.value} value={type.value}>
                  <Space>
                    <span>{type.label}</span>
                    <Text type="secondary">- {type.desc}</Text>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.type !== curr.type}
          >
            {({ getFieldValue }) => (
              <>
                {getFieldValue('type') === 'talking_photo' && (
                  <Form.Item name="sourceImageUrl" label="源图片" rules={[{ required: true }]}>
                    <Upload maxCount={1} accept="image/*" listType="picture">
                      <Button icon={<PictureOutlined />}>上传图片</Button>
                    </Upload>
                  </Form.Item>
                )}
                {getFieldValue('type') === 'lip_sync' && (
                  <Form.Item name="sourceVideoUrl" label="源视频" rules={[{ required: true }]}>
                    <Upload maxCount={1} accept="video/*">
                      <Button icon={<VideoOutlined />}>上传视频</Button>
                    </Upload>
                  </Form.Item>
                )}
              </>
            )}
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={2} placeholder="请输入视频描述（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
