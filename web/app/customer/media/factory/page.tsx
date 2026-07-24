'use client';

import { useState } from 'react';
import { Card, Typography, Empty, Button } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

/**
 * 旧版内容工厂 - 已被 ai-factory/page.tsx 替代
 * 此页面仅作为占位符，引导用户访问新版 AI 创作工厂
 */
export default function ContentFactoryPageLegacy() {
  const [redirecting, setRedirecting] = useState(false);

  const handleRedirect = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/customer/ai-factory';
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <Card>
        <Title level={3}>内容工厂（旧版已下线）</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          本页面已迁移到全新的「AI 创作工厂」，提供更强大的爆款内容生成能力。
        </Text>
        <Empty description="旧版入口已停用">
          <Button
            type="primary"
            icon={<ArrowRightOutlined />}
            loading={redirecting}
            onClick={handleRedirect}
          >
            前往新版 AI 创作工厂
          </Button>
        </Empty>
      </Card>
    </div>
  );
}