'use client';

import { Result, Button } from 'antd';
import { useRouter } from 'next/navigation';

export default function AdminConfigPage() {
  const router = useRouter();
  return (
    <Result
      status="info"
      title="功能开关管理已下线"
      subTitle="新的流程：代理商端默认自动开通，客户具体功能可在「客户管理」详情中按需开启。"
      extra={
        <Button type="primary" onClick={() => router.push('/admin/tenants')}>
          前往客户管理
        </Button>
      }
    />
  );
}
