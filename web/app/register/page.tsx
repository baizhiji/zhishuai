'use client';

import { Card, Button, Typography } from 'antd';
import { CustomerServiceOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Paragraph } = Typography;

export default function RegisterPage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderRadius: '16px',
          textAlign: 'center',
        }}
        bordered={false}
      >
        <CustomerServiceOutlined style={{ fontSize: 56, color: '#667eea', marginBottom: 24 }} />
        
        <Title level={3} style={{ marginBottom: 16 }}>开通账号</Title>
        
        <Paragraph style={{ fontSize: 16, color: '#666', lineHeight: 1.8, marginBottom: 24 }}>
          智枢AI采用邀请制，暂不支持自主注册。
          <br />
          如需开通账号，请联系您的管理员或区域代理。
        </Paragraph>

        <div style={{
          background: '#f6f8fa',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 24,
          textAlign: 'left',
        }}>
          <Paragraph style={{ margin: 0, color: '#555', fontSize: 14 }}>
            <strong>开通方式：</strong>
          </Paragraph>
          <Paragraph style={{ margin: '8px 0 0', color: '#666', fontSize: 14 }}>
            1. 联系管理员或区域代理为您创建账号
            <br />
            2. 获取手机号和初始密码
            <br />
            3. 使用手机号和密码登录系统
          </Paragraph>
        </div>

        <Button
          type="primary"
          size="large"
          block
          onClick={() => router.push('/login')}
          style={{ height: 48, borderRadius: 8, fontSize: 16 }}
        >
          返回登录
        </Button>
      </Card>
    </div>
  );
}
