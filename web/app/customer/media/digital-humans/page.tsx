'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Table,
  Tag,
  Modal,
  message,
  Image,
  Upload,
  Form,
  Input,
  Select,
  Radio,
  Divider,
  Avatar,
  Popconfirm,
  Empty,
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  DeleteOutlined,
  EditOutlined,
  VideoCameraOutlined,
  CameraOutlined,
  RobotOutlined,
  ApiOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { DigitalHuman, DigitalHumanType } from '@/lib/content/types';

const { Title, Text } = Typography;

export default function DigitalHumanWarehousePage() {
  const [digitalHumans, setDigitalHumans] = useState<DigitalHuman[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isApiModalVisible, setIsApiModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // 从 localStorage 加载数字人数据
  useEffect(() => {
    loadDigitalHumans();
  }, []);

  const loadDigitalHumans = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('digital-humans');
      if (saved) {
        try {
          setDigitalHumans(JSON.parse(saved));
        } catch (error) {
          console.error('加载数字人失败:', error);
        }
      }

      // 初始化系统自带数字人
      initializeSystemDigitalHumans();
    }
  };

  const initializeSystemDigitalHumans = () => {
    if (typeof window !== 'undefined') {
      const systemHumans: DigitalHuman[] = [
        // 商务风格 - 男
        {
          id: 'system_male_1',
          name: '商务精英-沉稳',
          type: DigitalHumanType.SYSTEM,
          avatar: 'https://via.placeholder.com/150/1e3a5f/ffffff?text=商务男1',
          gender: 'male',
          ageRange: '35-40',
          style: '商务精英',
          features: ['沉稳', '专业', '西装'],
          createdAt: Date.now(),
          status: 'active',
        },
        {
          id: 'system_male_2',
          name: '商务精英-活力',
          type: DigitalHumanType.SYSTEM,
          avatar: 'https://via.placeholder.com/150/2563eb/ffffff?text=商务男2',
          gender: 'male',
          ageRange: '30-35',
          style: '商务精英',
          features: ['活力', '年轻', '商务'],
          createdAt: Date.now(),
          status: 'active',
        },
        {
          id: 'system_male_3',
          name: '知识博主',
          type: DigitalHumanType.SYSTEM,
          avatar: 'https://via.placeholder.com/150/0891b2/ffffff?text=知识男',
          gender: 'male',
          ageRange: '32-38',
          style: '知识分享',
          features: ['知识型', '教授', '学者'],
          createdAt: Date.now(),
          status: 'active',
        },
        {
          id: 'system_male_4',
          name: '科技达人的',
          type: DigitalHumanType.SYSTEM,
          avatar: 'https://via.placeholder.com/150/6366f1/ffffff?text=科技男',
          gender: 'male',
          ageRange: '28-33',
          style: '科技数码',
          features: ['科技', '数码', '极客'],
          createdAt: Date.now(),
          status: 'active',
        },
        // 商务风格 - 女
        {
          id: 'system_female_1',
          name: '职场女强人',
          type: DigitalHumanType.SYSTEM,
          avatar: 'https://via.placeholder.com/150/be185d/ffffff?text=职场女1',
          gender: 'female',
          ageRange: '30-35',
          style: '职场精英',
          features: ['干练', '专业', '优雅'],
          createdAt: Date.now(),
          status: 'active',
        },
        {
          id: 'system_female_2',
          name: '知性女神',
          type: DigitalHumanType.SYSTEM,
          avatar: 'https://via.placeholder.com/150/db2777/ffffff?text=知性女',
          gender: 'female',
          ageRange: '28-33',
          style: '知性优雅',
          features: ['知性', '优雅', '温婉'],
          createdAt: Date.now(),
          status: 'active',
        },
        {
          id: 'system_female_3',
          name: '美妆达人',
          type: DigitalHumanType.SYSTEM,
          avatar: 'https://via.placeholder.com/150/ec4899/ffffff?text=美妆女',
          gender: 'female',
          ageRange: '25-30',
          style: '美妆时尚',
          features: ['美妆', '时尚', '潮流'],
          createdAt: Date.now(),
          status: 'active',
        },
        {
          id: 'system_female_4',
          name: '健身教练',
          type: DigitalHumanType.SYSTEM,
          avatar: 'https://via.placeholder.com/150/f43f5e/ffffff?text=健身女',
          gender: 'female',
          ageRange: '26-32',
          style: '运动健身',
          features: ['健身', '运动', '健康'],
          createdAt: Date.now(),
          status: 'active',
        },
        // 活泼风格 - 男
        {
          id: 'system_male_5',
          name: '阳光男孩',
          type: DigitalHumanType.SYSTEM,
          avatar: 'https://via.placeholder.com/150/22c55e/ffffff?text=阳光男',
          gender: 'male',
          ageRange: '22-27',
          style: '阳光活力',
          features: ['阳光', '活力', '年轻'],
          createdAt: Date.now(),
          status: 'active',
        },
        {
          id: 'system_male_6',
          name: '搞笑达人',
          type: DigitalHumanType.SYSTEM,
          avatar: 'https://via.placeholder.com/150/84cc16/ffffff?text=搞笑男',
          gender: 'male',
          ageRange: '24-30',
          style: '幽默搞笑',
          features: ['搞笑', '幽默', '娱乐'],
          createdAt: Date.now(),
          status: 'active',
        },
        {
          id: 'system_male_7',
          name: '美食博主',
          type: DigitalHumanType.SYSTEM,
          avatar: 'https://via.placeholder.com/150/f97316/ffffff?text=美食男',
          gender: 'male',
          ageRange: '26-32',
          style: '美食生活',
          features: ['美食', '生活', '探店'],
          createdAt: Date.now(),
          status: 'active',
        },
        {
          id: 'system_male_8',
          name: '旅游达人',
          type: DigitalHumanType.SYSTEM,
          avatar: 'https://via.placeholder.com/150/14b8a6/ffffff?text=旅游男',
          gender: 'male',
          ageRange: '28-34',
          style: '旅游出行',
          features: ['旅游', '户外', '探险'],
          createdAt: Date.now(),
          status: 'active',
        },
        // 活泼风格 - 女
        {
          id: 'system_female_5',
          name: '甜系少女',
          type: DigitalHumanType.SYSTEM,
          avatar: 'https://via.placeholder.com/150/f472b6/ffffff?text=甜系女',
          gender: 'female',
          ageRange: '20-25',
          style: '甜美可爱',
          features: ['甜美', '可爱', '清新'],
          createdAt: Date.now(),
          status: 'active',
        },
        {
          id: 'system_female_6',
          name: '萌系主播',
          type: DigitalHumanType.SYSTEM,
          avatar: 'https://via.placeholder.com/150/a855f7/ffffff?text=萌系女',
          gender: 'female',
          ageRange: '22-27',
          style: '萌系可爱',
          features: ['萌', '可爱', '活泼'],
          createdAt: Date.now(),
          status: 'active',
        },
        {
          id: 'system_female_7',
          name: '家居博主',
          type: DigitalHumanType.SYSTEM,
          avatar: 'https://via.placeholder.com/150/8b5cf6/ffffff?text=家居女',
          gender: 'female',
          ageRange: '28-35',
          style: '家居生活',
          features: ['家居', '生活', '收纳'],
          createdAt: Date.now(),
          status: 'active',
        },
        {
          id: 'system_female_8',
          name: '亲子妈妈',
          type: DigitalHumanType.SYSTEM,
          avatar: 'https://via.placeholder.com/150/06b6d4/ffffff?text=亲子女',
          gender: 'female',
          ageRange: '30-36',
          style: '亲子育儿',
          features: ['育儿', '亲子', '妈妈'],
          createdAt: Date.now(),
          status: 'active',
        },
        // 专业风格 - 男
        {
          id: 'system_male_9',
          name: '金融分析师',
          type: DigitalHumanType.SYSTEM,
          avatar: 'https://via.placeholder.com/150/0d9488/ffffff?text=金融男',
          gender: 'male',
          ageRange: '33-40',
          style: '金融财经',
          features: ['金融', '财经', '专业'],
          createdAt: Date.now(),
          status: 'active',
        },
        {
          id: 'system_male_10',
          name: '法律顾问',
          type: DigitalHumanType.SYSTEM,
          avatar: 'https://via.placeholder.com/150/4338ca/ffffff?text=法律男',
          gender: 'male',
          ageRange: '35-42',
          style: '法律咨询',
          features: ['法律', '律师', '专业'],
          createdAt: Date.now(),
          status: 'active',
        },
        {
          id: 'system_male_11',
          name: '医疗专家',
          type: DigitalHumanType.SYSTEM,
          avatar: 'https://via.placeholder.com/150/dc2626/ffffff?text=医疗男',
          gender: 'male',
          ageRange: '38-45',
          style: '医疗健康',
          features: ['医疗', '健康', '专家'],
          createdAt: Date.now(),
          status: 'active',
        },
        {
          id: 'system_male_12',
          name: '教育培训师',
          type: DigitalHumanType.SYSTEM,
          avatar: 'https://via.placeholder.com/150/ea580c/ffffff?text=教育男',
          gender: 'male',
          ageRange: '30-38',
          style: '教育培训',
          features: ['教育', '培训', '讲师'],
          createdAt: Date.now(),
          status: 'active',
        },
        // 专业风格 - 女
        {
          id: 'system_female_9',
          name: '金融女神',
          type: DigitalHumanType.SYSTEM,
          avatar: 'https://via.placeholder.com/150/059669/ffffff?text=金融女',
          gender: 'female',
          ageRange: '30-36',
          style: '金融财经',
          features: ['金融', '财经', '精英'],
          createdAt: Date.now(),
          status: 'active',
        },
        {
          id: 'system_female_10',
          name: '律政佳人',
          type: DigitalHumanType.SYSTEM,
          avatar: 'https://via.placeholder.com/150/7c3aed/ffffff?text=法律女',
          gender: 'female',
          ageRange: '32-38',
          style: '法律咨询',
          features: ['法律', '律师', '专业'],
          createdAt: Date.now(),
          status: 'active',
        },
        {
          id: 'system_female_11',
          name: '医疗护士',
          type: DigitalHumanType.SYSTEM,
          avatar: 'https://via.placeholder.com/150/e11d48/ffffff?text=医疗女',
          gender: 'female',
          ageRange: '28-35',
          style: '医疗健康',
          features: ['医疗', '护士', '健康'],
          createdAt: Date.now(),
          status: 'active',
        },
        {
          id: 'system_female_12',
          name: '培训讲师',
          type: DigitalHumanType.SYSTEM,
          avatar: 'https://via.placeholder.com/150/d97706/ffffff?text=培训女',
          gender: 'female',
          ageRange: '30-36',
          style: '教育培训',
          features: ['培训', '讲师', '教育'],
          createdAt: Date.now(),
          status: 'active',
        },
      ];

      // 合并系统数字人和已存在的数字人
      const existing = localStorage.getItem('digital-humans');
      const existingHumans = existing ? JSON.parse(existing) : [];

      // 过滤出非系统数字人
      const nonSystemHumans = existingHumans.filter(
        (h: DigitalHuman) => h.type !== DigitalHumanType.SYSTEM
      );

      // 合并
      const allHumans = [...systemHumans, ...nonSystemHumans];
      localStorage.setItem('digital-humans', JSON.stringify(allHumans));
      setDigitalHumans(allHumans);
    }
  };

  // 上传真人照片克隆
  const handlePhotoClone = async (values: any) => {
    setLoading(true);
    try {
      // 模拟克隆过程
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newHuman: DigitalHuman = {
        id: `cloned_photo_${Date.now()}`,
        name: values.name || `克隆数字人-${digitalHumans.length + 1}`,
        type: DigitalHumanType.CLONED,
        avatar: 'https://via.placeholder.com/150?text=克隆',
        gender: values.gender,
        ageRange: values.ageRange,
        style: values.style,
        createdAt: Date.now(),
        status: 'active',
      };

      const updatedHumans = [...digitalHumans, newHuman];
      setDigitalHumans(updatedHumans);
      localStorage.setItem('digital-humans', JSON.stringify(updatedHumans));

      setIsAddModalVisible(false);
      message.success('数字人克隆成功！');
    } catch (error) {
      message.error('克隆失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 上传真人视频克隆
  const handleVideoClone = async (values: any) => {
    setLoading(true);
    try {
      // 模拟克隆过程
      await new Promise(resolve => setTimeout(resolve, 3000));

      const newHuman: DigitalHuman = {
        id: `cloned_video_${Date.now()}`,
        name: values.name || `克隆数字人-${digitalHumans.length + 1}`,
        type: DigitalHumanType.CLONED,
        avatar: 'https://via.placeholder.com/150?text=视频克隆',
        gender: values.gender,
        ageRange: values.ageRange,
        style: values.style,
        createdAt: Date.now(),
        status: 'active',
      };

      const updatedHumans = [...digitalHumans, newHuman];
      setDigitalHumans(updatedHumans);
      localStorage.setItem('digital-humans', JSON.stringify(updatedHumans));

      setIsAddModalVisible(false);
      message.success('数字人克隆成功！');
    } catch (error) {
      message.error('克隆失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 从API调用数字人
  const handleApiCall = async (values: any) => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newHuman: DigitalHuman = {
        id: `api_${Date.now()}`,
        name: values.name || `API数字人-${digitalHumans.length + 1}`,
        type: DigitalHumanType.API,
        avatar: 'https://via.placeholder.com/150?text=API',
        gender: values.gender,
        ageRange: values.ageRange,
        style: values.style,
        createdAt: Date.now(),
        status: 'active',
      };

      const updatedHumans = [...digitalHumans, newHuman];
      setDigitalHumans(updatedHumans);
      localStorage.setItem('digital-humans', JSON.stringify(updatedHumans));

      setIsApiModalVisible(false);
      message.success('数字人添加成功！');
    } catch (error) {
      message.error('添加失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 删除数字人
  const handleDelete = (id: string) => {
    if (id.startsWith('system_')) {
      message.warning('系统自带数字人不能删除');
      return;
    }

    const newHumans = digitalHumans.filter(h => h.id !== id);
    setDigitalHumans(newHumans);
    localStorage.setItem('digital-humans', JSON.stringify(newHumans));
    message.success('已删除');
  };

  // 筛选数字人
  const filteredHumans = digitalHumans.filter(human => {
    if (activeTab === 'all') return true;
    return human.type === activeTab;
  });

  // 表格列定义
  const columns = [
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 80,
      render: (avatar: string) => <Avatar src={avatar} size={60} />,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: DigitalHuman) => (
        <Space>
          <Text strong>{name}</Text>
          {record.type === DigitalHumanType.SYSTEM && <Tag color="blue">系统自带</Tag>}
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: DigitalHumanType) => {
        const typeMap = {
          [DigitalHumanType.SYSTEM]: { label: '系统自带', color: 'blue', icon: <RobotOutlined /> },
          [DigitalHumanType.CLONED]: { label: '克隆', color: 'green', icon: <CameraOutlined /> },
          [DigitalHumanType.API]: { label: 'API', color: 'purple', icon: <ApiOutlined /> },
        };
        const config = typeMap[type];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      render: (gender: string) => (gender === 'male' ? '男' : '女'),
    },
    {
      title: '年龄范围',
      dataIndex: 'ageRange',
      key: 'ageRange',
      width: 100,
    },
    {
      title: '风格',
      dataIndex: 'style',
      key: 'style',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (features: string[] | undefined) => (
        <Space wrap size={4}>
          {tags?.map(tag => (
            <Tag key={tag} color="blue">{tag}</Tag>
          )) || '-'}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: DigitalHuman) => (
        <Space size="small">
          <Button type="link" size="small" icon={<VideoCameraOutlined />}>
            预览
          </Button>
          <Popconfirm
            title="确定删除？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={record.type === DigitalHumanType.SYSTEM}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      {/* 页面头部 */}
      <div className="mb-6">
        <Title level={2}>数字人仓库</Title>
        <Text type="secondary">管理您的数字人，支持真人克隆、系统自带和API调用的数字人</Text>
      </div>

      {/* 操作按钮 */}
      <Card className="mb-4">
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalVisible(true)}>
            克隆数字人
          </Button>
          <Button icon={<ApiOutlined />} onClick={() => setIsApiModalVisible(true)}>
            从API添加
          </Button>
          <Button
            icon={<VideoCameraOutlined />}
            onClick={() => (window.location.href = '/media/factory')}
          >
            使用数字人生成视频
          </Button>
        </Space>
      </Card>

      {/* 数字人列表 */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'all',
              label: `全部 (${digitalHumans.length})`,
            },
            {
              key: DigitalHumanType.SYSTEM,
              label: `系统自带 (${digitalHumans.filter(h => h.type === DigitalHumanType.SYSTEM).length})`,
            },
            {
              key: DigitalHumanType.CLONED,
              label: `克隆 (${digitalHumans.filter(h => h.type === DigitalHumanType.CLONED).length})`,
            },
            {
              key: DigitalHumanType.API,
              label: `API (${digitalHumans.filter(h => h.type === DigitalHumanType.API).length})`,
            },
          ]}
        />

        <div className="mt-4">
          {filteredHumans.length === 0 ? (
            <Empty description="暂无数字人" />
          ) : (
            <Table
              columns={columns}
              dataSource={filteredHumans}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: total => `共 ${total} 个数字人`,
              }}
            />
          )}
        </div>
      </Card>

      {/* 克隆数字人模态框 */}
      <Modal
        title="克隆数字人"
        open={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        footer={null}
        width={600}
      >
        <Tabs
          items={[
            {
              key: 'photo',
              label: '照片克隆',
              children: (
                <Form layout="vertical" onFinish={handlePhotoClone}>
                  <Form.Item
                    label="上传真人照片"
                    name="photo"
                    rules={[{ required: true, message: '请上传照片' }]}
                  >
                    <Upload listType="picture-card" maxCount={1} beforeUpload={() => false}>
                      <div>
                        <CameraOutlined />
                        <div style={{ marginTop: 8 }}>上传照片</div>
                      </div>
                    </Upload>
                  </Form.Item>
                  <Form.Item
                    label="数字人名称"
                    name="name"
                    rules={[{ required: true, message: '请输入名称' }]}
                  >
                    <Input placeholder="为数字人起个名字" />
                  </Form.Item>
                  <Form.Item
                    label="性别"
                    name="gender"
                    rules={[{ required: true, message: '请选择性别' }]}
                  >
                    <Radio.Group>
                      <Radio value="male">男</Radio>
                      <Radio value="female">女</Radio>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item
                    label="年龄范围"
                    name="ageRange"
                    rules={[{ required: true, message: '请选择年龄范围' }]}
                  >
                    <Select>
                      <Select.Option value="18-25">18-25岁</Select.Option>
                      <Select.Option value="25-30">25-30岁</Select.Option>
                      <Select.Option value="30-35">30-35岁</Select.Option>
                      <Select.Option value="35-40">35-40岁</Select.Option>
                      <Select.Option value="40-50">40-50岁</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    label="风格"
                    name="style"
                    rules={[{ required: true, message: '请选择风格' }]}
                  >
                    <Select>
                      <Select.Option value="商务">商务</Select.Option>
                      <Select.Option value="活泼">活泼</Select.Option>
                      <Select.Option value="亲和">亲和</Select.Option>
                      <Select.Option value="专业">专业</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block>
                      开始克隆
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'video',
              label: '视频克隆',
              children: (
                <Form layout="vertical" onFinish={handleVideoClone}>
                  <Form.Item
                    label="上传真人视频"
                    name="video"
                    rules={[{ required: true, message: '请上传视频' }]}
                  >
                    <Upload listType="text" maxCount={1} beforeUpload={() => false}>
                      <Button icon={<UploadOutlined />}>选择视频文件</Button>
                    </Upload>
                  </Form.Item>
                  <Form.Item
                    label="数字人名称"
                    name="name"
                    rules={[{ required: true, message: '请输入名称' }]}
                  >
                    <Input placeholder="为数字人起个名字" />
                  </Form.Item>
                  <Form.Item
                    label="性别"
                    name="gender"
                    rules={[{ required: true, message: '请选择性别' }]}
                  >
                    <Radio.Group>
                      <Radio value="male">男</Radio>
                      <Radio value="female">女</Radio>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item
                    label="年龄范围"
                    name="ageRange"
                    rules={[{ required: true, message: '请选择年龄范围' }]}
                  >
                    <Select>
                      <Select.Option value="18-25">18-25岁</Select.Option>
                      <Select.Option value="25-30">25-30岁</Select.Option>
                      <Select.Option value="30-35">30-35岁</Select.Option>
                      <Select.Option value="35-40">35-40岁</Select.Option>
                      <Select.Option value="40-50">40-50岁</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    label="风格"
                    name="style"
                    rules={[{ required: true, message: '请选择风格' }]}
                  >
                    <Select>
                      <Select.Option value="商务">商务</Select.Option>
                      <Select.Option value="活泼">活泼</Select.Option>
                      <Select.Option value="亲和">亲和</Select.Option>
                      <Select.Option value="专业">专业</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block>
                      开始克隆
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
      </Modal>

      {/* API添加模态框 */}
      <Modal
        title="从API添加数字人"
        open={isApiModalVisible}
        onCancel={() => setIsApiModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleApiCall}>
          <Form.Item
            label="API提供商"
            name="provider"
            rules={[{ required: true, message: '请选择API提供商' }]}
          >
            <Select>
              <Select.Option value="provider1">API提供商1</Select.Option>
              <Select.Option value="provider2">API提供商2</Select.Option>
              <Select.Option value="provider3">API提供商3</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="选择数字人"
            name="apiHumanId"
            rules={[{ required: true, message: '请选择数字人' }]}
          >
            <Select placeholder="从API选择数字人">
              <Select.Option value="api1">数字人1</Select.Option>
              <Select.Option value="api2">数字人2</Select.Option>
              <Select.Option value="api3">数字人3</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="数字人名称"
            name="name"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="为数字人起个名字" />
          </Form.Item>
          <Form.Item label="性别" name="gender" rules={[{ required: true, message: '请选择性别' }]}>
            <Radio.Group>
              <Radio value="male">男</Radio>
              <Radio value="female">女</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            label="年龄范围"
            name="ageRange"
            rules={[{ required: true, message: '请选择年龄范围' }]}
          >
            <Select>
              <Select.Option value="18-25">18-25岁</Select.Option>
              <Select.Option value="25-30">25-30岁</Select.Option>
              <Select.Option value="30-35">30-35岁</Select.Option>
              <Select.Option value="35-40">35-40岁</Select.Option>
              <Select.Option value="40-50">40-50岁</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="风格" name="style" rules={[{ required: true, message: '请选择风格' }]}>
            <Select>
              <Select.Option value="商务">商务</Select.Option>
              <Select.Option value="活泼">活泼</Select.Option>
              <Select.Option value="亲和">亲和</Select.Option>
              <Select.Option value="专业">专业</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              添加数字人
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
