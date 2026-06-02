'use client';

import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  QRCode,
  Space,
  Tag,
  Divider,
  Alert,
} from 'antd';
import {
  AndroidOutlined,
  DownloadOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  MobileOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface AppVersion {
  version: string;
  buildNumber: number;
  minVersion: string;
  downloadUrl: string;
  changelog: string;
  size: string;
  releaseDate: string;
  forceUpdate: boolean;
}

export default function AppDownloadPage() {
  const [loading, setLoading] = useState(false);
  const [version] = useState<AppVersion>({
    version: '1.0.0',
    buildNumber: 1,
    minVersion: '1.0.0',
    downloadUrl: '/app/zhishuai.apk',
    changelog: '初始版本发布',
    size: '45.6 MB',
    releaseDate: new Date().toISOString().split('T')[0],
    forceUpdate: false,
  });

  const downloadUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${version.downloadUrl}`
    : version.downloadUrl;

  const handleDownload = () => {
    setLoading(true);
    setTimeout(() => {
      window.open(version.downloadUrl, '_blank');
      setLoading(false);
    }, 500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(downloadUrl);
  };

  const appName = '智枢AI';

  return (
    <div>
      <Title level={3}>智枢AI APP下载</Title>
      <Text type="secondary">下载并安装智枢AI移动应用，随时随地管理您的业务</Text>
      
      <Divider />

      {/* 下载卡片 */}
      <Card style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Row gutter={[32, 24]} align="middle">
          {/* 左侧：版本信息 */}
          <Col xs={24} md={14}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* 版本号 */}
              <div>
                <Tag color="blue" style={{ marginBottom: 8 }}>最新版本</Tag>
                <Title level={3} style={{ margin: 0 }}>v{version.version}</Title>
                <Text type="secondary">Build {version.buildNumber}</Text>
              </div>

              <Divider style={{ margin: '8px 0' }} />

              {/* 更新说明 */}
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                  更新内容
                </Text>
                <Paragraph style={{ color: '#666' }}>
                  {version.changelog}
                </Paragraph>
              </div>

              {/* 版本信息 */}
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ textAlign: 'center', padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
                    <MobileOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">版本</Text>
                      <div><Text strong>v{version.version}</Text></div>
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ textAlign: 'center', padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
                    <AndroidOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">大小</Text>
                      <div><Text strong>{version.size}</Text></div>
                    </div>
                  </div>
                </Col>
              </Row>

              <Divider style={{ margin: '8px 0' }} />

              {/* 下载按钮 */}
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<DownloadOutlined />}
                  block
                  loading={loading}
                  onClick={handleDownload}
                  style={{ height: 56, fontSize: 18, borderRadius: 12 }}
                >
                  下载安装包
                </Button>
                <Button
                  size="large"
                  icon={<CopyOutlined />}
                  block
                  onClick={handleCopyLink}
                  style={{ height: 48, borderRadius: 12 }}
                >
                  复制下载链接
                </Button>
              </Space>

              {version.forceUpdate && (
                <Alert
                  type="warning"
                  icon={<WarningOutlined />}
                  message="必须更新到最新版本才能继续使用"
                  style={{ marginTop: 16 }}
                />
              )}
            </Space>
          </Col>

          {/* 右侧：二维码 */}
          <Col xs={24} md={10}>
            <div style={{ textAlign: 'center' }}>
              <QRCode
                value={downloadUrl}
                size={180}
                style={{ marginBottom: 16 }}
              />
              <Text type="secondary" style={{ display: 'block' }}>
                扫码下载 App
              </Text>
              <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                或访问上方链接下载
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 安装说明 */}
      <Card title="安装说明" style={{ marginTop: 24, borderRadius: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>1. 下载安装包</Text>
            <Paragraph type="secondary" style={{ marginBottom: 8 }}>
              点击上方「下载安装包」按钮，或扫描二维码下载 APK 文件。
            </Paragraph>
          </div>
          <div>
            <Text strong>2. 允许安装未知来源应用</Text>
            <Paragraph type="secondary" style={{ marginBottom: 8 }}>
              在手机设置中开启「允许安装未知来源应用」权限。
            </Paragraph>
          </div>
          <div>
            <Text strong>3. 安装应用</Text>
            <Paragraph type="secondary" style={{ marginBottom: 8 }}>
              找到下载的 APK 文件，点击安装即可。
            </Paragraph>
          </div>
          <div>
            <Text strong>4. 打开 App</Text>
            <Paragraph type="secondary">
              安装完成后，打开 {appName} App 并登录使用。
            </Paragraph>
          </div>
        </Space>
      </Card>

      {/* 底部信息 */}
      <div style={{ textAlign: 'center', marginTop: 24, color: '#999' }}>
        <Text style={{ color: '#999' }}>
          © 2024 {appName} · 智能商业解决方案
        </Text>
      </div>
    </div>
  );
}
