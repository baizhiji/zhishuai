'use client';

import { useState } from 'react';
import { Card, Row, Col, Button, Table, Tag, Space, Modal, Form, Input, Select, Switch, message, Typography, Tabs, List, Avatar } from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  RobotOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface AutoReplyTemplate {
  id: string;
  name: string;
  trigger: string;
  content: string;
  status: boolean;
  replyCount: number;
  createdAt: string;
}

interface ConversationLog {
  id: string;
  candidateName: string;
  position: string;
  message: string;
  reply: string;
  time: string;
  status: 'replied' | 'pending' | 'failed';
}

const mockTemplates: AutoReplyTemplate[] = [
  {
    id: '1',
    name: '面试邀请模板',
    trigger: '收到简历',
    content: '您好，感谢您投递我们公司的[职位名称]岗位。您的简历已收到，我们对您的经历很感兴趣，诚邀您参加面试...',
    status: true,
    replyCount: 156,
    createdAt: '2025-05-10',
  },
  {
    id: '2',
    name: '不合适回复',
    trigger: '筛选不通过',
    content: '您好，感谢您对我司[职位名称]岗位的关注。经过综合评估，暂时未能通过本次筛选...',
    status: true,
    replyCount: 89,
    createdAt: '2025-05-08',
  },
  {
    id: '3',
    name: '入职邀请',
    trigger: '面试通过',
    content: '恭喜您通过面试！我们诚邀您加入我们团队，担任[职位名称]岗位...',
    status: true,
    replyCount: 23,
    createdAt: '2025-05-05',
  },
];

const mockLogs: ConversationLog[] = [
  { id: '1', candidateName: '张三', position: '前端工程师', message: '您好，我想咨询一下这个岗位的薪资范围', reply: '您好，我们岗位薪资范围是15-25K，具体根据您的工作经验...', time: '10:30', status: 'replied' },
  { id: '2', candidateName: '李四', position: '产品经理', message: '请问贵公司加班多吗？', reply: '您好，我们公司实行弹性工作制，不强制加班...', time: '10:25', status: 'replied' },
  { id: '3', candidateName: '王五', position: 'UI设计师', message: '可以远程面试吗？', reply: '', time: '10:20', status: 'pending' },
];

export default function RecruitmentAuto() {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AutoReplyTemplate | null>(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('templates');

  const handleAddTemplate = () => {
    setEditingTemplate(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditTemplate = (template: AutoReplyTemplate) => {
    setEditingTemplate(template);
    form.setFieldsValue(template);
    setModalVisible(true);
  };

  const handleDeleteTemplate = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个自动回复模板吗？',
      onOk: () => {
        message.success('模板已删除');
      },
    });
  };

  const handleSaveTemplate = () => {
    form.validateFields().then(values => {
      console.log('Save template:', values);
      message.success(editingTemplate ? '模板已更新' : '模板已创建');
      setModalVisible(false);
    });
  };

  const columns = [
    { title: '模板名称', dataIndex: 'name', key: 'name' },
    { title: '触发条件', dataIndex: 'trigger', key: 'trigger' },
    { title: '回复次数', dataIndex: 'replyCount', key: 'replyCount' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: boolean) => <Tag color={status ? 'green' : 'default'}>{status ? '已启用' : '已禁用'}</Tag>
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: AutoReplyTemplate) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEditTemplate(record)}>编辑</Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteTemplate(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={4}>自动沟通</Title>
      <Text type="secondary">
        设置智能话术，自动与候选人沟通，提高招聘效率
      </Text>

      <Card style={{ marginTop: 24 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane tab={<span><RobotOutlined /> 自动回复模板</span>} key="templates">
            <Space style={{ marginBottom: 16 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTemplate}>
                新建模板
              </Button>
            </Space>
            <Table 
              columns={columns} 
              dataSource={mockTemplates} 
              rowKey="id"
              pagination={false}
            />
          </Tabs.TabPane>
          
          <Tabs.TabPane tab={<span><MessageOutlined /> 对话记录</span>} key="logs">
            <List
              itemLayout="horizontal"
              dataSource={mockLogs}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    item.status === 'pending' && (
                      <Button type="link">立即回复</Button>
                    )
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<MessageOutlined />} />}
                    title={
                      <Space>
                        <Text strong>{item.candidateName}</Text>
                        <Tag>{item.position}</Tag>
                        <Tag color={item.status === 'replied' ? 'green' : item.status === 'pending' ? 'orange' : 'red'}>
                          {item.status === 'replied' ? '已回复' : item.status === 'pending' ? '待回复' : '失败'}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary">候选人: {item.message}</Text>
                        {item.reply && <Text type="success">AI回复: {item.reply}</Text>}
                        <Text type="secondary" style={{ fontSize: 12 }}><ClockCircleOutlined /> {item.time}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Tabs.TabPane>
          
          <Tabs.TabPane tab={<span><CheckCircleOutlined /> 智能设置</span>} key="settings">
            <Row gutter={[24, 24]}>
              <Col span={12}>
                <Card title="基础设置">
                  <Form layout="vertical">
                    <Form.Item label="自动回复延迟（秒）">
                      <Select defaultValue="5">
                        <Option value="0">立即回复</Option>
                        <Option value="5">5秒</Option>
                        <Option value="10">10秒</Option>
                        <Option value="30">30秒</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label="工作时间">
                      <Space>
                        <Input placeholder="09:00" style={{ width: 100 }} /> -
                        <Input placeholder="18:00" style={{ width: 100 }} />
                      </Space>
                    </Form.Item>
                    <Form.Item label="非工作时间自动回复">
                      <Switch defaultChecked />
                    </Form.Item>
                    <Button type="primary">保存设置</Button>
                  </Form>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="统计概览">
                  <Row gutter={16}>
                    <Col span={12}>
                      <div style={{ textAlign: 'center' }}>
                        <Title level={2}>268</Title>
                        <Text type="secondary">今日自动回复</Text>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ textAlign: 'center' }}>
                        <Title level={2}>95%</Title>
                        <Text type="secondary">回复率</Text>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {/* 新建/编辑模板弹窗 */}
      <Modal
        title={editingTemplate ? '编辑模板' : '新建模板'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSaveTemplate}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="模板名称" rules={[{ required: true }]}>
            <Input placeholder="例如：面试邀请模板" />
          </Form.Item>
          <Form.Item name="trigger" label="触发条件" rules={[{ required: true }]}>
            <Select placeholder="选择触发条件">
              <Option value="收到简历">收到简历</Option>
              <Option value="筛选不通过">筛选不通过</Option>
              <Option value="面试通过">面试通过</Option>
              <Option value="面试未通过">面试未通过</Option>
              <Option value="收到咨询">收到咨询</Option>
            </Select>
          </Form.Item>
          <Form.Item name="content" label="回复内容" rules={[{ required: true }]}>
            <TextArea rows={6} placeholder="输入自动回复内容，可以使用[姓名][职位名称]等变量" />
          </Form.Item>
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            可用变量：[姓名] [职位名称] [公司名称] [面试时间] [面试地点] [薪资范围]
          </Paragraph>
        </Form>
      </Modal>
    </div>
  );
}
