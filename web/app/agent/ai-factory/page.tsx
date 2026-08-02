'use client';

import { Card, Typography, Alert, Space, Button, Row, Col, Tag } from 'antd';
import {
  RobotOutlined,
  HeartOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  FontSizeOutlined,
  CustomerServiceOutlined,
  ShopOutlined,
  ThunderboltOutlined,
  PlaySquareOutlined,
  ExperimentOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Text, Paragraph } = Typography;

interface Category {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  customerPath: string;
}

const CATEGORIES: Category[] = [
  {
    key: 'text',
    label: 'AI 文案',
    description: '朋友圈、获客海报、短视频脚本一键生成',
    icon: <FontSizeOutlined />,
    color: '#1677ff',
    customerPath: '/customer/ai-factory?tab=text',
  },
  {
    key: 'image',
    label: 'AI 图片',
    description: '营销海报、产品图、头像、AI 换装、海报模板',
    icon: <PictureOutlined />,
    color: '#722ed1',
    customerPath: '/customer/ai-factory?tab=image',
  },
  {
    key: 'video',
    label: 'AI 短视频',
    description: '数字人、混合短视频、萌宠卡通、电商口播',
    icon: <VideoCameraOutlined />,
    color: '#13c2c2',
    customerPath: '/customer/ai-factory?tab=video',
  },
  {
    key: 'voice',
    label: 'AI 配音',
    description: '多音色 AI 配音，支持克隆与情感调节',
    icon: <CustomerServiceOutlined />,
    color: '#fa8c16',
    customerPath: '/customer/ai-factory?tab=voice',
  },
  {
    key: 'digital-human',
    label: 'AI 数字人',
    description: '数字人短视频、定制形象、声音克隆',
    icon: <RobotOutlined />,
    color: '#eb2f96',
    customerPath: '/customer/ai-factory?tab=digital-human',
  },
  {
    key: 'viral',
    label: '爆款选题',
    description: '热点分析、爆款拆解、智能选题',
    icon: <FireOutlined />,
    color: '#f5222d',
    customerPath: '/customer/ai-factory?tab=viral',
  },
];

export default function AgentAIFactoryPage() {
  const router = useRouter();
  return (
    <div style={{ padding: 0 }}>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <RobotOutlined style={{ marginRight: 8, color: '#1677ff' }} />
          AI 创作工厂
        </Title>
        <Text type="secondary">为客户提供一站式 AI 内容生产能力</Text>
      </div>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="代理工作台"
        description="作为代理商，您可以在此查看 AI 创作工厂的全部能力。实际创作操作建议引导客户在自己的工作台完成，以便归属计费与素材沉淀。"
      />

      <Row gutter={[16, 16]}>
        {CATEGORIES.map((cat) => (
          <Col xs={24} sm={12} md={8} lg={8} key={cat.key}>
            <Card
              hoverable
              onClick={() => router.push(cat.customerPath)}
              style={{ borderTop: `3px solid ${cat.color}`, height: '100%' }}
            >
              <Space size={12} align="start">
                <div
                  style={{
                    fontSize: 28,
                    color: cat.color,
                    background: `${cat.color}1A`,
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {cat.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                    {cat.label}
                  </div>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {cat.description}
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    <Tag color={cat.color} style={{ marginRight: 0 }}>
                      客户工作台 <ArrowRightOutlined />
                    </Tag>
                  </div>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Title level={5} style={{ margin: 0 }}>即将上线</Title>
          <Space wrap>
            <Tag color="purple"><ExperimentOutlined /> AI 漫剧</Tag>
            <Tag color="magenta"><PlaySquareOutlined /> AI 短剧</Tag>
            <Tag color="cyan"><ShopOutlined /> 电商素材包</Tag>
            <Tag color="gold"><ThunderboltOutlined /> 批量混剪</Tag>
            <Tag color="green"><HeartOutlined /> 情感语音</Tag>
          </Space>
          <Paragraph type="secondary" style={{ margin: 0 }}>
            上述能力将在客户工作台中陆续开放，代理商可同步在客户工作台预览。
          </Paragraph>
        </Space>
      </Card>
    </div>
  );
}
