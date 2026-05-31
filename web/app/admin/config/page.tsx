'use client'

import React, { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Typography,
  Form,
  Input,
  Button,
  Switch,
  Select,
  Space,
  Divider,
  message,
  Tabs,
  Table,
  Tag
} from 'antd'
import {
  SaveOutlined,
  BellOutlined,
  GlobalOutlined,
  LockOutlined,
  SettingOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography

// Mock 日志数据
const mockLogs = [
  { key: '1', time: '2024-04-30 14:30:25', user: 'admin', action: '贴牌配置', detail: '修改APP名称为"智枢AI"', ip: '192.168.1.100' },
  { key: '2', time: '2024-04-30 13:45:10', user: 'agent_华东', action: '客户管理', detail: '新增客户"张三"', ip: '192.168.1.101' },
  { key: '3', time: '2024-04-30 12:20:33', user: 'agent_华南', action: '功能开关', detail: '开启自媒体运营功能', ip: '192.168.1.102' },
  { key: '4', time: '2024-04-30 11:15:08', user: 'admin', action: '租户管理', detail: '冻结客户"李四"', ip: '192.168.1.100' },
  { key: '5', time: '2024-04-30 10:30:45', user: 'agent_西南', action: '客户管理', detail: '重置客户密码', ip: '192.168.1.103' },
  { key: '6', time: '2024-04-29 16:45:22', user: 'admin', action: '代理商管理', detail: '创建区域代理"西北代理"', ip: '192.168.1.100' },
  { key: '7', time: '2024-04-29 15:20:11', user: 'agent_华北', action: '功能开关', detail: '批量开启招聘助手功能', ip: '192.168.1.104' },
  { key: '8', time: '2024-04-29 14:05:38', user: 'admin', action: '系统配置', detail: '更新热更新版本v2.1.0', ip: '192.168.1.100' },
  { key: '9', time: '2024-04-29 11:30:55', user: 'agent_华东', action: '客户管理', detail: '设置套餐到期时间', ip: '192.168.1.101' },
  { key: '10', time: '2024-04-29 10:15:42', user: 'admin', action: '公告管理', detail: '发布系统公告v3.2', ip: '192.168.1.100' }
]

const logColumns: ColumnsType<typeof mockLogs[0]> = [
  {
    title: '时间',
    dataIndex: 'time',
    key: 'time',
    width: 180
  },
  {
    title: '操作用户',
    dataIndex: 'user',
    key: 'user',
    width: 120,
    render: (text) => <Tag color={text === 'admin' ? 'red' : 'blue'}>{text}</Tag>
  },
  {
    title: '操作类型',
    dataIndex: 'action',
    key: 'action',
    width: 120
  },
  {
    title: '操作详情',
    dataIndex: 'detail',
    key: 'detail'
  },
  {
    title: 'IP地址',
    dataIndex: 'ip',
    key: 'ip',
    width: 140
  }
]

export default function SystemConfig() {
  const [systemForm] = Form.useForm()
  const [securityForm] = Form.useForm()
  const [announcementForm] = Form.useForm()

  // 保存系统配置
  const handleSaveSystem = () => {
    systemForm.validateFields().then(() => {
      message.success('系统配置已保存')
    })
  }

  // 保存安全设置
  const handleSaveSecurity = () => {
    securityForm.validateFields().then(() => {
      message.success('安全设置已保存')
    })
  }

  // 保存公告
  const handleSaveAnnouncement = () => {
    announcementForm.validateFields().then(() => {
      message.success('公告已发布')
    })
  }

  const tabItems = [
    {
      key: 'system',
      label: (
        <Space>
          <SettingOutlined />
          <span>系统配置</span>
        </Space>
      ),
      children: (
        <Card>
          <Form
            form={systemForm}
            layout="vertical"
            initialValues={{
              version: 'v3.2.1',
              updateUrl: 'https://update.baizhiji.com',
              maintenanceMode: false,
              maxUploadSize: 50,
              allowedFileTypes: 'jpg,png,pdf,doc,docx'
            }}
          >
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label="当前版本" name="version">
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="热更新版本" name="updateVersion">
                  <Input placeholder="如：v3.2.2" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="更新下载地址" name="updateUrl">
              <Input />
            </Form.Item>

            <Form.Item label="维护模式" name="maintenanceMode" valuePropName="checked">
              <Switch />
            </Form.Item>

            <Divider />

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label="最大上传大小(MB)" name="maxUploadSize">
                  <Input type="number" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="允许的文件类型" name="allowedFileTypes">
                  <Input placeholder="jpg,png,pdf,doc,docx" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveSystem}>
                保存配置
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )
    },
    {
      key: 'security',
      label: (
        <Space>
          <LockOutlined />
          <span>安全设置</span>
        </Space>
      ),
      children: (
        <Card>
          <Form
            form={securityForm}
            layout="vertical"
            initialValues={{
              passwordMinLength: 8,
              passwordRequireSpecial: true,
              sessionTimeout: 30,
              loginWhiteList: '',
              ipLockThreshold: 10
            }}
          >
            <Divider>密码策略</Divider>

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label="密码最小长度" name="passwordMinLength">
                  <Input type="number" min={6} max={32} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="必须包含特殊字符" name="passwordRequireSpecial" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            <Divider>登录安全</Divider>

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label="会话超时(分钟)" name="sessionTimeout">
                  <Input type="number" min={5} max={1440} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="IP锁定阈值(次)" name="ipLockThreshold">
                  <Input type="number" min={3} max={50} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="登录IP白名单" name="loginWhiteList">
              <Input.TextArea rows={3} placeholder="每行一个IP地址，空白表示不限制" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveSecurity}>
                保存配置
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )
    },
    {
      key: 'announcement',
      label: (
        <Space>
          <BellOutlined />
          <span>全局公告</span>
        </Space>
      ),
      children: (
        <Card>
          <Form
            form={announcementForm}
            layout="vertical"
          >
            <Form.Item label="公告标题" name="title" rules={[{ required: true }]}>
              <Input placeholder="如：系统升级通知" />
            </Form.Item>

            <Form.Item label="公告类型" name="type">
              <Select
                options={[
                  { value: 'info', label: '通知' },
                  { value: 'warning', label: '警告' },
                  { value: 'success', label: '成功' },
                  { value: 'error', label: '错误' }
                ]}
              />
            </Form.Item>

            <Form.Item label="公告内容" name="content" rules={[{ required: true }]}>
              <Input.TextArea rows={6} placeholder="请输入公告内容..." />
            </Form.Item>

            <Form.Item label="是否置顶" name="pinned" valuePropName="checked">
              <Switch />
            </Form.Item>

            <Form.Item label="显示时间范围" name="dateRange">
              <Input placeholder="如：2024-04-01 至 2024-04-30" />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveAnnouncement}>
                  发布公告
                </Button>
                <Button>保存草稿</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )
    },
    {
      key: 'logs',
      label: (
        <Space>
          <GlobalOutlined />
          <span>操作日志</span>
        </Space>
      ),
      children: (
        <Card>
          <Table
            rowKey="key"
            columns={logColumns}
            dataSource={mockLogs}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )
    }
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">系统配置</Title>
        <Text type="secondary">热更新版本管理、全局公告、安全设置、操作日志</Text>
      </div>

      <Tabs items={tabItems} />
    </div>
  )
}
