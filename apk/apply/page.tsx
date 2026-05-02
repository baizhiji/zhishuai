'use client';

import React, { useState } from 'react';
import {
  Layout,
  Card,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Empty,
  Tabs,
  List,
  Avatar,
} from 'antd';
import {
  ShoppingOutlined,
  CustomerServiceOutlined,
  TeamOutlined,
  GlobalOutlined,
  RobotOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  FundProjectionScreenOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  SendOutlined,
} from '@ant-design/icons';
import type { TabsProps } from 'antd';
import './styles.css';

const { Content } = Layout;
const { TextArea } = Input;

// 功能列表配置
const featureList = [
  {
    key: 'media',
    name: '自媒体运营',
    icon: <GlobalOutlined />,
    color: '#1890ff',
    features: [
      { key: 'content', name: 'AI内容工厂', desc: '智能生成文案、图片、视频', enabled: true },
      { key: 'matrix', name: '矩阵管理', desc: '多账号一键管理', enabled: true },
      { key: 'publish', name: '发布中心', desc: '一键多平台发布', enabled: true },
      { key: 'digital', name: '数字人视频', desc: 'AI数字人播报', enabled: false },
    ],
  },
  {
    key: 'recruit',
    name: '招聘助手',
    icon: <TeamOutlined />,
    color: '#52c41a',
    features: [
      { key: 'publish', name: '职位发布', desc: '多平台同步发布', enabled: true },
      { key: 'screen', name: '简历筛选', desc: 'AI智能筛选', enabled: true },
      { key: 'reply', name: '自动回复', desc: '智能回复咨询', enabled: false },
      { key: 'interview', name: '面试管理', desc: '面试安排与提醒', enabled: false },
    ],
  },
  {
    key: 'acquisition',
    name: '智能获客',
    icon: <CustomerServiceOutlined />,
    color: '#faad14',
    features: [
      { key: 'discover', name: '潜客发现', desc: '智能挖掘潜在客户', enabled: true },
      { key: 'task', name: '引流任务', desc: '自动化引流', enabled: false },
    ],
  },
  {
    key: 'ecommerce',
    name: '电商运营',
    icon: <ShoppingOutlined />,
    color: '#f5222d',
    features: [
      { key: 'product', name: '商品管理', desc: '商品上架与推广', enabled: false },
      { key: 'order', name: '订单管理', desc: '订单处理与售后', enabled: false },
    ],
  },
];

// 申请记录
const mockApplications = [
  {
    id: '1',
    feature: '数字人视频',
    reason: '需要制作产品介绍视频',
    status: 'pending',
    applyTime: '2024-01-15 10:30',
  },
  {
    id: '2',
    feature: '自动回复',
    reason: '提高招聘效率',
    status: 'approved',
    applyTime: '2024-01-10 15:20',
    approveTime: '2024-01-11 09:00',
  },
  {
    id: '3',
    feature: '引流任务',
    reason: '需要批量获客',
    status: 'rejected',
    applyTime: '2024-01-05 11:00',
    rejectReason: '当前套餐不支持',
  },
];

// 代理商列表
const agentList = [
  { key: 'agent1', name: '北京智枢科技', phone: '400-123-4567' },
  { key: 'agent2', name: '上海智枢代理', phone: '400-234-5678' },
  { key: 'agent3', name: '广州智枢服务', phone: '400-345-6789' },
];

// 主组件
const ApplyFeaturePage: React.FC = () => {
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('features');
  const [form] = Form.useForm();

  // 申请功能
  const handleApply = (featureKey: string, featureName: string) => {
    setSelectedFeature(featureName);
    setApplyModalVisible(true);
  };

  // 提交申请
  const handleSubmit = () => {
    form.validateFields().then((values) => {
      console.log('提交申请:', values);
      message.success('申请已提交，请等待代理商审核');
      setApplyModalVisible(false);
      form.resetFields();
      setActiveTab('records');
    });
  };

  // 联系代理商
  const handleContact = (agent: typeof agentList[0]) => {
    Modal.confirm({
      title: `联系 ${agent.name}`,
      content: `电话：${agent.phone}`,
      okText: '呼叫',
      cancelText: '取消',
      onOk: () => {
        message.success(`正在拨打 ${agent.phone}`);
      },
    });
  };

  const tabItems: TabsProps['items'] = [
    {
      key: 'features',
      label: '功能列表',
    },
    {
      key: 'records',
      label: (
        <span>
          申请记录
          <Tag color="blue" className="count-tag">{mockApplications.length}</Tag>
        </span>
      ),
    },
    {
      key: 'agents',
      label: '联系代理商',
    },
  ];

  // 获取状态配置
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return { color: 'success', icon: <CheckCircleOutlined />, text: '已开通' };
      case 'pending':
        return { color: 'warning', icon: <ClockCircleOutlined />, text: '审核中' };
      case 'rejected':
        return { color: 'error', icon: <CloseCircleOutlined />, text: '已拒绝' };
      default:
        return { color: 'default', icon: null, text: status };
    }
  };

  return (
    <Layout className="apk-layout">
      <Content className="apk-content">
        {/* 头部 */}
        <div className="apk-header">
          <div className="apk-header-title">
            <h2>功能申请</h2>
          </div>
        </div>

        {/* 说明卡片 */}
        <div className="apply-tip">
          <p>当前套餐不支持该功能？立即向代理商申请开通</p>
        </div>

        {/* 标签页 */}
        <div className="apply-tabs">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            className="apk-tabs"
          />
        </div>

        {/* 标签页内容 */}
        <div className="apply-content">
          {activeTab === 'features' && (
            <div className="features-list">
              {featureList.map((category) => (
                <Card
                  key={category.key}
                  className="feature-card"
                  title={
                    <div className="feature-category">
                      <span className="category-icon" style={{ color: category.color }}>
                        {category.icon}
                      </span>
                      <span>{category.name}</span>
                    </div>
                  }
                >
                  {category.features.map((feature) => (
                    <div
                      key={feature.key}
                      className={`feature-item ${feature.enabled ? 'enabled' : 'disabled'}`}
                    >
                      <div className="feature-info">
                        <span className="feature-name">{feature.name}</span>
                        <span className="feature-desc">{feature.desc}</span>
                      </div>
                      {feature.enabled ? (
                        <Tag color="success">已开通</Tag>
                      ) : (
                        <Button
                          type="primary"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => handleApply(feature.key, feature.name)}
                          className="apply-btn"
                        >
                          申请
                        </Button>
                      )}
                    </div>
                  ))}
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'records' && (
            <div className="records-list">
              {mockApplications.length > 0 ? (
                <List
                  dataSource={mockApplications}
                  renderItem={(item) => {
                    const statusConfig = getStatusConfig(item.status);
                    return (
                      <List.Item>
                        <List.Item.Meta
                          title={item.feature}
                          description={
                            <div className="record-info">
                              <span>申请理由：{item.reason}</span>
                              <span>申请时间：{item.applyTime}</span>
                              {item.status === 'rejected' && (
                                <span className="reject-reason">拒绝原因：{item.rejectReason}</span>
                              )}
                            </div>
                          }
                        />
                        <Tag color={statusConfig.color} icon={statusConfig.icon}>
                          {statusConfig.text}
                        </Tag>
                      </List.Item>
                    );
                  }}
                />
              ) : (
                <Empty description="暂无申请记录" />
              )}
            </div>
          )}

          {activeTab === 'agents' && (
            <div className="agents-list">
              <List
                dataSource={agentList}
                renderItem={(agent) => (
                  <List.Item
                    actions={[
                      <Button
                        key="contact"
                        type="primary"
                        onClick={() => handleContact(agent)}
                      >
                        联系
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          icon={<TeamOutlined />}
                          style={{ background: '#1890ff' }}
                        />
                      }
                      title={agent.name}
                      description={`联系电话：${agent.phone}`}
                    />
                  </List.Item>
                )}
              />
            </div>
          )}
        </div>

        {/* 申请弹窗 */}
        <Modal
          title={`申请开通：${selectedFeature}`}
          open={applyModalVisible}
          onCancel={() => {
            setApplyModalVisible(false);
            form.resetFields();
          }}
          className="apk-modal"
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                setApplyModalVisible(false);
                form.resetFields();
              }}
            >
              取消
            </Button>,
            <Button
              key="submit"
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSubmit}
            >
              提交申请
            </Button>,
          ]}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="reason"
              label="申请理由"
              rules={[{ required: true, message: '请输入申请理由' }]}
            >
              <TextArea
                rows={4}
                placeholder="请详细说明为什么需要开通此功能..."
              />
            </Form.Item>
            <Form.Item
              name="agent"
              label="选择代理商"
              rules={[{ required: true, message: '请选择代理商' }]}
            >
              <Select
                placeholder="请选择代理商"
                options={agentList.map((agent) => ({
                  value: agent.key,
                  label: `${agent.name} (${agent.phone})`,
                }))}
              />
            </Form.Item>
            <Form.Item name="contact" label="联系方式（选填）">
              <Input placeholder="手机号或邮箱" />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default ApplyFeaturePage;
