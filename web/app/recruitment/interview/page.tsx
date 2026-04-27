'use client'

import { Card, Typography, Table, Tag, Space, Button } from 'antd'
import { CalendarOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

export default function InterviewManagementPage() {
  return (
    <div className="p-6">
      <Title level={2} className="mb-2">面试管理</Title>
      <Text type="secondary" className="mb-6 block">安排和管理面试流程</Text>

      <Card title="面试日程">
        <Table
          dataSource={[]}
          columns={[
            { title: '候选人', dataIndex: 'name' },
            { title: '职位', dataIndex: 'position' },
            { title: '面试时间', dataIndex: 'time' },
            { title: '面试官', dataIndex: 'interviewer' },
            { title: '状态', dataIndex: 'status' },
            {
              title: '操作',
              render: () => (
                <Space>
                  <Button type="link">通过</Button>
                  <Button type="link" danger>拒绝</Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}
