'use client';

import React, { useState, useEffect } from 'react';
import { Card, Typography, Spin, Image, Divider, Space } from 'antd';
import { WechatOutlined, ScanOutlined, ClockCircleOutlined, CustomerServiceOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export default function AgentSupportPage() {
  const [qrcodeUrl, setQrcodeUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/support/qrcode')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.url) {
          setQrcodeUrl(data.data.url);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px' }}>
      <Title level={3} style={{ textAlign: 'center', marginBottom: 8 }}>
        <WechatOutlined style={{ color: '#07c160', marginRight: 8 }} />
        企业微信客服
      </Title>
      <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
        扫码添加企业微信，获取专属客服支持
      </Text>

      <Card
        style={{
          borderRadius: 16,
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          {/* 二维码区域 */}
          <div style={{
            width: 260,
            height: 260,
            margin: '0 auto 20px',
            borderRadius: 16,
            border: '1px solid #f0f0f0',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fafafa',
          }}>
            {qrcodeUrl ? (
              <Image
                src={qrcodeUrl}
                alt="企业微信客服二维码"
                width={260}
                height={260}
                preview={{ mask: '点击放大' }}
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <WechatOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
                <div style={{ marginTop: 12 }}>
                  <Text type="secondary">二维码尚未配置</Text>
                </div>
              </div>
            )}
          </div>

          <Title level={4} style={{ marginBottom: 4 }}>扫码添加企业微信</Title>
          <Paragraph type="secondary" style={{ marginBottom: 24 }}>
            打开微信扫一扫，添加企业微信客服
          </Paragraph>

          <Divider style={{ margin: '0 24px' }} />

          {/* 使用指引 */}
          <div style={{ padding: '16px 24px 0', textAlign: 'left' }}>
            <Title level={5} style={{ marginBottom: 16 }}>使用说明</Title>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <ScanOutlined style={{ fontSize: 18, color: '#6d28d9', marginTop: 2 }} />
                <div>
                  <Text strong>步骤一：扫码添加</Text>
                  <br />
                  <Text type="secondary">使用微信扫描上方二维码，添加企业微信客服</Text>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <CustomerServiceOutlined style={{ fontSize: 18, color: '#6d28d9', marginTop: 2 }} />
                <div>
                  <Text strong>步骤二：描述问题</Text>
                  <br />
                  <Text type="secondary">通过后发送您的问题，客服将尽快为您解答</Text>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <ClockCircleOutlined style={{ fontSize: 18, color: '#6d28d9', marginTop: 2 }} />
                <div>
                  <Text strong>步骤三：获取支持</Text>
                  <br />
                  <Text type="secondary">客服工作时间：工作日 9:00 - 18:00</Text>
                </div>
              </div>
            </Space>
          </div>

          <Divider style={{ margin: '20px 24px' }} />

          <Text type="secondary" style={{ fontSize: 12 }}>
            如遇紧急问题，请拨打客服热线或联系您的专属客户经理
          </Text>
        </div>
      </Card>
    </div>
  );
}
