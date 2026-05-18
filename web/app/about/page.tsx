'use client';

import React from 'react';
import { Card, Typography, Row, Col, Statistic, Progress, Tag, Space, Divider, QRCode } from 'antd';
import { 
  RobotOutlined, 
  GlobalOutlined, 
  CustomerServiceOutlined, 
  UsergroupAddOutlined,
  SafetyCertificateOutlined,
  ThunderboltBoltOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export default function AboutPage() {
  const features = [
    { icon: <RobotOutlined />, title: 'AI智能引擎', desc: '基于大语言模型的智能对话、内容生成、意图识别' },
    { icon: <GlobalOutlined />, title: '自媒体矩阵', desc: '抖音、快手、小红书多平台账号管理与一键发布' },
    { icon: <CustomerServiceOutlined />, title: '智能招聘', desc: 'AI生成JD、智能筛选简历、自动沟通候选人' },
    { icon: <UsergroupAddOutlined />, title: '智能获客', desc: '潜客发现、AI画像分析、自动引流转化' },
    { icon: <SafetyCertificateOutlined />, title: '企业级安全', desc: '数据加密、权限管理、操作审计' },
    { icon: <ThunderboltBoltOutlined />, title: '高效稳定', desc: '云原生架构、弹性扩展、99.9%可用性' },
  ];

  const stats = [
    { title: '平台用户', value: '10,000+', color: '#1890ff' },
    { title: '服务企业', value: '1,000+', color: '#52c41a' },
    { title: 'AI调用次数', value: '1,000,000+', color: '#faad14' },
    { title: '服务稳定性', value: '99.9%', color: '#f5222d' },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <Card style={{ marginBottom: 24, textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div style={{ color: 'white' }}>
          <Title level={1} style={{ color: 'white', marginBottom: 8 }}>
            智枢AI SaaS 系统
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16 }}>
            一站式智能商业平台，集成自媒体运营、智能招聘、获客引流等全场景功能
          </Text>
          <div style={{ marginTop: 24 }}>
            <Space size="large">
              <Tag color="gold">v1.0.0</Tag>
              <Tag color="green">稳定版</Tag>
              <Tag color="blue">持续更新</Tag>
            </Space>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {stats.map((stat, i) => (
          <Col span={6} key={i}>
            <Card>
              <Statistic 
                title={<Text type="secondary">{stat.title}</Text>}
                value={stat.value}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Features */}
      <Title level={2} style={{ marginBottom: 24 }}>核心功能</Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {features.map((feature, i) => (
          <Col span={8} key={i}>
            <Card hoverable>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ fontSize: 32, color: '#1890ff' }}>
                  {feature.icon}
                </div>
                <Title level={4} style={{ margin: 0 }}>{feature.title}</Title>
                <Text type="secondary">{feature.desc}</Text>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Technology Stack */}
      <Title level={2} style={{ marginBottom: 24 }}>技术架构</Title>
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[24, 16]}>
          <Col span={12}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>前端技术栈</Text>
                <div style={{ marginTop: 8 }}>
                  <Tag>Next.js 14</Tag>
                  <Tag>React 18</Tag>
                  <Tag>Ant Design 5</Tag>
                  <Tag>TypeScript</Tag>
                </div>
              </div>
              <div>
                <Text strong>后端技术栈</Text>
                <div style={{ marginTop: 8 }}>
                  <Tag color="blue">Node.js</Tag>
                  <Tag color="blue">Express</Tag>
                  <Tag color="blue">Prisma ORM</Tag>
                  <Tag color="blue">PostgreSQL</Tag>
                </div>
              </div>
              <div>
                <Text strong>AI能力</Text>
                <div style={{ marginTop: 8 }}>
                  <Tag color="green">OpenAI</Tag>
                  <Tag color="green">Claude</Tag>
                  <Tag color="green">通义千问</Tag>
                  <Tag color="green">文心一言</Tag>
                </div>
              </div>
            </Space>
          </Col>
          <Col span={12}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>部署架构</Text>
                <div style={{ marginTop: 8 }}>
                  <Tag color="orange">腾讯云 CVM</Tag>
                  <Tag color="orange">Nginx</Tag>
                  <Tag color="orange">PM2</Tag>
                  <Tag color="orange">HTTPS</Tag>
                </div>
              </div>
              <div>
                <Text strong>自动化能力</Text>
                <div style={{ marginTop: 8 }}>
                  <Tag color="purple">Playwright</Tag>
                  <Tag color="purple">Browser Automation</Tag>
                  <Tag color="purple">OAuth</Tag>
                </div>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Contact */}
      <Title level={2} style={{ marginBottom: 24 }}>联系我们</Title>
      <Card>
        <Row gutter={24}>
          <Col span={8}>
            <Space direction="vertical" size="small">
              <Space><EnvironmentOutlined /> <Text>地址</Text></Space>
              <Text type="secondary">深圳市南山区科技园</Text>
            </Space>
          </Col>
          <Col span={8}>
            <Space direction="vertical" size="small">
              <Space><PhoneOutlined /> <Text>电话</Text></Space>
              <Text type="secondary">400-888-8888</Text>
            </Space>
          </Col>
          <Col span={8}>
            <Space direction="vertical" size="small">
              <Space><MailOutlined /> <Text>邮箱</Text></Space>
              <Text type="secondary">support@baizhiji.net</Text>
            </Space>
          </Col>
        </Row>
        <Divider />
        <Row gutter={24} align="middle">
          <Col span={12}>
            <Space direction="vertical" size="middle">
              <Text strong>扫码联系我们</Text>
              <QRCode value="https://www.baizhiji.net" size={120} />
            </Space>
          </Col>
          <Col span={12}>
            <Space direction="vertical" size="middle">
              <Text strong>关注微信公众号</Text>
              <QRCode value="https://www.baizhiji.net" size={120} />
              <Text type="secondary">获取最新动态</Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Footer */}
      <Card style={{ marginTop: 24, textAlign: 'center' }}>
        <Text type="secondary">
          © 2024 智枢AI SaaS 系统 版权所有 | 
          <a href="https://www.baizhiji.net" style={{ marginLeft: 8 }}>官方网站</a> | 
          <a href="https://www.baizhiji.net/privacy" style={{ marginLeft: 8 }}>隐私政策</a> | 
          <a href="https://www.baizhiji.net/terms" style={{ marginLeft: 8 }}>服务条款</a>
        </Text>
      </Card>
    </div>
  );
}
