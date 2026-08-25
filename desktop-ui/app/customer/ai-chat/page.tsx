'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Card, Input, Button, Space, Avatar, Typography, Select, Spin, Empty, Divider, Badge, Tooltip, List, Modal, Drawer, message,
} from 'antd';
import {
  SendOutlined, RobotOutlined, UserOutlined, ClearOutlined,
  ThunderboltOutlined, CopyOutlined, CheckOutlined, CommentOutlined,
  BulbOutlined, FileTextOutlined, ExperimentOutlined, AppstoreOutlined,
  AimOutlined, SyncOutlined, BarChartOutlined, HistoryOutlined, SettingOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import { absUrl } from '@/utils/env';
import PageContainer from '@/components/customer/PageContainer';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
  provider?: string;
  isFallback?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

const QUICK_PROMPTS = [
  { icon: <BulbOutlined />, title: '商业诊断', prompt: '请帮我分析一下当前的市场竞争格局和我们的优势劣势' },
  { icon: <FileTextOutlined />, title: '营销策划', prompt: '帮我制定一份针对年轻用户的营销推广方案' },
  { icon: <ExperimentOutlined />, title: '运营优化', prompt: '分析一下我们门店的运营效率，提出优化建议' },
  { icon: <AppstoreOutlined />, title: '战略规划', prompt: '请帮我制定公司未来3年的发展战略规划' },
];

const MODEL_OPTIONS = [
  { value: 'auto', label: '智能选择', description: 'AI自动选择最适合的模型' },
  { value: 'deepseek_r1', label: 'DeepSeek-V4', description: '深度推理，适合复杂分析' },
  { value: 'kimi_k2', label: 'Kimi K3', description: '超长上下文，适合长文分析' },
  { value: 'qwen_plus', label: '通义千问 Plus', description: '均衡性能，日常对话' },
  { value: 'qwen_turbo', label: '通义千问 Turbo', description: '快速响应，效率优先' },
  { value: 'hunyuan_instruct', label: '腾讯混元', description: '腾讯混元大模型' },
];

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('auto');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<React.ComponentRef<typeof TextArea>>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: uuidv4(), role: 'user', content: inputValue.trim(), timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    if (!currentConversationId) {
      const newConvId = uuidv4();
      setCurrentConversationId(newConvId);
      setConversations(prev => [
        { id: newConvId, title: inputValue.trim().slice(0, 30) + (inputValue.length > 30 ? '...' : ''), messages: [userMessage], createdAt: new Date(), updatedAt: new Date() },
        ...prev,
      ]);
    } else {
      setConversations(prev => prev.map(conv =>
        conv.id === currentConversationId ? { ...conv, messages: [...conv.messages, userMessage], updatedAt: new Date() } : conv
      ));
    }

    try {
      abortControllerRef.current = new AbortController();
      const currentConvId = currentConversationId;
      const response = await fetch(absUrl('/api/ai-chat/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })), modelKey: selectedModel, stream: false }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error('请求失败');

      const result = await response.json();
      if (result.success) {
        const assistantMessage: Message = {
          id: uuidv4(), role: 'assistant', content: result.data.message, timestamp: new Date(),
          model: result.data.modelName, provider: result.data.provider, isFallback: result.data.isFallback,
        };
        setMessages(prev => [...prev, assistantMessage]);
        setConversations(prev => prev.map(conv =>
          conv.id === currentConvId ? { ...conv, messages: [...conv.messages, assistantMessage], updatedAt: new Date() } : conv
        ));
      } else {
        throw new Error(result.error || 'AI服务异常');
      }
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      const err = error as { message?: string };
      const errorMessage: Message = { id: uuidv4(), role: 'assistant', content: `抱歉，发生了错误：${err.message || '请稍后重试'}`, timestamp: new Date() };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => { abortControllerRef.current?.abort(); };

  const handleQuickPrompt = (prompt: string) => {
    setInputValue(prompt);
    inputRef.current?.focus();
  };

  const handleNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
    inputRef.current?.focus();
  };

  const handleSwitchConversation = (convId: string) => {
    const conv = conversations.find(c => c.id === convId);
    if (conv) {
      setMessages(conv.messages);
      setCurrentConversationId(convId);
      setShowHistory(false);
    }
  };

  const handleDeleteConversation = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (currentConversationId === convId) handleNewConversation();
  };

  const handleClearMessages = () => {
    setMessages([]);
    if (currentConversationId) {
      setConversations(prev => prev.map(conv =>
        conv.id === currentConversationId ? { ...conv, messages: [], updatedAt: new Date() } : conv
      ));
    }
  };

  const handleCopyMessage = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <PageContainer
      title="商业助手"
      description="基于多模型混合的智能诊断与对话系统，帮助您进行商业诊断、营销策划、运营优化"
      breadcrumb={[{ title: '商业助手' }]}
      loading={false}
      skeletonType="none"
      extra={
        <Space>
          <Select value={selectedModel} onChange={setSelectedModel} style={{ width: 160 }} options={MODEL_OPTIONS} size="small" />
          <Button icon={<HistoryOutlined />} onClick={() => setShowHistory(true)} size="small">历史</Button>
        </Space>
      }
    >
      <div style={{ display: 'flex', height: 'calc(100vh - 160px)', gap: 0 }}>
        {/* 聊天区域 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {/* 消息区 */}
          <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
            {messages.length === 0 ? (
              <div style={{ maxWidth: 700, margin: '0 auto', paddingTop: 60 }}>
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                  <Avatar size={72} icon={<RobotOutlined />} style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #722ed1 100%)', marginBottom: 20 }} />
                  <Title level={2} style={{ marginBottom: 8 }}>欢迎使用智枢商业助手</Title>
                  <Paragraph type="secondary" style={{ fontSize: 15 }}>我可以帮助您进行商业诊断、营销策划、运营优化等全方位的智能分析</Paragraph>
                </div>
                <Divider>快捷提问</Divider>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {QUICK_PROMPTS.map((item, index) => (
                    <Card key={index} hoverable onClick={() => handleQuickPrompt(item.prompt)} style={{ cursor: 'pointer', borderRadius: 10 }}>
                      <Space><Avatar size="small" icon={item.icon} style={{ background: '#6d28d9' }} /><Text strong>{item.title}</Text></Space>
                      <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }} ellipsis={{ rows: 2 }}>{item.prompt}</Paragraph>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ maxWidth: 750, margin: '0 auto' }}>
                {messages.map(message => (
                  <div key={message.id} style={{ display: 'flex', justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 24 }}>
                    <div style={{ display: 'flex', maxWidth: '80%', gap: 12 }}>
                      {message.role === 'assistant' && <Avatar icon={<RobotOutlined />} style={{ background: '#6d28d9', flexShrink: 0 }} />}
                      <Card
                        size="small"
                        style={{
                          background: message.role === 'user' ? '#6d28d9' : '#fff',
                          borderRadius: 16,
                        }}
                        styles={{ body: { padding: '12px 16px' } }}
                      >
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: message.role === 'user' ? '#fff' : 'inherit' }}>{message.content}</div>
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Space size="small">
                            <Text style={{ fontSize: 11, color: message.role === 'user' ? 'rgba(255,255,255,0.7)' : '#999' }}>{formatTime(message.timestamp)}</Text>
                            {message.model && <Badge count={message.model} style={{ fontSize: 10, background: message.isFallback ? '#faad14' : '#52c41a' }} />}
                          </Space>
                          {message.role === 'assistant' && (
                            <Button type="text" size="small" icon={copiedId === message.id ? <CheckOutlined /> : <CopyOutlined />} onClick={() => handleCopyMessage(message.id, message.content)}>
                              {copiedId === message.id ? '已复制' : '复制'}
                            </Button>
                          )}
                        </div>
                      </Card>
                      {message.role === 'user' && <Avatar icon={<UserOutlined />} style={{ background: '#52c41a', flexShrink: 0 }} />}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
                    <Avatar icon={<RobotOutlined />} style={{ background: '#6d28d9' }} />
                    <Card size="small" style={{ background: '#f5f5f5', borderRadius: 12 }}>
                      <Space><Spin size="small" /><Text type="secondary">AI正在思考中...</Text></Space>
                    </Card>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* 输入区 */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid #f0f0f0', background: '#fafafa' }}>
            <div style={{ maxWidth: 750, margin: '0 auto', display: 'flex', gap: 12 }}>
              <TextArea
                ref={inputRef}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="输入您的问题，AI将为您提供专业的分析和建议..."
                autoSize={{ minRows: 1, maxRows: 4 }}
                onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); handleSend(); } }}
                style={{ flex: 1, borderRadius: 12 }}
                disabled={isLoading}
              />
              <Space>
                {isLoading ? (
                  <Button danger icon={<StopOutlined />} onClick={handleStop}>停止</Button>
                ) : (
                  <Button type="primary" icon={<SendOutlined />} onClick={handleSend} disabled={!inputValue.trim()} size="middle">发送</Button>
                )}
                {messages.length > 0 && <Tooltip title="清空对话"><Button icon={<ClearOutlined />} onClick={handleClearMessages} /></Tooltip>}
              </Space>
            </div>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>按 Enter 发送，Shift + Enter 换行</Text>
            </div>
          </div>
        </div>
      </div>

      {/* 历史记录抽屉 */}
      <Drawer title="历史对话" onClose={() => setShowHistory(false)} open={showHistory} width={360}>
        <Button type="primary" icon={<CommentOutlined />} onClick={() => { handleNewConversation(); setShowHistory(false); }} block style={{ marginBottom: 16 }}>新建对话</Button>
        {conversations.length === 0 ? <Empty description="暂无历史对话" /> : (
          <List dataSource={conversations} renderItem={conv => (
            <List.Item
              style={{ padding: '8px 12px', borderRadius: 8, cursor: 'pointer', background: currentConversationId === conv.id ? '#e6f7ff' : 'transparent' }}
              onClick={() => handleSwitchConversation(conv.id)}
              actions={[<Button type="text" size="small" danger key="del" onClick={e => handleDeleteConversation(conv.id, e)}>删除</Button>]}
            >
              <List.Item.Meta title={<Text ellipsis style={{ display: 'block', fontWeight: 500 }}>{conv.title || '新对话'}</Text>} description={<Text type="secondary" style={{ fontSize: 12 }}>{conv.messages.length} 条消息 · {formatTime(conv.updatedAt)}</Text>} />
            </List.Item>
          )} />
        )}
      </Drawer>

      {/* 设置弹窗 */}
      <Modal title="模型设置" open={showSettings} onCancel={() => setShowSettings(false)} footer={null}>
        <Paragraph>商业助手使用多模型混合调度系统，根据问题类型自动选择最合适的模型。</Paragraph>
        <List header={<Text strong>可用模型</Text>} dataSource={MODEL_OPTIONS} renderItem={item => (
          <List.Item><List.Item.Meta title={item.label} description={item.description} /></List.Item>
        )} />
      </Modal>
    </PageContainer>
  );
}
