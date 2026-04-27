import { lazy, Suspense } from 'react';
import { Spin } from 'antd';

/**
 * 懒加载组件包装器
 * @param importFunc 组件导入函数
 * @param fallback 加载时的占位组件
 * @returns 懒加载的组件
 */
export function lazyLoad<T extends object>(
  importFunc: () => Promise<{ default: React.ComponentType<T> }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc);

  return function LazyWrapper(props: T) {
    return (
      <Suspense
        fallback={
          fallback || (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh'
              }}
            >
              <Spin size="large" tip="加载中..." />
            </div>
          )
        }
      >
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * 动态导入组件
 * @param componentPath 组件路径
 * @returns 动态导入的组件
 */
export function dynamicLoad<T extends object>(
  componentPath: string,
  options?: {
    loading?: React.ReactNode;
    ssr?: boolean;
  }
) {
  return lazyLoad<T>(() => import(componentPath), options?.loading);
}

/**
 * 图片懒加载
 * @param src 图片地址
 * @param alt 图片描述
 * @returns 图片组件
 */
export function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  style
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const Image = lazy(() => import('next/image'));

  return (
    <Suspense fallback={<div style={{ background: '#f0f0f0', width, height }} />}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={style}
        loading="lazy"
      />
    </Suspense>
  );
}

/**
 * 代码分割和懒加载示例
 */
export const LazyComponents = {
  // 懒加载图表组件
  Charts: lazyLoad(() => import('@/components/charts/Charts')),

  // 懒加载富文本编辑器
  Editor: lazyLoad(() => import('@/components/editor/Editor')),

  // 懒加载地图组件
  Map: lazyLoad(() => import('@/components/map/Map')),

  // 懒加载文件上传组件
  Upload: lazyLoad(() => import('@/components/upload/Upload')),
};
