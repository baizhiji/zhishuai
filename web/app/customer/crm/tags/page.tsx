'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Popconfirm,
  message,
  ColorPicker,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TagOutlined,
} from '@ant-design/icons';
import { getTags, createTag, updateTag, deleteTag, CrmTag } from '../../../../services/crm-advanced';

const { confirm } = Modal;

export default function TagsPage() {
  const [tags, setTags] = useState<CrmTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<CrmTag | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const res = await getTags();
      setTags(res || []);
    } catch (error) {
      message.error('获取标签失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingTag(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: CrmTag) => {
    setEditingTag(record);
    form.setFieldsValue({ name: record.name, color: record.color });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTag(id);
      message.success('删除成功');
      fetchTags();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const colorHex = typeof values.color === 'string' ? values.color : values.color?.toHexString?.() || '#1890ff';
      
      if (editingTag) {
        await updateTag(editingTag.id, { name: values.name, color: colorHex });
        message.success('更新成功');
      } else {
        await createTag({ name: values.name, color: colorHex });
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchTags();
    } catch (error) {
      // 表单验证失败或API错误
    }
  };

  const columns = [
    {
      title: '标签',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: CrmTag) => (
        <Tag color={record.color} icon={<TagOutlined />}>
          {name}
        </Tag>
      ),
    },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
      width: 100,
      render: (color: string) => (
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 4,
            backgroundColor: color,
            border: '1px solid #d9d9d9',
          }}
        />
      ),
    },
    {
      title: '关联客户数',
      dataIndex: 'customerCount',
      key: 'customerCount',
      width: 120,
      render: (count: number) => count || 0,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: CrmTag) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此标签？"
            description="删除后，该标签将从所有客户中移除"
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
    <div style={{ padding: 24 }}>
      <Card
        title="客户标签管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建标签
          </Button>
        }
      >
        <Table
          dataSource={tags}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      <Modal
        title={editingTag ? '编辑标签' : '新建标签'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" initialValues={{ color: '#1890ff' }}>
          <Form.Item
            name="name"
            label="标签名称"
            rules={[{ required: true, message: '请输入标签名称' }]}
          >
            <Input placeholder="请输入标签名称" maxLength={20} />
          </Form.Item>
          <Form.Item name="color" label="标签颜色">
            <ColorPicker
              presets={[
                {
                  label: '推荐',
                  colors: [
                    '#f5222d',
                    '#fa541c',
                    '#fa8c16',
                    '#faad14',
                    '#fadb14',
                    '#a0d911',
                    '#52c41a',
                    '#13c2c2',
                    '#1890ff',
                    '#2f54eb',
                    '#722ed1',
                    '#eb2f96',
                  ],
                },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
