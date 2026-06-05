'use client';

import React from 'react';
import { Result, Button, Card } from 'antd';
import { useRouter } from 'next/navigation';

export default function NotFoundPage() {
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
          status="404"
          title="404"
          subTitle="抱歉，您访问的页面不存在"
          extra={
            <div>
              <p style={{ marginBottom: 16 }}>可能的原因：</p>
              <ul style={{ textAlign: 'left', marginBottom: 24 }}>
                <li>页面已被删除或移动</li>
                <li>URL 地址输入错误</li>
                <li>链接已过期</li>
              </ul>
              <Button type="primary" onClick={() => router.push('/')}>
                返回首页
              </Button>
            </div>
          }
        />
      </Card>
    </div>
  );
}
