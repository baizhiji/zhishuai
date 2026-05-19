'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Table, Tag, Space, Modal, Form, Input, Select, Switch, message, Typography, Tabs, List, Avatar, Statistic, Divider, Badge, Tooltip, Popconfirm, Empty, Spin, Alert } from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  RobotOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  StarOutlined,
  BulbOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  HistoryOutlined,
  UserOutlined,
  LikeOutlined,
  DislikeOutlined,
  ThunderboltOutlined,
  SmileOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// 场景类型
type Scenario = 'recruitment' | 'social_media' | 'customer_service' | 'common';

// 话术模板
interface ScriptTemplate {
  id: string;
  name: string;
  scenario: Scenario;
  category: string;
  content: string;
  style: 'professional' | 'friendly' | 'casual' | 'concise';
  isAI: boolean;
  status: boolean;
  useCount: number;
  successRate: number;
  createdAt: string;
  updatedAt: string;
}

// 对话记录
interface ConversationLog {
  id: string;
  sender: string;
  receiver: string;
  originalMessage: string;
  generatedReply: string;
  template?: string;
  scenario: Scenario;
  style: string;
  feedback?: 'good' | 'bad' | null;
  timestamp: string;
}

// 知识库分类
const SCRIPT_CATEGORIES: Record<Scenario, string[]> = {
  recruitment: ['开场白', '职位介绍', '面试邀请', '面试提醒', '拒绝话术', '入职邀请', '跟进话术', '常见问题'],
  social_media: ['评论回复', '私信回复', '私信群发', '活动推广', '感谢回复', '投诉处理'],
  customer_service: ['欢迎语', '常见问题', '投诉处理', '退款处理', '订单咨询', '会员服务'],
  common: ['问候语', '告别语', '道歉解释', '感谢语'],
};

// 人设风格
const STYLE_CONFIG = {
  professional: { label: '专业严谨', icon: '👔', desc: '措辞规范，像资深HR或专业客服' },
  friendly: { label: '亲切友好', icon: '🤝', desc: '像朋友聊天，轻松自然' },
  casual: { label: '活泼开朗', icon: '😊', desc: '带表情，语气俏皮' },
  concise: { label: '简洁干练', icon: '⚡', desc: '直奔主题，高效直接' },
};

export default function SmartCommunication() {
  const [activeTab, setActiveTab] = useState('communicate');
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [aiGenerateModalVisible, setAiGenerateModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ScriptTemplate | null>(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<Scenario>('recruitment');
  const [form] = Form.useForm();
  const [aiForm] = Form.useForm();
  
  const [templates, setTemplates] = useState<ScriptTemplate[]>([
    {
      id: '1',
      name: '收到简历自动回复',
      scenario: 'recruitment',
      category: '开场白',
      content: '您好！感谢您投递简历，我们已收到您的申请。HR会在3个工作日内审核您的简历，通过初审后会电话联系您安排面试。请保持电话畅通！',
      style: 'friendly',
      isAI: false,
      status: true,
      useCount: 156,
      successRate: 92,
      createdAt: '2025-05-10',
      updatedAt: '2025-05-15',
    },
    {
      id: '2',
      name: '面试邀请',
      scenario: 'recruitment',
      category: '面试邀请',
      content: '您好！恭喜您通过简历筛选。我们诚邀您参加面试。\n📅 时间：{date}\n📍 地点：{address}\n👔 穿着：商务休闲\n请回复"确认参加"，如有疑问请联系 HR。期待与您见面！',
      style: 'professional',
      isAI: false,
      status: true,
      useCount: 89,
      successRate: 88,
      createdAt: '2025-05-08',
      updatedAt: '2025-05-14',
    },
    {
      id: '3',
      name: '面试提醒',
      scenario: 'recruitment',
      category: '面试提醒',
      content: '您好！明天就是面试了，请记得：\n1️⃣ 带好身份证和简历\n2️⃣ 提前10分钟到达\n3️⃣ 如有变动请提前告知\n\n期待明天见面！',
      style: 'friendly',
      isAI: false,
      status: true,
      useCount: 45,
      successRate: 95,
      createdAt: '2025-05-05',
      updatedAt: '2025-05-12',
    },
    {
      id: '4',
      name: '不合适回复',
      scenario: 'recruitment',
      category: '拒绝话术',
      content: '您好！感谢您对我们公司的关注。经过认真审核，您的简历与我们当前招聘岗位的要求不太匹配。我们已将您的简历存入人才库，后续有合适岗位会再联系您。祝您早日找到满意的工作！',
      style: 'professional',
      isAI: false,
      status: false,
      useCount: 234,
      successRate: 85,
      createdAt: '2025-05-01',
      updatedAt: '2025-05-10',
    },
    {
      id: '5',
      name: '感谢关注回复',
      scenario: 'social_media',
      category: '感谢回复',
      content: '感谢您的关注！如果您有任何问题，随时可以私信我哦~ 🌟',
      style: 'casual',
      isAI: false,
      status: true,
      useCount: 320,
      successRate: 90,
      createdAt: '2025-05-08',
      updatedAt: '2025-05-15',
    },
  ]);

  const [logs] = useState<ConversationLog[]>([
    { id: '1', sender: 'HR小王', receiver: '李明', originalMessage: '您好，我想咨询一下这个岗位的薪资范围', generatedReply: '您好，我们岗位薪资范围是15-25K，具体根据您的工作经验...', template: '收到简历自动回复', scenario: 'recruitment', style: 'friendly', feedback: 'good', timestamp: '10:30' },
    { id: '2', sender: 'HR小李', receiver: '王芳', originalMessage: '请问贵公司加班多吗？', generatedReply: '您好，我们公司实行弹性工作制，不强制加班...', template: '收到简历自动回复', scenario: 'recruitment', style: 'friendly', feedback: 'good', timestamp: '10:25' },
    { id: '3', sender: 'HR小张', receiver: '赵六', originalMessage: '可以远程面试吗？', generatedReply: '您好！当然可以，我们支持线上面试，请问您方便什么时间呢？', template: '面试邀请', scenario: 'recruitment', style: 'friendly', feedback: null, timestamp: '10:20' },
    { id: '4', sender: '运营小明', receiver: '粉丝A', originalMessage: '这个产品好用吗？', generatedReply: '感谢您的关注！这款产品我们卖得特别好，用户反馈很不错呢~', template: '感谢关注回复', scenario: 'social_media', style: 'casual', feedback: 'good', timestamp: '09:15' },
  ]);

  // 统计数据
  const stats = {
    totalTemplates: templates.length,
    activeTemplates: templates.filter(t => t.status).length,
    totalUsage: templates.reduce((acc, t) => acc + t.useCount, 0),
    avgSuccessRate: Math.round(templates.reduce((acc, t) => acc + t.successRate, 0) / templates.length),
    todayUsage: logs.length,
    aiGenerated: templates.filter(t => t.isAI).length,
  };

  // AI 生成话术
  const handleAIGenerate = async () => {
    const values = await aiForm.validateFields();
    setGeneratingAI(true);
    
    try {
      // 调用后端 API 生成话术
      const response = await fetch('/api/ai/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scene: values.sceneType,
          sceneName: values.sceneTypeName,
          scenePrompt: values.scenePrompt,
          style: values.style,
          context: values.context,
          maxTokens: values.maxTokens || 300,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        aiForm.setFieldValue('generatedContent', result.data.script);
        message.success('AI 已生成话术，请预览或调整');
      } else {
        message.error(result.error || 'AI 生成失败');
      }
    } catch (error) {
      console.error('AI生成失败:', error);
      message.error('AI 生成失败，请稍后重试');
    } finally {
      setGeneratingAI(false);
    }
  };

  // 保存话术
  const handleSaveTemplate = () => {
    form.validateFields().then(values => {
      const newTemplate: ScriptTemplate = {
        id: editingTemplate?.id || Date.now().toString(),
        name: values.name,
        scenario: values.scenario,
        category: values.category,
        content: values.content,
        style: values.style,
        isAI: values.isAI || false,
        status: values.status !== false,
        useCount: editingTemplate?.useCount || 0,
        successRate: editingTemplate?.successRate || 85,
        createdAt: editingTemplate?.createdAt || new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };

      if (editingTemplate) {
        setTemplates(templates.map(t => t.id === editingTemplate.id ? newTemplate : t));
        message.success('话术已更新');
      } else {
        setTemplates([...templates, newTemplate]);
        message.success('话术已创建');
      }

      setTemplateModalVisible(false);
      form.resetFields();
    });
  };

  // 删除话术
  const handleDelete = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
    message.success('话术已删除');
  };

  // 预览话术
  const handlePreview = (template: ScriptTemplate) => {
    setEditingTemplate(template);
    setPreviewModalVisible(true);
  };

  // 表格列
  const columns = [
    { 
      title: '话术名称', 
      dataIndex: 'name', 
      key: 'name',
      render: (name: string, record: ScriptTemplate) => (
        <Space>
          <Text strong>{name}</Text>
          {record.isAI && <Tag color="purple" icon={<StarOutlined />}>AI</Tag>}
        </Space>
      )
    },
    { 
      title: '场景', 
      dataIndex: 'scenario', 
      key: 'scenario',
      render: (scenario: Scenario) => {
        const config: Record<Scenario, { label: string; color: string }> = {
          recruitment: { label: '招聘', color: 'blue' },
          social_media: { label: '自媒体', color: 'green' },
          customer_service: { label: '客服', color: 'orange' },
          common: { label: '通用', color: 'default' },
        };
        return <Tag color={config[scenario].color}>{config[scenario].label}</Tag>;
      }
    },
    { title: '分类', dataIndex: 'category', key: 'category' },
    { 
      title: '风格', 
      dataIndex: 'style', 
      key: 'style',
      render: (style: string) => (
        <Space>
          <span>{STYLE_CONFIG[style as keyof typeof STYLE_CONFIG]?.icon}</span>
          <Text>{STYLE_CONFIG[style as keyof typeof STYLE_CONFIG]?.label}</Text>
        </Space>
      )
    },
    { title: '使用次数', dataIndex: 'useCount', key: 'useCount', render: (v: number) => <Text>{v}次</Text> },
    { 
      title: '成功率', 
      dataIndex: 'successRate', 
      key: 'successRate',
      render: (v: number) => (
        <Text type={v >= 90 ? 'success' : v >= 80 ? 'warning' : 'danger'}>{v}%</Text>
      )
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: boolean) => <Badge status={status ? 'success' : 'default'} text={status ? '已启用' : '已禁用'} />
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ScriptTemplate) => (
        <Space>
          <Button type="link" size="small" onClick={() => handlePreview(record)}>预览</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => {
            setEditingTemplate(record);
            form.setFieldsValue(record);
            setTemplateModalVisible(true);
          }}>编辑</Button>
          <Popconfirm title="确定删除此话术？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ marginBottom: 8 }}>
          <RobotOutlined style={{ marginRight: 8 }} />
          智能沟通
        </Title>
        <Text type="secondary">
          AI 驱动的智能话术系统，支持多场景沟通，让人机对话更自然高效
        </Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="话术总数" value={stats.totalTemplates} prefix={<MessageOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="启用中" value={stats.activeTemplates} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="累计使用" value={stats.totalUsage} suffix="次" />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="平均成功率" value={stats.avgSuccessRate} suffix="%" valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
      </Row>

      {/* 提示信息 */}
      <Alert
        message="智能话术系统"
        description="系统已配置阿里云百炼和腾讯云 TokenHub 模型，可以生成更自然、人性化的话术。点击「AI 生成」体验智能话术创建。"
        type="info"
        showIcon
        icon={<StarOutlined />}
        style={{ marginBottom: 24 }}
      />

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          {
            key: 'communicate',
            label: <span><MessageOutlined /> 话术管理</span>,
            children: (
              <>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                  <Space>
                    <Select value={selectedScenario} onChange={setSelectedScenario} style={{ width: 150 }}>
                      <Option value="recruitment">招聘场景</Option>
                      <Option value="social_media">自媒体场景</Option>
                      <Option value="customer_service">客服场景</Option>
                      <Option value="common">通用场景</Option>
                    </Select>
                  </Space>
                  <Space>
                    <Button icon={<BulbOutlined />} onClick={() => {
                      aiForm.resetFields();
                      aiForm.setFieldsValue({ scenario: selectedScenario, style: 'friendly' });
                      setAiGenerateModalVisible(true);
                    }}>
                      <StarOutlined /> AI 生成
                    </Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                      setEditingTemplate(null);
                      form.resetFields();
                      form.setFieldsValue({ scenario: selectedScenario, style: 'friendly', status: true });
                      setTemplateModalVisible(true);
                    }}>
                      新建话术
                    </Button>
                  </Space>
                </div>
                
                <Table 
                  columns={columns} 
                  dataSource={templates.filter(t => t.scenario === selectedScenario)} 
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              </>
            ),
          },
          {
            key: 'records',
            label: <span><HistoryOutlined /> 对话记录</span>,
            children: (
              <>
                <List
                  itemLayout="horizontal"
                  dataSource={logs}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Tooltip title="好评"><Button type="text" icon={<LikeOutlined />} style={{ color: item.feedback === 'good' ? '#52c41a' : undefined }} /></Tooltip>,
                        <Tooltip title="差评"><Button type="text" icon={<DislikeOutlined />} style={{ color: item.feedback === 'bad' ? '#ff4d4f' : undefined }} /></Tooltip>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar icon={<MessageOutlined />} style={{ background: '#1890ff' }} />}
                        title={
                          <Space>
                            <Text strong>{item.receiver}</Text>
                            <Tag>{item.template || 'AI生成'}</Tag>
                            <Text type="secondary">{item.timestamp}</Text>
                          </Space>
                        }
                        description={
                          <div>
                            <div style={{ marginBottom: 8 }}>
                              <Text type="secondary">候选人：</Text>
                              <Text>{item.originalMessage}</Text>
                            </div>
                            <div>
                              <Text type="secondary">回复：</Text>
                              <Text type="success">{item.generatedReply}</Text>
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </>
            ),
          },
          {
            key: 'settings',
            label: <span><SettingOutlined /> 人设配置</span>,
            children: (
              <Row gutter={[24, 24]}>
                {Object.entries(STYLE_CONFIG).map(([key, config]) => (
                  <Col span={12} key={key}>
                    <Card size="small" title={
                      <Space>
                        <span style={{ fontSize: 20 }}>{config.icon}</span>
                        <Text strong>{config.label}</Text>
                      </Space>
                    }>
                      <Paragraph type="secondary">{config.desc}</Paragraph>
                      <Tag color="blue">{templates.filter(t => t.style === key).length} 个话术</Tag>
                    </Card>
                  </Col>
                ))}
              </Row>
            ),
          },
        ]} />
      </Card>

      {/* 新建/编辑话术弹窗 */}
      <Modal
        title={editingTemplate ? '编辑话术' : '新建话术'}
        open={templateModalVisible}
        onOk={handleSaveTemplate}
        onCancel={() => setTemplateModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="话术名称" rules={[{ required: true, message: '请输入话术名称' }]}>
            <Input placeholder="例如：收到简历自动回复" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="scenario" label="使用场景" rules={[{ required: true }]}>
                <Select onChange={(v) => { form.setFieldValue('category', SCRIPT_CATEGORIES[v as Scenario][0]); }}>
                  <Option value="recruitment">招聘场景</Option>
                  <Option value="social_media">自媒体场景</Option>
                  <Option value="customer_service">客服场景</Option>
                  <Option value="common">通用场景</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="话术分类" rules={[{ required: true }]}>
                <Select>
                  {(form.getFieldValue('scenario') ? SCRIPT_CATEGORIES[form.getFieldValue('scenario') as Scenario] : SCRIPT_CATEGORIES.recruitment).map(cat => (
                    <Option key={cat} value={cat}>{cat}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="style" label="沟通风格" rules={[{ required: true }]}>
            <Select>
              {Object.entries(STYLE_CONFIG).map(([key, config]) => (
                <Option key={key} value={key}>
                  <Space>{config.icon} {config.label}</Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="content" label="话术内容" rules={[{ required: true, message: '请输入话术内容' }]}>
            <TextArea rows={6} placeholder="请输入话术内容，支持 {变量} 格式" />
          </Form.Item>
          <Form.Item name="status" label="启用状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
          <Form.Item name="isAI" label="AI 增强" valuePropName="checked">
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>
        </Form>
      </Modal>

      {/* AI 生成话术弹窗 */}
      <Modal
        title={<Space><StarOutlined /> AI 智能生成话术</Space>}
        open={aiGenerateModalVisible}
        onCancel={() => setAiGenerateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={aiForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="scenario" label="使用场景" rules={[{ required: true }]}>
                <Select>
                  <Option value="recruitment">招聘场景</Option>
                  <Option value="social_media">自媒体场景</Option>
                  <Option value="customer_service">客服场景</Option>
                  <Option value="common">通用场景</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="style" label="沟通风格" rules={[{ required: true }]}>
                <Select>
                  {Object.entries(STYLE_CONFIG).map(([key, config]) => (
                    <Option key={key} value={key}>
                      <Space>{config.icon} {config.label}</Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="context" label="话术主题/场景描述" rules={[{ required: true, message: '请描述话术主题' }]}>
            <TextArea rows={3} placeholder="例如：面试前一天的提醒，需要包含时间、地点、注意事项等" />
          </Form.Item>
          <Form.Item name="generatedContent" label="生成结果">
            <TextArea rows={6} placeholder="点击「开始生成」后将显示AI生成的话术" />
          </Form.Item>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button 
              type="primary" 
              icon={<StarOutlined />} 
              onClick={handleAIGenerate}
              loading={generatingAI}
              size="large"
            >
              {generatingAI ? 'AI 正在生成...' : '开始生成'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 预览弹窗 */}
      <Modal
        title="话术预览"
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={null}
        width={600}
      >
        {editingTemplate && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space split={<Divider type="vertical" />}>
                <Text strong>{editingTemplate.name}</Text>
                <Tag>{editingTemplate.scenario}</Tag>
                <Tag>{editingTemplate.category}</Tag>
                <Space>{STYLE_CONFIG[editingTemplate.style as keyof typeof STYLE_CONFIG]?.icon}</Space>
              </Space>
            </Card>
            <Card title="话术内容">
              <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{editingTemplate.content}</Paragraph>
            </Card>
            <Card size="small" style={{ marginTop: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic title="使用次数" value={editingTemplate.useCount} />
                </Col>
                <Col span={8}>
                  <Statistic title="成功率" value={editingTemplate.successRate} suffix="%" />
                </Col>
                <Col span={8}>
                  <Statistic title="状态" value={editingTemplate.status ? '已启用' : '已禁用'} />
                </Col>
              </Row>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
}
