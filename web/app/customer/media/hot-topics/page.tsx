'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Select,
  Input,
  Modal,
  List,
  Statistic,
  Spin,
  message,
  Tabs,
  Avatar,
} from 'antd';
import {
  FireOutlined,
  RiseOutlined,
  FallOutlined,
  MinusOutlined,
  ThunderboltOutlined,
  BulbOutlined,
  CopyOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  getPlatforms,
  getHotTopics,
  generateContent,
  HotTopic,
  TopicPlatform,
  GeneratedContent,
} from '@/services/hot-topics';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Search } = Input;

const platformOptions = [
  { value: 'douyin', label: '🎵 抖音' },
  { value: 'weibo', label: '📱 微博' },
  { value: 'toutiao', label: '📰 头条' },
  { value: 'baidu', label: '🔍 百度' },
  { value: 'zhihu', label: '💬 知乎' },
  { value: 'kuaishou', label: '📷 快手' },
];

const categoryOptions = [
  { value: '', label: '全部分类' },
  { value: '科技', label: '科技' },
  { value: '美食', label: '美食' },
  { value: '教育', label: '教育' },
  { value: '电商', label: '电商' },
  { value: '旅游', label: '旅游' },
  { value: '汽车', label: '汽车' },
  { value: '健康', label: '健康' },
  { value: '时尚', label: '时尚' },
  { value: '娱乐', label: '娱乐' },
];

const trendIcon: Record<string, React.ReactNode> = {
  up: <RiseOutlined style={{ color: '#f5222d' }} />,
  down: <FallOutlined style={{ color: '#52c41a' }} />,
  stable: <MinusOutlined style={{ color: '#999' }} />,
};

export default function HotTopicsPage() {
  const [topics, setTopics] = useState<HotTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState('douyin');
  const [category, setCategory] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<HotTopic | null>(null);
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchHotTopics();
  }, [platform, category]);

  const fetchHotTopics = async () => {
    setLoading(true);
    try {
      const res = await getHotTopics({
        platform,
        category: category || undefined,
        limit: 50,
      });
      setTopics(res.data || []);
    } catch (error) {
      message.error('获取热点话题失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContent = async (topic: HotTopic) => {
    setSelectedTopic(topic);
    setGenerateModalVisible(true);
    setGeneratedContent(null);
  };

  const handleGenerate = async () => {
    if (!selectedTopic) return;

    setGenerating(true);
    try {
      const res = await generateContent({
        topicTitle: selectedTopic.title,
        contentType: 'text',
        style: 'popular',
      });
      setGeneratedContent(res.data);
    } catch (error) {
      message.error('生成内容失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyContent = () => {
    if (!generatedContent) return;
    
    const text = `${generatedContent.title}\n\n${generatedContent.content}\n\n${generatedContent.hashtags.map(t => '#' + t).join(' ')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatHeat = (heat: number) => {
    if (heat >= 10000000) {
      return (heat / 10000000).toFixed(1) + '千万';
    }
    if (heat >= 10000) {
      return (heat / 10000).toFixed(1) + '万';
    }
    return heat.toString();
  };

  const columns: ColumnsType<HotTopic> = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank: number) => (
        <div className={`text-center font-bold ${rank <= 3 ? 'text-red-500' : ''}`}>
          {rank <= 3 ? '🔥' : ''}{rank}
        </div>
      ),
    },
    {
      title: '话题',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record) => (
        <div>
          <div 
            className="font-medium cursor-pointer hover:text-blue-500"
            onClick={() => handleGenerateContent(record)}
          >
            {title}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Tag>{record.category}</Tag>
            <span className="text-gray-400 text-sm">
              {formatHeat(record.heat)} 热度
            </span>
            {trendIcon[record.trend]}
          </div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<BulbOutlined />}
            onClick={() => handleGenerateContent(record)}
          >
            生成内容
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card
        title={
          <Space>
            <FireOutlined style={{ color: '#f5222d' }} />
            <span>热点话题</span>
          </Space>
        }
      >
        {/* 筛选 */}
        <Row gutter={16} className="mb-4">
          <Col span={8}>
            <Select
              value={platform}
              onChange={(value) => setPlatform(value)}
              options={platformOptions}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={8}>
            <Select
              value={category}
              onChange={(value) => setCategory(value)}
              options={categoryOptions}
              style={{ width: '100%' }}
              placeholder="选择分类"
            />
          </Col>
          <Col span={8}>
            <Button onClick={fetchHotTopics}>刷新数据</Button>
          </Col>
        </Row>

        {/* 统计信息 */}
        <Row gutter={16} className="mb-4">
          <Col span={6}>
            <Statistic 
              title="总话题数" 
              value={topics.length} 
              prefix={<ThunderboltOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="上升中" 
              value={topics.filter(t => t.trend === 'up').length} 
              valueStyle={{ color: '#f5222d' }}
              prefix={<RiseOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="趋于平稳" 
              value={topics.filter(t => t.trend === 'stable').length} 
              valueStyle={{ color: '#999' }}
              prefix={<MinusOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="热度下降" 
              value={topics.filter(t => t.trend === 'down').length} 
              valueStyle={{ color: '#52c41a' }}
              prefix={<FallOutlined />}
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={topics}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
          size="middle"
        />
      </Card>

      {/* 生成内容弹窗 */}
      <Modal
        title={
          <Space>
            <BulbOutlined />
            <span>基于话题生成内容</span>
          </Space>
        }
        open={generateModalVisible}
        onCancel={() => setGenerateModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setGenerateModalVisible(false)}>
            关闭
          </Button>,
          <Button
            key="generate"
            type="primary"
            loading={generating}
            onClick={handleGenerate}
            disabled={!selectedTopic}
          >
            AI 生成
          </Button>,
        ]}
        width={700}
      >
        {selectedTopic && (
          <div className="mb-4">
            <Tag color="red" className="text-lg px-3 py-1">
              #{selectedTopic.title}#
            </Tag>
            <Text type="secondary" className="ml-2">
              热度: {formatHeat(selectedTopic.heat)}
            </Text>
          </div>
        )}

        {generating && (
          <div className="text-center py-8">
            <Spin size="large" />
            <div className="mt-4">AI 正在生成内容...</div>
          </div>
        )}

        {generatedContent && !generating && (
          <div className="space-y-4">
            <Card title="生成结果" size="small">
              <div className="mb-4">
                <Text strong>标题：</Text>
                <div className="text-lg font-medium">{generatedContent.title}</div>
              </div>
              
              <div className="mb-4">
                <Text strong>正文内容：</Text>
                <div className="mt-2 p-3 bg-gray-50 rounded whitespace-pre-wrap">
                  {generatedContent.content}
                </div>
              </div>

              <div className="mb-4">
                <Text strong>推荐话题标签：</Text>
                <div className="mt-2">
                  {generatedContent.hashtags.map((tag, index) => (
                    <Tag key={index} color="blue" className="mr-2">
                      #{tag}
                    </Tag>
                  ))}
                </div>
              </div>

              <div>
                <Text strong>发布建议：</Text>
                <ul className="mt-2 list-disc list-inside text-gray-600">
                  {generatedContent.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>

              <Button
                type="primary"
                icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                onClick={handleCopyContent}
                className="mt-4"
                block
              >
                {copied ? '已复制到剪贴板' : '复制全部内容'}
              </Button>
            </Card>
          </div>
        )}

        {!generatedContent && !generating && (
          <div className="text-center py-8 text-gray-400">
            点击"AI 生成"按钮，基于当前话题智能生成发布内容
          </div>
        )}
      </Modal>
    </div>
  );
}
