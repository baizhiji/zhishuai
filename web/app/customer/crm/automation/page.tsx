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
  Select,
  Switch,
  Popconfirm,
  message,
  Descriptions,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import {
  getAutomationRules,
  createAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
  CrmAutomationRule,
} from '../../../../services/crm-advanced';

const { TextArea } = Input;

const TRIGGER_OPTIONS = [
  { value: 'follow_up_overdue', label: '客户超期未跟进' },
  { value: 'level_change', label: '客户等级变更' },
  { value: 'source_change', label: '客户来源变更' },
  { value: 'tag_added', label: '添加标签' },
  { value: 'days_inactive', label: 'N天无互动' },
];

const ACTION_OPTIONS = [
  { value: 'notify', label: '发送提醒通知' },
  { value: 'assign', label: '重新分配' },
  { value: 'tag', label: '添加/移除标签' },
  { value: 'status_change', label: '变更客户状态' },
];

export default function AutomationPage() {
  const [rules, setRules] = useState<CrmAutomationRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<CrmAutomationRule | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await getAutomationRules();
      setRules(res || []);
    } catch (error) {
      message.error('获取规则失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRule(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: CrmAutomationRule) => {
    setEditingRule(record);
    const condition = typeof record.condition === 'string' 
      ? JSON.parse(record.condition) 
      : record.condition;
    const action = typeof record.action === 'string'
      ? JSON.parse(record.action)
      : record.action;
    form.setFieldsValue({
      name: record.name,
      trigger: record.trigger,
      condition,
      action,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAutomationRule(id);
      message.success('删除成功');
      fetchRules();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleToggle = async (record: CrmAutomationRule) => {
    try {
      await updateAutomationRule(record.id, { isActive: !record.isActive });
      message.success(record.isActive ? '规则已停用' : '规则已启用');
      fetchRules();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingRule) {
        await updateAutomationRule(editingRule.id, values);
        message.success('更新成功');
      } else {
        await createAutomationRule(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchRules();
    } catch (error) {
      // 表单验证失败或API错误
    }
  };

  const getTriggerLabel = (trigger: string) => {
    return TRIGGER_OPTIONS.find(t => t.value === trigger)?.label || trigger;
  };

  const getActionLabel = (action: any) => {
    const type = typeof action === 'string' ? JSON.parse(action).type : action?.type;
    return ACTION_OPTIONS.find(a => a.value === type)?.label || type;
  };

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '触发条件',
      dataIndex: 'trigger',
      key: 'trigger',
      render: (trigger: string) => (
        <Tag color="blue">{getTriggerLabel(trigger)}</Tag>
      ),
    },
    {
      title: '执行动作',
      dataIndex: 'action',
      key: 'action',
      render: (action: any) => {
        const actionObj = typeof action === 'string' ? JSON.parse(action) : action;
        return <Tag color="green">{getActionLabel(action)}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean, record: CrmAutomationRule) => (
        <Switch
          checked={isActive}
          onChange={() => handleToggle(record)}
          checkedChildren="启用"
          unCheckedChildren="停用"
        />
      ),
    },
    {
      title: '执行次数',
      dataIndex: 'runCount',
      key: 'runCount',
      width: 100,
    },
    {
      title: '最后执行',
      dataIndex: 'lastRunAt',
      key: 'lastRunAt',
      width: 180,
      render: (date: string) => date ? new Date(date).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: CrmAutomationRule) => (
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
            title="确定删除此规则？"
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
        title="自动化规则"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建规则
          </Button>
        }
      >
        <Table
          dataSource={rules}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      <Modal
        title={editingRule ? '编辑规则' : '新建规则'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="规则名称"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="请输入规则名称" />
          </Form.Item>

          <Form.Item
            name="trigger"
            label="触发条件"
            rules={[{ required: true, message: '请选择触发条件' }]}
          >
            <Select
              placeholder="请选择触发条件"
              options={TRIGGER_OPTIONS}
            />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.trigger !== curr.trigger}>
            {({ getFieldValue }) => {
              const trigger = getFieldValue('trigger');
              if (trigger === 'follow_up_overdue' || trigger === 'days_inactive') {
                return (
                  <Form.Item label="条件参数" name={['condition', 'days']}>
                    <Select
                      placeholder="请选择天数"
                      options={[
                        { value: 3, label: '3天' },
                        { value: 7, label: '7天' },
                        { value: 14, label: '14天' },
                        { value: 30, label: '30天' },
                      ]}
                    />
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>

          <Form.Item
            name="action"
            label="执行动作"
            rules={[{ required: true, message: '请选择执行动作' }]}
          >
            <Select
              placeholder="请选择执行动作"
              options={ACTION_OPTIONS}
              onChange={(value) => {
                const action = { type: value };
                form.setFieldsValue({ action });
              }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
