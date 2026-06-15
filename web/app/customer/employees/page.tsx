'use client';

import { useState, useEffect } from 'react';
<<<<<<< HEAD
import { Card, Table, Button, Tag, Space, Modal, Form, Input, Select, Switch, message, Popconfirm, Avatar, Descriptions } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, KeyOutlined, LoginOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getEmployees, createEmployee, updateEmployee, resetEmployeePassword, deleteEmployee, type Employee } from '@/services/employee';
=======
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Popconfirm,
  Avatar,
  Descriptions,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  KeyOutlined,
  LoginOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  resetEmployeePassword,
  deleteEmployee,
  type Employee,
} from '@/services/employee';
>>>>>>> 962968886be726cd434c792933b5515366d34518

const { Option } = Select;

const ROLE_MAP: Record<string, { label: string; color: string }> = {
  staff: { label: '员工', color: 'blue' },
  manager: { label: '经理', color: 'purple' },
  admin: { label: '管理员', color: 'red' },
};

const PERMISSIONS_OPTIONS = [
  { value: 'view_materials', label: '查看素材' },
  { value: 'create_content', label: '创建内容' },
  { value: 'manage_own_posts', label: '管理自己的发布' },
  { value: 'view_reports', label: '查看报表' },
  { value: 'manage_team', label: '管理团队' },
  { value: 'manage_settings', label: '系统设置' },
];

export default function EmployeeManagementPage() {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 20 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form] = Form.useForm();
<<<<<<< HEAD
  
=======

>>>>>>> 962968886be726cd434c792933b5515366d34518
  // 获取当前用户ID（从 localStorage 或 context）
  const currentUserId = 'demo-user'; // TODO: 从登录状态获取

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const res = await getEmployees({ userId: currentUserId, page, pageSize });
      setEmployees(res.data || []);
<<<<<<< HEAD
      setPagination({ total: res.total || 0, page, pageSize });
=======
      setPagination({ total: res.data?.total || 0, page, pageSize });
>>>>>>> 962968886be726cd434c792933b5515366d34518
    } catch (error) {
      message.error('加载员工列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingEmployee(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Employee) => {
    setEditingEmployee(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEmployee(id);
      message.success('删除成功');
      loadEmployees(pagination.page, pagination.pageSize);
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleResetPassword = async (id: string) => {
    try {
      const res = await resetEmployeePassword(id);
      message.success(res.message || '密码已重置为 123456');
    } catch (error) {
      message.error('重置失败');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      await updateEmployee(id, { status: newStatus as any });
      message.success(`已${newStatus === 'active' ? '启用' : '禁用'}`);
      loadEmployees(pagination.page, pagination.pageSize);
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, values);
        message.success('更新成功');
      } else {
        await createEmployee({ ...values, userId: currentUserId });
        message.success('创建成功');
      }
      setModalVisible(false);
      loadEmployees(pagination.page, pagination.pageSize);
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns: ColumnsType<Employee> = [
    {
      title: '员工',
      key: 'info',
      width: 200,
      render: (_, record) => (
        <Space>
<<<<<<< HEAD
          <Avatar style={{ backgroundColor: '#1890ff' }}>
            {record.name?.charAt(0) || '?'}
          </Avatar>
=======
          <Avatar style={{ backgroundColor: '#1890ff' }}>{record.name?.charAt(0) || '?'}</Avatar>
>>>>>>> 962968886be726cd434c792933b5515366d34518
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{record.phone}</div>
          </div>
        </Space>
      ),
    },
    { title: '邮箱', dataIndex: 'email', key: 'email', ellipsis: true },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (r: string) => <Tag color={ROLE_MAP[r]?.color}>{ROLE_MAP[r]?.label || r}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string, record) => (
        <Switch
          checked={s === 'active'}
          onChange={() => handleToggleStatus(record.id, s)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 180,
<<<<<<< HEAD
      render: (t: string) => t ? new Date(t).toLocaleString('zh-CN') : '从未登录',
=======
      render: (t: string) => (t ? new Date(t).toLocaleString('zh-CN') : '从未登录'),
>>>>>>> 962968886be726cd434c792933b5515366d34518
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_, record) => (
        <Space>
<<<<<<< HEAD
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" icon={<KeyOutlined />} onClick={() => handleResetPassword(record.id)}>
=======
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<KeyOutlined />}
            onClick={() => handleResetPassword(record.id)}
          >
>>>>>>> 962968886be726cd434c792933b5515366d34518
            重置密码
          </Button>
          <Popconfirm title="确定删除该员工?" onConfirm={() => handleDelete(record.id)}>
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
        title="员工管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加员工
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={employees}
          rowKey="id"
          loading={loading}
          pagination={{
            total: pagination.total,
            current: pagination.page,
            pageSize: pagination.pageSize,
            onChange: (page, pageSize) => loadEmployees(page, pageSize),
          }}
        />
      </Card>

      <Modal
        title={editingEmployee ? '编辑员工' : '添加员工'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="员工姓名" />
          </Form.Item>
<<<<<<< HEAD
          <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
=======
          <Form.Item
            name="phone"
            label="手机号"
            rules={[{ required: true, message: '请输入手机号' }]}
          >
>>>>>>> 962968886be726cd434c792933b5515366d34518
            <Input placeholder="登录手机号" disabled={!!editingEmployee} />
          </Form.Item>
          {!editingEmployee && (
            <Form.Item name="password" label="初始密码" initialValue="123456">
              <Input.Password placeholder="默认: 123456" />
            </Form.Item>
          )}
          <Form.Item name="email" label="邮箱">
            <Input placeholder="员工邮箱（可选）" />
          </Form.Item>
          <Form.Item name="role" label="角色" initialValue="staff">
            <Select>
              <Option value="staff">员工</Option>
              <Option value="manager">经理</Option>
              <Option value="admin">管理员</Option>
            </Select>
          </Form.Item>
          <Form.Item name="permissions" label="权限" help="根据角色自动分配，可手动调整">
            <Select mode="multiple" placeholder="选择权限">
              {PERMISSIONS_OPTIONS.map(p => (
<<<<<<< HEAD
                <Option key={p.value} value={p.value}>{p.label}</Option>
=======
                <Option key={p.value} value={p.value}>
                  {p.label}
                </Option>
>>>>>>> 962968886be726cd434c792933b5515366d34518
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
