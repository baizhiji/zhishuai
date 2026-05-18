'use client';

import { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Space, Modal, Form, Input, Select, Upload, message, Popconfirm, Image, Row, Col, Statistic } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, UploadOutlined, SearchOutlined, PictureOutlined, VideoCameraOutlined, FileTextOutlined, AudioOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getMaterials, createMaterial, updateMaterial, deleteMaterial, batchDeleteMaterials, markMaterialUsed, type Material } from '@/services/materials';

const { TextArea } = Input;
const { Option } = Select;

const TYPE_MAP: Record<string, { label: string; color: string; icon: any }> = {
  text: { label: '文本', color: 'blue', icon: <FileTextOutlined /> },
  image: { label: '图片', color: 'green', icon: <PictureOutlined /> },
  video: { label: '视频', color: 'purple', icon: <VideoCameraOutlined /> },
  audio: { label: '音频', color: 'orange', icon: <AudioOutlined /> },
};

const CATEGORIES = [
  '营销文案', '产品介绍', '行业资讯', '热点话题', '招聘JD', '获客话术', '通用素材', '其他'
];

export default function MaterialsPage() {
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 20 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [filters, setFilters] = useState({ type: '', keyword: '', category: '' });
  const [form] = Form.useForm();

  useEffect(() => {
    loadMaterials();
  }, [filters]);

  const loadMaterials = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const res = await getMaterials({ ...filters, page, pageSize });
      setMaterials(res.data?.list || res.data || []);
      setPagination({ 
        total: res.data?.total || res.total || 0, 
        page, 
        pageSize 
      });
    } catch (error) {
      message.error('加载素材失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingMaterial(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Material) => {
    setEditingMaterial(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMaterial(id);
      message.success('删除成功');
      loadMaterials(pagination.page, pagination.pageSize);
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的素材');
      return;
    }
    try {
      await batchDeleteMaterials(selectedRowKeys as string[]);
      message.success(`成功删除 ${selectedRowKeys.length} 个素材`);
      setSelectedRowKeys([]);
      loadMaterials(pagination.page, pagination.pageSize);
    } catch (error) {
      message.error('批量删除失败');
    }
  };

  const handleMarkUsed = async (id: string) => {
    try {
      await markMaterialUsed(id);
      message.success('已标记为已使用');
      loadMaterials(pagination.page, pagination.pageSize);
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingMaterial) {
        await updateMaterial(editingMaterial.id, values);
        message.success('更新成功');
      } else {
        await createMaterial(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadMaterials(pagination.page, pagination.pageSize);
    } catch (error) {
      message.error('操作失败');
    }
  };

  const renderContent = (record: Material) => {
    switch (record.type) {
      case 'text':
        return <div style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.content}</div>;
      case 'image':
        return record.url ? <Image src={record.url} width={60} height={60} style={{ objectFit: 'cover' }} /> : <PictureOutlined style={{ fontSize: 24 }} />;
      case 'video':
        return record.url ? <video src={record.url} width={60} height={60} style={{ objectFit: 'cover' }} /> : <VideoCameraOutlined style={{ fontSize: 24 }} />;
      default:
        return '-';
    }
  };

  const columns: ColumnsType<Material> = [
    { title: '预览', key: 'preview', width: 80, render: (_, record) => renderContent(record) },
    { title: '标题', dataIndex: 'title', key: 'title', width: 200, ellipsis: true },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (t: string) => (
        <Tag color={TYPE_MAP[t]?.color} icon={TYPE_MAP[t]?.icon}>
          {TYPE_MAP[t]?.label || t}
        </Tag>
      ),
    },
    { title: '分类', dataIndex: 'category', key: 'category', width: 100 },
    { title: '标签', dataIndex: 'tags', key: 'tags', width: 150, render: (tags: string[]) => tags?.map((t, i) => <Tag key={i}>{t}</Tag>) },
    {
      title: '状态',
      dataIndex: 'used',
      key: 'used',
      width: 100,
      render: (used: boolean) => (
        <Tag color={used ? 'red' : 'green'}>{used ? '已使用' : '未使用'}</Tag>
      ),
    },
    { title: '浏览', dataIndex: 'viewCount', key: 'viewCount', width: 80 },
    { title: '点赞', dataIndex: 'likeCount', key: 'likeCount', width: 80 },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180, render: (t: string) => new Date(t).toLocaleString('zh-CN') },
    {
      title: '操作',
      key: 'action',
      width: 250,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          {!record.used && (
            <Button type="link" size="small" onClick={() => handleMarkUsed(record.id)}>
              标记已用
            </Button>
          )}
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card><Statistic title="素材总数" value={pagination.total} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="文本" value={materials.filter(m => m.type === 'text').length} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="图片" value={materials.filter(m => m.type === 'image').length} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="已使用" value={materials.filter(m => m.used).length} /></Card>
        </Col>
      </Row>

      <Card
        title="素材库"
        extra={
          <Space>
            <Select placeholder="类型" style={{ width: 120 }} allowClear onChange={v => setFilters({ ...filters, type: v || '' })}>
              <Option value="text">文本</Option>
              <Option value="image">图片</Option>
              <Option value="video">视频</Option>
              <Option value="audio">音频</Option>
            </Select>
            <Select placeholder="分类" style={{ width: 120 }} allowClear onChange={v => setFilters({ ...filters, category: v || '' })}>
              {CATEGORIES.map(c => <Option key={c} value={c}>{c}</Option>)}
            </Select>
            <Input placeholder="搜索标题/内容" prefix={<SearchOutlined />} style={{ width: 200 }} onPressEnter={() => loadMaterials()} />
            <Button onClick={() => loadMaterials()}>搜索</Button>
            {selectedRowKeys.length > 0 && (
              <Popconfirm title={`确定删除 ${selectedRowKeys.length} 个素材?`} onConfirm={handleBatchDelete}>
                <Button danger>批量删除</Button>
              </Popconfirm>
            )}
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              上传素材
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={materials}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          pagination={{
            total: pagination.total,
            current: pagination.page,
            pageSize: pagination.pageSize,
            onChange: (page, pageSize) => loadMaterials(page, pageSize),
          }}
        />
      </Card>

      <Modal
        title={editingMaterial ? '编辑素材' : '上传素材'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="素材标题" />
          </Form.Item>
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="type" label="类型" rules={[{ required: true }]} style={{ width: 200 }}>
              <Select placeholder="选择类型">
                <Option value="text">文本</Option>
                <Option value="image">图片</Option>
                <Option value="video">视频</Option>
                <Option value="audio">音频</Option>
              </Select>
            </Form.Item>
            <Form.Item name="category" label="分类" style={{ width: 200 }}>
              <Select placeholder="选择分类">
                {CATEGORIES.map(c => <Option key={c} value={c}>{c}</Option>)}
              </Select>
            </Form.Item>
          </Space>
          <Form.Item name="content" label="内容">
            <TextArea rows={4} placeholder="文本内容或描述" />
          </Form.Item>
          <Form.Item name="url" label="文件URL">
            <Input placeholder="图片/视频/音频的URL" />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="输入标签后按回车">
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
