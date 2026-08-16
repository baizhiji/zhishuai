import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI创作工厂 - 智枢AI',
  description: '通过文字、照片生成图文、视频等多种创意内容',
};

export default function AIFactoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
