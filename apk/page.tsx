'use client';

import { useState, useEffect } from 'react';
import { ConfigProvider, Flex, Badge } from 'antd';
import {
  HomeOutlined,
  BulbOutlined,
  UserOutlined,
  BellOutlined,
  MessageOutlined,
  FireOutlined,
  TeamOutlined,
  ShareAltOutlined,
  WalletOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  CustomerServiceOutlined,
  SkinOutlined,
  LogoutOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  ScanOutlined,
  RightOutlined,
  ArrowUpOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

// 移动端样式
const mobileStyles = `
  @import url('https://fonts.googleapis.com/css2?family=PingFang+SC&display=swap');

  * {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
  }

  body {
    font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #f5f5f5;
    margin: 0;
    padding: 0;
    overflow-x: hidden;
  }

  .apk-container {
    max-width: 430px;
    margin: 0 auto;
    min-height: 100vh;
    background: #f5f5f5;
    position: relative;
    padding-bottom: 70px;
  }

  .apk-header {
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
    padding: 16px 20px;
    padding-top: max(16px, env(safe-area-inset-top));
    color: white;
  }

  .apk-header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .apk-welcome {
    font-size: 18px;
    font-weight: 600;
  }

  .apk-header-actions {
    display: flex;
    gap: 16px;
  }

  .apk-header-actions span {
    font-size: 20px;
    cursor: pointer;
  }

  .apk-stat-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-top: 12px;
  }

  .apk-stat-item {
    background: rgba(255,255,255,0.15);
    border-radius: 8px;
    padding: 8px 4px;
    text-align: center;
  }

  .apk-stat-value {
    font-size: 16px;
    font-weight: 700;
    color: white;
  }

  .apk-stat-label {
    font-size: 10px;
    color: rgba(255,255,255,0.8);
    margin-top: 2px;
  }

  .apk-module-grid {
    padding: 16px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    background: white;
    margin: 12px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }

  .apk-module-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .apk-module-item:active {
    transform: scale(0.95);
  }

  .apk-module-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
  }

  .apk-module-icon.media { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%); }
  .apk-module-icon.recruit { background: linear-gradient(135deg, #4ecdc4 0%, #44a3a0 100%); }
  .apk-module-icon.acquisition { background: linear-gradient(135deg, #45b7d1 0%, #3a9fc0 100%); }
  .apk-module-icon.share { background: linear-gradient(135deg, #96ceb4 0%, #7ab89d 100%); }

  .apk-module-name {
    font-size: 12px;
    color: #333;
    text-align: center;
  }

  .apk-section {
    padding: 16px;
  }

  .apk-section-title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .apk-section-title span {
    font-size: 12px;
    color: #999;
    font-weight: normal;
  }

  .apk-quick-actions {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    background: white;
    padding: 16px;
    border-radius: 12px;
    margin: 0 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }

  .apk-quick-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }

  .apk-quick-item:active {
    opacity: 0.7;
  }

  .apk-quick-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: #f0f5ff;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1890ff;
    font-size: 18px;
  }

  .apk-quick-name {
    font-size: 11px;
    color: #666;
  }

  .apk-data-cards {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding: 0 12px;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
  }

  .apk-data-card {
    flex: 0 0 140px;
    background: white;
    border-radius: 12px;
    padding: 14px;
    scroll-snap-align: start;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }

  .apk-data-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .apk-data-card-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }

  .apk-data-card-trend {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .apk-data-card-trend.up {
    background: #f6ffed;
    color: #52c41a;
  }

  .apk-data-card-trend.down {
    background: #fff2f0;
    color: #ff4d4f;
  }

  .apk-data-card-value {
    font-size: 20px;
    font-weight: 700;
    color: #333;
  }

  .apk-data-card-label {
    font-size: 12px;
    color: #999;
    margin-top: 4px;
  }

  .apk-bottom-nav {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 430px;
    background: white;
    display: flex;
    justify-content: space-around;
    padding: 8px 0;
    padding-bottom: max(8px, env(safe-area-inset-bottom));
    box-shadow: 0 -2px 10px rgba(0,0,0,0.06);
    z-index: 100;
  }

  .apk-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    color: #999;
    font-size: 10px;
    cursor: pointer;
    padding: 4px 16px;
    transition: color 0.2s;
  }

  .apk-nav-item.active {
    color: #1890ff;
  }

  .apk-nav-item span:first-child {
    font-size: 22px;
  }

  .apk-notice {
    background: #fff7e6;
    margin: 0 12px;
    padding: 12px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 12px;
  }

  .apk-notice-icon {
    color: #fa8c16;
    font-size: 18px;
  }

  .apk-notice-content {
    flex: 1;
    font-size: 13px;
    color: #8c6d3f;
  }

  /* AI 创作 Tab */
  .apk-ai-tabs {
    display: flex;
    background: white;
    padding: 12px 16px;
    gap: 8px;
    overflow-x: auto;
    margin: 12px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }

  .apk-ai-tab {
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 13px;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.2s;
  }

  .apk-ai-tab.active {
    background: #1890ff;
    color: white;
  }

  .apk-ai-tab:not(.active) {
    background: #f5f5f5;
    color: #666;
  }

  .apk-ai-input {
    margin: 12px;
    background: white;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }

  .apk-ai-input-box {
    border: 1px solid #e8e8e8;
    border-radius: 12px;
    padding: 12px;
    min-height: 80px;
    resize: none;
    width: 100%;
    font-size: 14px;
    outline: none;
  }

  .apk-ai-input-box:focus {
    border-color: #1890ff;
  }

  .apk-ai-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
  }

  .apk-ai-templates {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .apk-ai-template {
    padding: 6px 12px;
    background: #f0f5ff;
    color: #1890ff;
    border-radius: 16px;
    font-size: 12px;
    white-space: nowrap;
    cursor: pointer;
  }

  .apk-ai-generate-btn {
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
    color: white;
    border: none;
    padding: 10px 24px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .apk-ai-generate-btn:active {
    opacity: 0.8;
  }

  .apk-ai-results {
    margin: 12px;
  }

  .apk-ai-result-item {
    background: white;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }

  .apk-ai-result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .apk-ai-result-type {
    font-size: 12px;
    color: #1890ff;
    background: #e6f7ff;
    padding: 4px 10px;
    border-radius: 4px;
  }

  .apk-ai-result-time {
    font-size: 12px;
    color: #999;
  }

  .apk-ai-result-content {
    font-size: 14px;
    color: #333;
    line-height: 1.6;
    margin-bottom: 12px;
  }

  .apk-ai-result-actions {
    display: flex;
    gap: 10px;
  }

  .apk-ai-result-btn {
    flex: 1;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 13px;
    text-align: center;
    cursor: pointer;
    border: none;
  }

  .apk-ai-result-btn.primary {
    background: #1890ff;
    color: white;
  }

  .apk-ai-result-btn.secondary {
    background: #f5f5f5;
    color: #666;
  }

  /* 我的 Tab */
  .apk-profile-header {
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
    padding: 20px;
    padding-top: max(20px, env(safe-area-inset-top));
    color: white;
  }

  .apk-profile-info {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .apk-profile-avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    color: white;
  }

  .apk-profile-details h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  .apk-profile-details p {
    margin: 4px 0 0;
    font-size: 13px;
    opacity: 0.8;
  }

  .apk-profile-menu {
    margin: 12px;
  }

  .apk-menu-group {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }

  .apk-menu-item {
    display: flex;
    align-items: center;
    padding: 14px 16px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .apk-menu-item:active {
    background: #f5f5f5;
  }

  .apk-menu-item:not(:last-child) {
    border-bottom: 1px solid #f0f0f0;
  }

  .apk-menu-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    margin-right: 12px;
  }

  .apk-menu-icon.blue { background: #e6f7ff; color: #1890ff; }
  .apk-menu-icon.green { background: #f6ffed; color: #52c41a; }
  .apk-menu-icon.orange { background: #fff7e6; color: #fa8c16; }
  .apk-menu-icon.purple { background: #f9f0ff; color: #722ed1; }
  .apk-menu-icon.red { background: #fff1f0; color: #ff4d4f; }
  .apk-menu-icon.cyan { background: #e6fffb; color: #13c2c2; }

  .apk-menu-text {
    flex: 1;
    font-size: 15px;
    color: #333;
  }

  .apk-menu-badge {
    background: #ff4d4f;
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 10px;
    margin-right: 8px;
  }

  .apk-menu-arrow {
    color: #ccc;
    font-size: 14px;
  }

  .apk-invite-section {
    background: linear-gradient(135deg, #1890ff 0%, #722ed1 100%);
    margin: 12px;
    border-radius: 12px;
    padding: 20px;
    color: white;
  }

  .apk-invite-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 6px;
  }

  .apk-invite-desc {
    font-size: 13px;
    opacity: 0.9;
    margin-bottom: 14px;
  }

  .apk-invite-btn {
    background: white;
    color: #1890ff;
    border: none;
    padding: 10px 20px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
  }

  .apk-login-page {
    min-height: 100vh;
    background: linear-gradient(180deg, #1890ff 0%, #096dd9 50%, #f5f5f5 50%);
    display: flex;
    flex-direction: column;
  }

  .apk-login-header {
    padding: 60px 20px 40px;
    text-align: center;
    color: white;
  }

  .apk-login-logo {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .apk-login-title {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .apk-login-subtitle {
    font-size: 14px;
    opacity: 0.9;
  }

  .apk-login-form {
    flex: 1;
    background: white;
    margin: 0 16px;
    border-radius: 16px 16px 0 0;
    padding: 24px 20px;
  }

  .apk-login-input {
    width: 100%;
    padding: 14px 16px;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    font-size: 15px;
    margin-bottom: 12px;
    outline: none;
  }

  .apk-login-input:focus {
    border-color: #1890ff;
  }

  .apk-login-btn {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 8px;
  }

  .apk-login-btn:active {
    opacity: 0.9;
  }

  .apk-login-links {
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
    font-size: 14px;
  }

  .apk-login-links a {
    color: #1890ff;
    text-decoration: none;
  }

  .apk-tabs-content {
    display: none;
  }

  .apk-tabs-content.active {
    display: block;
  }
`;

// Mock 数据
const mockStats = {
  publishCount: 128,
  customerCount: 45,
  recommendCount: 23,
  chatCount: 156,
};

const mockModules = [
  { name: '自媒体运营', icon: <VideoCameraOutlined />, color: 'media', path: '/media/factory' },
  { name: '招聘助手', icon: <TeamOutlined />, color: 'recruit', path: '/recruitment/board' },
  { name: '智能获客', icon: <FireOutlined />, color: 'acquisition', path: '/acquisition/board' },
  { name: '推荐分享', icon: <ShareAltOutlined />, color: 'share', path: '/share/board' },
];

const mockQuickActions = [
  { name: '批量剪辑', icon: <VideoCameraOutlined /> },
  { name: '智能文案', icon: <FileTextOutlined /> },
  { name: '发布记录', icon: <PictureOutlined /> },
  { name: '素材库', icon: <ScanOutlined /> },
];

const mockDataCards = [
  { label: '发布量', value: '128', trend: '+12%', trendType: 'up', icon: '📤', color: '#1890ff' },
  { label: '获客数', value: '45', trend: '+8%', trendType: 'up', icon: '👥', color: '#52c41a' },
  { label: '推荐转化', value: '23', trend: '-3%', trendType: 'down', icon: '🔗', color: '#fa8c16' },
  { label: '沟通人数', value: '156', trend: '+15%', trendType: 'up', icon: '💬', color: '#722ed1' },
];

const mockTemplates = [
  '爆款标题', '直播脚本', '招聘文案', '获客话术', '产品介绍', '活动策划'
];

const mockResults = [
  {
    type: '小红书文案',
    time: '2分钟前',
    content: '🔥 打工人的周末神器！这个APP让我多睡2小时...',
  },
  {
    type: '短视频脚本',
    time: '10分钟前',
    content: '【开场】老板：听说你们公司用了AI？员工：是的！效率提升了300%...',
  },
];

type TabType = 'home' | 'ai' | 'profile';

export default function APKPage() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [aiTab, setAiTab] = useState('text');
  const [aiInput, setAiInput] = useState('');

  // 模拟登录
  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  // 渲染登录页
  const renderLoginPage = () => (
    <div className="apk-login-page">
      <style>{mobileStyles}</style>
      <div className="apk-login-header">
        <div className="apk-login-logo">🤖</div>
        <div className="apk-login-title">智枢 AI</div>
        <div className="apk-login-subtitle">用AI赋能企业，让商业更智能</div>
      </div>
      <div className="apk-login-form">
        <input
          type="tel"
          className="apk-login-input"
          placeholder="请输入手机号"
        />
        <input
          type="password"
          className="apk-login-input"
          placeholder="请输入密码"
        />
        <button className="apk-login-btn" onClick={handleLogin}>
          登录
        </button>
        <div className="apk-login-links">
          <a href="#">忘记密码</a>
          <a href="#">注册账号</a>
        </div>
      </div>
    </div>
  );

  // 渲染首页 Tab
  const renderHomeTab = () => (
    <>
      <div className="apk-header">
        <div className="apk-header-top">
          <div className="apk-welcome">下午好，智枢科技 👋</div>
          <div className="apk-header-actions">
            <Badge count={3} size="small">
              <BellOutlined style={{ fontSize: 20 }} />
            </Badge>
          </div>
        </div>
        <div className="apk-stat-cards">
          <div className="apk-stat-item">
            <div className="apk-stat-value">128</div>
            <div className="apk-stat-label">发布量</div>
          </div>
          <div className="apk-stat-item">
            <div className="apk-stat-value">45</div>
            <div className="apk-stat-label">获客数</div>
          </div>
          <div className="apk-stat-item">
            <div className="apk-stat-value">23</div>
            <div className="apk-stat-label">推荐数</div>
          </div>
          <div className="apk-stat-item">
            <div className="apk-stat-value">156</div>
            <div className="apk-stat-label">沟通数</div>
          </div>
        </div>
      </div>

      <div className="apk-notice">
        <ExclamationCircleOutlined className="apk-notice-icon" />
        <div className="apk-notice-content">
          📢 系统将于今晚22:00-23:00进行升级维护
        </div>
      </div>

      <div className="apk-module-grid">
        {mockModules.map((module) => (
          <div key={module.name} className="apk-module-item">
            <div className={`apk-module-icon ${module.color}`}>
              {module.icon}
            </div>
            <span className="apk-module-name">{module.name}</span>
          </div>
        ))}
      </div>

      <div className="apk-section">
        <div className="apk-section-title">
          快捷操作 <span>最近使用</span>
        </div>
      </div>
      <div className="apk-quick-actions">
        {mockQuickActions.map((action) => (
          <div key={action.name} className="apk-quick-item">
            <div className="apk-quick-icon">{action.icon}</div>
            <span className="apk-quick-name">{action.name}</span>
          </div>
        ))}
      </div>

      <div className="apk-section">
        <div className="apk-section-title">
          数据摘要 <span>近7天</span>
        </div>
      </div>
      <div className="apk-data-cards">
        {mockDataCards.map((card) => (
          <div key={card.label} className="apk-data-card">
            <div className="apk-data-card-header">
              <div
                className="apk-data-card-icon"
                style={{ background: `${card.color}20`, color: card.color }}
              >
                {card.icon}
              </div>
              <span className={`apk-data-card-trend ${card.trendType}`}>
                {card.trend}
              </span>
            </div>
            <div className="apk-data-card-value">{card.value}</div>
            <div className="apk-data-card-label">{card.label}</div>
          </div>
        ))}
      </div>
      <div style={{ height: 20 }} />
    </>
  );

  // 渲染AI创作 Tab
  const renderAITab = () => (
    <>
      <div style={{ background: 'white', padding: '16px' }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>AI 创作中心</div>
        <div style={{ fontSize: 13, color: '#666' }}>选择创作类型，输入需求，AI为您生成内容</div>
      </div>

      <div className="apk-ai-tabs">
        {['文字生成', '图片生成', '视频生成', '批量剪辑', '数字人'].map((tab) => (
          <div
            key={tab}
            className={`apk-ai-tab ${aiTab === tab ? 'active' : ''}`}
            onClick={() => setAiTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>

      <div className="apk-ai-input">
        <textarea
          className="apk-ai-input-box"
          placeholder="请描述您的创作需求..."
          value={aiInput}
          onChange={(e) => setAiInput(e.target.value)}
        />
        <div className="apk-ai-actions">
          <div className="apk-ai-templates">
            {mockTemplates.map((t) => (
              <div key={t} className="apk-ai-template">{t}</div>
            ))}
          </div>
          <button className="apk-ai-generate-btn">
            <BulbOutlined /> 生成
          </button>
        </div>
      </div>

      <div className="apk-ai-results">
        <div className="apk-section-title">生成记录</div>
        {mockResults.map((result, index) => (
          <div key={index} className="apk-ai-result-item">
            <div className="apk-ai-result-header">
              <span className="apk-ai-result-type">{result.type}</span>
              <span className="apk-ai-result-time">{result.time}</span>
            </div>
            <div className="apk-ai-result-content">{result.content}</div>
            <div className="apk-ai-result-actions">
              <button className="apk-ai-result-btn secondary">保存到素材库</button>
              <button className="apk-ai-result-btn primary">直接发布</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ height: 20 }} />
    </>
  );

  // 渲染我的 Tab
  const renderProfileTab = () => (
    <>
      <div className="apk-profile-header">
        <div className="apk-profile-info">
          <div className="apk-profile-avatar">
            <UserOutlined />
          </div>
          <div className="apk-profile-details">
            <h3>张三</h3>
            <p>📱 138****8888</p>
          </div>
        </div>
      </div>

      <div className="apk-invite-section">
        <div className="apk-invite-title">邀请好友赚奖励</div>
        <div className="apk-invite-desc">每成功邀请1位好友，最高奖励100元</div>
        <button className="apk-invite-btn">立即邀请</button>
      </div>

      <div className="apk-profile-menu">
        <div className="apk-menu-group">
          <div className="apk-menu-item">
            <div className="apk-menu-icon blue"><UserOutlined /></div>
            <span className="apk-menu-text">个人信息</span>
            <RightOutlined className="apk-menu-arrow" />
          </div>
          <div className="apk-menu-item">
            <div className="apk-menu-icon green"><WalletOutlined /></div>
            <span className="apk-menu-text">我的套餐</span>
            <span className="apk-menu-badge">VIP</span>
            <RightOutlined className="apk-menu-arrow" />
          </div>
          <div className="apk-menu-item">
            <div className="apk-menu-icon orange"><TeamOutlined /></div>
            <span className="apk-menu-text">员工管理</span>
            <RightOutlined className="apk-menu-arrow" />
          </div>
        </div>

        <div className="apk-menu-group">
          <div className="apk-menu-item">
            <div className="apk-menu-icon purple"><ShareAltOutlined /></div>
            <span className="apk-menu-text">我的推荐</span>
            <RightOutlined className="apk-menu-arrow" />
          </div>
          <div className="apk-menu-item">
            <div className="apk-menu-icon cyan"><ScanOutlined /></div>
            <span className="apk-menu-text">推荐追踪</span>
            <RightOutlined className="apk-menu-arrow" />
          </div>
        </div>

        <div className="apk-menu-group">
          <div className="apk-menu-item">
            <div className="apk-menu-icon blue"><SettingOutlined /></div>
            <span className="apk-menu-text">主题设置</span>
            <RightOutlined className="apk-menu-arrow" />
          </div>
          <div className="apk-menu-item">
            <div className="apk-menu-icon green"><CustomerServiceOutlined /></div>
            <span className="apk-menu-text">帮助与客服</span>
            <RightOutlined className="apk-menu-arrow" />
          </div>
          <div className="apk-menu-item">
            <div className="apk-menu-icon orange"><QuestionCircleOutlined /></div>
            <span className="apk-menu-text">关于我们</span>
            <RightOutlined className="apk-menu-arrow" />
          </div>
          <div className="apk-menu-item">
            <div className="apk-menu-icon red"><LogoutOutlined /></div>
            <span className="apk-menu-text">退出登录</span>
            <RightOutlined className="apk-menu-arrow" />
          </div>
        </div>
      </div>
      <div style={{ height: 20 }} />
    </>
  );

  // 未登录状态
  if (!isLoggedIn) {
    return renderLoginPage();
  }

  return (
    <ConfigProvider>
      <style>{mobileStyles}</style>
      <div className="apk-container">
        {/* 内容区 */}
        <div className="apk-tabs-content active">
          {activeTab === 'home' && renderHomeTab()}
          {activeTab === 'ai' && renderAITab()}
          {activeTab === 'profile' && renderProfileTab()}
        </div>

        {/* 底部导航 */}
        <div className="apk-bottom-nav">
          <div
            className={`apk-nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <HomeOutlined />
            <span>首页</span>
          </div>
          <div
            className={`apk-nav-item ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            <BulbOutlined />
            <span>AI创作</span>
          </div>
          <div
            className={`apk-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <UserOutlined />
            <span>我的</span>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
