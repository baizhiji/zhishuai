'use client';

import React, { useState, useEffect } from 'react';
import { Card, Upload, Button, Typography, Space, message, Image, Spin, Divider } from 'antd';
import { UploadOutlined, WechatOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';

const { Title, Text, Paragraph } = Typography;

export default function AdminSupportPage() {
  const [qrcodeUrl, setQrcodeUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  useEffect(() => {
    loadQrcode();
  }, []);

  const loadQrcode = async () => {
    try {
      const res = await fetch('/api/support/qrcode');
      const data = await res.json();
      if (data.success && data.data.url) {
        setQrcodeUrl(data.data.url);
      }
    } catch (err) {
      console.error('加载二维码失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: RcFile): Promise<false | void> => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/support/qrcode', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setQrcodeUrl(data.data.url);
        message.success('企业微信二维码已更新');
      } else {
        message.error(data.error || '上传失败');
      }
    } catch (err) {
      message.error('上传失败');
    } finally {
      setUploading(false);
    }
    return false; // 阻止默认上传行为
  };

  const beforeUpload = (file: RcFile) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('请上传图片文件');
      return Upload.LIST_IGNORE;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('图片大小不能超过 5MB');
      return Upload.LIST_IGNORE;
    }
    handleUpload(file);
    return Upload.LIST_IGNORE;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
      <Title level={3} style={{ marginBottom: 8 }}>
        <WechatOutlined style={{ color: '#07c160', marginRight: 8 }} />
        客服中心配置
      </Title>
      <Text type="secondary">
        上传企业微信二维码，客户扫码后即可添加企业微信进行咨询
      </Text>

      <Divider />

      <Card title="企业微信二维码" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          {qrcodeUrl ? (
            <div style={{ textAlign: 'center' }}>
              <Image
                src={qrcodeUrl}
                alt="企业微信二维码"
                width={280}
                height={280}
                style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}
                fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjI4MCIgdmlld0JveD0iMCAwIDI4MCAyODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjI4MCIgaGVpZ2h0PSIyODAiIGZpbGw9IiNmNWY1ZjUiLz48dGV4dCB4PSIxNDAiIHk9IjE0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZpbGw9IiNiZmJmYmYiIGZvbnQtc2l6ZT0iMTQiPuWbvueJh+WKoOi9veWksei0pTwvdGV4dD48L3N2Zz4="
              />
              <div style={{ marginTop: 12 }}>
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <Text type="success">二维码已配置</Text>
                </Space>
              </div>
            </div>
          ) : (
            <div style={{
              width: 280,
              height: 280,
              background: '#fafafa',
              borderRadius: 12,
              border: '2px dashed #d9d9d9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text type="secondary">尚未配置二维码</Text>
            </div>
          )}

          <Upload
            accept="image/*"
            showUploadList={false}
            beforeUpload={beforeUpload}
          >
            <Button
              type="primary"
              icon={<UploadOutlined />}
              loading={uploading}
              size="large"
            >
              {qrcodeUrl ? '更换二维码' : '上传企业微信二维码'}
            </Button>
          </Upload>

          <Text type="secondary" style={{ fontSize: 12 }}>
            支持 PNG、JPG、GIF、WEBP 格式，大小不超过 5MB
          </Text>
        </div>
      </Card>

      <Card title="预览效果" style={{ marginBottom: 24 }}>
        <Paragraph>
          客户和代理商在"客服中心"页面将看到以下效果：
        </Paragraph>
        <div style={{
          background: '#f5f5f5',
          borderRadius: 12,
          padding: 24,
          textAlign: 'center',
          maxWidth: 500,
          margin: '0 auto',
        }}>
          <WechatOutlined style={{ fontSize: 48, color: '#07c160', marginBottom: 16 }} />
          <Title level={4}>扫码添加企业微信客服</Title>
          <Paragraph type="secondary">
            使用微信扫描下方二维码，即可添加我们的企业微信客服
          </Paragraph>
          {qrcodeUrl ? (
            <Image
              src={qrcodeUrl}
              alt="企业微信二维码"
              width={220}
              height={220}
              preview={false}
              style={{ borderRadius: 8 }}
            />
          ) : (
            <div style={{
              width: 220,
              height: 220,
              background: '#fff',
              borderRadius: 8,
              border: '2px dashed #d9d9d9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
            }}>
              <Text type="secondary">未配置二维码</Text>
            </div>
          )}
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">扫码后我们的客服人员将在企业微信中为您服务</Text>
          </div>
        </div>
      </Card>
    </div>
  );
}
