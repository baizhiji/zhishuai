'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Table,
  Tag,
  Button,
  QRCode,
  Input,
  message,
  Space,
  Avatar,
  Spin,
  Empty,
} from 'antd';
import {
  ShareAltOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import request from '@/utils/request';

const { Title, Text } = Typography;

interface ReferralRecord {
  id: number;
  name: string;
  avatar: string;
  code: string;
  registerTime: string;
  activateTime?: string;
  status: 'pending' | 'active';
  level: number;
}

export default function MyReferralPage() {
  const [loading, setLoading] = useState(true);
  const [referralLink, setReferralLink] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [stats, setStats] = useState({ total: 0, success: 0, rate: 0, pending: 0 });
  const [records, setRecords] = useState<ReferralRecord[]>([]);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    setLoading(true);
    try {
      const statsRes = await request.get('/api/referral/stats');
      const statsData = statsRes?.data || statsRes;
      setStats({
        total: statsData?.totalReferrals ?? statsData?.total ?? 0,
        success: statsData?.successCount ?? statsData?.success ?? 0,
        rate: statsData?.conversionRate ?? statsData?.rate ?? 0,
        pending: statsData?.pendingCount ?? statsData?.pending ?? 0,
      });
      setReferralLink(statsData?.referralLink || statsData?.link || '');
      setReferralCode(statsData?.referralCode || statsData?.code || '');
    } catch {
      setStats({ total: 0, success: 0, rate: 0, pending: 0 });
    }

    try {
      const usersRes = await request.get('/api/referral/users');
      const usersData = usersRes?.data || usersRes;
      setRecords(
        (usersData?.users || usersData?.list || Array.isArray(usersData) ? usersData : []).map((u: any) => ({
          id: u.id,
          name: u.name || u.userName || '-',
          avatar: u.avatar || (u.name ? u.name.substring(0, 2) : 'U'),
          code: u.code || u.referralCode || '-',
          registerTime: u.registerTime || u.createdAt || '-',
          activateTime: u.activateTime || u.activatedAt,
          status: u.status === 'active' || u.status === 'activated' ? 'active' : 'pending',
          level: u.level || 1,
        }))
      );
    } catch {
      setRecords([]);
    }
    setLoading(false);
  };

  const columns = [
    {
      title: '用户',
      key: 'user',
      render: (_: any, record: ReferralRecord) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1890ff' }}>{record.avatar}</Avatar>
          <span>{record.name}</span>
        </Space>
      ),
    },
    { title: '推荐码', dataIndex: 'code', key: 'code' },
    { title: '注册时间', dataIndex: 'registerTime', key: 'registerTime' },
    {
      title: '激活时间',
      dataIndex: 'activateTime',
      key: 'activateTime',
      render: (text: string) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'warning'}>
          {status === 'active' ? '已激活' : '待激活'}
        </Tag>
      ),
    },
  ];

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    message.success('推荐链接已复制到剪贴板');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    message.success('推荐码已复制到剪贴板');
  };

  if (loading) {
    return (
      <div className="p-6" style={{ textAlign: 'center', paddingTop: 100 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">
          我的转介绍
        </Title>
        <Text type="secondary">分享智枢 AI，邀请好友加入</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={6}>
          <Card hoverable>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">{stats.total}</div>
              <div className="text-gray-600 text-sm">总推荐数</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500 mb-2">{stats.success}</div>
              <div className="text-gray-600 text-sm">成功转化</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500 mb-2">{stats.rate}%</div>
              <div className="text-gray-600 text-sm">转化率</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500 mb-2">{stats.pending}</div>
              <div className="text-gray-600 text-sm">待激活</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={24}>
        {/* 左侧：推荐码和二维码 */}
        <Col xs={24} lg={8}>
          <Card title="我的推荐码" bordered={false}>
            {referralLink ? (
              <>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <QRCode value={referralLink} size={160} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary">推荐码：</Text>
                  <Input
                    value={referralCode}
                    readOnly
                    addonAfter={
                      <Button type="text" size="small" icon={<CopyOutlined />} onClick={copyCode}>
                        复制
                      </Button>
                    }
                    style={{ fontWeight: 'bold', letterSpacing: 2 }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary">推广链接：</Text>
                  <Input
                    value={referralLink}
                    readOnly
                    addonAfter={
                      <Button type="text" size="small" icon={<CopyOutlined />} onClick={copyLink}>
                        复制
                      </Button>
                    }
                  />
                </div>
                <Button block type="primary" icon={<DownloadOutlined />}>
                  下载二维码
                </Button>
              </>
            ) : (
              <Empty description="暂无推荐码" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>

        {/* 右侧：推荐记录 */}
        <Col xs={24} lg={16}>
          <Card
            title="推荐记录"
            extra={
              <Space>
                <Tag color="success">已激活: {stats.success}</Tag>
                <Tag color="warning">待激活: {stats.pending}</Tag>
              </Space>
            }
          >
            {records.length > 0 ? (
              <Table
                dataSource={records}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                size="small"
              />
            ) : (
              <Empty description="暂无推荐记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
