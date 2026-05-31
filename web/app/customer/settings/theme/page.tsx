'use client'

import { Card, Typography, Radio, ColorPicker, Switch, message } from 'antd'

const { Title } = Typography

export default function ThemeSettingsPage() {
  return (
    <div className="p-6">
      <Title level={2} className="mb-6">主题设置</Title>

      <Card title="外观主题">
        <div className="space-y-4">
          <div>
            <div className="mb-2">主题模式</div>
            <Radio.Group defaultValue="light">
              <Radio value="light">浅色</Radio>
              <Radio value="dark">深色</Radio>
              <Radio value="auto">自动</Radio>
            </Radio.Group>
          </div>
          <div>
            <div className="mb-2">主色调</div>
            <ColorPicker defaultValue="#1890ff" />
          </div>
          <div>
            <div className="flex justify-between items-center">
              <span>紧凑模式</span>
              <Switch defaultChecked={false} />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center">
              <span>显示动画</span>
              <Switch defaultChecked={true} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
