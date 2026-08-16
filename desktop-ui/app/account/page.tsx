'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Table, Skeleton } from 'antd';
import {
  UserOutlined,
  SafetyCertificateOutlined,
  TrophyOutlined,
  CrownOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import request from '@/utils/request';

const { Title, Text } = Typography;

interface AccountInfo {
  userId: string;
  phone: string;
  email: string;
  role: string;
  memberType: string;
  expireDate: string;
}

interface UsageStat {
  icon: React.ReactNode;
  name: string;
  value: string;
  color: string;
}

interface UsageRecord {
  id: number;
  type: string;
  count: number;
  time: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  aiFactory: <UserOutlined />,
  recruitment: <CrownOutlined />,
  acquisition: <SafetyCertificateOutlined />,
  share: <TrophyOutlined />,
};

export default function AccountPage() {
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStat[]>([]);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [profileRes, statsRes] = await Promise.all([
          request.get('/api/account/profile'),
          request.get('/api/account/usage'),
        ]);
        const profile: any = profileRes.data || profileRes;
        if (profile) {
          setAccountInfo({
            userId: profile.id || profile.userId || '-',
            phone: profile.phone || '-',
            email: profile.email || '-',
            role: profile.role || '-',
            memberType: profile.memberType || profile.subscriptionPlan || '-',
            expireDate: profile.expireDate || profile.subscriptionExpiry || '-',
          });
        }
        const statsData: any = statsRes.data || statsRes;
        if (statsData?.stats) {
          setUsageStats(
            statsData.stats.map((s: any) => ({
              icon: ICON_MAP[s.key] || <UserOutlined />,
              name: s.name || s.key,
              value: `${s.value || s.count || 0}次`,
              color: s.color || '#1890ff',
            }))
          );
        }
        if (statsData?.records) {
          setUsageRecords(statsData.records);
        }
      } catch {
        // 数据获取失败时显示空状态
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  const columns = [
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '次数', dataIndex: 'count', key: 'count' },
    { title: '时间', dataIndex: 'time', key: 'time' },
  ];

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">
        账号总览
      </Title>

      {accountInfo && (
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
      )}

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

      <Card title="使用记录">
        <Table rowKey="id" columns={columns} dataSource={usageRecords} pagination={false} />
      </Card>
    </div>
  );
}
