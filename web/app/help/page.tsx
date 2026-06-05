'use client';

import { useState } from 'react';
import {
  Card,
  Input,
  List,
  Tag,
  Typography,
  Space,
  Breadcrumb,
  Collapse,
  Button,
  Avatar,
  Form,
  Modal,
  message,
  Select,
} from 'antd';
import {
  SearchOutlined,
  BookOutlined,
  QuestionCircleOutlined,
  CustomerServiceOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  RightOutlined,
  HistoryOutlined,
  RobotOutlined,
  SendOutlined,
  PhoneOutlined,
  MailOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface FAQ {
  id: number;
  category: string;
  question: string;
  answer: string;
  views: number;
}

interface HelpArticle {
  id: number;
  title: string;
  category: string;
  description: string;
  icon: React.ReactNode;
}

interface ChatMessage {
  id: number;
  type: 'user' | 'bot';
  content: string;
  time: string;
}

const faqCategories = [
  { key: 'all', label: '全部' },
  { key: 'account', label: '账号问题' },
  { key: 'payment', label: '支付问题' },
  { key: 'feature', label: '功能使用' },
  { key: 'technical', label: '技术问题' },
];

const mockFAQs: FAQ[] = [
  {
    id: 1,
    category: 'account',
    question: '如何注册智枢 AI SaaS 账号？',
    answer: '访问智枢 AI SaaS 官网，点击注册按钮，填写手机号和验证码即可完成注册。',
    views: 1256,
  },
  {
    id: 2,
    category: 'account',
    question: '忘记密码怎么办？',
    answer: '在登录页面点击"忘记密码"，输入注册手机号，接收验证码后重置密码。',
    views: 2341,
  },
  {
    id: 3,
    category: 'payment',
    question: '如何购买套餐？',
    answer: '登录后进入"套餐管理"页面，选择适合您的套餐，完成支付即可开通服务。',
    views: 1876,
  },
  {
    id: 4,
    category: 'payment',
    question: '支持哪些支付方式？',
    answer: '我们支持微信支付、支付宝、银联卡等多种支付方式。',
    views: 987,
  },
  {
    id: 5,
    category: 'feature',
    question: '如何使用矩阵管理功能？',
    answer: '在矩阵管理页面，点击"添加账号"，通过扫码授权绑定您的社交媒体账号，即可统一管理。',
    views: 3456,
  },
  {
    id: 6,
    category: 'feature',
    question: 'AI 对话引擎如何使用？',
    answer: '进入 AI 对话页面，选择合适的 AI 模型，输入您的问题即可获得智能回答。',
    views: 2876,
  },
  {
    id: 7,
    category: 'feature',
    question: '招聘助手的简历筛选准吗？',
    answer:
      '我们的 AI 简历筛选基于多维度分析，包括技能匹配度、工作经验、教育背景等，准确率可达 85% 以上。',
    views: 1567,
  },
  {
    id: 8,
    category: 'technical',
    question: 'API 调用失败怎么解决？',
    answer: '请检查：1. API Key 是否正确配置；2. 调用频率是否超限；3. 网络连接是否正常。',
    views: 2345,
  },
  {
    id: 9,
    category: 'technical',
    question: '数据导出支持哪些格式？',
    answer: '支持 Excel、CSV、JSON 三种格式导出，您可以在数据报表页面选择导出格式。',
    views: 1234,
  },
  {
    id: 10,
    category: 'technical',
    question: '系统运行缓慢怎么办？',
    answer: '建议：1. 清理浏览器缓存；2. 使用 Chrome 或 Firefox 最新版本；3. 检查网络速度。',
    views: 987,
  },
];

const helpArticles: HelpArticle[] = [
  {
    id: 1,
    title: '快速入门指南',
    category: 'getting-started',
    description: '5分钟快速上手智枢 AI',
    icon: <BookOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
  },
  {
    id: 2,
    title: '视频教程',
    category: 'video',
    description: '观看功能操作视频',
    icon: <VideoCameraOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
  },
  {
    id: 3,
    title: 'API 文档',
    category: 'api',
    description: '开发者 API 参考',
    icon: <FileTextOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
  },
  {
    id: 4,
    title: '常见问题',
    category: 'faq',
    description: 'FAQ 常见问题解答',
    icon: <QuestionCircleOutlined style={{ fontSize: 32, color: '#faad14' }} />,
  },
];

const contactOptions = [
  { label: '账号问题', value: 'account' },
  { label: '支付问题', value: 'payment' },
  { label: '功能咨询', value: 'feature' },
  { label: '技术问题', value: 'technical' },
  { label: '合作洽谈', value: 'business' },
];

export default function HelpCenter() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [chatVisible, setChatVisible] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      type: 'bot',
      content: '您好！我是智枢 AI 助手，请问有什么可以帮助您的？',
      time: new Date().toLocaleTimeString(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [contactForm] = Form.useForm();

  const filteredFAQs = mockFAQs.filter(faq => {
    const matchCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchSearch =
      !searchKeyword ||
      faq.question.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      type: 'user',
      content: chatInput,
      time: new Date().toLocaleTimeString(),
    };

    setMessages([...messages, userMessage]);
    setChatInput('');

    // 模拟机器人回复
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: '感谢您的咨询！我们的工作人员将尽快为您解答。您也可以通过下方的联系方式联系我们。',
        time: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const handleContactSubmit = (values: any) => {
    console.log('Contact form:', values);
    message.success('提交成功！我们将尽快与您联系');
    setContactModalVisible(false);
    contactForm.resetFields();
  };

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      {/* Hero */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
          borderRadius: 16,
          padding: '48px 24px',
          textAlign: 'center',
          color: 'white',
          marginBottom: 24,
        }}
      >
        <Title level={2} style={{ color: 'white', marginBottom: 16 }}>
          帮助中心
        </Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, marginBottom: 24 }}>
          遇到问题？在这里您可以找到答案，或联系我们的客服团队
        </Paragraph>
        <Input.Search
          placeholder="搜索问题..."
          size="large"
          style={{ maxWidth: 500 }}
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
          prefix={<SearchOutlined />}
          allowClear
        />
      </div>

      {/* Quick Access */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {helpArticles.map(article => (
          <Col xs={24} sm={12} lg={6} key={article.id}>
            <Card hoverable style={{ textAlign: 'center', borderRadius: 12 }}>
              <div style={{ marginBottom: 16 }}>{article.icon}</div>
              <Title level={5} style={{ margin: 0 }}>
                {article.title}
              </Title>
              <Text type="secondary">{article.description}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      {/* FAQ Section */}
      <Card style={{ borderRadius: 12, marginBottom: 24 }}>
        <Title level={4}>常见问题</Title>
        <Space wrap style={{ marginBottom: 16 }}>
          {faqCategories.map(cat => (
            <Tag
              key={cat.key}
              color={activeCategory === cat.key ? 'blue' : 'default'}
              style={{ cursor: 'pointer', padding: '4px 12px' }}
              onClick={() => setActiveCategory(cat.key)}
            >
              {cat.label}
            </Tag>
          ))}
        </Space>

        <Collapse accordion>
          {filteredFAQs.map(faq => (
            <Panel
              key={faq.id}
              header={
                <Space>
                  <Text strong>{faq.question}</Text>
                  <Tag>{faqCategories.find(c => c.key === faq.category)?.label}</Tag>
                </Space>
              }
              extra={<Text type="secondary">{faq.views} 次浏览</Text>}
            >
              <Paragraph>{faq.answer}</Paragraph>
            </Panel>
          ))}
        </Collapse>

        {filteredFAQs.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <SearchOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
            <Title level={5} type="secondary" style={{ marginTop: 16 }}>
              未找到相关问题
            </Title>
            <Text type="secondary">试试其他关键词，或联系我们的客服</Text>
          </div>
        )}
      </Card>

      {/* Contact */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="联系客服" style={{ borderRadius: 12 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                block
                size="large"
                icon={<CustomerServiceOutlined />}
                onClick={() => setChatVisible(true)}
              >
                在线客服
              </Button>
              <Button
                block
                size="large"
                icon={<PhoneOutlined />}
                onClick={() => setContactModalVisible(true)}
              >
                电话咨询: 400-888-8888
              </Button>
              <Button
                block
                size="large"
                icon={<MailOutlined />}
                onClick={() => setContactModalVisible(true)}
              >
                邮件联系: support@baizhiji.net
              </Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="使用指南" style={{ borderRadius: 12 }}>
            <List
              dataSource={[
                { title: '新手指南', href: '/help/getting-started' },
                { title: '矩阵管理教程', href: '/help/matrix-guide' },
                { title: 'AI 对话使用技巧', href: '/help/ai-chat-guide' },
                { title: '招聘助手操作手册', href: '/help/recruitment-guide' },
              ]}
              renderItem={item => (
                <List.Item>
                  <a href={item.href} style={{ display: 'flex', alignItems: 'center' }}>
                    <BookOutlined style={{ marginRight: 8 }} />
                    {item.title}
                    <RightOutlined style={{ marginLeft: 'auto' }} />
                  </a>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Chat Modal */}
      <Modal
        title={
          <Space>
            <RobotOutlined />
            <span>智能客服</span>
          </Space>
        }
        open={chatVisible}
        onCancel={() => setChatVisible(false)}
        footer={null}
        width={500}
      >
        <div style={{ height: 400, overflowY: 'auto', marginBottom: 16 }}>
          {messages.map(msg => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 16,
              }}
            >
              {msg.type === 'bot' && <Avatar icon={<RobotOutlined />} style={{ marginRight: 8 }} />}
              <div
                style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: msg.type === 'user' ? '#1890ff' : '#f0f0f0',
                  color: msg.type === 'user' ? 'white' : 'inherit',
                }}
              >
                {msg.content}
              </div>
              {msg.type === 'user' && <Avatar style={{ marginLeft: 8 }}>U</Avatar>}
            </div>
          ))}
        </div>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="输入您的问题..."
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onPressEnter={handleSendMessage}
          />
          <Button type="primary" icon={<SendOutlined />} onClick={handleSendMessage}>
            发送
          </Button>
        </Space.Compact>
      </Modal>

      {/* Contact Modal */}
      <Modal
        title="联系我们"
        open={contactModalVisible}
        onCancel={() => setContactModalVisible(false)}
        footer={null}
      >
        <Form form={contactForm} layout="vertical" onFinish={handleContactSubmit}>
          <Form.Item
            label="问题类型"
            name="type"
            rules={[{ required: true, message: '请选择问题类型' }]}
          >
            <Select options={contactOptions} placeholder="请选择" />
          </Form.Item>
          <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入您的姓名" />
          </Form.Item>
          <Form.Item
            label="手机号"
            name="phone"
            rules={[{ required: true, message: '请输入手机号' }]}
          >
            <Input placeholder="请输入您的手机号" />
          </Form.Item>
          <Form.Item
            label="问题描述"
            name="description"
            rules={[{ required: true, message: '请输入问题描述' }]}
          >
            <Input.TextArea rows={4} placeholder="请详细描述您的问题" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              提交
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Floating Chat Button */}
      {!chatVisible && (
        <div
          style={{
            position: 'fixed',
            right: 24,
            bottom: 24,
            zIndex: 100,
          }}
        >
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<CustomerServiceOutlined />}
            onClick={() => setChatVisible(true)}
            style={{
              width: 60,
              height: 60,
              boxShadow: '0 4px 12px rgba(24, 144, 255, 0.4)',
            }}
          />
        </div>
      )}
    </div>
  );
}

import { Row, Col } from 'antd';
