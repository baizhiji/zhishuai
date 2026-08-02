'use client';

import React, { useState, useEffect } from 'react';
import { Card, Typography, Spin, Image, Divider, Space } from 'antd';
import { WechatOutlined, ScanOutlined, ClockCircleOutlined, CustomerServiceOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export default function CustomerSupportPage() {
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
        在线客服
      </Title>
      <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
        微信扫码添加企业微信，立即获取专业客服支持
      </Text>

      <Card
        style={{
          borderRadius: 16,
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #f0fff4 0%, #ffffff 100%)',
        }}
      >
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          {/* 二维码区域 */}
          <div style={{
            width: 260,
            height: 260,
            margin: '0 auto 20px',
            borderRadius: 16,
            border: '4px solid #07c160',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fff',
            boxShadow: '0 4px 16px rgba(7,193,96,0.15)',
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
                <WechatOutlined style={{ fontSize: 64, color: '#07c160' }} />
                <div style={{ marginTop: 12 }}>
                  <Text type="secondary">客服二维码准备中...</Text>
                </div>
              </div>
            )}
          </div>

          <Title level={4} style={{ marginBottom: 4, color: '#07c160' }}>扫码添加企业微信客服</Title>
          <Paragraph type="secondary" style={{ marginBottom: 24 }}>
            打开微信扫一扫，扫描二维码即可添加
          </Paragraph>

          <Divider style={{ margin: '0 24px' }} />

          {/* 使用指引 */}
          <div style={{ padding: '16px 24px 0', textAlign: 'left' }}>
            <Title level={5} style={{ marginBottom: 16 }}>如何获取帮助</Title>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <ScanOutlined style={{ fontSize: 18, color: '#07c160', marginTop: 2 }} />
                <div>
                  <Text strong>第一步：扫描二维码</Text>
                  <br />
                  <Text type="secondary">打开微信，使用扫一扫功能扫描上方二维码</Text>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <WechatOutlined style={{ fontSize: 18, color: '#07c160', marginTop: 2 }} />
                <div>
                  <Text strong>第二步：添加企业微信</Text>
                  <br />
                  <Text type="secondary">点击添加好友，通过后即可开始咨询</Text>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <CustomerServiceOutlined style={{ fontSize: 18, color: '#07c160', marginTop: 2 }} />
                <div>
                  <Text strong>第三步：描述您的问题</Text>
                  <br />
                  <Text type="secondary">直接发送您的问题、截图或需求，客服将尽快回复</Text>
                </div>
              </div>
            </Space>
          </div>

          <Divider style={{ margin: '20px 24px' }} />

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
            <ClockCircleOutlined style={{ color: '#999' }} />
            <Text type="secondary" style={{ fontSize: 13 }}>
              客服工作时间：工作日 9:00 - 18:00
            </Text>
          </div>
        </div>
      </Card>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          如遇紧急问题或非工作时间，您也可以通过工单系统提交问题，我们将在第一时间处理
        </Text>
      </div>
    </div>
  );
}
