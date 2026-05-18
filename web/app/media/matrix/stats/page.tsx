'use client';

import React from 'react';
import { Card, Typography, Space, Row, Col, Statistic, Button, Progress, Tag } from 'antd';
import { ArrowLeftOutlined, RiseOutlined, TeamOutlined, EyeOutlined, HeartOutlined } from '@ant-design/icons';
import Link from 'next/link';

const { Title, Text, Paragraph } = Typography;

export default function StatsPage() {
  // 模拟数据
  const summaryData = [
    { title: '总粉丝数', value: 256892, suffix: '+', prefix: '' },
    { title: '总曝光量', value: 1256890, suffix: '', prefix: '' },
    { title: '总互动数', value: 89456, suffix: '', prefix: '' },
    { title: '发布作品', value: 128, suffix: '个', prefix: '' },
  ];

  const platformData = [
    { platform: '抖音', fans: 125800, growth: '+2.3%', color: '#fe2c55' },
    { platform: '快手', fans: 68450, growth: '+1.8%', color: '#ff4906' },
    { platform: '小红书', fans: 45632, growth: '+3.2%', color: '#fe2c25' },
    { platform: '微博', fans: 17010, growth: '+0.5%', color: '#e6162d' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/media/matrix">
          <Button type="link" icon={<ArrowLeftOutlined />}>
            返回矩阵管理
          </Button>
        </Link>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size={0}>
          <Title level={4} style={{ margin: 0 }}>📊 数据统计</Title>
          <Text type="secondary">多平台数据汇总分析，了解账号运营状况</Text>
        </Space>
      </Card>

      {/* 概览数据 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {summaryData.map((item, index) => (
          <Col span={6} key={index}>
            <Card>
              <Statistic
                title={item.title}
                value={item.value}
                suffix={item.suffix}
                prefix={item.prefix && <RiseOutlined />}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 平台数据 */}
      <Card title="各平台数据">
        <Row gutter={[16, 16]}>
          {platformData.map((item, index) => (
            <Col span={12} key={index}>
              <Card size="small">
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <div>
                    <Text strong>{item.platform}</Text>
                    <div>
                      <TeamOutlined /> {item.fans.toLocaleString()} 粉丝
                    </div>
                  </div>
                  <Tag color={item.color}>{item.growth}</Tag>
                </Space>
                <Progress
                  percent={Math.min(100, (item.fans / 150000) * 100)}
                  strokeColor={item.color}
                  showInfo={false}
                  style={{ marginTop: 8 }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card title="数据趋势" style={{ marginTop: 24 }}>
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          <Text type="secondary">图表功能即将上线...</Text>
        </div>
      </Card>
    </div>
  );
}
