'use client';

/**
 * 功能开关配置页面
 * Admin 可以在这里配置全局功能开关
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Switch,
  Button,
  Space,
  message,
  Tag,
  Tooltip,
  Descriptions,
  Badge,
  Modal,
  Select,
  Table,
  Divider,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SaveOutlined,
  UnorderedListOutlined,
  SettingOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { featureToggles, FeatureToggle } from '@/lib/permissions/config';
import { useUser } from '@/components/auth';

const { Title, Text, Paragraph } = Typography;

// 客户配置类型
interface TenantFeatureConfig {
  tenantId: string;
  tenantName: string;
  features: Record<string, boolean>;
}

// Mock客户数据
const mockTenants = [
  { id: 't001', name: '张三的公司', features: {}, tenantId: 't001', tenantName: '张三的公司' },
  { id: 't002', name: '李四的企业', features: {}, tenantId: 't002', tenantName: '李四的企业' },
  { id: 't003', name: '王五的工作室', features: {}, tenantId: 't003', tenantName: '王五的工作室' },
];

// 表格数据源类型
type TenantRow = typeof mockTenants[0];

export default function FeatureConfigPage() {
  const { featureToggles: currentToggles, setFeatureToggles } = useUser();
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [tenantModalVisible, setTenantModalVisible] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [tenantConfigs, setTenantConfigs] = useState<Record<string, Record<string, boolean>>>({});

  // 初始化开关状态
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    featureToggles.forEach(ft => {
      initial[ft.key] = currentToggles[ft.key] ?? ft.defaultEnabled;
    });
    setToggles(initial);
  }, []);

  // 更新单个开关
  const handleToggle = (key: string, checked: boolean) => {
    setToggles(prev => ({
      ...prev,
      [key]: checked,
    }));
  };

  // 保存全局配置
  const handleSaveGlobal = () => {
    setLoading(true);
    // 模拟API调用
    setTimeout(() => {
      setFeatureToggles(toggles);
      message.success('全局功能开关配置已保存');
      setLoading(false);
    }, 500);
  };

  // 重置为默认
  const handleReset = () => {
    const defaults: Record<string, boolean> = {};
    featureToggles.forEach(ft => {
      defaults[ft.key] = ft.defaultEnabled;
    });
    setToggles(defaults);
    message.info('已重置为默认配置');
  };

  // 批量开启/关闭
  const handleBatchToggle = (enabled: boolean) => {
    const updated: Record<string, boolean> = {};
    featureToggles.forEach(ft => {
      // 不修改预留模块
      if (['ecommerce', 'crm', 'marketing'].includes(ft.key)) {
        updated[ft.key] = ft.defaultEnabled;
      } else {
        updated[ft.key] = enabled;
      }
    });
    setToggles(updated);
    message.success(`已${enabled ? '开启' : '关闭'}所有功能`);
  };

  // 客户级别配置相关
  const handleOpenTenantConfig = (tenantId: string) => {
    setSelectedTenant(tenantId);
    setTenantModalVisible(true);
  };

  const handleSaveTenantConfig = () => {
    if (selectedTenant) {
      setTenantConfigs(prev => ({
        ...prev,
        [selectedTenant]: toggles,
      }));
      message.success('客户功能配置已保存');
    }
    setTenantModalVisible(false);
  };

  const tenantColumns: ColumnsType<TenantRow> = [
    {
      title: '客户名称',
      dataIndex: 'tenantName',
      key: 'tenantName',
    },
    {
      title: '配置状态',
      key: 'status',
      render: (_, record) => (
        <Badge
          status={tenantConfigs[record.tenantId] ? 'success' : 'default'}
          text={tenantConfigs[record.tenantId] ? '已自定义' : '使用全局'}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => handleOpenTenantConfig(record.tenantId)}
        >
          配置
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* 页面标题 */}
      <Card
        style={{ marginBottom: 24 }}
        title={
          <Space>
            <ExperimentOutlined />
            <span>功能开关总控</span>
          </Space>
        }
        extra={
          <Space>
            <Button onClick={() => handleBatchToggle(true)}>批量开启</Button>
            <Button onClick={() => handleBatchToggle(false)}>批量关闭</Button>
            <Button onClick={handleReset}>重置默认</Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={loading}
              onClick={handleSaveGlobal}
            >
              保存全局配置
            </Button>
          </Space>
        }
      >
        <Paragraph type="secondary">
          在此页面可以控制全局功能模块的启用/禁用。开启的功能将对所有客户可见，关闭的功能将隐藏。
          客户级别配置可以覆盖全局设置。
        </Paragraph>

        {/* 功能开关列表 */}
        <Row gutter={[16, 16]}>
          {featureToggles.map(ft => (
            <Col xs={24} sm={12} md={8} lg={6} key={ft.key}>
              <Card
                size="small"
                style={{
                  borderColor: toggles[ft.key] ? '#52c41a' : '#f0f0f0',
                  background: toggles[ft.key] ? '#f6ffed' : '#fafafa',
                }}
                actions={[
                  <Switch
                    key="switch"
                    checked={toggles[ft.key]}
                    onChange={(checked) => handleToggle(ft.key, checked)}
                    checkedChildren={<CheckCircleOutlined />}
                    unCheckedChildren={<CloseCircleOutlined />}
                  />,
                ]}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: 8 }}>
                    {toggles[ft.key] ? (
                      <Tag color="success">已开启</Tag>
                    ) : (
                      <Tag color="default">已关闭</Tag>
                    )}
                  </div>
                  <Text strong style={{ fontSize: 16 }}>{ft.name}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {ft.description}
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 客户级别配置 */}
      <Card
        title={
          <Space>
            <SettingOutlined />
            <span>客户功能配置</span>
          </Space>
        }
        extra={
          <Button
            icon={<UnorderedListOutlined />}
            onClick={() => setTenantModalVisible(true)}
          >
            管理客户配置
          </Button>
        }
      >
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="全局开关控制">
            <Space>
              <Badge status="success" text="自媒体运营" />
              <Badge status="success" text="招聘助手" />
              <Badge status="success" text="智能获客" />
              <Badge status="success" text="推荐分享" />
              <Badge status="default" text="电商运营(预留)" />
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="客户覆盖">
            <Text type="secondary">
              已配置 {Object.keys(tenantConfigs).length} 个客户
            </Text>
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <Title level={5}>功能模块状态概览</Title>
        <Row gutter={16}>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="已开启"
                value={Object.values(toggles).filter(Boolean).length}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="已关闭"
                value={Object.values(toggles).filter(v => !v).length}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="已配置客户"
                value={Object.keys(tenantConfigs).length}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="功能模块总数"
                value={featureToggles.length}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 客户列表弹窗 */}
      <Modal
        title="客户功能配置"
        open={tenantModalVisible}
        onCancel={() => setTenantModalVisible(false)}
        footer={null}
        width={800}
      >
        <Table
          columns={tenantColumns}
          dataSource={mockTenants.map(t => ({
            ...t,
            key: t.id,
          }))}
          pagination={false}
        />
      </Modal>
    </div>
  );
}

// 简单的统计组件
function Statistic({
  title,
  value,
  valueStyle,
}: {
  title: string;
  value: number;
  valueStyle?: React.CSSProperties;
}) {
  return (
    <div>
      <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: 14 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 600, ...valueStyle }}>{value}</div>
    </div>
  );
}
