'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AgentPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/agent/dashboard');
  }, [router]);

  return (
<<<<<<< HEAD
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '18px',
      color: '#666'
    }}>
=======
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
