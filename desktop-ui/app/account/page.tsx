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
  material: <SafetyCertificateOutlined />,
  recruitment: <CrownOutlined />,
  acquisition: <SafetyCertificateOutlined />,
  share: <TrophyOutlined />,
  digitalHuman: <UserOutlined />,
  voiceClone: <UserOutlined />,
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
          request.get('/api/account'),
          request.get('/api/account/usage-stats'),
        ]);
        const profile: any = profileRes.data || profileRes;
        if (profile) {
          setAccountInfo({
            userId: profile.id || profile.userId || '-',
            phone: profile.phone || '-',
            email: profile.email || profile.name || '-',
            role: profile.role || '-',
            memberType: profile.package || profile.memberType || '-',
            expireDate: profile.expireAt
              ? String(profile.expireAt).slice(0, 10)
              : '-',
          });
        }
        const statsData: any = statsRes.data || statsRes;
        if (statsData) {
          const dims: { key: string; name: string; value: number }[] = [
            { key: 'material', name: '素材库', value: statsData.materialCount },
            { key: 'recruitment', name: '招聘职位', value: statsData.recruitmentCount },
            { key: 'acquisition', name: '获客任务', value: statsData.acquisitionTaskCount },
            { key: 'share', name: '分享码', value: statsData.shareCodeCount },
            { key: 'digitalHuman', name: '数字人', value: statsData.digitalHumanCount },
            { key: 'voiceClone', name: '声音克隆', value: statsData.voiceCloneCount },
          ];
          setUsageStats(
            dims
              .filter(d => d.value > 0)
              .map(d => ({
                icon: ICON_MAP[d.key] || <UserOutlined />,
                name: d.name,
                value: `${d.value}次`,
                color: '#6d28d9',
              }))
          );
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
