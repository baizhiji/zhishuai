'use client'

import { Card, Typography } from 'antd'

const { Title, Paragraph } = Typography

export default function PlaceholderPage({ featureName }: { featureName: string }) {
  return (
    <div className="p-6">
      <Card className="text-center py-12">
        <Title level={3}>{featureName}</Title>
        <Paragraph type="secondary">该功能即将上线，敬请期待！</Paragraph>
      </Card>
    </div>
  )
}
