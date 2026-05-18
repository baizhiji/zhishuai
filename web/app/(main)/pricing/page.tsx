'use client';

import Link from 'next/link';
import { Card, Row, Col, Typography, Button, Tag, List } from 'antd';
import {
  CheckCircleOutlined,
  RocketOutlined,
  CrownOutlined,
  DollarOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import styles from './page.module.css';

const { Title, Paragraph } = Typography;

const plans = [
  {
    name: '基础版',
    price: '999',
    period: '月',
    description: '适合个人或小微企业起步使用',
    icon: <RocketOutlined />,
    color: '#1890ff',
    features: [
      'AI 内容生成 1000 次/月',
      '矩阵账号 3 个',
      '平台发布 3 个',
      '基础数据报表',
      '邮件支持',
    ],
    notIncluded: [
      '智能招聘',
      '智能获客',
      '定制开发',
    ],
    popular: false,
  },
  {
    name: '专业版',
    price: '2999',
    period: '月',
    description: '适合中型企业规模化运营',
    icon: <CrownOutlined />,
    color: '#722ed1',
    features: [
      'AI 内容生成 5000 次/月',
      '矩阵账号 10 个',
      '平台发布 10 个',
      '智能招聘',
      '高级数据报表',
      'API 接口调用',
      '优先技术支持',
    ],
    notIncluded: [
      '智能获客',
      '定制开发',
    ],
    popular: true,
  },
  {
    name: '企业版',
    price: '面议',
    period: '',
    description: '适合大型企业私有化部署',
    icon: <DollarOutlined />,
    color: '#faad14',
    features: [
      '无限 AI 内容生成',
      '无限矩阵账号',
      '无限平台发布',
      '智能招聘 + 智能获客',
      '私有化部署',
      '定制开发服务',
      '专属客户经理',
      '7x24 小时支持',
    ],
    notIncluded: [],
    popular: false,
  },
];

const faqs = [
  {
    question: '套餐可以随时升级吗？',
    answer: '是的，您可以随时升级到更高级别的套餐，费用按剩余天数计算。',
  },
  {
    question: '超出套餐限制怎么办？',
    answer: '超出部分按量计费，您也可以升级套餐获取更多额度。',
  },
  {
    question: '支持退款吗？',
    answer: '购买后 7 天内如不满意可申请全额退款。',
  },
  {
    question: '可以定制开发吗？',
    answer: '企业版用户可享受定制开发服务，其他用户可单独购买定制服务。',
  },
];

export default function PricingPage() {
  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <Title level={1}>价格方案</Title>
        <Paragraph>选择适合您的方案，开启智能化运营之旅</Paragraph>
      </section>

      {/* Pricing Cards */}
      <section className={styles.pricing}>
        <Row gutter={[24, 24]} justify="center">
          {plans.map((plan) => (
            <Col xs={24} md={8} key={plan.name}>
              <Card
                className={`${styles.planCard} ${plan.popular ? styles.popular : ''}`}
                style={{ borderColor: plan.popular ? plan.color : undefined }}
              >
                {plan.popular && (
                  <Tag color={plan.color} className={styles.popularTag}>
                    最受欢迎
                  </Tag>
                )}
                <div
                  className={styles.planIcon}
                  style={{ backgroundColor: `${plan.color}15`, color: plan.color }}
                >
                  {plan.icon}
                </div>
                <Title level={3}>{plan.name}</Title>
                <div className={styles.price}>
                  {plan.price !== '面议' ? (
                    <>
                      <span className={styles.currency}>¥</span>
                      <span className={styles.amount}>{plan.price}</span>
                      <span className={styles.period}>/{plan.period}</span>
                    </>
                  ) : (
                    <span className={styles.amount}>{plan.price}</span>
                  )}
                </div>
                <Paragraph type="secondary" className={styles.description}>
                  {plan.description}
                </Paragraph>
                <List
                  size="small"
                  dataSource={plan.features}
                  renderItem={(item) => (
                    <List.Item className={styles.featureItem}>
                      <CheckCircleOutlined style={{ color: plan.color, marginRight: 8 }} />
                      {item}
                    </List.Item>
                  )}
                />
                {plan.notIncluded.length > 0 && (
                  <List
                    size="small"
                    className={styles.notIncluded}
                    dataSource={plan.notIncluded}
                    renderItem={(item) => (
                      <List.Item className={styles.featureItem}>
                        <span style={{ color: '#d9d9d9', marginRight: 8 }}>×</span>
                        <span style={{ color: '#bfbfbf' }}>{item}</span>
                      </List.Item>
                    )}
                  />
                )}
                <Link href="/register">
                  <Button
                    type={plan.popular ? 'primary' : 'default'}
                    block
                    size="large"
                    style={{ marginTop: 24 }}
                  >
                    立即购买 <ArrowRightOutlined />
                  </Button>
                </Link>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      {/* FAQ */}
      <section className={styles.faq}>
        <Title level={2} className={styles.faqTitle}>
          常见问题
        </Title>
        <Row gutter={[24, 24]}>
          {faqs.map((faq, index) => (
            <Col xs={24} md={12} key={index}>
              <Card className={styles.faqCard}>
                <Title level={4}>{faq.question}</Title>
                <Paragraph type="secondary">{faq.answer}</Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <Title level={2}>还有其他问题？</Title>
        <Paragraph>联系我们的客服团队，获取更多帮助</Paragraph>
        <Link href="/help#contact">
          <Button type="primary" size="large">
            联系我们
          </Button>
        </Link>
      </section>
    </div>
  );
}
