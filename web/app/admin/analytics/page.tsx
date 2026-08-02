'use client';

import { Result, Button } from 'antd';
import { useRouter } from 'next/navigation';

export default function AdminAnalyticsPage() {
  const router = useRouter();
  return (
    <Result
      status="info"
      title="数据大盘已升级为「数据总览」"
      subTitle="原数据大盘功能已并入数据总览，查看更全面的核心指标。"
      extra={
        <Button type="primary" onClick={() => router.push('/admin/dashboard')}>
          前往数据总览
        </Button>
      }
    />
  );
}
