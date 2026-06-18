'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  Table,
  Tag,
  Modal,
  message,
  Upload,
  Form,
  Input,
  Select,
  Radio,
  Avatar,
  Popconfirm,
  Empty,
  Tabs,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  DeleteOutlined,
  VideoCameraOutlined,
  CameraOutlined,
  RobotOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import request from '@/utils/request';

const { Title, Text } = Typography;

interface DigitalHuman {
  id: string;
  name: string;
  type: string;
  avatar: string;
  gender?: string;
  ageRange?: string;
  style?: string;
  status: string;
  tags?: string[];
  createdAt: string;
}

export default function DigitalHumanWarehousePage() {
  const [digitalHumans, setDigitalHumans] = useState<DigitalHuman[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isApiModalVisible, setIsApiModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadDigitalHumans();
  }, []);

  const loadDigitalHumans = async () => {
    setLoading(true);
    try {
      const res = await request.get('/digital-human/humans');
      if (res.data?.success !== false) {
        setDigitalHumans(res.data?.data || res.data || []);
      }
    } catch (error: any) {
      message.error(error.message || '加载数字人失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoClone = async (values: any) => {
    setLoading(true);
    try {
      const formData = new FormData();
      if (values.photo?.[0]?.originFileObj) {
        formData.append('photo', values.photo[0].originFileObj);
      }
      formData.append('name', values.name);
      formData.append('gender', values.gender);
      formData.append('ageRange', values.ageRange);
      formData.append('style', values.style);
      formData.append('type', 'cloned_photo');

      const res = await request.post('/digital-human/humans', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success !== false) {
        message.success('数字人克隆任务已提交，正在处理中');
        loadDigitalHumans();
      } else {
        message.error(res.data?.error || '克隆失败');
      }
      setIsAddModalVisible(false);
    } catch (error: any) {
      message.error(error.message || '克隆失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClone = async (values: any) => {
    setLoading(true);
    try {
      const formData = new FormData();
      if (values.video?.[0]?.originFileObj) {
        formData.append('video', values.video[0].originFileObj);
      }
      formData.append('name', values.name);
      formData.append('gender', values.gender);
      formData.append('ageRange', values.ageRange);
      formData.append('style', values.style);
      formData.append('type', 'cloned_video');

      const res = await request.post('/digital-human/humans', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success !== false) {
        message.success('数字人克隆任务已提交，正在处理中');
        loadDigitalHumans();
      } else {
        message.error(res.data?.error || '克隆失败');
      }
      setIsAddModalVisible(false);
    } catch (error: any) {
      message.error(error.message || '克隆失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleApiCall = async (values: any) => {
    setLoading(true);
    try {
      const res = await request.post('/digital-human/humans', {
        name: values.name,
        gender: values.gender,
        ageRange: values.ageRange,
        style: values.style,
        type: 'api',
        provider: values.provider,
        apiHumanId: values.apiHumanId,
      });
      if (res.data?.success !== false) {
        message.success('数字人添加成功');
        loadDigitalHumans();
      } else {
        message.error(res.data?.error || '添加失败');
      }
      setIsApiModalVisible(false);
    } catch (error: any) {
      message.error(error.message || '添加失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await request.delete(`/digital-human/humans/${id}`);
      if (res.data?.success !== false) {
        message.success('已删除');
        loadDigitalHumans();
      } else {
        message.error(res.data?.error || '删除失败');
      }
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const filteredHumans = digitalHumans.filter(human => {
    if (activeTab === 'all') return true;
    return human.type === activeTab;
  });

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
          {record.type === 'system' && <Tag color="blue">系统自带</Tag>}
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const typeMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
          system: { label: '系统自带', color: 'blue', icon: <RobotOutlined /> },
          cloned_photo: { label: '照片克隆', color: 'green', icon: <CameraOutlined /> },
          cloned_video: { label: '视频克隆', color: 'cyan', icon: <VideoCameraOutlined /> },
          api: { label: 'API', color: 'purple', icon: <ApiOutlined /> },
        };
        const config = typeMap[type] || { label: type, color: 'default', icon: null };
        return <Tag color={config.color} icon={config.icon}>{config.label}</Tag>;
      },
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      render: (gender: string) => gender === 'male' ? '男' : gender === 'female' ? '女' : '-',
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
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2}>数字人仓库</Title>
        <Text type="secondary">管理您的数字人，支持真人克隆、系统自带和API调用的数字人</Text>
      </div>

      <Card className="mb-4">
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalVisible(true)}>
            克隆数字人
          </Button>
          <Button icon={<ApiOutlined />} onClick={() => setIsApiModalVisible(true)}>
            从API添加
          </Button>
          <Button icon={<VideoCameraOutlined />} onClick={() => (window.location.href = '/media/factory')}>
            使用数字人生成视频
          </Button>
        </Space>
      </Card>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'all', label: `全部 (${digitalHumans.length})` },
            { key: 'system', label: `系统自带 (${digitalHumans.filter(h => h.type === 'system').length})` },
            { key: 'cloned_photo', label: `照片克隆 (${digitalHumans.filter(h => h.type === 'cloned_photo').length})` },
            { key: 'cloned_video', label: `视频克隆 (${digitalHumans.filter(h => h.type === 'cloned_video').length})` },
            { key: 'api', label: `API (${digitalHumans.filter(h => h.type === 'api').length})` },
          ]}
        />
        <div className="mt-4">
          <Spin spinning={loading}>
            {filteredHumans.length === 0 ? (
              <Empty description="暂无数字人" />
            ) : (
              <Table
                columns={columns}
                dataSource={filteredHumans}
                rowKey="id"
                pagination={{ pageSize: 10, showSizeChanger: true, showTotal: total => `共 ${total} 个数字人` }}
              />
            )}
          </Spin>
        </div>
      </Card>

      <Modal title="克隆数字人" open={isAddModalVisible} onCancel={() => setIsAddModalVisible(false)} footer={null} width={600}>
        <Tabs items={[
          {
            key: 'photo',
            label: '照片克隆',
            children: (
              <Form layout="vertical" onFinish={handlePhotoClone}>
                <Form.Item label="上传真人照片" name="photo" rules={[{ required: true, message: '请上传照片' }]}>
                  <Upload listType="picture-card" maxCount={1} beforeUpload={() => false}>
                    <div><CameraOutlined /><div style={{ marginTop: 8 }}>上传照片</div></div>
                  </Upload>
                </Form.Item>
                <Form.Item label="数字人名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
                  <Input placeholder="为数字人起个名字" />
                </Form.Item>
                <Form.Item label="性别" name="gender" rules={[{ required: true, message: '请选择性别' }]}>
                  <Radio.Group><Radio value="male">男</Radio><Radio value="female">女</Radio></Radio.Group>
                </Form.Item>
                <Form.Item label="年龄范围" name="ageRange" rules={[{ required: true, message: '请选择年龄范围' }]}>
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
                <Form.Item><Button type="primary" htmlType="submit" loading={loading} block>开始克隆</Button></Form.Item>
              </Form>
            ),
          },
          {
            key: 'video',
            label: '视频克隆',
            children: (
              <Form layout="vertical" onFinish={handleVideoClone}>
                <Form.Item label="上传真人视频" name="video" rules={[{ required: true, message: '请上传视频' }]}>
                  <Upload listType="text" maxCount={1} beforeUpload={() => false}>
                    <Button icon={<UploadOutlined />}>选择视频文件</Button>
                  </Upload>
                </Form.Item>
                <Form.Item label="数字人名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
                  <Input placeholder="为数字人起个名字" />
                </Form.Item>
                <Form.Item label="性别" name="gender" rules={[{ required: true, message: '请选择性别' }]}>
                  <Radio.Group><Radio value="male">男</Radio><Radio value="female">女</Radio></Radio.Group>
                </Form.Item>
                <Form.Item label="年龄范围" name="ageRange" rules={[{ required: true, message: '请选择年龄范围' }]}>
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
                <Form.Item><Button type="primary" htmlType="submit" loading={loading} block>开始克隆</Button></Form.Item>
              </Form>
            ),
          },
        ]} />
      </Modal>

      <Modal title="从API添加数字人" open={isApiModalVisible} onCancel={() => setIsApiModalVisible(false)} footer={null}>
        <Form layout="vertical" onFinish={handleApiCall}>
          <Form.Item label="API提供商" name="provider" rules={[{ required: true, message: '请选择API提供商' }]}>
            <Select>
              <Select.Option value="tencent">腾讯云TokenHub</Select.Option>
              <Select.Option value="aliyun">阿里云百炼</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="选择数字人" name="apiHumanId" rules={[{ required: true, message: '请选择数字人' }]}>
            <Input placeholder="输入API数字人ID" />
          </Form.Item>
          <Form.Item label="数字人名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="为数字人起个名字" />
          </Form.Item>
          <Form.Item label="性别" name="gender" rules={[{ required: true, message: '请选择性别' }]}>
            <Radio.Group><Radio value="male">男</Radio><Radio value="female">女</Radio></Radio.Group>
          </Form.Item>
          <Form.Item label="年龄范围" name="ageRange">
            <Select>
              <Select.Option value="18-25">18-25岁</Select.Option>
              <Select.Option value="25-30">25-30岁</Select.Option>
              <Select.Option value="30-35">30-35岁</Select.Option>
              <Select.Option value="35-40">35-40岁</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="风格" name="style">
            <Select>
              <Select.Option value="商务">商务</Select.Option>
              <Select.Option value="活泼">活泼</Select.Option>
              <Select.Option value="亲和">亲和</Select.Option>
              <Select.Option value="专业">专业</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" loading={loading} block>添加数字人</Button></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
