'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layout, Menu, Button, Dropdown, Space } from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  ToolOutlined,
  QuestionCircleOutlined,
  RobotOutlined,
  PlayCircleOutlined,
  TeamOutlined,
  ShoppingOutlined,
  MessageOutlined,
  FileTextOutlined,
  BarChartOutlined,
  RocketOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import styles from './layout.module.css';

const { Header, Content, Footer } = Layout;

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link href="/">首页</Link>,
    },
    {
      key: '/features',
      icon: <RocketOutlined />,
      label: <Link href="/features">功能介绍</Link>,
    },
    {
      key: '/pricing',
      icon: <BarChartOutlined />,
      label: <Link href="/pricing">价格方案</Link>,
    },
    {
      key: '/about',
      icon: <TeamOutlined />,
      label: <Link href="/about">关于我们</Link>,
    },
    {
      key: '/help',
      icon: <QuestionCircleOutlined />,
      label: <Link href="/help">帮助中心</Link>,
    },
  ];

  const userMenuItems = [
    { key: 'login', label: <Link href="/login">登录</Link> },
    { key: 'register', label: <Link href="/register">注册</Link> },
  ];

  return (
    <Layout className={styles.layout}>
      <Header className={styles.header}>
        <div className={styles.logo}>
          <RocketOutlined style={{ fontSize: 24, color: '#1890ff', marginRight: 8 }} />
          <span className={styles.logoText}>智枢 AI</span>
        </div>
        <Menu
          mode="horizontal"
          selectedKeys={[pathname]}
          items={menuItems}
          className={styles.menu}
        />
        <Space className={styles.actions}>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button type="primary">开始使用</Button>
          </Dropdown>
        </Space>
      </Header>
      <Content className={styles.content}>
        {children}
      </Content>
      <Footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h4>产品功能</h4>
            <ul>
              <li><Link href="/features#matrix">矩阵管理</Link></li>
              <li><Link href="/features#ai-content">AI内容生成</Link></li>
              <li><Link href="/features#recruitment">智能招聘</Link></li>
              <li><Link href="/features#acquisition">智能获客</Link></li>
            </ul>
          </div>
          <div className={styles.footerSection}>
            <h4>帮助支持</h4>
            <ul>
              <li><Link href="/help">使用文档</Link></li>
              <li><Link href="/help#faq">常见问题</Link></li>
              <li><Link href="/help#contact">联系我们</Link></li>
              <li><Link href="/api-test">API测试</Link></li>
            </ul>
          </div>
          <div className={styles.footerSection}>
            <h4>关于我们</h4>
            <ul>
              <li><Link href="/about">公司介绍</Link></li>
              <li><Link href="/about#team">团队成员</Link></li>
              <li><Link href="/about#contact">联系方式</Link></li>
            </ul>
          </div>
          <div className={styles.footerSection}>
            <h4>联系我们</h4>
            <ul>
              <li>客服电话：400-888-8888</li>
              <li>邮箱：support@baizhiji.net</li>
              <li>地址：北京市海淀区中关村</li>
            </ul>
          </div>
        </div>
        <div className={styles.copyright}>
          © 2024 智枢 AI SaaS 系统 版权所有
        </div>
      </Footer>
    </Layout>
  );
}
