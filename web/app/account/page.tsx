<<<<<<< HEAD
'use client'

import { Card, Row, Col, Statistic, Typography, Table, Tag, Progress, Avatar } from 'antd'
=======
'use client';

import { Card, Row, Col, Statistic, Typography, Table, Tag, Progress, Avatar } from 'antd';
>>>>>>> 962968886be726cd434c792933b5515366d34518
import {
  UserOutlined,
  SafetyCertificateOutlined,
  TrophyOutlined,
  CrownOutlined,
<<<<<<< HEAD
  ClockCircleOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography
=======
  ClockCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
>>>>>>> 962968886be726cd434c792933b5515366d34518

export default function AccountPage() {
  // 模拟账户信息
  const accountInfo = {
    userId: 'USR001',
    phone: '138****8000',
    email: 'user@example.com',
    role: '终端客户',
    memberType: '年度会员',
    expireDate: '2025-12-31',
<<<<<<< HEAD
  }
=======
  };
>>>>>>> 962968886be726cd434c792933b5515366d34518

  // 功能使用统计
  const usageStats = [
    { icon: <UserOutlined />, name: '自媒体运营', value: '1250次', color: '#1890ff' },
    { icon: <CrownOutlined />, name: '招聘助手', value: '89次', color: '#722ed1' },
    { icon: <SafetyCertificateOutlined />, name: '智能获客', value: '320次', color: '#13c2c2' },
    { icon: <TrophyOutlined />, name: '推荐分享', value: '156次', color: '#fa8c16' },
<<<<<<< HEAD
  ]
=======
  ];
>>>>>>> 962968886be726cd434c792933b5515366d34518

  // 使用记录
  const usageRecords = [
    { id: 1, type: '内容生成', count: 5, time: '2024-04-30 14:30' },
    { id: 2, type: '简历筛选', count: 12, time: '2024-04-28 10:15' },
    { id: 3, type: '数字人视频', count: 3, time: '2024-04-25 16:45' },
    { id: 4, type: '智能获客', count: 8, time: '2024-04-20 09:00' },
    { id: 5, type: '推荐分享', count: 5, time: '2024-04-15 11:20' },
<<<<<<< HEAD
  ]
=======
  ];
>>>>>>> 962968886be726cd434c792933b5515366d34518

  const columns = [
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '次数', dataIndex: 'count', key: 'count' },
    { title: '时间', dataIndex: 'time', key: 'time' },
<<<<<<< HEAD
  ]

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">账号总览</Title>
=======
  ];

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">
        账号总览
      </Title>
>>>>>>> 962968886be726cd434c792933b5515366d34518

      {/* 账户基本信息 */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
<<<<<<< HEAD
            <Statistic 
              title="账户ID" 
              value={accountInfo.userId}
              prefix={<UserOutlined />}
            />
=======
            <Statistic title="账户ID" value={accountInfo.userId} prefix={<UserOutlined />} />
>>>>>>> 962968886be726cd434c792933b5515366d34518
          </Card>
        </Col>
        <Col span={6}>
          <Card>
<<<<<<< HEAD
            <Statistic 
              title="手机号码" 
              value={accountInfo.phone}
            />
=======
            <Statistic title="手机号码" value={accountInfo.phone} />
>>>>>>> 962968886be726cd434c792933b5515366d34518
          </Card>
        </Col>
        <Col span={6}>
          <Card>
<<<<<<< HEAD
            <Statistic 
              title="会员类型" 
=======
            <Statistic
              title="会员类型"
>>>>>>> 962968886be726cd434c792933b5515366d34518
              value={accountInfo.memberType}
              prefix={<CrownOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
<<<<<<< HEAD
            <Statistic 
              title="到期时间" 
=======
            <Statistic
              title="到期时间"
>>>>>>> 962968886be726cd434c792933b5515366d34518
              value={accountInfo.expireDate}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 功能使用统计 */}
      <Row gutter={16} className="mb-6">
        {usageStats.map((stat, index) => (
          <Col span={6} key={index}>
            <Card>
              <div className="flex items-center">
<<<<<<< HEAD
                <div 
                  style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '8px', 
=======
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
>>>>>>> 962968886be726cd434c792933b5515366d34518
                    backgroundColor: `${stat.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '16px',
                    color: stat.color,
<<<<<<< HEAD
                    fontSize: '24px'
=======
                    fontSize: '24px',
>>>>>>> 962968886be726cd434c792933b5515366d34518
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

      {/* 使用记录 */}
      <Card title="使用记录">
<<<<<<< HEAD
        <Table
          rowKey="id"
          columns={columns}
          dataSource={usageRecords}
          pagination={false}
        />
      </Card>
    </div>
  )
=======
        <Table rowKey="id" columns={columns} dataSource={usageRecords} pagination={false} />
      </Card>
    </div>
  );
>>>>>>> 962968886be726cd434c792933b5515366d34518
}
