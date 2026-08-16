'use client';

import { Typography, Row, Col, Card } from 'antd';
import {
  RocketOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  TeamOutlined,
  UserAddOutlined,
  ShareAltOutlined,
  RobotOutlined,
  PieChartOutlined,
  ApiOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const features = [
  {
    id: 'digital-human',
    icon: <VideoCameraOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
    title: '数字人平台',
    desc: 'AI数字人克隆与视频生成，支持形象定制、语音合成、智能互动，打造专属数字分身。',
  },
  {
    id: 'ai-content',
    icon: <RobotOutlined style={{ fontSize: 48, color: '#722ed1' }} />,
    title: 'AI内容生成',
    desc: '基于大语言模型的内容创作助手，支持文案生成、图片设计、视频脚本，让创意无限延伸。',
  },
  {
    id: 'recruitment',
    icon: <TeamOutlined style={{ fontSize: 48, color: '#52c41a' }} />,
    title: '智能招聘',
    desc: 'AI驱动的招聘助手，自动化简历筛选、智能沟通、面试管理，让招聘更高效。',
  },
  {
    id: 'acquisition',
    icon: <UserAddOutlined style={{ fontSize: 48, color: '#fa8c16' }} />,
    title: '智能获客',
    desc: '精准潜客发现、自动化引流任务、数据驱动的获客看板，让增长不再困难。',
  },
  {
    id: 'materials',
    icon: <PictureOutlined style={{ fontSize: 48, color: '#eb2f96' }} />,
    title: '素材库',
    desc: '集中管理营销素材，支持图片、视频、文案等多媒体内容的存储、分类和检索。',
  },
  {
    id: 'share',
    icon: <ShareAltOutlined style={{ fontSize: 48, color: '#13c2c2' }} />,
    title: '推荐分享',
    desc: '生成专属分享码和追踪链接，实时追踪推荐效果，打造裂变增长引擎。',
  },
  {
    id: 'analytics',
    icon: <PieChartOutlined style={{ fontSize: 48, color: '#2f54eb' }} />,
    title: '数据分析',
    desc: '多维度数据看板，实时监控运营效果，AI驱动的洞察报告帮助优化策略。',
  },
  {
    id: 'api',
    icon: <ApiOutlined style={{ fontSize: 48, color: '#f5222d' }} />,
    title: '开放API',
    desc: '丰富的API接口，支持与第三方系统集成，灵活的权限控制，安全可靠。',
  },
];

export default function FeaturesPage() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <Title level={1} style={{ marginBottom: 16 }}>
          <RocketOutlined style={{ marginRight: 12, color: '#1890ff' }} />
          产品功能
        </Title>
        <Paragraph style={{ fontSize: 18, color: '#666', maxWidth: 700, margin: '0 auto' }}>
          智枢AI为企业提供全方位的智能化运营解决方案，从内容创作到客户获取，从招聘管理到数据分析，一站式助力企业数字化转型。
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        {features.map((feature) => (
          <Col key={feature.id} xs={24} sm={12} lg={6}>
            <Card
              id={feature.id}
              hoverable
              style={{ height: '100%', borderRadius: 12 }}
              styles={{ body: { padding: 32 } }}
            >
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                {feature.icon}
              </div>
              <Title level={4} style={{ textAlign: 'center', marginBottom: 12 }}>
                {feature.title}
              </Title>
              <Paragraph style={{ color: '#666', textAlign: 'center', marginBottom: 0 }}>
                {feature.desc}
              </Paragraph>
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ textAlign: 'center', marginTop: 80, padding: '48px 24px', background: '#fafafa', borderRadius: 16 }}>
        <ThunderboltOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
        <Title level={3}>准备好开始了吗？</Title>
        <Paragraph style={{ fontSize: 16, color: '#666' }}>
          立即注册体验，开启您的智能化运营之旅
        </Paragraph>
      </div>
    </div>
  );
}
