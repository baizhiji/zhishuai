'use client';

import { useState } from 'react';
import { Typography, Row, Col, Card, Input, Select, Button, Space, Divider, message } from 'antd';
import { SendOutlined, ClearOutlined, ApiOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const API_ENDPOINTS = [
  { label: 'POST /api/auth/login', value: '/api/auth/login' },
  { label: 'POST /api/auth/register', value: '/api/auth/register' },
  { label: 'GET /api/agent/customers', value: '/api/agent/customers' },
];

export default function ApiTestPage() {
  const [endpoint, setEndpoint] = useState(API_ENDPOINTS[0].value);
  const [method, setMethod] = useState<string>('POST');
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEndpointChange = (value: string) => {
    setEndpoint(value);
    setMethod(value.startsWith('GET') ? 'GET' : 'POST');
  };

  const handleSend = async () => {
    setLoading(true);
    setResponse('');

    try {
      const actualMethod = endpoint.startsWith('GET') ? 'GET' : 'POST';
      const options: RequestInit = {
        method: actualMethod,
        headers: { 'Content-Type': 'application/json' },
      };

      if (actualMethod === 'POST' && requestBody.trim()) {
        try {
          JSON.parse(requestBody);
          options.body = requestBody;
        } catch {
          message.warning('请求体 JSON 格式不正确');
          setLoading(false);
          return;
        }
      }

      const res = await fetch(endpoint, options);
      const data = await res.json();

      setResponse(JSON.stringify({ status: res.status, data }, null, 2));
    } catch (err: any) {
      setResponse(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setRequestBody('');
    setResponse('');
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Title level={1}>
          <ApiOutlined style={{ marginRight: 12, color: '#1890ff' }} />
          API 测试工具
        </Title>
        <Paragraph style={{ fontSize: 16, color: '#666' }}>
          在线测试智枢AI的API接口，快速验证接口功能
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="请求配置" style={{ borderRadius: 12 }}>
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>接口端点</Text>
              <Select
                value={endpoint}
                onChange={handleEndpointChange}
                style={{ width: '100%' }}
                options={API_ENDPOINTS}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>请求方法</Text>
              <Input value={method} disabled />
            </div>

            {!endpoint.startsWith('GET') && (
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>请求体 (JSON)</Text>
                <TextArea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  rows={8}
                  placeholder='{"phone": "13800000001", "password": "123456"}'
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
            )}

            <Space>
              <Button type="primary" icon={<SendOutlined />} onClick={handleSend} loading={loading}>
                发送请求
              </Button>
              <Button icon={<ClearOutlined />} onClick={handleClear}>
                清空
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="响应结果" style={{ borderRadius: 12 }}>
            {response ? (
              <pre
                style={{
                  background: '#f5f5f5',
                  padding: 16,
                  borderRadius: 8,
                  fontSize: 13,
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  maxHeight: 400,
                  overflow: 'auto',
                }}
              >
                {response}
              </pre>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                <ApiOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <Paragraph>点击"发送请求"查看响应结果</Paragraph>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
