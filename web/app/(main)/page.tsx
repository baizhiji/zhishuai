'use client';

import Link from 'next/link';
import { Button, Card, Row, Col, Typography, Statistic } from 'antd';
import {
  RocketOutlined,
  RobotOutlined,
  PlayCircleOutlined,
  TeamOutlined,
  ShoppingOutlined,
  MessageOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SafetyOutlined,
  CloudOutlined,
  ApiOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import styles from './page.module.css';

const { Title, Text, Paragraph } = Typography;

const features = [
  {
    icon: <RobotOutlined />,
    title: 'AI 内容工厂',
    description: '基于大语言模型，批量生成高质量文案、图片、视频内容，支持多平台适配',
    color: '#1890ff',
  },
  {
    icon: <PlayCircleOutlined />,
    title: '矩阵管理',
    description: '一键授权抖音、快手、小红书等多平台账号，统一管理多账号发布',
    color: '#52c41a',
  },
  {
    icon: <TeamOutlined />,
    title: '智能招聘',
    description: 'AI 生成 JD、自动发布多平台、智能筛选简历、自动沟通预约面试',
    color: '#faad14',
  },
  {
    icon: <ShoppingOutlined />,
    title: '智能获客',
    description: 'AI 分析潜客、自动引流私信、精准触达目标用户、提升转化率',
    color: '#f5222d',
  },
  {
    icon: <MessageOutlined />,
    title: 'AI 对话引擎',
    description: '多模型切换、流式响应、智能客服、7x24 小时在线服务',
    color: '#722ed1',
  },
  {
    icon: <FileTextOutlined />,
    title: '数据报表',
    description: '全平台数据汇总、趋势分析、效果追踪、导出报告',
    color: '#13c2c2',
  },
];

const stats = [
  { title: '服务企业', value: '10,000+', suffix: '家' },
  { title: '内容发布量', value: '1,000,000+', suffix: '条' },
  { title: 'AI 对话次数', value: '5,000,000+', suffix: '次' },
  { title: '用户满意度', value: '99.9', suffix: '%' },
];

const steps = [
  {
    number: '01',
    title: '注册账号',
    description: '简单几步完成账号注册，选择适合您的套餐',
  },
  {
    number: '02',
    title: '授权账号',
    description: '扫码授权抖音、快手、小红书等平台账号',
  },
  {
    number: '03',
    title: 'AI 生成',
    description: '使用 AI 批量生成高质量内容，一键发布',
  },
  {
    number: '04',
    title: '数据追踪',
    description: '实时查看发布效果，持续优化运营策略',
  },
];

export default function HomePage() {
  return (
    <div className={styles.home}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <Title level={1} className={styles.heroTitle}>
            智枢 AI SaaS 系统
            <br />
            <span className={styles.highlight}>企业智能化运营一站式解决方案</span>
          </Title>
          <Paragraph className={styles.heroDesc}>
            集成 AI 内容生成、矩阵账号管理、智能招聘、智能获客等核心功能，
            <br />
            帮助企业实现智能化运营，降低人力成本，提升运营效率。
          </Paragraph>
          <Space size="large" className={styles.heroButtons}>
            <Link href="/register">
              <Button type="primary" size="large" icon={<RocketOutlined />}>
                立即体验
              </Button>
            </Link>
            <Link href="/features">
              <Button size="large" icon={<PlayCircleOutlined />}>
                了解更多
              </Button>
            </Link>
          </Space>
        </div>
        <div className={styles.heroStats}>
          <Row gutter={16}>
            {stats.map((stat, index) => (
              <Col span={6} key={index}>
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  suffix={stat.suffix}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.sectionHeader}>
          <Title level={2}>核心功能</Title>
          <Text type="secondary">一站式满足企业智能化运营需求</Text>
        </div>
        <Row gutter={[24, 24]}>
          {features.map((feature, index) => (
            <Col xs={24} sm={12} md={8} key={index}>
              <Card hoverable className={styles.featureCard}>
                <div
                  className={styles.featureIcon}
                  style={{ backgroundColor: `${feature.color}15`, color: feature.color }}
                >
                  {feature.icon}
                </div>
                <Title level={4}>{feature.title}</Title>
                <Paragraph type="secondary">{feature.description}</Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      {/* How It Works Section */}
      <section className={styles.howItWorks}>
        <div className={styles.sectionHeader}>
          <Title level={2}>快速上手</Title>
          <Text type="secondary">四步开启智能化运营之旅</Text>
        </div>
        <Row gutter={[48, 24]}>
          {steps.map((step, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <div className={styles.stepCard}>
                <div className={styles.stepNumber}>{step.number}</div>
                <Title level={4}>{step.title}</Title>
                <Paragraph type="secondary">{step.description}</Paragraph>
              </div>
            </Col>
          ))}
        </Row>
      </section>

      {/* Tech Stack Section */}
      <section className={styles.techStack}>
        <div className={styles.sectionHeader}>
          <Title level={2}>技术架构</Title>
          <Text type="secondary">采用业界领先技术，保障系统稳定高效</Text>
        </div>
        <Row gutter={[24, 24]} justify="center">
          <Col xs={12} sm={8} md={6}>
            <Card className={styles.techCard}>
              <CloudOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              <Text>云原生架构</Text>
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card className={styles.techCard}>
              <ApiOutlined style={{ fontSize: 48, color: '#52c41a' }} />
              <Text>微服务 API</Text>
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card className={styles.techCard}>
              <SafetyOutlined style={{ fontSize: 48, color: '#faad14' }} />
              <Text>安全合规</Text>
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card className={styles.techCard}>
              <BarChartOutlined style={{ fontSize: 48, color: '#722ed1' }} />
              <Text>数据分析</Text>
            </Card>
          </Col>
        </Row>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <Title level={2}>准备好开始了吗？</Title>
        <Paragraph>
          加入我们，开启智能化运营新时代，让 AI 为您赋能
        </Paragraph>
        <Space size="large">
          <Link href="/register">
            <Button type="primary" size="large">
              立即注册
              <ArrowRightOutlined />
            </Button>
          </Link>
          <Link href="/contact">
            <Button size="large">联系我们</Button>
          </Link>
        </Space>
      </section>
    </div>
  );
}
