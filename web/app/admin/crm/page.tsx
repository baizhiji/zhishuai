'use client';

import { Result, Button } from 'antd';
import { useRouter } from 'next/navigation';

export default function AdminCrmPage() {
  const router = useRouter();
  return (
    <Result
      status="info"
      title="客户管理已并入主菜单"
      subTitle="原 CRM 客户管理功能（开通、设置、冻结、重置密码等）已整合到统一的客户管理页面。"
      extra={
        <Button type="primary" onClick={() => router.push('/admin/tenants')}>
          前往客户管理
        </Button>
      }
    />
  );
}
