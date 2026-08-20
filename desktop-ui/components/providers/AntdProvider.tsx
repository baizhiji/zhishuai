'use client';

import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

/**
 * 智枢AI 全局主题 —— 紫色品牌 · 商务科技风
 * 主色 #6D28D9 (violet-700)，深紫品牌 #4C1D95，浅紫底 #F4F1FA
 */
export default function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#6D28D9',
          colorInfo: '#6D28D9',
          colorLink: '#5B21B6',
          colorSuccess: '#16A34A',
          colorWarning: '#F59E0B',
          colorError: '#DC2626',
          colorBgLayout: '#F4F1FA',
          colorBgContainer: '#FFFFFF',
          colorBgElevated: '#FFFFFF',
          colorBorder: '#E5D9F5',
          colorBorderSecondary: '#EDE7F8',
          colorText: '#1F1B2E',
          colorTextSecondary: '#5D5873',
          borderRadius: 8,
          borderRadiusLG: 12,
          borderRadiusSM: 6,
          fontSize: 14,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif",
          boxShadow: '0 2px 12px rgba(76, 29, 149, 0.06)',
          boxShadowSecondary: '0 6px 24px rgba(76, 29, 149, 0.12)',
          controlHeight: 34,
          controlHeightLG: 40,
        },
        components: {
          Layout: {
            headerBg: 'transparent',
            headerHeight: 56,
            headerPadding: '0 24px',
            bodyBg: 'transparent',
            siderBg: 'transparent',
          },
          Menu: {
            itemBorderRadius: 8,
            itemHeight: 42,
            itemMarginInline: 8,
            darkItemBg: 'transparent',
            darkItemColor: 'rgba(255,255,255,0.72)',
            darkItemHoverBg: 'rgba(124,58,237,0.18)',
            darkItemHoverColor: '#FFFFFF',
            darkItemSelectedBg: 'rgba(124,58,237,0.28)',
            darkItemSelectedColor: '#FFFFFF',
            darkSubMenuItemBg: 'rgba(0,0,0,0.18)',
            subMenuItemBorderRadius: 8,
          },
          Button: {
            primaryShadow: '0 4px 14px rgba(109,40,217,0.32)',
            fontWeight: 500,
            defaultShadow: 'none',
            primaryColor: '#FFFFFF',
          },
          Card: {
            headerBg: 'transparent',
            bodyPadding: 20,
          },
          Table: {
            headerBg: 'linear-gradient(90deg, #F3EDFF 0%, #EFE7FF 100%)',
            headerColor: '#4C1D95',
            headerSplitColor: 'transparent',
            rowHoverBg: '#F8F5FF',
            borderColor: '#F0E9FB',
            cellPaddingBlock: 12,
          },
          Modal: {
            headerBg: '#FFFFFF',
            contentBg: '#FFFFFF',
            titleFontSize: 16,
          },
          Tabs: {
            titleFontSize: 14,
            itemActiveColor: '#6D28D9',
            itemSelectedColor: '#6D28D9',
            itemHoverColor: '#7C3AED',
            inkBarColor: '#6D28D9',
          },
          Statistic: {
            titleFontSize: 14,
            contentFontSize: 26,
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
