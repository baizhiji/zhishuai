'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, message, Modal, Steps, Descriptions, Tag, Alert } from 'antd';
import {
  AndroidOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  IPhoneOutlined,
  WindowsOutlined,
  ChromeOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export default function DownloadPage() {
  const [apkUrl, setApkUrl] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    // 检测设备类型
    const checkDevice = () => {
      const ua = navigator.userAgent.toLowerCase();
      const isAndroid = ua.indexOf('android') > -1;
      const isIOS = ua.indexOf('iphone') > -1 || ua.indexOf('ipad') > -1;
      setIsMobile(isAndroid || isIOS);
    };
    
    checkDevice();
    
    // 设置APK下载地址
    const downloadUrl = process.env.NEXT_PUBLIC_APK_DOWNLOAD_URL || '/zhishuai.apk';
    setApkUrl(downloadUrl);
  }, []);

  const handleDownload = () => {
    if (!apkUrl) {
      message.error('APK下载链接未配置，请联系管理员');
      return;
    }
    
    const link = document.createElement('a');
    link.href = apkUrl;
    link.download = '智枢AI.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('开始下载智枢AI APP');
  };

  const installSteps = [
    {
      title: '下载APK',
      description: '点击上方下载按钮',
    },
    {
      title: '允许安装',
      description: '在设置中允许安装未知来源应用',
    },
    {
      title: '安装应用',
      description: '打开下载的APK文件进行安装',
    },
    {
      title: '开始使用',
      description: '安装完成后打开应用登录使用',
    },
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px'
    }}>
      <Card
        style={{
          maxWidth: 600,
          margin: '0 auto',
          borderRadius: 20,
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.25)',
        }}
        styles={{ body: { padding: 40 } }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 100,
            height: 100,
            borderRadius: 24,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)',
          }}>
            <AndroidOutlined style={{ fontSize: 50, color: '#fff' }} />
          </div>
          <Title level={2} style={{ marginBottom: 8 }}>智枢AI</Title>
          <Text type="secondary">智能内容创作与营销平台</Text>
        </div>

        {/* 下载按钮 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Button
            type="primary"
            size="large"
            icon={<DownloadOutlined />}
            onClick={handleDownload}
            style={{
              height: 56,
              paddingLeft: 48,
              paddingRight: 48,
              borderRadius: 28,
              fontSize: 18,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              boxShadow: '0 8px 30px rgba(102, 126, 234, 0.4)',
            }}
          >
            下载Android安装包
          </Button>
          <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
            版本: {process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}
          </Text>
        </div>

        {/* 安装说明 */}
        <div style={{ marginBottom: 32 }}>
          <Button 
            type="link" 
            onClick={() => setShowInstallGuide(true)}
            style={{ padding: 0 }}
          >
            查看安装教程
          </Button>
        </div>

        {/* 功能特性 */}
        <div style={{ marginBottom: 24 }}>
          <Title level={5} style={{ marginBottom: 16 }}>APP功能</Title>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <Text>AI智能对话与内容创作</Text>
            </Space>
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <Text>数字人视频制作</Text>
            </Space>
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <Text>自媒体矩阵管理</Text>
            </Space>
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <Text>智能获客与CRM管理</Text>
            </Space>
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <Text>招聘助手与简历筛选</Text>
            </Space>
          </Space>
        </div>

        {/* 提示 */}
        <Alert
          type="info"
          showIcon
          message="温馨提示"
          description="如遇安装问题，请在手机设置中开启'允许安装未知来源应用'，或联系管理员获取帮助。"
          style={{ marginBottom: 16 }}
        />
      </Card>

      {/* 安装教程弹窗 */}
      <Modal
        title="Android安装教程"
        open={showInstallGuide}
        onCancel={() => setShowInstallGuide(false)}
        footer={null}
        width={500}
      >
        <Steps
          direction="vertical"
          current={4}
          items={installSteps.map((step, index) => ({
            title: step.title,
            description: step.description,
            status: 'finish',
          }))}
        />
        
        <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
          <Title level={5}>注意事项</Title>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>首次安装需要允许安装未知来源应用</li>
            <li>安装后如提示"风险"，选择"仍要安装"</li>
            <li>建议在WiFi环境下下载，节省流量</li>
            <li>如更新后无法打开，请先卸载旧版本再安装</li>
          </ul>
        </div>
      </Modal>
    </div>
  );
}
