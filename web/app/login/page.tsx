'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Form, Input, Button, Card, Typography, Space, message } from 'antd'
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/lib/store'
import { validatePhone, validatePassword } from '@/utils'

const { Title, Text } = Typography

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const handleSubmit = async (values: { phone: string; password: string }) => {
    if (!validatePhone(values.phone)) {
      message.error('请输入正确的手机号码')
      return
    }

    if (!validatePassword(values.password)) {
      message.error('密码长度至少6位')
      return
    }

    setLoading(true)

    try {
      // TODO: 调用真实的登录API
      // const response = await apiClient.post('/auth/login', values)

      // 模拟登录成功
      setTimeout(() => {
        const mockUser = {
          id: '1',
          username: '测试用户',
          phone: values.phone,
          role: 'customer' as const,
          permissions: ['media', 'ecommerce', 'hr'],
          features: ['media', 'ecommerce', 'hr', 'customer'],
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const mockToken = 'mock_token_' + Date.now()

        login(mockUser, mockToken)
        message.success('登录成功！')

        // 跳转到首页
        router.push('/dashboard')
      }, 1000)
    } catch (error: any) {
      message.error(error.message || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🤖</div>
            <Title level={2} className="mb-2">
              智枢AI
            </Title>
            <Text type="secondary">智能商业平台</Text>
          </div>

          <Form
            form={form}
            name="login"
            onFinish={handleSubmit}
            autoComplete="off"
            layout="vertical"
          >
            <Form.Item
              label="手机号码"
              name="phone"
              rules={[
                { required: true, message: '请输入手机号码' },
                {
                  pattern: /^1[3-9]\d{9}$/,
                  message: '请输入正确的手机号码',
                },
              ]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="请输入手机号码"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="密码"
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码长度至少6位' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="请输入密码"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                icon={<LoginOutlined />}
                block
                className="bg-gradient-to-r from-blue-500 to-purple-600 border-0 hover:from-blue-600 hover:to-purple-700"
              >
                登录
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center">
            <Space direction="vertical" size="small">
              <Text type="secondary" className="text-sm">
                还没有账号？<a href="/register" className="text-blue-600">立即注册</a>
              </Text>
              <Text type="secondary" className="text-sm">
                <a href="/forgot-password" className="text-blue-600">忘记密码？</a>
              </Text>
            </Space>
          </div>
        </Card>

        <div className="text-center mt-8">
          <Text type="secondary" className="text-xs">
            © 2024 智枢AI. 保留所有权利。
          </Text>
        </div>
      </div>
    </div>
  )
}
