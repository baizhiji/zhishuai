'use client';

<<<<<<< HEAD
import { useState } from 'react';
=======
import React, { useState, useEffect } from 'react';
>>>>>>> 962968886be726cd434c792933b5515366d34518
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
<<<<<<< HEAD
  Descriptions,
  Statistic,
  Tabs,
  Divider,
  Progress,
  Alert,
=======
  Statistic,
  Tabs,
  Progress,
  Alert,
  List,
  Badge,
  Timeline,
>>>>>>> 962968886be726cd434c792933b5515366d34518
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
<<<<<<< HEAD
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

// 数字人模型类型
=======
  AudioOutlined,
  EyeOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import request from '@/utils/request';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// 数字人类型
>>>>>>> 962968886be726cd434c792933b5515366d34518
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

<<<<<<< HEAD
// 视频模板类型
interface VideoTemplate {
  id: string;
  name: string;
  thumbnail: string;
  duration: number;
  style: string;
  scenes: number;
=======
// 声音克隆类型
interface VoiceClone {
  id: string;
  name: string;
  gender: string;
  description: string;
  audioUrl: string;
  language: string;
  status: 'ready' | 'processing' | 'failed';
>>>>>>> 962968886be726cd434c792933b5515366d34518
  usageCount: number;
  createdAt: string;
}

<<<<<<< HEAD
=======
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

>>>>>>> 962968886be726cd434c792933b5515366d34518
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

<<<<<<< HEAD
export default function DigitalHumanPage() {
  const [loading, setLoading] = useState(false);
=======
const VIDEO_TYPES = [
  { value: 'digital_human', label: '数字人视频', desc: '使用数字人形象生成视频' },
  { value: 'talking_photo', label: ' talking photo', desc: '让照片说话' },
  { value: 'lip_sync', label: '唇形同步', desc: '根据音频同步唇形' },
];

export default function DigitalHumanPage() {
  const [activeTab, setActiveTab] = useState('humans');
>>>>>>> 962968886be726cd434c792933b5515366d34518
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
<<<<<<< HEAD
  const [templates] = useState<VideoTemplate[]>([
    { id: '1', name: '企业宣传片', thumbnail: '', duration: 60, style: 'professional', scenes: 5, usageCount: 45, createdAt: '2024-03-10' },
    { id: '2', name: '产品介绍', thumbnail: '', duration: 30, style: 'friendly', scenes: 3, usageCount: 78, createdAt: '2024-03-12' },
    { id: '3', name: '招聘宣讲', thumbnail: '', duration: 120, style: 'friendly', scenes: 8, usageCount: 23, createdAt: '2024-03-14' },
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHuman, setEditingHuman] = useState<DigitalHuman | null>(null);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [videoForm] = Form.useForm();
  const [form] = Form.useForm();

  const columns: ColumnsType<DigitalHuman> = [
=======
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
>>>>>>> 962968886be726cd434c792933b5515366d34518
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
<<<<<<< HEAD
          <Button type="link" size="small" icon={<VideoCameraOutlined />} onClick={() => {
            videoForm.setFieldsValue({ humanId: record.id });
            setVideoModalVisible(true);
          }}>
=======
          <Button
            type="link"
            size="small"
            icon={<VideoCameraOutlined />}
            onClick={() => {
              videoForm.setFieldsValue({ humanId: record.id });
              setVideoModalVisible(true);
            }}
          >
>>>>>>> 962968886be726cd434c792933b5515366d34518
            生成视频
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => {
            setEditingHuman(record);
            form.setFieldsValue(record);
            setModalVisible(true);
          }}>
            编辑
          </Button>
<<<<<<< HEAD
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
=======
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
>>>>>>> 962968886be726cd434c792933b5515366d34518
            删除
          </Button>
        </Space>
      ),
    },
  ];

<<<<<<< HEAD
  const templateColumns: ColumnsType<VideoTemplate> = [
    { title: '模板名称', dataIndex: 'name', key: 'name' },
    { title: '时长', dataIndex: 'duration', key: 'duration', render: (d: number) => `${d}秒` },
    { title: '场景数', dataIndex: 'scenes', key: 'scenes', render: (s: number) => `${s}个` },
    { title: '使用次数', dataIndex: 'usageCount', key: 'usageCount', render: (c: number) => `${c}次` },
=======
  // 视频克隆表格列
  const videoColumns: ColumnsType<VideoClone> = [
    {
      title: '视频名称',
      key: 'name',
      render: (_, record) => (
        <Space>
          <Avatar icon={<VideoCameraOutlined />} style={{ background: '#fa8c16' }} />
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
>>>>>>> 962968886be726cd434c792933b5515366d34518
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
<<<<<<< HEAD
        <Button type="primary" size="small" icon={<PlayCircleOutlined />} onClick={() => {
          videoForm.setFieldsValue({ templateId: record.id });
          setVideoModalVisible(true);
        }}>
          使用模板
        </Button>
=======
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
>>>>>>> 962968886be726cd434c792933b5515366d34518
      ),
    },
  ];

<<<<<<< HEAD
  const handleSubmit = () => {
    form.validateFields().then(values => {
      if (editingHuman) {
        setHumans(humans.map(h => h.id === editingHuman.id ? { ...h, ...values } : h));
        message.success('数字人已更新');
      } else {
        setHumans([...humans, {
          ...values,
          id: Date.now().toString(),
          status: 'active',
          usageCount: 0,
          createdAt: new Date().toISOString().split('T')[0],
        }]);
        message.success('数字人已创建');
      }
      setModalVisible(false);
      form.resetFields();
    });
  };

  const handleGenerateVideo = () => {
    videoForm.validateFields().then(values => {
      setGeneratingVideo(true);
      // 模拟视频生成
      setTimeout(() => {
        setGeneratingVideo(false);
        setVideoModalVisible(false);
        message.success('视频生成任务已提交，请在任务列表查看进度');
        videoForm.resetFields();
      }, 2000);
    });
=======
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
>>>>>>> 962968886be726cd434c792933b5515366d34518
  };

  return (
    <div style={{ padding: 24 }}>
<<<<<<< HEAD
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 8 }}>
          <RobotOutlined style={{ marginRight: 8 }} />
          数字人视频
        </Title>
        <Text type="secondary">
          AI数字人形象，支持一键生成宣传视频、课程讲解、产品介绍等多种场景
        </Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card><Statistic title="数字人形象" value={humans.length} prefix={<RobotOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="视频模板" value={templates.length} prefix={<VideoCameraOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="已生成视频" value={156} prefix={<PlayCircleOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="本月生成" value={23} suffix="个" valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
      </Row>

      {/* 提示信息 */}
      <Alert
        message="数字人视频服务"
        description="基于AI技术的一键视频生成，支持多种数字人形象和音色选择。生成的视频可用于宣传、教学、客服等多个场景。"
        type="info"
        showIcon
        icon={<RobotOutlined />}
        style={{ marginBottom: 24 }}
      />

      <Card>
        <Tabs defaultActiveKey="humans">
          <TabPane tab={<span><RobotOutlined /> 数字人管理</span>} key="humans">
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                setEditingHuman(null);
                form.resetFields();
                setModalVisible(true);
              }}>
                创建数字人
              </Button>
            </div>
            <Table columns={columns} dataSource={humans} rowKey="id" />
          </TabPane>
          <TabPane tab={<span><VideoCameraOutlined /> 视频模板</span>} key="templates">
            <Table columns={templateColumns} dataSource={templates} rowKey="id" />
          </TabPane>
          <TabPane tab={<span><PlayCircleOutlined /> 生成记录</span>} key="records">
            <div style={{ textAlign: 'center', padding: 48 }}>
              <Text type="secondary">暂无生成记录</Text>
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* 创建/编辑数字人弹窗 */}
      <Modal
        title={editingHuman ? '编辑数字人' : '创建数字人'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="例如：企业助手" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={2} placeholder="简短描述数字人的用途" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="gender" label="性别" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="female"><WomanOutlined /> 女声</Select.Option>
                  <Select.Option value="male"><ManOutlined /> 男声</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="style" label="风格" rules={[{ required: true }]}>
                <Select>
                  {STYLE_OPTIONS.map(s => (
                    <Select.Option key={s.value} value={s.value}>
                      <Space>{s.icon} {s.label}</Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="voice" label="音色" rules={[{ required: true }]}>
            <Select>
              {VOICE_OPTIONS.map(v => (
                <Select.Option key={v.value} value={v.value}>
                  {v.label} - {v.preview}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="avatar" label="头像图片">
            <Upload maxCount={1} listType="picture">
              <Button icon={<UploadOutlined />}>上传头像</Button>
            </Upload>
=======
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
                    <Statistic title="视频克隆" value={videos.filter(v => v.status === 'ready').length} prefix={<VideoCameraOutlined />} />
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
              <span><VideoCameraOutlined /> 视频克隆</span>
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
>>>>>>> 962968886be726cd434c792933b5515366d34518
          </Form.Item>
        </Form>
      </Modal>

<<<<<<< HEAD
      {/* 生成视频弹窗 */}
      <Modal
        title="生成视频"
        open={videoModalVisible}
        onOk={handleGenerateVideo}
=======
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
>>>>>>> 962968886be726cd434c792933b5515366d34518
        onCancel={() => setVideoModalVisible(false)}
        width={700}
        confirmLoading={generatingVideo}
      >
        <Alert
<<<<<<< HEAD
          message="视频生成说明"
          description="填写脚本内容，选择数字人形象，系统将自动生成配套视频。整个过程预计需要3-5分钟。"
=======
          message="视频克隆说明"
          description="根据选择的类型，上传相应的源素材。处理时间取决于视频长度和服务器负载，通常需要3-10分钟。"
>>>>>>> 962968886be726cd434c792933b5515366d34518
          type="info"
          style={{ marginBottom: 16 }}
        />
        <Form form={videoForm} layout="vertical">
<<<<<<< HEAD
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="humanId" label="选择数字人" rules={[{ required: true }]}>
                <Select placeholder="请选择">
                  {humans.filter(h => h.status === 'active').map(h => (
                    <Select.Option key={h.id} value={h.id}>
                      <Space>
                        {h.name}
                        <Tag>{h.gender === 'female' ? '女' : '男'}</Tag>
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="templateId" label="选择模板">
                <Select placeholder="可选">
                  {templates.map(t => (
                    <Select.Option key={t.id} value={t.id}>
                      {t.name} ({t.duration}秒)
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="title" label="视频标题" rules={[{ required: true }]}>
            <Input placeholder="请输入视频标题" />
          </Form.Item>
          <Form.Item name="script" label="视频脚本" rules={[{ required: true }]}>
            <TextArea rows={6} placeholder="请输入视频脚本内容，支持分段，每段用空行分隔..." />
          </Form.Item>
          <Form.Item name="backgroundMusic" label="背景音乐">
            <Select placeholder="选择背景音乐（可选）">
              <Select.Option value="none">无</Select.Option>
              <Select.Option value="corporate">企业风格</Select.Option>
              <Select.Option value="friendly">轻松友好</Select.Option>
              <Select.Option value="dynamic">活力动感</Select.Option>
            </Select>
          </Form.Item>
=======
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
                      <Button icon={<VideoCameraOutlined />}>上传视频</Button>
                    </Upload>
                  </Form.Item>
                )}
              </>
            )}
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={2} placeholder="请输入视频描述（可选）" />
          </Form.Item>
>>>>>>> 962968886be726cd434c792933b5515366d34518
        </Form>
      </Modal>
    </div>
  );
}
