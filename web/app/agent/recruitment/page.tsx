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
  InputNumber,
  Select,
  message,
  Row,
  Col,
  Statistic,
  Tabs,
  Divider,
  Typography,
  Empty,
  Progress,
  Badge,
  Tooltip,
  Descriptions,
} from 'antd';
import {
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  RobotOutlined,
  TeamOutlined,
  FileTextOutlined,
  AimOutlined,
  ScheduleOutlined,
} from '@ant-design/icons';
import request from '@/utils/request';

const { TextArea } = Input;
const { TabPane } = Tabs;
const { Text } = Typography;

interface Job {
  id: string;
  title: string;
  salaryMin?: number;
  salaryMax?: number;
  education?: string;
  experience?: string;
  status: string;
  candidateCount: number;
  createdAt: string;
}

interface Resume {
  id: string;
  jobId: string;
  name: string;
  phone: string;
  email?: string;
  education?: string;
  experience?: string;
  status: string;
  aiScore?: number;
  aiAnalysis?: string;
  createdAt: string;
  job?: { title: string };
}

interface Stats {
  totalJobs: number;
  activeJobs: number;
  totalResumes: number;
  newResumes: number;
}

const RecruitmentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [stats, setStats] = useState<Stats>({ totalJobs: 0, activeJobs: 0, totalResumes: 0, newResumes: 0 });
  const [loading, setLoading] = useState(false);
  const [jobModalVisible, setJobModalVisible] = useState(false);
  const [resumeModalVisible, setResumeModalVisible] = useState(false);
  const [interviewModalVisible, setInterviewModalVisible] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [parseLoading, setParseLoading] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [jobForm] = Form.useForm();
  const [resumeForm] = Form.useForm();
  const [interviewForm] = Form.useForm();
  const [interviewQuestions, setInterviewQuestions] = useState<{ question: string; answer: string }[]>([]);

  useEffect(() => {
    fetchJobs();
    fetchResumes();
    fetchStats();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await request.get('/api/recruitment/jobs');
      if (res.success) {
        setJobs(res.data.list);
      }
    } catch (error) {
      console.error('获取岗位列表失败', error);
    }
  };

  const fetchResumes = async () => {
    try {
      const res = await request.get('/api/recruitment/resumes');
      if (res.success) {
        setResumes(res.data.list);
      }
    } catch (error) {
      console.error('获取简历列表失败', error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await request.get('/api/recruitment/stats');
      if (res.success) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('获取统计数据失败', error);
    }
  };

  const handleCreateJob = async (values: any) => {
    try {
      const res = await request.post('/api/recruitment/jobs', values);
      if (res.success) {
        message.success('岗位创建成功');
        setJobModalVisible(false);
        jobForm.resetFields();
        fetchJobs();
        fetchStats();
      }
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleCreateResume = async (values: any) => {
    try {
      const res = await request.post('/api/recruitment/resumes', values);
      if (res.success) {
        message.success('简历添加成功');
        setResumeModalVisible(false);
        resumeForm.resetFields();
        fetchResumes();
        fetchStats();
      }
    } catch (error) {
      message.error('添加失败');
    }
  };

  const handleParseResume = async () => {
    const text = resumeForm.getFieldValue('resumeText');
    if (!text) {
      message.warning('请先输入简历内容');
      return;
    }

    setParseLoading(true);
    try {
      const res = await request.post('/api/recruitment/ai/parse-resume', { resumeText: text });
      if (res.success) {
        setParsedData(res.data);
        message.success('简历解析成功');
      }
    } catch (error) {
      message.error('AI解析失败');
    } finally {
      setParseLoading(false);
    }
  };

  const handleMatchJob = async (resumeId: string) => {
    const jobId = resumes.find(r => r.id === resumeId)?.jobId;
    if (!jobId) {
      message.warning('请先选择岗位');
      return;
    }

    try {
      const res = await request.post('/api/recruitment/ai/match-job', { resumeId, jobId });
      if (res.success) {
        message.success(`匹配度: ${res.data.score}分`);
        fetchResumes();
      }
    } catch (error) {
      message.error('匹配失败');
    }
  };

  const handleGenerateQuestions = async (resumeId: string) => {
    const resume = resumes.find(r => r.id === resumeId);
    if (!resume) return;

    try {
      const res = await request.post('/api/recruitment/ai/interview-questions', {
        resumeId,
        jobId: resume.jobId,
      });
      if (res.success) {
        setAiQuestions(res.data);
        setSelectedResume(resume);
        setInterviewModalVisible(true);
      }
    } catch (error) {
      message.error('生成面试问题失败');
    }
  };

  const handleBatchScreen = async (jobId: string) => {
    try {
      const res = await request.post(`/api/recruitment/ai/batch-screen/${jobId}`);
      if (res.success) {
        message.success(`批量筛选完成，共处理 ${res.data.total} 份简历`);
        fetchResumes();
      }
    } catch (error) {
      message.error('批量筛选失败');
    }
  };

  const handleUpdateStatus = async (resumeId: string, status: string) => {
    try {
      const res = await request.put(`/api/recruitment/resumes/${resumeId}`, { status });
      if (res.success) {
        message.success('状态更新成功');
        fetchResumes();
      }
    } catch (error) {
      message.error('更新失败');
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
      pending: { color: 'default', text: '待处理', icon: <ClockCircleOutlined /> },
      screening: { color: 'processing', text: '筛选中', icon: <AimOutlined /> },
      interview: { color: 'blue', text: '面试中', icon: <TeamOutlined /> },
      offer: { color: 'purple', text: '待发offer', icon: <FileTextOutlined /> },
      hired: { color: 'success', text: '已入职', icon: <CheckCircleOutlined /> },
      rejected: { color: 'error', text: '已拒绝', icon: <CloseCircleOutlined /> },
    };
    const config = statusMap[status] || statusMap.pending;
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'default';
    if (score >= 80) return 'success';
    if (score >= 60) return 'processing';
    return 'error';
  };

  const jobColumns = [
    { title: '岗位名称', dataIndex: 'title', key: 'title' },
    {
      title: '薪资范围',
      dataIndex: 'salaryMin',
      key: 'salary',
      render: (_: any, record: Job) => (
        record.salaryMin && record.salaryMax
          ? `${record.salaryMin}K - ${record.salaryMax}K`
          : '面议'
      ),
    },
    { title: '学历要求', dataIndex: 'education', key: 'education' },
    { title: '经验要求', dataIndex: 'experience', key: 'experience' },
    {
      title: '候选人',
      dataIndex: 'candidateCount',
      key: 'candidateCount',
      render: (count: number) => <Badge count={count} showZero color="blue" />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'recruiting' ? 'success' : 'default'}>
          {status === 'recruiting' ? '招聘中' : '已暂停'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Job) => (
        <Space>
          <Button size="small" onClick={() => handleBatchScreen(record.id)}>
            AI筛选
          </Button>
          <Button size="small" type="link">编辑</Button>
        </Space>
      ),
    },
  ];

  const resumeColumns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '学历', dataIndex: 'education', key: 'education' },
    { title: '经验', dataIndex: 'experience', key: 'experience' },
    {
      title: 'AI评分',
      dataIndex: 'aiScore',
      key: 'aiScore',
      render: (score?: number) => (
        score ? (
          <Progress
            percent={score}
            size="small"
            status={score >= 60 ? 'normal' : 'exception'}
            strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#1890ff' : '#ff4d4f'}
          />
        ) : '-'
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '投递时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Resume) => (
        <Space>
          <Tooltip title="AI匹配">
            <Button size="small" icon={<RobotOutlined />} onClick={() => handleMatchJob(record.id)} />
          </Tooltip>
          <Tooltip title="生成面试问题">
            <Button size="small" icon={<AimOutlined />} onClick={() => handleGenerateQuestions(record.id)} />
          </Tooltip>
          <Button size="small" type="link" onClick={() => {
            setSelectedResume(record);
            setResumeModalVisible(true);
          }}>详情</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <TeamOutlined />
            智能招聘中心
          </Space>
        }
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setJobModalVisible(true)}>
              发布岗位
            </Button>
            <Button icon={<PlusOutlined />} onClick={() => setResumeModalVisible(true)}>
              添加简历
            </Button>
          </Space>
        }
      >
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic
              title="岗位总数"
              value={stats.totalJobs}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="在招岗位"
              value={stats.activeJobs}
              prefix={<ScheduleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="简历总数"
              value={stats.totalResumes}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="本周新增"
              value={stats.newResumes}
              prefix={<AimOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Col>
        </Row>

        <Divider />

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={<span><FileTextOutlined /> 岗位管理</span>} key="jobs">
            <Table
              dataSource={jobs}
              columns={jobColumns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane tab={<span><TeamOutlined /> 简历管理</span>} key="resumes">
            <Table
              dataSource={resumes}
              columns={resumeColumns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane tab={<span><RobotOutlined /> AI分析</span>} key="ai">
            <Empty description="选择简历后进行AI分析">
              <Button type="primary" icon={<RobotOutlined />} onClick={() => setActiveTab('resumes')}>
                去添加简历
              </Button>
            </Empty>
          </TabPane>
        </Tabs>
      </Card>

      {/* 创建岗位弹窗 */}
      <Modal
        title="发布新岗位"
        open={jobModalVisible}
        onCancel={() => setJobModalVisible(false)}
        onOk={() => jobForm.submit()}
        width={600}
      >
        <Form form={jobForm} layout="vertical" onFinish={handleCreateJob}>
          <Form.Item name="title" label="岗位名称" rules={[{ required: true }]}>
            <Input placeholder="例如：高级前端工程师" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="salaryMin" label="最低薪资(K)">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="例如：15" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="salaryMax" label="最高薪资(K)">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="例如：30" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="education" label="学历要求">
                <Select placeholder="选择学历要求">
                  <Select.Option value="不限">不限</Select.Option>
                  <Select.Option value="初中及以下">初中及以下</Select.Option>
                  <Select.Option value="高中">高中</Select.Option>
                  <Select.Option value="大专">大专</Select.Option>
                  <Select.Option value="本科">本科</Select.Option>
                  <Select.Option value="硕士">硕士</Select.Option>
                  <Select.Option value="博士">博士</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="experience" label="经验要求">
                <Select placeholder="选择经验要求">
                  <Select.Option value="不限">不限</Select.Option>
                  <Select.Option value="1年以下">1年以下</Select.Option>
                  <Select.Option value="1-3年">1-3年</Select.Option>
                  <Select.Option value="3-5年">3-5年</Select.Option>
                  <Select.Option value="5-10年">5-10年</Select.Option>
                  <Select.Option value="10年以上">10年以上</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="岗位描述">
            <TextArea rows={3} placeholder="描述岗位职责..." />
          </Form.Item>
          <Form.Item name="requirements" label="任职要求">
            <TextArea rows={3} placeholder="描述任职要求..." />
          </Form.Item>
          <Form.Item name="benefits" label="福利待遇">
            <TextArea rows={2} placeholder="例如：五险一金、带薪年假、弹性工作..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加简历弹窗 */}
      <Modal
        title="添加简历"
        open={resumeModalVisible}
        onCancel={() => {
          setResumeModalVisible(false);
          setParsedData(null);
        }}
        width={700}
        footer={[
          <Button key="parse" onClick={handleParseResume} loading={parseLoading} icon={<RobotOutlined />}>
            AI解析
          </Button>,
          <Button key="cancel" onClick={() => setResumeModalVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" onClick={() => resumeForm.submit()}>保存</Button>,
        ]}
      >
        <Form form={resumeForm} layout="vertical" onFinish={handleCreateResume}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="jobId" label="投递岗位" rules={[{ required: true }]}>
                <Select placeholder="选择岗位">
                  {jobs.map(job => (
                    <Select.Option key={job.id} value={job.id}>{job.title}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
                <Input placeholder="候选人姓名" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="手机号" rules={[{ required: true }]}>
                <Input placeholder="手机号码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="邮箱">
                <Input placeholder="电子邮箱" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="education" label="学历">
                <Input placeholder="最高学历" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="experience" label="工作经验">
                <Input placeholder="工作年限" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="resumeText" label="简历内容">
            <TextArea rows={4} placeholder="粘贴简历文本内容，用于AI解析..." />
          </Form.Item>
        </Form>

        {parsedData && (
          <>
            <Divider>AI解析结果</Divider>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="姓名">{parsedData.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="电话">{parsedData.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="学历">{parsedData.education || '-'}</Descriptions.Item>
              <Descriptions.Item label="工作年限">{parsedData.workExperience || '-'}</Descriptions.Item>
              <Descriptions.Item label="当前公司" span={2}>{parsedData.currentCompany || '-'}</Descriptions.Item>
              <Descriptions.Item label="当前职位" span={2}>{parsedData.currentPosition || '-'}</Descriptions.Item>
              <Descriptions.Item label="技能" span={2}>
                {parsedData.skills?.map((s: string, i: number) => (
                  <Tag key={i} color="blue">{s}</Tag>
                )) || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="个人简介" span={2}>{parsedData.summary || '-'}</Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Modal>

      {/* 面试问题弹窗 */}
      <Modal
        title={`面试问题 - ${selectedResume?.name || ''}`}
        open={interviewModalVisible}
        onCancel={() => setInterviewModalVisible(false)}
        footer={null}
        width={700}
      >
        <Typography.Title level={5}>AI生成的面试问题</Typography.Title>
        <div style={{ marginBottom: 16 }}>
          {aiQuestions.map((q, i) => (
            <Card key={i} size="small" style={{ marginBottom: 8 }}>
              <Text strong>Q{i + 1}: {q}</Text>
            </Card>
          ))}
        </div>
        <Divider>面试记录</Divider>
        <Form form={interviewForm} layout="vertical">
          <Form.Item name="answer" label="面试记录">
            <TextArea rows={4} placeholder="记录面试回答..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RecruitmentPage;
