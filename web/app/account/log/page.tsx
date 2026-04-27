'use client'

import { Card, Typography, Table, Tag, DatePicker, Select, Button } from 'antd'
import { EyeOutlined } from '@ant-design/icons'

const { Title } = Typography

export default function OperationLogPage() {
  const columns = [
    { title: '操作时间', dataIndex: 'time', key: 'time' },
    { title: '操作人', dataIndex: 'operator', key: 'operator' },
    { title: '操作类型', dataIndex: 'type', key: 'type' },
    { title: '操作内容', dataIndex: 'content', key: 'content' },
    { title: 'IP地址', dataIndex: 'ip', key: 'ip' },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Button type="link" icon={<EyeOutlined />}>详情</Button>
      ),
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <Title level={2} className="mb-0">操作日志</Title>
      </div>

      <Card>
        <Table
          dataSource={[
            { time: '2024-03-25 10:30:00', operator: '管理员', type: '登录', content: '用户登录', ip: '192.168.1.1' },
          ]}
          columns={columns}
          rowKey="time"
        />
      </Card>
    </div>
  )
}
