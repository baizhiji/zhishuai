'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Tag,
  Space,
  message,
  Popconfirm,
  Tabs,
  Statistic,
  Row,
  Col,
  Descriptions,
  Timeline,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  VideoCameraOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { request } from '@/utils/request';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { TabPane } = Tabs;

interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  position: string;
  scheduledTime: string;
  duration: number;
  type: 'video' | 'phone' | 'onsite';
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  interviewer: string;
  meetingLink?: string;
  notes?: string;
  feedback?: string;
  rating?: number;
  createdAt: string;
}

export default function InterviewPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [form] = Form.useForm();
  const [feedbackForm] = Form.useForm();
  const [userId, setUserId] = useState<string>('');
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    today: 0,
  });

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      setUserId(userData.id);
    }
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const res = await request.get('/api/recruitment/interviews', {
        params: { userId },
      });
      setInterviews(res.interviews || []);

      const today = dayjs().format('YYYY-MM-DD');
      const interviews = res.interviews || [];
      setStats({
        total: interviews.length,
        scheduled: interviews.filter((i: Interview) => i.status === 'scheduled').length,
        completed: interviews.filter((i: Interview) => i.status === 'completed').length,
        today: interviews.filter(
          (i: Interview) => dayjs(i.scheduledTime).format('YYYY-MM-DD') === today
        ).length,
      });
    } catch (error) {
      message.error('获取面试记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingInterview) {
        await request.put(`/api/recruitment/interviews/${editingInterview.id}`, {
          ...values,
          userId,
        });
        message.success('更新成功');
      } else {
        await request.post('/api/recruitment/interviews', {
          ...values,
          userId,
        });
        message.success('创建成功');
      }
      setModalVisible(false);
      form.resetFields();
      fetchInterviews();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await request.delete(`/api/recruitment/interviews/${id}`);
      message.success('删除成功');
      fetchInterviews();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleFeedback = async (values: any) => {
    try {
      await request.put(`/api/recruitment/interviews/${selectedInterview?.id}/feedback`, {
        ...values,
        userId,
      });
      message.success('反馈提交成功');
      setDetailVisible(false);
      feedbackForm.resetFields();
      fetchInterviews();
    } catch (error) {
      message.error('提交失败');
    }
  };

  const showDetail = (interview: Interview) => {
    setSelectedInterview(interview);
    if (interview.feedback) {
      feedbackForm.setFieldsValue({
        feedback: interview.feedback,
        rating: interview.rating,
      });
    }
    setDetailVisible(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'blue',
      completed: 'green',
      cancelled: 'red',
      rescheduled: 'orange',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      scheduled: '已安排',
      completed: '已完成',
      cancelled: '已取消',
      rescheduled: '已改期',
    };
    return texts[status] || status;
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      video: <VideoCameraOutlined />,
      phone: <PhoneOutlined />,
      onsite: <CalendarOutlined />,
    };
    return icons[type] || <CalendarOutlined />;
  };

  const columns = [
    {
      title: '候选人',
      dataIndex: 'candidateName',
      key: 'candidateName',
    },
    {
      title: '岗位',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: '面试时间',
      dataIndex: 'scheduledTime',
      key: 'scheduledTime',
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      render: (min: number) => `${min}分钟`,
    },
    {
      title: '方式',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Space>
          {getTypeIcon(type)}
          {type === 'video' ? '视频' : type === 'phone' ? '电话' : '现场'}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>,
    },
    {
      title: '面试官',
      dataIndex: 'interviewer',
      key: 'interviewer',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Interview) => (
        <Space>
          <Button type="link" size="small" onClick={() => showDetail(record)}>
            详情
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setEditingInterview(record);
              form.setFieldsValue({
                ...record,
                scheduledTime: dayjs(record.scheduledTime),
              });
              setModalVisible(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger>
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
        <h1 className="text-2xl font-bold">面试管理</h1>
        <p className="text-gray-500">管理招聘面试安排和反馈</p>
      </div>

      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic title="面试总数" value={stats.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="待面试" value={stats.scheduled} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已完成" value={stats.completed} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="今日面试" value={stats.today} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
      </Row>

      <Card
        title="面试列表"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingInterview(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            新增面试
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={interviews}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingInterview ? '编辑面试' : '新增面试'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="candidateId" label="候选人ID" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="candidateName" label="候选人姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="position" label="应聘岗位" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="scheduledTime" label="面试时间" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="duration" label="面试时长(分钟)" rules={[{ required: true }]}>
            <Input type="number" placeholder="30" />
          </Form.Item>
          <Form.Item name="type" label="面试方式" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="video">视频面试</Select.Option>
              <Select.Option value="phone">电话面试</Select.Option>
              <Select.Option value="onsite">现场面试</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="interviewer" label="面试官" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="meetingLink" label="会议链接">
            <Input placeholder="视频面试链接" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="面试详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {selectedInterview && (
          <Tabs defaultActiveKey="info">
            <TabPane tab="基本信息" key="info">
              <Descriptions column={2} bordered>
                <Descriptions.Item label="候选人">
                  {selectedInterview.candidateName}
                </Descriptions.Item>
                <Descriptions.Item label="应聘岗位">{selectedInterview.position}</Descriptions.Item>
                <Descriptions.Item label="面试时间">
                  {dayjs(selectedInterview.scheduledTime).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="面试时长">
                  {selectedInterview.duration}分钟
                </Descriptions.Item>
                <Descriptions.Item label="面试方式">
                  {selectedInterview.type === 'video'
                    ? '视频面试'
                    : selectedInterview.type === 'phone'
                      ? '电话面试'
                      : '现场面试'}
                </Descriptions.Item>
                <Descriptions.Item label="面试官">
                  {selectedInterview.interviewer}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={getStatusColor(selectedInterview.status)}>
                    {getStatusText(selectedInterview.status)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {dayjs(selectedInterview.createdAt).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="备注" span={2}>
                  {selectedInterview.notes || '无'}
                </Descriptions.Item>
                {selectedInterview.meetingLink && (
                  <Descriptions.Item label="会议链接" span={2}>
                    <a
                      href={selectedInterview.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {selectedInterview.meetingLink}
                    </a>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </TabPane>
            <TabPane tab="面试反馈" key="feedback">
              <Form form={feedbackForm} onFinish={handleFeedback} layout="vertical">
                <Form.Item name="feedback" label="面试反馈">
                  <TextArea rows={6} placeholder="记录面试反馈..." />
                </Form.Item>
                <Form.Item name="rating" label="综合评分">
                  <Select allowClear>
                    <Select.Option value={5}>5分 - 非常优秀</Select.Option>
                    <Select.Option value={4}>4分 - 优秀</Select.Option>
                    <Select.Option value={3}>3分 - 良好</Select.Option>
                    <Select.Option value={2}>2分 - 一般</Select.Option>
                    <Select.Option value={1}>1分 - 不合适</Select.Option>
                  </Select>
                </Form.Item>
                <Button type="primary" htmlType="submit">
                  提交反馈
                </Button>
              </Form>
            </TabPane>
          </Tabs>
        )}
      </Modal>
    </div>
  );
}
