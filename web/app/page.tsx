<<<<<<< HEAD
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  
  useEffect(() => {
    // 默认跳转到客户工作台
    router.replace('/customer/dashboard')
  }, [router])
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      正在跳转到工作台...
    </div>
  )
=======
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // 默认跳转到客户工作台
    router.replace('/customer/dashboard');
  }, [router]);

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
      正在加载...
    </div>
  );
>>>>>>> 962968886be726cd434c792933b5515366d34518
}
