'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Spin } from 'antd';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // 等待认证状态确认后再跳转
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    const viewingRole =
      typeof window !== 'undefined'
        ? localStorage.getItem('viewing_role')
        : null;
    const effectiveRole = viewingRole || user.role;

    if (effectiveRole === 'admin') {
      router.replace('/admin/tenants');
    } else if (effectiveRole === 'agent') {
      router.replace('/agent/tenants');
    } else {
      router.replace('/customer/dashboard');
    }
  }, [loading, user, router]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '16px',
        color: '#666',
      }}
    >
      <Spin size="large" />
    </div>
  );
}
