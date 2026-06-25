'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Table, Tag, Progress, Avatar, Spin, Empty } from 'antd';
import {
  UserOutlined,
  SafetyCertificateOutlined,
  TrophyOutlined,
  CrownOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import request from '@/utils/request';

const { Title, Text } = Typography;

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [usageStats, setUsageStats] = useState<any[]>([]);
  const [usageRecords, setUsageRecords] = useState<any[]>([]);

  useEffect(() => {
    fetchAccountData();
  }, []);

  const fetchAccountData = async () => {
    setLoading(true);
    try {
      const res = await request.get('/api/account');
      const data = res?.data || res;
      setAccountInfo({
        userId: data?.id || data?.userId || '-',
        phone: data?.phone || '-',
        email: data?.email || '-',
        role: data?.role || '-',
        memberType: data?.memberType || data?.plan || '-',
        expireDate: data?.expireDate || data?.subscriptionExpiry || '-',
      });
      setUsageStats(
        (data?.stats || []).map((s: any) => ({
          icon: s.iconType === 'media' ? <SafetyCertificateOutlined /> : s.iconType === 'recruit' ? <CrownOutlined /> : s.iconType === 'acquisition' ? <SafetyCertificateOutlined /> : <TrophyOutlined />,
          name: s.name || s.feature || '-',
          value: `${s.used ?? s.count ?? 0}次`,
          color: s.color || '#1890ff',
        }))
      );
      setUsageRecords(
        (data?.usageRecords || []).map((r: any, i: number) => ({
          id: r.id || i + 1,
          type: r.type || r.feature || '-',
          count: r.count || r.used || 0,
          time: r.time || r.createdAt || '-',
        }))
      );
    } catch (error) {
      console.error('Failed to fetch account data:', error);
      setAccountInfo(null);
      setUsageStats([]);
      setUsageRecords([]);
    }
    setLoading(false);
  };

  const columns = [
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '次数', dataIndex: 'count', key: 'count' },
    { title: '时间', dataIndex: 'time', key: 'time' },
  ];

  if (loading) {
    return (
      <div className="p-6" style={{ textAlign: 'center', paddingTop: 100 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!accountInfo) {
    return (
      <div className="p-6">
        <Empty description="暂无账号信息" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">
        账号总览
      </Title>

      {/* 账户基本信息 */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic title="账户ID" value={accountInfo.userId} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="手机号码" value={accountInfo.phone} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="会员类型"
              value={accountInfo.memberType}
              prefix={<CrownOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="到期时间"
              value={accountInfo.expireDate}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 功能使用统计 */}
      {usageStats.length > 0 && (
        <Row gutter={16} className="mb-6">
          {usageStats.map((stat, index) => (
            <Col span={6} key={index}>
              <Card>
                <div className="flex items-center">
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '8px',
                      backgroundColor: `${stat.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '16px',
                      color: stat.color,
                      fontSize: '24px',
                    }}
                  >
                    {stat.icon}
                  </div>
                  <div>
                    <Text type="secondary">{stat.name}</Text>
                    <div>
                      <Text strong>{stat.value}</Text>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* 使用记录 */}
      <Card title="使用记录">
        {usageRecords.length > 0 ? (
          <Table rowKey="id" columns={columns} dataSource={usageRecords} pagination={false} />
        ) : (
          <Empty description="暂无使用记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>
    </div>
  );
}
