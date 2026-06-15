<<<<<<< HEAD
import React from 'react'
import { Spin } from 'antd'

interface LoadingProps {
  size?: 'small' | 'default' | 'large'
  tip?: string
  spinning?: boolean
=======
import React from 'react';
import { Spin } from 'antd';

interface LoadingProps {
  size?: 'small' | 'default' | 'large';
  tip?: string;
  spinning?: boolean;
>>>>>>> 962968886be726cd434c792933b5515366d34518
}

export default function Loading({ size = 'default', tip, spinning = true }: LoadingProps) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spin size={size} tip={tip} spinning={spinning} />
    </div>
<<<<<<< HEAD
  )
=======
  );
>>>>>>> 962968886be726cd434c792933b5515366d34518
}

export function PageLoading({ tip = '加载中...' }: { tip?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <Spin size="large" tip={tip} />
    </div>
<<<<<<< HEAD
  )
=======
  );
>>>>>>> 962968886be726cd434c792933b5515366d34518
}

export function InlineLoading({ tip }: { tip?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <Spin tip={tip} />
    </div>
<<<<<<< HEAD
  )
=======
  );
>>>>>>> 962968886be726cd434c792933b5515366d34518
}
