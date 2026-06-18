'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CustomerPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/customer/my');
  }, [router]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666',
      }}
    >
      正在跳转...
    </div>
  );
}
