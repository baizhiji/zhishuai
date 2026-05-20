'use client';

import { useState } from 'react';
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
  Descriptions,
  Statistic,
  Tabs,
  Divider,
  Progress,
  Alert,
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
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

// 数字人模型类型
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

// 视频模板类型
interface VideoTemplate {
  id: string;
  name: string;
  thumbnail: string;
  duration: number;
  style: string;
  scenes: number;
  usageCount: number;
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

export default function DigitalHumanPage() {
  const [loading, setLoading] = useState(false);
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
          <Button type="link" size="small" icon={<VideoCameraOutlined />} onClick={() => {
            videoForm.setFieldsValue({ humanId: record.id });
            setVideoModalVisible(true);
          }}>
            生成视频
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => {
            setEditingHuman(record);
            form.setFieldsValue(record);
            setModalVisible(true);
          }}>
            编辑
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const templateColumns: ColumnsType<VideoTemplate> = [
    { title: '模板名称', dataIndex: 'name', key: 'name' },
    { title: '时长', dataIndex: 'duration', key: 'duration', render: (d: number) => `${d}秒` },
    { title: '场景数', dataIndex: 'scenes', key: 'scenes', render: (s: number) => `${s}个` },
    { title: '使用次数', dataIndex: 'usageCount', key: 'usageCount', render: (c: number) => `${c}次` },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="primary" size="small" icon={<PlayCircleOutlined />} onClick={() => {
          videoForm.setFieldsValue({ templateId: record.id });
          setVideoModalVisible(true);
        }}>
          使用模板
        </Button>
      ),
    },
  ];

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
  };

  return (
    <div style={{ padding: 24 }}>
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
          </Form.Item>
        </Form>
      </Modal>

      {/* 生成视频弹窗 */}
      <Modal
        title="生成视频"
        open={videoModalVisible}
        onOk={handleGenerateVideo}
        onCancel={() => setVideoModalVisible(false)}
        width={700}
        confirmLoading={generatingVideo}
      >
        <Alert
          message="视频生成说明"
          description="填写脚本内容，选择数字人形象，系统将自动生成配套视频。整个过程预计需要3-5分钟。"
          type="info"
          style={{ marginBottom: 16 }}
        />
        <Form form={videoForm} layout="vertical">
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
        </Form>
      </Modal>
    </div>
  );
}
