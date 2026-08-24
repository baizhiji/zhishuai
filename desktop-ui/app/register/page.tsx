'use client';

import { Button, Card, Result } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
        padding: '20px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderRadius: '16px',
        }}
        bordered={false}
      >
        <Result
          icon={<LockOutlined style={{ color: '#7c3aed' }} />}
          title="暂不支持自主注册"
          subTitle="智枢AI账号由管理员统一开通管理。如需使用本服务，请联系您的服务代理商或平台管理员为您开通账号。"
          extra={
            <Link href="/login">
              <Button type="primary" size="large">
                返回登录
              </Button>
            </Link>
          }
        />
      </Card>
    </div>
  );
}
