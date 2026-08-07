'use client';

import React from 'react';
import { Breadcrumb, Typography, Skeleton, Empty, Space } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import Link from 'next/link';

export interface BreadcrumbItem {
  title: string;
  href?: string;
}

export interface PageContainerProps {
  title?: string;
  description?: string;
  breadcrumb?: BreadcrumbItem[];
  loading?: boolean;
  skeletonType?: 'table' | 'card' | 'detail' | 'none';
  empty?: boolean;
  emptyText?: string;
  emptyImage?: React.ReactNode;
  emptyExtra?: React.ReactNode;
  extra?: React.ReactNode;
  children?: React.ReactNode;
  contentStyle?: React.CSSProperties;
}

const SkeletonTable = () => (
  <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
    <Skeleton active paragraph={{ rows: 1 }} />
    <Skeleton active paragraph={{ rows: 8 }} style={{ marginTop: 16 }} />
  </div>
);

const SkeletonCardGrid = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
    {[1, 2, 3, 4].map(i => (
      <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <Skeleton active paragraph={{ rows: 3 }} />
      </div>
    ))}
  </div>
);

const SkeletonDetail = () => (
  <div style={{ background: '#fff', borderRadius: 12, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
    <Skeleton active paragraph={{ rows: 12 }} />
  </div>
);

export default function PageContainer({
  title,
  description,
  breadcrumb,
  loading = false,
  skeletonType = 'card',
  empty = false,
  emptyText,
  emptyImage,
  emptyExtra,
  extra,
  children,
  contentStyle,
}: PageContainerProps) {
  const renderSkeleton = () => {
    if (skeletonType === 'none') return children;
    switch (skeletonType) {
      case 'table':
        return <SkeletonTable />;
      case 'detail':
        return <SkeletonDetail />;
      case 'card':
      default:
        return <SkeletonCardGrid />;
    }
  };

  const defaultBreadcrumb: BreadcrumbItem[] = [
    { title: '首页', href: '/customer/dashboard' }
  ];

  const allBreadcrumb = breadcrumb && breadcrumb.length > 0
    ? breadcrumb
    : title ? [{ title }] : [];

  return (
    <div style={{ padding: '0 0 24px 0', ...contentStyle }}>
      {/* Breadcrumb */}
      {allBreadcrumb.length > 0 && (
        <Breadcrumb
          style={{ marginBottom: 16 }}
          items={allBreadcrumb.map((item, idx) => ({
            title: item.href ? (
              <Link href={item.href} style={{ color: idx === allBreadcrumb.length - 1 ? undefined : undefined }}>
                <Space size={4}>
                  {idx === 0 && <HomeOutlined />}
                  {item.title}
                </Space>
              </Link>
            ) : (
              <Space size={4}>
                {idx === 0 && <HomeOutlined />}
                <span>{item.title}</span>
              </Space>
            ),
          }))}
        />
      )}

      {/* Page Header */}
      {(title || extra) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            {title && (
              <Typography.Title level={2} style={{ marginBottom: 4, fontSize: 24 }}>
                {title}
              </Typography.Title>
            )}
            {description && (
              <Typography.Text type="secondary" style={{ fontSize: 14 }}>
                {description}
              </Typography.Text>
            )}
          </div>
          {extra && <div style={{ flexShrink: 0 }}>{extra}</div>}
        </div>
      )}

      {/* Content */}
      {loading ? (
        renderSkeleton()
      ) : empty ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: '80px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <Empty
            image={emptyImage || Empty.PRESENTED_IMAGE_SIMPLE}
            description={emptyText || '暂无数据'}
          >
            {emptyExtra}
          </Empty>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
