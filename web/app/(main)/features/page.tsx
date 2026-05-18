'use client';

import Link from 'next/link';
import { Card, Row, Col, Typography, Button, Tag, Space } from 'antd';
import {
  RocketOutlined,
  RobotOutlined,
  VideoOutlined,
  TeamOutlined,
  ShoppingOutlined,
  MessageOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import styles from './page.module.css';

const { Title, Paragraph } = Typography;

const features = [
  {
    id: 'ai-content',
    icon: <RobotOutlined />,
    title: 'AI 内容工厂',
    description: '基于大语言模型，批量生成高质量文案、图片、视频内容',
    color: '#1890ff',
    tags: ['文案生成', '图片生成', '视频生成', '数字人'],
    details: [
      '支持 GPT-4、Claude、通义千问等多种大模型',
      '批量生成内容，一次性生成多条',
      '多平台内容适配，一键分发',
      'AI 数字人视频，真实感强',
    ],
  },
  {
    id: 'matrix',
    icon: <VideoOutlined />,
    title: '矩阵管理',
    description: '一键授权多平台账号，统一管理多账号发布',
    color: '#52c41a',
    tags: ['抖音', '快手', '小红书', '微信'],
    details: [
      '扫码授权，无需账号密码',
      '多平台多账号统一管理',
      '批量发布，一键同步',
      '数据汇总，效果追踪',
    ],
  },
  {
    id: 'recruitment',
    icon: <TeamOutlined />,
    title: '智能招聘',
    description: 'AI 生成 JD、自动发布多平台、智能筛选简历',
    color: '#faad14',
    tags: ['BOSS直聘', '前程无忧', '智联招聘'],
    details: [
      'AI 智能生成职位描述',
      '一键发布到多个招聘平台',
      'AI 智能筛选简历，匹配度高',
      '自动沟通预约面试，省时省力',
    ],
  },
  {
    id: 'acquisition',
    icon: <ShoppingOutlined />,
    title: '智能获客',
    description: 'AI 分析潜客、自动引流私信、精准触达目标用户',
    color: '#f5222d',
    tags: ['潜客发现', '自动引流', '私信触达'],
    details: [
      '多维度潜客画像分析',
      '自动搜索目标用户',
      'AI 生成引流话术',
      '批量私信，自动跟进',
    ],
  },
  {
    id: 'chat',
    icon: <MessageOutlined />,
    title: 'AI 对话引擎',
    description: '多模型切换、流式响应、智能客服',
    color: '#722ed1',
    tags: ['智能客服', '多模型', '流式响应'],
    details: [
      '支持多种 AI 模型自由切换',
      '流式输出，响应速度快',
      '7x24 小时在线服务',
      '支持私有知识库',
    ],
  },
  {
    id: 'data',
    icon: <RocketOutlined />,
    title: '数据报表',
    description: '全平台数据汇总、趋势分析、效果追踪',
    color: '#13c2c2',
    tags: ['数据看板', '趋势分析', '报告导出'],
    details: [
      '全平台数据统一汇总',
      '多维度数据分析',
      '趋势图表，直观展示',
      '一键导出 Excel 报告',
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <Title level={1}>核心功能介绍</Title>
        <Paragraph>
          智枢 AI SaaS 系统集成企业智能化运营所需的全部功能，一站式满足您的需求
        </Paragraph>
      </section>

      {/* Features Grid */}
      <section className={styles.features}>
        {features.map((feature, index) => (
          <Card
            key={feature.id}
            id={feature.id}
            className={styles.featureCard}
            style={{ marginBottom: 48 }}
          >
            <Row gutter={[48, 24]} align="middle">
              <Col xs={24} md={index % 2 === 0 ? 12 : { span: 12, order: 1 }}}>
                <div
                  className={styles.featureIcon}
                  style={{ backgroundColor: `${feature.color}15`, color: feature.color }}
                >
                  {feature.icon}
                </div>
                <Title level={2}>{feature.title}</Title>
                <Paragraph className={styles.description}>{feature.description}</Paragraph>
                <Space size="small" wrap>
                  {feature.tags.map((tag) => (
                    <Tag key={tag} color={feature.color}>
                      {tag}
                    </Tag>
                  ))}
                </Space>
                <ul className={styles.details}>
                  {feature.details.map((detail, i) => (
                    <li key={i}>
                      <CheckCircleOutlined style={{ color: feature.color, marginRight: 8 }} />
                      {detail}
                    </li>
                  ))}
                </ul>
              </Col>
              <Col xs={24} md={12}>
                <div className={styles.featureImage}>
                  <div
                    className={styles.imagePlaceholder}
                    style={{ backgroundColor: `${feature.color}10` }}
                  >
                    <span style={{ color: feature.color, fontSize: 64 }}>
                      {feature.icon}
                    </span>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        ))}
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <Title level={2}>准备好体验了吗？</Title>
        <Paragraph>立即注册，开启智能化运营之旅</Paragraph>
        <Link href="/register">
          <Button type="primary" size="large">
            立即体验 <ArrowRightOutlined />
          </Button>
        </Link>
      </section>
    </div>
  );
}
