import { lazy, Suspense } from 'react';
import { Spin } from 'antd';

/**
 * 懒加载组件包装器
 * @param importFunc 组件导入函数
 * @param fallback 加载时的占位组件
 * @returns 懒加载的组件
 */
export function lazyLoad<T extends object>(
  importFunc: () => Promise<any>,
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
        <LazyComponent {...(props as any)} />
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
  // 使用 Next.js 的 dynamic
  const dynamicOptions: any = {
    ssr: options?.ssr ?? false,
    loading: options?.loading ?? (
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
    ),
  };

  // 动态导入组件
  const Component = lazy(() => import(componentPath));

  return function DynamicWrapper(props: T) {
    return (
      <Suspense fallback={dynamicOptions.loading}>
        <Component {...(props as any)} />
      </Suspense>
    );
  };
}
