'use client';

import { useState } from 'react';
import {
  Card,
  Typography,
  Table,
  Tag,
  Button,
  Space,
  Form,
  Input,
  Select,
  Switch,
  Modal,
  message,
  Popconfirm,
  Tabs,
  Divider,
  Alert,
  Descriptions,
  Badge,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  SettingOutlined,
  GlobalOutlined,
  RobotOutlined,
  MessageOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// API服务商配置
interface APIProvider {
  id: string;
  name: string;
  type: string;
  apiKey: string;
  baseUrl?: string;
  status: 'active' | 'inactive';
  lastUsed?: string;
  enabledModels: string[];
}

// AI智能沟通配置
interface AIChatConfig {
  enabled: boolean;
  defaultModel: string;
  provider: 'aliyun' | 'tencent';
  style: 'professional' | 'friendly' | 'lively' | 'concise';
  temperature: number;
  maxTokens: number;
}

// 支持的模型配置
const AVAILABLE_MODELS = {
  aliyun: {
    name: '阿里云百炼',
    icon: '🔷',
    models: [
      { id: 'qwen-turbo', name: 'qwen-turbo', description: '日常对话、快速响应', type: 'text' },
      { id: 'qwen-plus', name: 'qwen-plus', description: '专业文案、长文本生成', type: 'text' },
      { id: 'qwen-long', name: 'qwen-long', description: '超长文本处理', type: 'text' },
      {
        id: 'deepseek-r1-0528',
        name: 'DeepSeek R1',
        description: '深度思考、复杂推理',
        type: 'reasoning',
      },
    ],
  },
  tencent: {
    name: '腾讯云TokenHub',
    icon: '🔶',
    models: [
      {
        id: 'hunyuan-2.0-instruct-20251111',
        name: '混元指令版',
        description: '日常对话、智能问答',
        type: 'text',
      },
      {
        id: 'hunyuan-2.0-thinking-20251109',
        name: '混元思考版',
        description: '复杂推理、数学问题',
        type: 'reasoning',
      },
      { id: 'kimi-k2.6', name: 'Kimi K2.6', description: '超长文本、报告生成', type: 'text' },
      { id: 'glm-5', name: 'GLM-5', description: 'Agent任务、代码生成', type: 'agent' },
      { id: 'glm-5v-turbo', name: 'GLM-5V Turbo', description: '图片理解、多模态', type: 'vision' },
      { id: 'youtu-vita', name: 'youtu-vita', description: '视频理解、视频分析', type: 'video' },
      { id: 'HY-Image-V3.0', name: 'HY-Image-V3.0', description: '高质量图像生成', type: 'image' },
      {
        id: 'YT-Video-HumanActor',
        name: '数字人视频',
        description: '数字人口播视频',
        type: 'digital_human',
      },
    ],
  },
};

// 人设风格配置
const STYLE_CONFIG = {
  professional: {
    name: '👔 专业严谨',
    description: '措辞规范，像资深HR',
    example: '您好，感谢您投递[职位名]岗位...',
  },
  friendly: {
    name: '🤝 亲切友好',
    description: '像朋友聊天，轻松自然',
    example: '嗨～看到你的简历啦，很感兴趣...',
  },
  lively: {
    name: '😊 活泼开朗',
    description: '带表情，语气俏皮',
    example: '太棒了！你的经历超适合我们~',
  },
  concise: {
    name: '⚡ 简洁干练',
    description: '直奔主题，高效直接',
    example: '看了你的简历，符合要求，面谈？',
  },
};

export default function APIConfigPage() {
  const [form] = Form.useForm();
  const [chatConfigForm] = Form.useForm();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [chatConfigModalVisible, setChatConfigModalVisible] = useState(false);
  const [editingProvider, setEditingProvider] = useState<APIProvider | null>(null);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  // AI智能沟通配置
  const [aiChatConfig, setAiChatConfig] = useState<AIChatConfig>({
    enabled: false,
    defaultModel: 'qwen-turbo',
    provider: 'aliyun',
    style: 'friendly',
    temperature: 0.7,
    maxTokens: 500,
  });

  // 初始服务商数据
  const [providers, setProviders] = useState<APIProvider[]>([
    {
      id: 'aliyun',
      name: '阿里云百炼',
      type: 'LLM',
      apiKey: '',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      status: 'inactive',
      enabledModels: ['qwen-turbo', 'qwen-plus', 'qwen-long', 'deepseek-r1-0528'],
    },
    {
      id: 'tencent',
      name: '腾讯云TokenHub',
      type: 'Multi-Modal',
      apiKey: '',
      baseUrl: 'https://tokenhub.tencentmaas.com/v1',
      status: 'inactive',
      enabledModels: [
        'hunyuan-2.0-instruct-20251111',
        'hunyuan-2.0-thinking-20251109',
        'kimi-k2.6',
        'glm-5',
        'glm-5v-turbo',
        'youtu-vita',
        'HY-Image-V3.0',
        'YT-Video-HumanActor',
      ],
    },
  ]);

  // 计算费用统计
  const getUsageStats = () => {
    const activeProviders = providers.filter(p => p.status === 'active' && p.apiKey);
    const totalModels = activeProviders.reduce((acc, p) => acc + p.enabledModels.length, 0);
    return {
      activeProviders: activeProviders.length,
      totalModels,
      status: activeProviders.length > 0 ? '已配置' : '未配置',
      aiReady: activeProviders.length > 0 && aiChatConfig.enabled,
    };
  };

  const stats = getUsageStats();

  // 列配置
  const columns = [
    {
      title: '服务商',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: APIProvider) => (
        <Space>
          <span>{name}</span>
          <Tag color={record.type === 'LLM' ? 'blue' : 'purple'}>{record.type}</Tag>
        </Space>
      ),
    },
    {
      title: 'API Key',
      dataIndex: 'apiKey',
      key: 'apiKey',
      render: (key: string) =>
        key ? `${key.slice(0, 8)}...${key.slice(-4)}` : <Text type="secondary">未配置</Text>,
    },
    {
      title: '已启用模型',
      dataIndex: 'enabledModels',
      key: 'enabledModels',
      render: (models: string[]) => (
        <Space wrap>
          {models.slice(0, 3).map(m => (
            <Tag key={m} color="green">
              {m}
            </Tag>
          ))}
          {models.length > 3 && <Tag>+{models.length - 3}</Tag>}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: APIProvider) => (
        <Tag color={record.apiKey && status === 'active' ? 'success' : 'default'}>
          {record.apiKey ? (status === 'active' ? '已启用' : '已禁用') : '未配置'}
        </Tag>
      ),
    },
    {
      title: '最后使用',
      dataIndex: 'lastUsed',
      key: 'lastUsed',
      render: (time: string) => time || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: APIProvider) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            配置
          </Button>
        </Space>
      ),
    },
  ];

  // 编辑服务商
  const handleEdit = (record: APIProvider) => {
    setEditingProvider(record);
    form.setFieldsValue({
      name: record.name,
      apiKey: record.apiKey,
      baseUrl: record.baseUrl,
      status: record.status === 'active',
      enabledModels: record.enabledModels,
    });
    setSelectedModels(record.enabledModels);
    setEditModalVisible(true);
  };

  // 保存配置
  const handleSave = () => {
    form.validateFields().then(values => {
      const updatedProviders = providers.map(p => {
        if (p.id === editingProvider?.id) {
          return {
            ...p,
            apiKey: values.apiKey,
            baseUrl: values.baseUrl,
            status: values.status ? ('active' as const) : ('inactive' as const),
            enabledModels: selectedModels,
            lastUsed: values.apiKey ? new Date().toLocaleString('zh-CN') : p.lastUsed,
          };
        }
        return p;
      });
      setProviders(updatedProviders);
      message.success('配置保存成功');
      setEditModalVisible(false);
    });
  };

  // 保存AI智能沟通配置
  const handleSaveChatConfig = () => {
    chatConfigForm.validateFields().then(values => {
      setAiChatConfig({
        ...values,
        enabled: values.enabled,
      });
      message.success('AI智能沟通配置已保存');
      setChatConfigModalVisible(false);
    });
  };

  // 切换模型选择
  const toggleModel = (modelId: string) => {
    setSelectedModels(prev =>
      prev.includes(modelId) ? prev.filter(m => m !== modelId) : [...prev, modelId]
    );
  };

  // 模型选择列表
  const renderModelSelector = (providerKey: 'aliyun' | 'tencent') => {
    const provider = AVAILABLE_MODELS[providerKey];
    return (
      <div style={{ marginTop: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 12 }}>
          选择启用模型
        </Text>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {provider.models.map(model => (
            <Tag
              key={model.id}
              color={selectedModels.includes(model.id) ? 'blue' : 'default'}
              style={{
                padding: '4px 12px',
                cursor: 'pointer',
                border: selectedModels.includes(model.id)
                  ? '2px solid #1890ff'
                  : '1px solid #d9d9d9',
              }}
              onClick={() => toggleModel(model.id)}
            >
              {model.name} {selectedModels.includes(model.id) && <CheckOutlined />}
            </Tag>
          ))}
        </div>
        <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
          已选择 {selectedModels.filter(m => provider.models.some(pm => pm.id === m)).length} 个模型
        </Text>
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Title level={2} className="mb-0">
            API服务商配置
          </Title>
          <Text type="secondary">配置AI服务商API Key，按实际使用量计费</Text>
        </div>
      </div>

      {/* 使用说明 */}
      <Alert
        message="配置说明"
        description={
          <div>
            <p>• API Key由客户自行在WEB端输入配置，费用由客户自行承担</p>
            <p>• 支持同时配置多个服务商，系统会自动选择最优模型</p>
            <p>• 启用模型后，该模型将可用于AI对话和内容生成</p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card size="small">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.activeProviders}</div>
            <div className="text-gray-500 text-sm">已配置服务商</div>
          </div>
        </Card>
        <Card size="small">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.totalModels}</div>
            <div className="text-gray-500 text-sm">已启用模型</div>
          </div>
        </Card>
        <Card size="small">
          <div className="text-center">
            <div
              className={`text-2xl font-bold ${stats.status === '已配置' ? 'text-green-600' : 'text-gray-400'}`}
            >
              {stats.status}
            </div>
            <div className="text-gray-500 text-sm">配置状态</div>
          </div>
        </Card>
        <Card size="small" className={aiChatConfig.enabled ? 'border-green-500' : ''}>
          <div className="text-center">
            <div
              className={`text-2xl font-bold ${aiChatConfig.enabled ? 'text-green-600' : 'text-gray-400'}`}
            >
              {aiChatConfig.enabled ? '已启用' : '未启用'}
            </div>
            <div className="text-gray-500 text-sm">AI智能沟通</div>
          </div>
        </Card>
      </div>

      {/* AI智能沟通配置卡片 */}
      <Card
        title={
          <Space>
            <RobotOutlined className="text-blue-500" />
            <span>AI智能沟通配置</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<SettingOutlined />}
            onClick={() => {
              chatConfigForm.setFieldsValue(aiChatConfig);
              setChatConfigModalVisible(true);
            }}
          >
            {aiChatConfig.enabled ? '修改配置' : '启用AI智能沟通'}
          </Button>
        }
        style={{ marginBottom: 24 }}
        className={aiChatConfig.enabled ? 'border-blue-500' : ''}
      >
        {aiChatConfig.enabled ? (
          <div>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="服务商">
                <Tag color={aiChatConfig.provider === 'aliyun' ? 'blue' : 'purple'}>
                  {AVAILABLE_MODELS[aiChatConfig.provider].icon}{' '}
                  {AVAILABLE_MODELS[aiChatConfig.provider].name}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="默认模型">
                <Tag color="green">{aiChatConfig.defaultModel}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="沟通风格">
                <Tag color="orange">{STYLE_CONFIG[aiChatConfig.style].name}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创意参数">
                <Tag color="cyan">温度 {aiChatConfig.temperature}</Tag>
              </Descriptions.Item>
            </Descriptions>
            <Divider style={{ margin: '12px 0' }} />
            <Paragraph type="secondary" className="mb-0">
              <MessageOutlined /> 当前配置将用于：招聘自动沟通、自媒体自动回复、客服自动响应
              等场景。
              <br />
              <Text type="secondary" className="text-xs">
                系统会根据配置的模型和风格，生成自然、人性化的沟通话术。
              </Text>
            </Paragraph>
          </div>
        ) : (
          <div className="text-center py-4">
            <RobotOutlined className="text-4xl text-gray-300 mb-3" />
            <Paragraph type="secondary">
              启用AI智能沟通后，系统将使用大模型自动生成人性化话术，
              <br />
              支持招聘沟通、自媒体回复、客服响应等多种场景。
            </Paragraph>
            <Button type="primary" onClick={() => setChatConfigModalVisible(true)}>
              立即配置
            </Button>
          </div>
        )}
      </Card>

      {/* 服务商列表 */}
      <Card
        title={
          <Space>
            <SettingOutlined />
            <span>服务商配置</span>
          </Space>
        }
        extra={<Text type="secondary">点击「配置」按钮添加API Key</Text>}
      >
        <Table
          dataSource={providers}
          columns={columns}
          rowKey="id"
          pagination={false}
          rowClassName={record => (record.apiKey ? '' : 'bg-gray-50')}
        />
      </Card>

      {/* 模型说明 */}
      <Card
        title={
          <Space>
            <GlobalOutlined />
            <span>支持的模型</span>
          </Space>
        }
        style={{ marginTop: 24 }}
      >
        <Tabs
          defaultActiveKey="aliyun"
          items={[
            {
              key: 'aliyun',
              label: `${AVAILABLE_MODELS.aliyun.icon} ${AVAILABLE_MODELS.aliyun.name}`,
              children: (
                <div>
                  {AVAILABLE_MODELS.aliyun.models.map(model => (
                    <div
                      key={model.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100"
                    >
                      <div>
                        <Tag color="blue">{model.id}</Tag>
                        <Text>{model.description}</Text>
                      </div>
                      <Tag
                        color={
                          model.type === 'text'
                            ? 'green'
                            : model.type === 'reasoning'
                              ? 'orange'
                              : 'purple'
                        }
                      >
                        {model.type === 'text'
                          ? '文本生成'
                          : model.type === 'reasoning'
                            ? '深度推理'
                            : model.type}
                      </Tag>
                    </div>
                  ))}
                </div>
              ),
            },
            {
              key: 'tencent',
              label: `${AVAILABLE_MODELS.tencent.icon} ${AVAILABLE_MODELS.tencent.name}`,
              children: (
                <div>
                  {AVAILABLE_MODELS.tencent.models.map(model => (
                    <div
                      key={model.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100"
                    >
                      <div>
                        <Tag color="purple">{model.id}</Tag>
                        <Text>{model.description}</Text>
                      </div>
                      <Tag
                        color={
                          model.type === 'text'
                            ? 'green'
                            : model.type === 'vision'
                              ? 'cyan'
                              : model.type === 'video'
                                ? 'red'
                                : model.type === 'image'
                                  ? 'orange'
                                  : model.type === 'digital_human'
                                    ? 'pink'
                                    : 'purple'
                        }
                      >
                        {model.type === 'text'
                          ? '文本'
                          : model.type === 'vision'
                            ? '图像理解'
                            : model.type === 'video'
                              ? '视频理解'
                              : model.type === 'image'
                                ? '图像生成'
                                : model.type === 'digital_human'
                                  ? '数字人'
                                  : model.type === 'agent'
                                    ? 'Agent'
                                    : model.type === 'reasoning'
                                      ? '推理'
                                      : model.type}
                      </Tag>
                    </div>
                  ))}
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* 编辑弹窗 */}
      <Modal
        title={`配置 ${editingProvider?.name}`}
        open={editModalVisible}
        onOk={handleSave}
        onCancel={() => setEditModalVisible(false)}
        width={700}
        okText="保存配置"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: true,
          }}
        >
          <Form.Item
            name="apiKey"
            label="API Key"
            rules={[{ required: true, message: '请输入API Key' }]}
            extra={
              editingProvider?.id === 'aliyun'
                ? '获取地址：阿里云百炼控制台 -> 模型服务 -> API-KEY'
                : '获取地址：腾讯云TokenHub控制台 -> API密钥'
            }
          >
            <Input.Password placeholder="请输入API Key" />
          </Form.Item>

          <Form.Item name="baseUrl" label="API Base URL">
            <Input disabled />
          </Form.Item>

          <Form.Item name="status" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          {editingProvider && renderModelSelector(editingProvider.id as 'aliyun' | 'tencent')}
        </Form>
      </Modal>

      {/* AI智能沟通配置弹窗 */}
      <Modal
        title={
          <Space>
            <RobotOutlined className="text-blue-500" />
            <span>AI智能沟通配置</span>
          </Space>
        }
        open={chatConfigModalVisible}
        onOk={handleSaveChatConfig}
        onCancel={() => setChatConfigModalVisible(false)}
        width={700}
        okText="保存配置"
        cancelText="取消"
      >
        <Alert
          message="AI智能沟通说明"
          description={
            <div>
              <p>• 配置后，系统将使用大模型自动生成人性化沟通话术</p>
              <p>• 支持招聘沟通、自媒体回复、客服响应等多种场景</p>
              <p>• 话术会根据配置的"人设风格"自动调整语气和表达方式</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form form={chatConfigForm} layout="vertical" initialValues={aiChatConfig}>
          <Form.Item name="enabled" valuePropName="checked" label="启用AI智能沟通">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          <Form.Item
            name="provider"
            label="选择AI服务商"
            rules={[{ required: true, message: '请选择AI服务商' }]}
          >
            <Select>
              <Select.Option value="aliyun">
                🔷 阿里云百炼（推荐：qwen-plus 生成质量更高）
              </Select.Option>
              <Select.Option value="tencent">
                🔶 腾讯云TokenHub（推荐：混元模型 中文理解更好）
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="defaultModel"
            label="默认模型"
            rules={[{ required: true, message: '请选择默认模型' }]}
          >
            <Select placeholder="选择用于生成话术的模型">
              {aiChatConfig.provider === 'aliyun' ? (
                <>
                  <Select.Option value="qwen-turbo">qwen-turbo（快速响应）</Select.Option>
                  <Select.Option value="qwen-plus">qwen-plus（推荐：质量更高）</Select.Option>
                  <Select.Option value="qwen-long">qwen-long（超长文本）</Select.Option>
                </>
              ) : (
                <>
                  <Select.Option value="hunyuan-2.0-instruct-20251111">
                    混元指令版（日常对话）
                  </Select.Option>
                  <Select.Option value="kimi-k2.6">Kimi K2.6（长文本）</Select.Option>
                  <Select.Option value="glm-5">GLM-5（Agent任务）</Select.Option>
                </>
              )}
            </Select>
          </Form.Item>

          <Form.Item name="style" label="沟通人设风格">
            <Select>
              {Object.entries(STYLE_CONFIG).map(([key, config]) => (
                <Select.Option value={key}>
                  {config.name} - {config.description}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="temperature"
            label="创意温度 (0.1-1.0)"
            extra="较低值：保守稳定；较高值：更有创意"
          >
            <Select>
              <Select.Option value={0.3}>0.3（保守稳定）</Select.Option>
              <Select.Option value={0.5}>0.5（平衡）</Select.Option>
              <Select.Option value={0.7}>0.7（推荐：自然流畅）</Select.Option>
              <Select.Option value={0.9}>0.9（创意丰富）</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="maxTokens" label="最大生成长度">
            <Select>
              <Select.Option value={200}>200字（简短回复）</Select.Option>
              <Select.Option value={300}>300字（标准话术）</Select.Option>
              <Select.Option value={500}>500字（详细沟通）</Select.Option>
              <Select.Option value={800}>800字（长文本）</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
