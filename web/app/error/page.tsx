'use client';

import React from 'react';
import { Result, Button, Card } from 'antd';
import { useRouter } from 'next/navigation';

export default function ErrorPage(props: any) {
  const { error, reset } = props;
  const router = useRouter();

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f0f2f5',
      }}
    >
      <Card>
        <Result
          status="error"
          title="页面加载失败"
          subTitle={error.message || '发生了未知错误，请稍后重试'}
          extra={[
            <Button key="retry" type="primary" onClick={reset}>
              重试
            </Button>,
            <Button key="home" onClick={() => router.push('/')}>
              返回首页
            </Button>,
          ]}
        />
      </Card>
    </div>
  );
}
