'use client';

import React, { useState } from 'react';
import {
  Layout,
  List,
  Switch,
  Divider,
  Button,
  Modal,
  Input,
  Form,
  Select,
  Avatar,
  message,
  Card,
} from 'antd';
import {
  UserOutlined,
  SafetyOutlined,
  BellOutlined,
  BgColorsOutlined,
  GlobalOutlined,
  QuestionCircleOutlined,
  InfoCircleOutlined,
  LogoutOutlined,
  PhoneOutlined,
  LockOutlined,
  PayCircleOutlined,
  ExportOutlined,
  RightOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import './styles.css';

const { Content } = Layout;
const { confirm } = Modal;

// 设置项配置
const settingItems = [
  {
    title: '账号设置',
    icon: <UserOutlined />,
    items: [
      { key: 'profile', label: '个人信息', icon: <UserOutlined />, arrow: true },
      { key: 'phone', label: '手机号', icon: <PhoneOutlined />, value: '138****8888', arrow: true },
      { key: 'password', label: '登录密码', icon: <LockOutlined />, value: '已设置', arrow: true },
      { key: 'payment', label: '支付密码', icon: <PayCircleOutlined />, value: '未设置', arrow: true },
    ],
  },
  {
    title: '偏好设置',
    icon: <BellOutlined />,
    items: [
      { key: 'notifications', label: '消息通知', icon: <BellOutlined />, switch: true, defaultChecked: true },
      { key: 'sound', label: '声音提示', icon: <BellOutlined />, switch: true, defaultChecked: false },
      { key: 'theme', label: '深色模式', icon: <BgColorsOutlined />, switch: true, defaultChecked: false },
      { key: 'language', label: '语言', icon: <GlobalOutlined />, value: '简体中文', arrow: true },
    ],
  },
  {
    title: '其他',
    icon: <QuestionCircleOutlined />,
    items: [
      { key: 'help', label: '帮助中心', icon: <QuestionCircleOutlined />, arrow: true },
      { key: 'about', label: '关于我们', icon: <InfoCircleOutlined />, arrow: true },
      { key: 'feedback', label: '意见反馈', icon: <InfoCircleOutlined />, arrow: true },
      { key: 'clear', label: '清理缓存', icon: <ExportOutlined />, value: '23.5MB' },
    ],
  },
];

// 设置页面组件
const SettingItem: React.FC<{
  item: typeof settingItems[0]['items'][0];
  onClick: (key: string) => void;
  onSwitchChange: (key: string, checked: boolean) => void;
}> = ({ item, onClick, onSwitchChange }) => (
  <div
    className={`setting-item ${item.arrow ? 'clickable' : ''}`}
    onClick={() => item.arrow && onClick(item.key)}
  >
    <div className="setting-item-left">
      <span className="setting-icon">{item.icon}</span>
      <span className="setting-label">{item.label}</span>
    </div>
    <div className="setting-item-right">
      {item.switch ? (
        <Switch
          size="small"
          defaultChecked={item.defaultChecked}
          onChange={(checked) => onSwitchChange(item.key, checked)}
        />
      ) : item.value ? (
        <span className="setting-value">{item.value}</span>
      ) : null}
      {item.arrow && <RightOutlined className="setting-arrow" />}
    </div>
  </div>
);

// 主组件
const SettingsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // 处理设置项点击
  const handleSettingClick = (key: string) => {
    switch (key) {
      case 'profile':
        setActiveSection('profile');
        break;
      case 'phone':
        setActiveSection('phone');
        break;
      case 'password':
        setActiveSection('password');
        break;
      case 'help':
        message.info('帮助中心即将上线');
        break;
      case 'about':
        message.info('版本 v1.0.0');
        break;
      case 'feedback':
        setActiveSection('feedback');
        break;
      case 'clear':
        Modal.confirm({
          title: '确认清理',
          content: '确定要清理缓存吗？',
          onOk: () => {
            message.success('缓存已清理');
          },
        });
        break;
      default:
        message.info('功能即将上线');
    }
  };

  // 处理开关切换
  const handleSwitchChange = (key: string, checked: boolean) => {
    switch (key) {
      case 'notifications':
        message.success(checked ? '已开启消息通知' : '已关闭消息通知');
        break;
      case 'sound':
        message.success(checked ? '已开启声音提示' : '已关闭声音提示');
        break;
      case 'theme':
        message.success(checked ? '已开启深色模式' : '已关闭深色模式');
        break;
    }
  };

  // 退出登录
  const handleLogout = () => {
    confirm({
      title: '确认退出',
      content: '确定要退出登录吗？',
      okText: '退出',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        message.success('已退出登录');
        // 实际应该跳转到登录页
      },
    });
  };

  return (
    <Layout className="apk-layout">
      <Content className="apk-content">
        {/* 用户信息卡片 */}
        <div className="profile-card">
          <div className="profile-info">
            <Avatar
              size={64}
              icon={<UserOutlined />}
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
              className="profile-avatar"
            />
            <div className="profile-detail">
              <h3>张明</h3>
              <p>ID: 13888888</p>
              <span className="member-badge">高级会员</span>
            </div>
          </div>
          <Button type="primary" shape="round" size="small" className="edit-btn">
            编辑资料
          </Button>
        </div>

        {/* 设置分组 */}
        <div className="settings-group">
          {settingItems.map((section) => (
            <div key={section.title} className="setting-section">
              <div className="section-title">{section.title}</div>
              <div className="section-content">
                {section.items.map((item) => (
                  <SettingItem
                    key={item.key}
                    item={item}
                    onClick={handleSettingClick}
                    onSwitchChange={handleSwitchChange}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 退出登录 */}
        <div className="logout-section">
          <Button
            type="text"
            danger
            block
            size="large"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            className="logout-btn"
          >
            退出登录
          </Button>
        </div>

        {/* 版本信息 */}
        <div className="version-info">
          <p>智枢AI v1.0.0</p>
          <p>© 2024 智枢科技 版权所有</p>
        </div>

        {/* 个人信息弹窗 */}
        <Modal
          title="编辑资料"
          open={activeSection === 'profile'}
          onCancel={() => setActiveSection(null)}
          footer={[
            <Button key="cancel" onClick={() => setActiveSection(null)}>
              取消
            </Button>,
            <Button key="submit" type="primary" onClick={() => {
              message.success('保存成功');
              setActiveSection(null);
            }}>
              保存
            </Button>,
          ]}
          className="apk-modal"
        >
          <Form layout="vertical">
            <Form.Item label="昵称">
              <Input defaultValue="张明" />
            </Form.Item>
            <Form.Item label="简介">
              <Input.TextArea rows={3} placeholder="介绍一下自己..." />
            </Form.Item>
          </Form>
        </Modal>

        {/* 意见反馈弹窗 */}
        <Modal
          title="意见反馈"
          open={activeSection === 'feedback'}
          onCancel={() => setActiveSection(null)}
          footer={[
            <Button key="cancel" onClick={() => setActiveSection(null)}>
              取消
            </Button>,
            <Button key="submit" type="primary" onClick={() => {
              message.success('感谢您的反馈');
              setActiveSection(null);
            }}>
              提交
            </Button>,
          ]}
          className="apk-modal"
        >
          <Form layout="vertical">
            <Form.Item label="反馈类型">
              <Select
                placeholder="请选择"
                options={[
                  { value: 'bug', label: '功能问题' },
                  { value: 'suggest', label: '功能建议' },
                  { value: 'other', label: '其他' },
                ]}
              />
            </Form.Item>
            <Form.Item label="反馈内容">
              <Input.TextArea rows={4} placeholder="请详细描述您的问题或建议..." />
            </Form.Item>
            <Form.Item label="联系方式（选填）">
              <Input placeholder="手机号或邮箱" />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default SettingsPage;
