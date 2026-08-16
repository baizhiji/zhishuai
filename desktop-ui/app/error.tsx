'use client';

// 全局错误页（500）：渲染层异常时展示，提供重试入口
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f7fa',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            padding: '48px 32px',
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            maxWidth: 420,
            width: '100%',
          }}
        >
          <div style={{ fontSize: 56, lineHeight: 1, color: '#d4380d', marginBottom: 16 }}>
            500
          </div>
          <h1 style={{ fontSize: 20, margin: '0 0 8px', color: '#1f2329' }}>页面出错了</h1>
          <p style={{ fontSize: 14, color: '#8a919f', margin: '0 0 24px' }}>
            系统发生异常，请刷新重试。如问题持续，请联系管理员。
          </p>
          <button
            onClick={reset}
            style={{
              padding: '8px 24px',
              fontSize: 14,
              color: '#fff',
              background: '#1677ff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            重新加载
          </button>
        </div>
      </body>
    </html>
  );
}
