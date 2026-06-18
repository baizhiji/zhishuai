'use client';

import React from 'react';
import { Result, Button, Spin, Empty, Skeleton } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

export interface PageStateWrapperProps {
  loading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyText?: string;
  children: React.ReactNode;
  onRetry?: () => void;
  skeletonType?: 'card' | 'table' | 'stat' | 'form' | 'page';
}

/**
 * 统一页面状态包装器
 * 处理 loading / error / empty / 正常渲染 四种状态
 */
export default function PageStateWrapper({
  loading = false,
  error = null,
  isEmpty = false,
  emptyText = '暂无数据',
  children,
  onRetry,
  skeletonType = 'page',
}: PageStateWrapperProps) {
  // 加载中 - 骨架屏
  if (loading) {
    return <SkeletonLoader type={skeletonType} />;
  }

  // 错误
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Result
          status="error"
          title="加载失败"
          subTitle={error}
          extra={
            onRetry ? (
              <Button type="primary" icon={<ReloadOutlined />} onClick={onRetry}>
                重试
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  // 空数据
  if (isEmpty) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Empty description={emptyText} />
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * 骨架屏加载器
 */
function SkeletonLoader({ type }: { type: PageStateWrapperProps['skeletonType'] }) {
  switch (type) {
    case 'card':
      return (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
              <Skeleton active avatar paragraph={{ rows: 3 }} />
            </div>
          ))}
        </div>
      );
    case 'table':
      return (
        <div className="p-6">
          <Skeleton.Input active style={{ width: 200, marginBottom: 24 }} />
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex gap-4 mb-4">
              {[1, 2, 3, 4, 5, 6].map(j => (
                <Skeleton.Input key={j} active style={{ flex: 1 }} size="small" />
              ))}
            </div>
          ))}
        </div>
      );
    case 'stat':
      return (
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
              <Skeleton active paragraph={{ rows: 1 }} />
            </div>
          ))}
        </div>
      );
    case 'form':
      return (
        <div className="p-6 max-w-lg">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="mb-4">
              <Skeleton.Input active style={{ width: '100%' }} />
            </div>
          ))}
          <Skeleton.Button active style={{ width: '100%', height: 40 }} />
        </div>
      );
    case 'page':
    default:
      return (
        <div className="p-8">
          <Skeleton.Input active style={{ width: 300, height: 40, marginBottom: 24 }} />
          <Skeleton.Input active style={{ width: 500, marginBottom: 24 }} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
                <Skeleton active avatar paragraph={{ rows: 3 }} />
              </div>
            ))}
          </div>
        </div>
      );
  }
}
