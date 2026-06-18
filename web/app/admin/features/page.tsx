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
  Table,
  Divider,
  Spin,
  Popconfirm,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SaveOutlined,
  UnorderedListOutlined,
  SettingOutlined,
  ExperimentOutlined,
  ReloadOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { featureToggles, FeatureToggle, SubFeature } from '@/lib/permissions/config';
import api from '@/services/api';

const { Title, Text, Paragraph } = Typography;

// 客户配置类型
interface TenantFeatureConfig {
  tenantId: string;
  tenantName: string;
  features: Record<string, boolean>;
}

// 表格数据源类型
interface AgentCustomer {
  id: string;
  phone: string;
  name?: string;
  avatar?: string;
  status: string;
  createdAt: string;
}

export default function FeatureConfigPage() {
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [subToggles, setSubToggles] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [tenantModalVisible, setTenantModalVisible] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [tenantConfigs, setTenantConfigs] = useState<Record<string, Record<string, boolean>>>({});
  const [agents, setAgents] = useState<any[]>([]);
  const [agentCustomers, setAgentCustomers] = useState<AgentCustomer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // 获取功能开关数据
  const fetchFeatures = async () => {
    try {
      setFetchLoading(true);
      const res = await api.features.getFeatures();
      if (res.data?.data) {
        const features = res.data.data;
        const togglesMap: Record<string, boolean> = {};
        const subTogglesMap: Record<string, Record<string, boolean>> = {};

        features.forEach((f: any) => {
          togglesMap[f.code] = f.enabled;
          subTogglesMap[f.code] = {};
          (f.subFeatures || []).forEach((sub: any) => {
            subTogglesMap[f.code][sub.code] = sub.enabled;
          });
        });

        setToggles(togglesMap);
        setSubToggles(subTogglesMap);
        message.success('功能开关数据加载成功');
      }
    } catch (error: any) {
      console.error('获取功能开关失败:', error);
      // 如果API失败，使用默认配置
      const defaults: Record<string, boolean> = {};
      const subDefaults: Record<string, Record<string, boolean>> = {};
      featureToggles.forEach(ft => {
        defaults[ft.key] = ft.defaultEnabled;
        subDefaults[ft.key] = {};
        (ft.subFeatures || []).forEach(sub => {
          subDefaults[ft.key][sub.code] = sub.defaultEnabled;
        });
      });
      setToggles(defaults);
      setSubToggles(subDefaults);
      message.warning('使用默认配置，请确保后端API已启动');
    } finally {
      setFetchLoading(false);
    }
  };

  // 初始化开关状态
  useEffect(() => {
    fetchFeatures();
  }, []);

  // 更新单个功能开关
  const handleToggle = (key: string, checked: boolean) => {
    setToggles(prev => ({
      ...prev,
      [key]: checked,
    }));
  };

  // 更新子功能开关
  const handleSubToggle = (featureKey: string, subCode: string, checked: boolean) => {
    setSubToggles(prev => ({
      ...prev,
      [featureKey]: {
        ...prev[featureKey],
        [subCode]: checked,
      },
    }));
  };

  // 保存全局配置
  const handleSaveGlobal = async () => {
    try {
      setLoading(true);

      // 保存主功能开关
      for (const [code, enabled] of Object.entries(toggles)) {
        await api.features.updateFeature(code, { enabled });
      }

      // 保存子功能开关
      for (const [featureCode, subs] of Object.entries(subToggles)) {
        for (const [subCode, enabled] of Object.entries(subs)) {
          await api.features.updateSubFeature(featureCode, subCode, { enabled });
        }
      }

      message.success('全局功能开关配置已保存');
    } catch (error: any) {
      console.error('保存失败:', error);
      message.error('保存失败: ' + (error.message || '请检查后端API'));
    } finally {
      setLoading(false);
    }
  };

  // 初始化默认功能开关
  const handleInitFeatures = async () => {
    try {
      setInitLoading(true);
      await api.features.initFeatures();
      message.success('功能开关初始化成功');
      fetchFeatures();
    } catch (error: any) {
      console.error('初始化失败:', error);
      message.error('初始化失败: ' + (error.message || '请检查后端API'));
    } finally {
      setInitLoading(false);
    }
  };

  // 重置为默认
  const handleReset = () => {
    const defaults: Record<string, boolean> = {};
    const subDefaults: Record<string, Record<string, boolean>> = {};
    featureToggles.forEach(ft => {
      defaults[ft.key] = ft.defaultEnabled;
      subDefaults[ft.key] = {};
      (ft.subFeatures || []).forEach(sub => {
        subDefaults[ft.key][sub.code] = sub.defaultEnabled;
      });
    });
    setToggles(defaults);
    setSubToggles(subDefaults);
    message.info('已重置为默认配置');
  };

  // 批量开启/关闭
  const handleBatchToggle = (enabled: boolean) => {
    const updated: Record<string, boolean> = {};
    const subUpdated: Record<string, Record<string, boolean>> = {};
    featureToggles.forEach(ft => {
      updated[ft.key] = enabled;
      subUpdated[ft.key] = {};
      (ft.subFeatures || []).forEach(sub => {
        subUpdated[ft.key][sub.code] = enabled;
      });
    });
    setToggles(updated);
    setSubToggles(subUpdated);
    message.success(`已${enabled ? '开启' : '关闭'}所有功能`);
  };

  // 获取代理商列表
  const fetchAgents = async () => {
    try {
      const res = await api.agents.getAgents({ pageSize: 100 });
      if (res.data?.data) {
        setAgents((res.data as any).data as any);
      }
    } catch (error) {
      console.error('获取代理商列表失败:', error);
    }
  };

  // 获取代理商客户
  const fetchAgentCustomers = async (agentId: string) => {
    try {
      setLoadingCustomers(true);
      const res = await api.agents.getAgentCustomers(agentId, { pageSize: 50 });
      if (res.data?.data) {
        setAgentCustomers((res.data as any).data as any);
      }
    } catch (error) {
      console.error('获取客户列表失败:', error);
      setAgentCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  // 客户级别配置相关
  const handleOpenTenantConfig = (tenantId: string) => {
    setSelectedTenant(tenantId);
    setTenantModalVisible(true);
    fetchAgents();
    fetchAgentCustomers(tenantId);
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

  const customerColumns: ColumnsType<AgentCustomer> = [
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: text => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: status => (
        <Badge
          status={status === 'active' ? 'success' : 'default'}
          text={status === 'active' ? '正常' : '已冻结'}
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: date => new Date(date).toLocaleDateString(),
    },
  ];

  // 合并主功能和子功能开关配置
  const getFeatureConfig = (key: string): FeatureToggle | undefined => {
    return featureToggles.find(ft => ft.key === key);
  };

  return (
    <div style={{ padding: 24 }}>
      <Spin spinning={fetchLoading}>
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
              <Button
                icon={<SyncOutlined spin={initLoading} />}
                onClick={handleInitFeatures}
                loading={initLoading}
              >
                初始化开关
              </Button>
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
          <Row gutter={[16, 24]}>
            {featureToggles.map(ft => (
              <Col xs={24} sm={12} md={8} lg={6} xl={4} key={ft.key}>
                <Card
                  size="small"
                  style={{
                    borderColor: toggles[ft.key] ? '#52c41a' : '#f0f0f0',
                    background: toggles[ft.key] ? '#f6ffed' : '#fafafa',
                  }}
                  actions={[
                    <Switch
                      key="switch"
                      size="small"
                      checked={toggles[ft.key]}
                      onChange={checked => handleToggle(ft.key, checked)}
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
                    <Text strong style={{ fontSize: 14 }}>
                      {ft.name}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {ft.description}
                    </Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          <Divider />

          {/* 子功能开关配置 */}
          <Title level={5}>子功能配置</Title>
          <Row gutter={[16, 16]}>
            {featureToggles.map(ft =>
              ft.subFeatures?.map(sub => (
                <Col xs={24} sm={12} md={8} key={`${ft.key}-${sub.code}`}>
                  <Card size="small">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <Text strong>{sub.name}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {sub.description}
                        </Text>
                        <br />
                        <Tag
                          color="processing"
                          style={{ marginTop: 4 }}
                        >
                          属于: {ft.name}
                        </Tag>
                      </div>
                      <Switch
                        size="small"
                        checked={subToggles[ft.key]?.[sub.code] ?? sub.defaultEnabled}
                        onChange={checked => handleSubToggle(ft.key, sub.code, checked)}
                        disabled={!toggles[ft.key]} // 如果主功能关闭，子功能也不能开启
                      />
                    </div>
                  </Card>
                </Col>
              ))
            )}
          </Row>
        </Card>

        {/* 客户级别配置 */}
        <Card
          title={
            <Space>
              <SettingOutlined />
              <span>代理商功能配置</span>
            </Space>
          }
          extra={
            <Button
              icon={<UnorderedListOutlined />}
              onClick={() => {
                setTenantModalVisible(true);
                fetchAgents();
              }}
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
            <Descriptions.Item label="已配置客户">
              <Text type="secondary">已配置 {Object.keys(tenantConfigs).length} 个客户</Text>
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <Title level={5}>功能模块状态概览</Title>
          <Row gutter={16}>
            <Col span={6}>
              <Card size="small">
                <div>
                  <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: 14 }}>已开启</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>
                    {Object.values(toggles).filter(Boolean).length}
                  </div>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <div>
                  <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: 14 }}>已关闭</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#ff4d4f' }}>
                    {Object.values(toggles).filter(v => !v).length}
                  </div>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <div>
                  <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: 14 }}>已配置客户</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#1890ff' }}>
                    {Object.keys(tenantConfigs).length}
                  </div>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <div>
                  <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: 14 }}>功能模块总数</div>
                  <div style={{ fontSize: 24, fontWeight: 600 }}>{featureToggles.length}</div>
                </div>
              </Card>
            </Col>
          </Row>
        </Card>

        {/* 代理商列表弹窗 */}
        <Modal
          title="代理商客户配置"
          open={tenantModalVisible}
          onCancel={() => setTenantModalVisible(false)}
          footer={null}
          width={900}
        >
          <Spin spinning={loadingCustomers}>
            <Table
              columns={[
                {
                  title: '代理商名称',
                  dataIndex: 'name',
                  key: 'name',
                },
                {
                  title: '手机号',
                  dataIndex: ['user', 'phone'],
                  key: 'phone',
                },
                {
                  title: '客户数量',
                  dataIndex: ['_count', 'customers'],
                  key: 'customerCount',
                  render: count => (
                    <Badge count={count} showZero style={{ backgroundColor: '#1890ff' }} />
                  ),
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  key: 'status',
                  render: status => (
                    <Badge
                      status={status === 'active' ? 'success' : 'error'}
                      text={status === 'active' ? '正常' : '已冻结'}
                    />
                  ),
                },
                {
                  title: '操作',
                  key: 'action',
                  render: (_, record) => (
                    <Button type="link" onClick={() => handleOpenTenantConfig(record.id)}>
                      配置客户
                    </Button>
                  ),
                },
              ]}
              dataSource={agents.map(a => ({ ...a, key: a.id }))}
              pagination={false}
            />
          </Spin>
        </Modal>

        {/* 客户功能配置弹窗 */}
        <Modal
          title="客户功能配置"
          open={!!selectedTenant && tenantModalVisible}
          onCancel={() => {
            setTenantModalVisible(false);
            setSelectedTenant(null);
          }}
          footer={[
            <Button key="cancel" onClick={() => setTenantModalVisible(false)}>
              取消
            </Button>,
            <Button key="save" type="primary" onClick={handleSaveTenantConfig}>
              保存配置
            </Button>,
          ]}
          width={800}
        >
          <Table
            columns={customerColumns}
            dataSource={agentCustomers}
            pagination={false}
            size="small"
          />
        </Modal>
      </Spin>
    </div>
  );
}
