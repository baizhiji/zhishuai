'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CustomerPage() {
  const router = useRouter();

  useEffect(() => {
<<<<<<< HEAD
    router.replace('/customer/dashboard');
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '18px',
      color: '#666'
    }}>
=======
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
>>>>>>> 962968886be726cd434c792933b5515366d34518
      正在跳转...
    </div>
  );
}
