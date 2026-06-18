'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Card,
  Input,
  Button,
  Space,
  Avatar,
  Typography,
  Select,
  Spin,
  Empty,
  Divider,
  Badge,
  Tooltip,
  List,
  Modal,
} from 'antd';
import {
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  SwapOutlined,
  ClearOutlined,
  SettingOutlined,
  HistoryOutlined,
  ThunderboltOutlined,
  CopyOutlined,
  CheckOutlined,
  CommentOutlined,
  BulbOutlined,
  FileTextOutlined,
  ExperimentOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// 消息类型
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
  provider?: string;
  isFallback?: boolean;
}

// 对话会话类型
interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// 预设提示词
const QUICK_PROMPTS = [
  {
    icon: <BulbOutlined />,
    title: '商业诊断',
    prompt: '请帮我分析一下当前的市场竞争格局和我们的优势劣势',
  },
  {
    icon: <FileTextOutlined />,
    title: '营销策划',
    prompt: '帮我制定一份针对年轻用户的营销推广方案',
  },
  {
    icon: <ExperimentOutlined />,
    title: '运营优化',
    prompt: '分析一下我们门店的运营效率，提出优化建议',
  },
  {
    icon: <AppstoreOutlined />,
    title: '战略规划',
    prompt: '请帮我制定公司未来3年的发展战略规划',
  },
];

// 模型选项
const MODEL_OPTIONS = [
  { value: 'auto', label: '智能选择', description: 'AI自动选择最适合的模型' },
  { value: 'deepseek-r1-0528', label: 'DeepSeek R1', description: '深度推理，适合复杂分析' },
  { value: 'kimi-k2.6', label: 'Kimi K2.6', description: '超长上下文，适合长文分析' },
  { value: 'qwen-plus', label: '通义千问 Plus', description: '均衡性能，日常对话' },
  { value: 'qwen-turbo', label: '通义千问 Turbo', description: '快速响应，效率优先' },
  { value: 'hunyuan-2.0-instruct-20251111', label: '腾讯混元', description: '腾讯混元大模型' },
];

export default function AIChatPage() {
  // 状态
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('auto');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<any>(null);

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 流式请求控制器（用于取消）
  const abortControllerRef = useRef<AbortController | null>(null);

  // 发送消息（SSE流式 + 打字机效果）
  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    // 添加用户消息
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    // 如果是新对话，创建会话
    if (!currentConversationId) {
      const newConversationId = uuidv4();
      setCurrentConversationId(newConversationId);
      setConversations(prev => [
        {
          id: newConversationId,
          title: userMessage.content.slice(0, 30) + (userMessage.content.length > 30 ? '...' : ''),
          messages: [userMessage],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        ...prev,
      ]);
    } else {
      setConversations(prev =>
        prev.map(conv =>
          conv.id === currentConversationId
            ? { ...conv, messages: [...conv.messages, userMessage], updatedAt: new Date() }
            : conv
        )
      );
    }

    // 创建一个空的助手消息占位符，实现打字机效果
    const assistantId = uuidv4();
    const assistantPlaceholder: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, assistantPlaceholder]);

    try {
      // 取消之前的请求
      abortControllerRef.current?.abort();

      const chatMessages = updatedMessages.map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      }));

      // 使用fetch + SSE流式
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await fetch('/api/ai-chat/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: chatMessages,
          modelKey: selectedModel,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: `请求失败: ${response.status}` }));
        throw new Error(errData.error || `请求失败: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullContent += parsed.content;
              // 逐块更新消息内容 — 打字机效果
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId ? { ...m, content: fullContent } : m
                )
              );
            }
            // 如果有降级标记，更新
            if (parsed.fallback || parsed.isFallback) {
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId ? { ...m, isFallback: true } : m
                )
              );
            }
          } catch {
            // 忽略解析失败的行
          }
        }
      }

      // 流结束 — 如果没有收到任何内容，回退到非流式
      if (!fullContent) {
        // fallback: 非流式请求
        const fallbackResponse = await fetch('/api/ai-chat/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: chatMessages,
            modelKey: selectedModel,
            stream: false,
          }),
        });
        const fallbackResult = await fallbackResponse.json();
        if (fallbackResult.success) {
          fullContent = fallbackResult.data.message;
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId
                ? {
                    ...m,
                    content: fullContent,
                    model: fallbackResult.data.modelName,
                    provider: fallbackResult.data.provider,
                    isFallback: fallbackResult.data.isFallback,
                  }
                : m
            )
          );
        } else {
          throw new Error(fallbackResult.error || 'AI服务异常');
        }
      }

      // 更新会话中的消息
      setConversations(prev =>
        prev.map(conv =>
          conv.id === currentConversationId
            ? {
                ...conv,
                messages: [
                  ...conv.messages,
                  { ...assistantPlaceholder, content: fullContent },
                ],
                updatedAt: new Date(),
              }
            : conv
        )
      );
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // 用户主动取消，不显示错误
        return;
      }
      // 移除空的占位符并添加错误消息
      setMessages(prev => {
        const withoutEmpty = prev.filter(m => m.id !== assistantId);
        return [
          ...withoutEmpty,
          {
            id: uuidv4(),
            role: 'assistant' as const,
            content: `抱歉，发生了错误：${error.message || '请稍后重试'}`,
            timestamp: new Date(),
          },
        ];
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // 使用快捷提示
  const handleQuickPrompt = (prompt: string) => {
    setInputValue(prompt);
    inputRef.current?.focus();
  };

  // 新建对话
  const handleNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
    inputRef.current?.focus();
  };

  // 切换会话
  const handleSwitchConversation = (convId: string) => {
    const conv = conversations.find(c => c.id === convId);
    if (conv) {
      setMessages(conv.messages);
      setCurrentConversationId(convId);
      setShowHistory(false);
    }
  };

  // 删除会话
  const handleDeleteConversation = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (currentConversationId === convId) {
      handleNewConversation();
    }
  };

  // 清空当前对话
  const handleClearMessages = () => {
    setMessages([]);
    if (currentConversationId) {
      setConversations(prev =>
        prev.map(conv =>
          conv.id === currentConversationId
            ? { ...conv, messages: [], updatedAt: new Date() }
            : conv
        )
      );
    }
  };

  // 复制消息
  const handleCopyMessage = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 格式化时间
  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f0f2f5' }}>
      {/* 侧边栏 - 历史会话 */}
      <div
        style={{
          width: 280,
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* 头部 */}
        <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0' }}>
          <Button
            type="primary"
            icon={<CommentOutlined />}
            onClick={handleNewConversation}
            block
            size="large"
          >
            新建对话
          </Button>
        </div>

        {/* 会话列表 */}
        <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
          <List
            dataSource={conversations}
            locale={{ emptyText: '暂无历史对话' }}
            renderItem={conv => (
              <List.Item
                key={conv.id}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: currentConversationId === conv.id ? '#e6f7ff' : 'transparent',
                }}
                onClick={() => handleSwitchConversation(conv.id)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text ellipsis style={{ display: 'block', fontWeight: 500 }}>
                    {conv.title || '新对话'}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {conv.messages.length} 条消息 · {formatTime(conv.updatedAt)}
                  </Text>
                </div>
                <Button
                  type="text"
                  size="small"
                  danger
                  onClick={e => handleDeleteConversation(conv.id, e)}
                >
                  删除
                </Button>
              </List.Item>
            )}
          />
        </div>
      </div>

      {/* 主聊天区域 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 顶部栏 */}
        <div
          style={{
            padding: '12px 24px',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Space>
            <Avatar icon={<RobotOutlined />} style={{ background: '#1890ff' }} />
            <div>
              <Title level={5} style={{ margin: 0 }}>
                智枢AI助手
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                基于多模型混合的智能诊断与对话系统
              </Text>
            </div>
          </Space>

          <Space>
            <Select
              value={selectedModel}
              onChange={setSelectedModel}
              style={{ width: 180 }}
              options={MODEL_OPTIONS}
            />
            <Tooltip title="清空对话">
              <Button
                icon={<ClearOutlined />}
                onClick={handleClearMessages}
                disabled={messages.length === 0}
              />
            </Tooltip>
          </Space>
        </div>

        {/* 消息区域 */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {messages.length === 0 ? (
            <div style={{ maxWidth: 800, margin: '0 auto', paddingTop: 100 }}>
              {/* 欢迎语 */}
              <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <Avatar
                  size={80}
                  icon={<RobotOutlined />}
                  style={{
                    background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
                    marginBottom: 24,
                  }}
                />
                <Title level={2}>欢迎使用智枢AI助手</Title>
                <Paragraph type="secondary" style={{ fontSize: 16 }}>
                  我可以帮助您进行商业诊断、营销策划、运营优化等全方位的智能分析
                </Paragraph>
              </div>

              {/* 快捷提示 */}
              <Divider>快捷提问</Divider>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {QUICK_PROMPTS.map((item, index) => (
                  <Card
                    key={index}
                    hoverable
                    onClick={() => handleQuickPrompt(item.prompt)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Space>
                      <Avatar size="small" icon={item.icon} style={{ background: '#1890ff' }} />
                      <Text strong>{item.title}</Text>
                    </Space>
                    <Paragraph
                      type="secondary"
                      style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}
                      ellipsis={{ rows: 2 }}
                    >
                      {item.prompt}
                    </Paragraph>
                  </Card>
                ))}
              </div>

              {/* 功能说明 */}
              <Divider>能力说明</Divider>
              <Card>
                <List
                  size="small"
                  dataSource={[
                    { icon: '🎯', text: '智能模型调度 - 根据问题类型自动选择最合适的AI模型' },
                    { icon: '💡', text: '深度诊断分析 - 内置全行业商业诊断专家知识库' },
                    { icon: '🔄', text: '智能降级 - 主模型不可用时自动切换到备用模型' },
                    { icon: '📊', text: '多模型对比 - 支持腾讯混元、阿里通义、DeepSeek等主流模型' },
                  ]}
                  renderItem={item => (
                    <List.Item>
                      <Space>
                        <Text>{item.icon}</Text>
                        <Text>{item.text}</Text>
                      </Space>
                    </List.Item>
                  )}
                />
              </Card>
            </div>
          ) : (
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              {messages.map(message => (
                <div
                  key={message.id}
                  style={{
                    display: 'flex',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                    marginBottom: 24,
                  }}
                >
                  <div style={{ display: 'flex', maxWidth: '80%', gap: 12 }}>
                    {message.role === 'assistant' && (
                      <Avatar
                        icon={<RobotOutlined />}
                        style={{ background: '#1890ff', flexShrink: 0 }}
                      />
                    )}

                    <Card
                      size="small"
                      style={{
                        background: message.role === 'user' ? '#1890ff' : '#fff',
                        color: message.role === 'user' ? '#fff' : 'inherit',
                        borderRadius: 16,
                      }}
                    >
                      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                        {message.content}
                      </div>

                      <div
                        style={{
                          marginTop: 8,
                          paddingTop: 8,
                          borderTop: '1px solid rgba(0,0,0,0.06)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Space size="small" style={{ opacity: 0.7 }}>
                          <Text
                            style={{
                              fontSize: 11,
                              color: 'rgba(255,255,255,0.8)',
                            }}
                          >
                            {formatTime(message.timestamp)}
                          </Text>
                          {message.model && (
                            <Badge
                              count={message.model}
                              style={{
                                fontSize: 10,
                                background: message.isFallback ? '#faad14' : '#52c41a',
                              }}
                            />
                          )}
                        </Space>

                        {message.role === 'assistant' && (
                          <Button
                            type="text"
                            size="small"
                            icon={copiedId === message.id ? <CheckOutlined /> : <CopyOutlined />}
                            onClick={() => handleCopyMessage(message.id, message.content)}
                            style={{
                              color: 'rgba(255,255,255,0.8)',
                            }}
                          >
                            {copiedId === message.id ? '已复制' : '复制'}
                          </Button>
                        )}
                      </div>
                    </Card>

                    {message.role === 'user' && (
                      <Avatar
                        icon={<UserOutlined />}
                        style={{ background: '#52c41a', flexShrink: 0 }}
                      />
                    )}
                  </div>
                </div>
              ))}

              {/* 加载中 */}
              {isLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
                  <Avatar icon={<RobotOutlined />} style={{ background: '#1890ff' }} />
                  <Card size="small" style={{ background: '#f5f5f5' }}>
                    <Space>
                      <Spin size="small" />
                      <Text type="secondary">AI正在思考中...</Text>
                    </Space>
                  </Card>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 输入区域 */}
        <div
          style={{
            padding: 16,
            background: '#fff',
            borderTop: '1px solid #f0f0f0',
          }}
        >
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <TextArea
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="输入您的问题，AI将为您提供专业的分析和建议..."
              autoSize={{ minRows: 2, maxRows: 6 }}
              onPressEnter={e => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              style={{ borderRadius: 12 }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                按 Enter 发送，Shift + Enter 换行
              </Text>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                loading={isLoading}
                disabled={!inputValue.trim()}
              >
                发送
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 设置弹窗 */}
      <Modal
        title="AI设置"
        open={showSettings}
        onCancel={() => setShowSettings(false)}
        footer={null}
      >
        <Paragraph>AI对话功能使用多模型混合调度系统，根据问题类型自动选择最合适的模型。</Paragraph>
        <List
          header={<Text strong>可用模型</Text>}
          dataSource={MODEL_OPTIONS}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta title={item.label} description={item.description} />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
}
