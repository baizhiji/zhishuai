'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Typography,
  Tooltip,
  Tabs,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ApiOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface ApiProvider {
  id: string;
  name: string;
  type: string;
  baseUrl?: string;
  apiKey?: string | null;
  enabled: boolean;
  isDefault: boolean;
  priority: number;
  remark?: string;
  category: string;
  clientVisible: boolean;
  config?: any;
  createdAt: string;
}

interface CategoryInfo {
  key: string;
  name: string;
  icon: string;
  types: string[];
}

const TYPE_LABELS: Record<string, string> = {
  // 聚合
  tokenhub: '腾讯云 TokenHub',
  dashscope: '阿里云百炼（DashScope）',
  siliconflow: 'SiliconFlow',
  oneapi: 'OneAPI',
  newapi: 'NewAPI',
  openrouter: 'OpenRouter',
  // LLM
  openai: 'OpenAI（GPT-4/GPT-4o）',
  anthropic: 'Anthropic（Claude）',
  deepseek: '深度求索（DeepSeek）',
  zhipu: '智谱 AI（GLM-4）',
  moonshot: '月之暗面（Kimi）',
  qwen: '阿里通义千问',
  doubao: '字节豆包',
  wenxin: '百度文心一言',
  hunyuan: '腾讯混元',
  spark: '科大讯飞星火',
  baichuan: '百川智能',
  minimax: 'MiniMax（abab）',
  stepfun: '阶跃星辰',
  yi: '零一万物（Yi）',
  sensetime: '商汤日日新',
  // 图像
  'openai-dalle': 'OpenAI DALL-E',
  cogview: '智谱 CogView',
  'tongyi-wanxiang': '通义万相',
  'doubao-image': '豆包图像',
  jimeng: '字节即梦 AI',
  midjourney: 'Midjourney',
  'stable-diffusion': 'Stable Diffusion',
  flux: 'Black Forest Labs Flux',
  // 视频（AI 漫剧/AI 短剧）
  kling: '可灵 AI（Kling）',
  sora: 'OpenAI Sora',
  cogvideox: '智谱 CogVideoX',
  'doubao-video': '豆包视频',
  'tongyi-wanxiang-video': '通义万相视频',
  'jimeng-video': '即梦视频',
  runway: 'Runway Gen-3',
  pika: 'Pika Labs',
  luma: 'Luma Dream Machine',
  vidu: '生数科技 Vidu',
  // 语音
  elevenlabs: 'ElevenLabs',
  'azure-speech': 'Azure 语音',
  'aliyun-tts': '阿里云语音',
  'volcengine-tts': '火山引擎语音',
  'tencent-tts': '腾讯云语音',
  'doubao-tts': '豆包语音',
  'minimax-tts': 'MiniMax TTS',
  // 数字人
  'tencent-zhiying': '腾讯智影数字人',
  'aliyun-digital-human': '阿里云数字人',
  'baidu-digital-human': '百度数字人',
  heygen: 'HeyGen',
  synthesia: 'Synthesia',
  'doubao-digital-human': '豆包数字人',
  custom: '自定义',
};

export default function AdminApiProvidersPage() {
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchText, setSearchText] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<ApiProvider | null>(null);
  const [form] = Form.useForm();

  // 拉取分类
  const fetchCategories = useCallback(async () => {
    try {
      const request = (await import('@/lib/request')).default;
      const res = (await request.get<{ success: boolean; data: CategoryInfo[] }>(
        '/api/admin/api-providers/categories-list'
      )) as unknown as { success: boolean; data: CategoryInfo[] };
      if (res.success) {
        setCategories(res.data || []);
      }
    } catch (err) {
      console.error('获取分类失败', err);
    }
  }, []);

  // 拉取服务商
  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const request = (await import('@/lib/request')).default;
      const res = (await request.get<{ success: boolean; data: ApiProvider[] }>(
        '/api/admin/api-providers/providers'
      )) as unknown as { success: boolean; data: ApiProvider[] };
      if (res.success) {
        setProviders(res.data || []);
      } else {
        setProviders([]);
      }
    } catch (err) {
      console.error('获取服务商失败', err);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchProviders();
  }, [fetchCategories, fetchProviders]);

  // 切换启用
  const handleToggleEnabled = async (provider: ApiProvider) => {
    try {
      const request = (await import('@/lib/request')).default;
      const res = (await request.patch<{ success: boolean; data: ApiProvider }>(
        `/api/admin/api-providers/providers/${provider.id}/toggle`
      )) as unknown as { success: boolean; data: ApiProvider };
      if (res.success) {
        message.success(`${provider.name} 已${provider.enabled ? '停用' : '启用'}`);
        fetchProviders();
      } else {
        message.error('切换失败');
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || '切换失败');
    }
  };

  // 删除
  const handleDelete = async (id: string) => {
    try {
      const request = (await import('@/lib/request')).default;
      const res = (await request.delete<{ success: boolean }>(
        `/api/admin/api-providers/providers/${id}`
      )) as unknown as { success: boolean };
      if (res.success) {
        message.success('已删除');
        fetchProviders();
      } else {
        message.error('删除失败');
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || '删除失败');
    }
  };

  // 打开弹窗（新建 / 编辑）
  const openModal = (provider?: ApiProvider) => {
    setEditing(provider || null);
    if (provider) {
      form.setFieldsValue({
        name: provider.name,
        type: provider.type,
        baseUrl: provider.baseUrl,
        apiKey: '',
        enabled: provider.enabled,
        isDefault: provider.isDefault,
        priority: provider.priority,
        clientVisible: provider.clientVisible,
        remark: provider.remark,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        enabled: true,
        isDefault: false,
        clientVisible: true,
        priority: 100,
      });
    }
    setModalVisible(true);
  };

  // 提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const request = (await import('@/lib/request')).default;
      let res: any;
      if (editing) {
        const payload: any = { ...values };
        if (!payload.apiKey) delete payload.apiKey;
        res = (await request.put<{ success: boolean; message?: string }>(
          `/api/admin/api-providers/providers/${editing.id}`,
          payload
        )) as unknown as { success: boolean; message?: string };
      } else {
        res = (await request.post<{ success: boolean; message?: string }>(
          '/api/admin/api-providers/providers',
          values
        )) as unknown as { success: boolean; message?: string };
      }
      if (res.success) {
        message.success(editing ? '更新成功' : '创建成功');
        setModalVisible(false);
        fetchProviders();
      } else {
        message.error(res.message || '操作失败');
      }
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.message || '操作失败');
    }
  };

  // 过滤后的数据
  const filteredProviders = useMemo(() => {
    let list = providers;
    if (activeCategory !== 'all') {
      list = list.filter(p => p.category === activeCategory);
    }
    if (searchText) {
      const kw = searchText.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(kw) ||
        p.type.toLowerCase().includes(kw) ||
        TYPE_LABELS[p.type]?.toLowerCase().includes(kw)
      );
    }
    return list;
  }, [providers, activeCategory, searchText]);

  const stats = useMemo(() => {
    return {
      total: providers.length,
      enabled: providers.filter(p => p.enabled).length,
      clientVisible: providers.filter(p => p.clientVisible).length,
      clientActive: providers.filter(p => p.clientVisible && p.enabled).length,
    };
  }, [providers]);

  const columns: ColumnsType<ApiProvider> = [
    {
      title: '服务商',
      key: 'name',
      width: 220,
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Space>
            <Text strong>{r.name}</Text>
            {r.isDefault && <Tag color="gold" icon={<StarOutlined />}>默认</Tag>}
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {TYPE_LABELS[r.type] || r.type}
          </Text>
        </Space>
      ),
    },
    {
      title: '类型编码',
      dataIndex: 'type',
      key: 'type',
      width: 130,
      render: t => <Tag>{t}</Tag>,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 130,
      render: cat => {
        const c = categories.find(x => x.key === cat);
        return c ? <Tag color="cyan">{c.name}</Tag> : <Tag>其他</Tag>;
      },
    },
    {
      title: 'API Key',
      dataIndex: 'apiKey',
      key: 'apiKey',
      width: 90,
      render: v => v ? <Tag color="green">已配置</Tag> : <Tag>未配置</Tag>,
    },
    {
      title: '总后台启用',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 110,
      render: (enabled, r) => (
        <Switch
          checked={enabled}
          onChange={() => handleToggleEnabled(r)}
          checkedChildren="启用"
          unCheckedChildren="停用"
        />
      ),
    },
    {
      title: '客户端可见',
      dataIndex: 'clientVisible',
      key: 'clientVisible',
      width: 110,
      render: v => v ? (
        <Tag icon={<EyeOutlined />} color="green">可见</Tag>
      ) : (
        <Tag icon={<EyeInvisibleOutlined />}>隐藏</Tag>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      sorter: (a, b) => a.priority - b.priority,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, r) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openModal(r)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该服务商？" onConfirm={() => handleDelete(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0 }}>API 服务商</Title>
          <Text type="secondary">
            配置 AI 模型、视频、图像、语音、数字人等服务商；只有启用的服务商才会向客户端开放
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchProviders}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
            新增服务商
          </Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="服务商总数"
              value={stats.total}
              prefix={<ApiOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="已启用"
              value={stats.enabled}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="客户端可见"
              value={stats.clientVisible}
              valueStyle={{ color: '#1677ff' }}
              prefix={<EyeOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="客户端可配置"
              value={stats.clientActive}
              valueStyle={{ color: '#722ed1' }}
              prefix={<CheckCircleOutlined />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>启用 + 可见</Text>
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input
              placeholder="搜索名称/类型"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 220 }}
              allowClear
            />
            <Select value={activeCategory} onChange={setActiveCategory} style={{ width: 160 }}>
              <Option value="all">全部分类</Option>
              {categories.map(c => (
                <Option key={c.key} value={c.key}>{c.name}</Option>
              ))}
            </Select>
          </Space>
        </div>

        {filteredProviders.length > 0 ? (
          <Table
            columns={columns}
            dataSource={filteredProviders}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10, showTotal: t => `共 ${t} 个` }}
          />
        ) : (
          <Empty description="还没有服务商，点击右上角新增" />
        )}
      </Card>

      <Modal
        title={editing ? '编辑服务商' : '新增服务商'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="服务商名称"
                rules={[{ required: true, message: '请输入名称' }]}
              >
                <Input placeholder="如：腾讯云 TokenHub" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="类型编码"
                rules={[{ required: true, message: '请选择类型' }]}
              >
                <Select
                  showSearch
                  placeholder="选择服务商类型"
                  optionFilterProp="label"
                >
                  {Object.entries(TYPE_LABELS).map(([code, label]) => (
                    <Option key={code} value={code} label={label}>
                      {label} <Text type="secondary">({code})</Text>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="baseUrl" label="API Base URL">
            <Input placeholder="如：https://api.openai.com/v1" />
          </Form.Item>

          <Form.Item
            name="apiKey"
            label={editing ? 'API Key（留空表示不修改）' : 'API Key'}
            extra={editing ? '出于安全考虑，输入框留空则不修改原 Key' : undefined}
          >
            <Input.Password placeholder="请输入 API Key" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="enabled"
                label="总后台启用"
                valuePropName="checked"
              >
                <Switch checkedChildren="启用" unCheckedChildren="停用" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="clientVisible"
                label="客户端可见"
                valuePropName="checked"
                extra="关闭后客户端不会显示该服务商"
              >
                <Switch checkedChildren="可见" unCheckedChildren="隐藏" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="isDefault"
                label="设为默认"
                valuePropName="checked"
              >
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="priority" label="优先级（数字越小越靠前）">
            <Input type="number" placeholder="如：100" />
          </Form.Item>

          <Form.Item name="remark" label="备注">
            <TextArea rows={2} placeholder="如：该 Key 已购买 100 万 tokens" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
