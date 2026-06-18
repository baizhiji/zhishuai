'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Card,
  Input,
  Button,
  Select,
  Spin,
  Space,
  Typography,
  message,
  Segmented,
  Tooltip,
  Result,
} from 'antd';
import {
  SendOutlined,
  RobotOutlined,
  ClearOutlined,
  CodeOutlined,
  WifiOutlined,
  DisconnectOutlined,
  MenuOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import FeatureCard, { iconMap } from '@/components/code-assistant/FeatureCard';
import CodeBlock from '@/components/code-assistant/CodeBlock';
import {
  sendCodeRequestStream,
  getCodeModels,
  CodeMessage,
} from '@/services/code-assistant.service';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// 功能列表
const FEATURES = [
  {
    key: 'generate',
    icon: iconMap.generate,
    title: '代码生成',
    devDesc: '描述需求，生成完整代码',
    nonDevDesc: '说需求，AI 帮你写代码',
  },
  {
    key: 'explain',
    icon: iconMap.explain,
    title: '代码解释',
    devDesc: '粘贴代码，获取逐行解释',
    nonDevDesc: '粘贴代码，看懂每一行',
  },
  {
    key: 'debug',
    icon: iconMap.debug,
    title: '代码调试',
    devDesc: '描述 Bug，获取修复方案',
    nonDevDesc: '代码报错了，AI 帮你改',
  },
  {
    key: 'testgen',
    icon: iconMap.testgen,
    title: '单元测试',
    devDesc: '粘贴代码，自动生成单测',
    nonDevDesc: '自动生成测试，保证质量',
  },
  {
    key: 'review',
    icon: iconMap.review,
    title: '代码 Review',
    devDesc: '粘贴代码，获取改进建议',
    nonDevDesc: '让 AI 帮你检查代码质量',
  },
  {
    key: 'nl2code',
    icon: iconMap.nl2code,
    title: '自然语言转代码',
    devDesc: '用自然语言描述功能',
    nonDevDesc: '说人话，AI 帮你写代码',
  },
];

// 语言选项
const LANGUAGE_OPTIONS = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c++', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
];

// 网络状态检测
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  return isOnline;
}

export default function CodeAssistantPage() {
  // 状态
  const [messages, setMessages] = useState<CodeMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [taskType, setTaskType] = useState<string>('generate');
  const [language, setLanguage] = useState<string>('javascript');
  const [userMode, setUserMode] = useState<'developer' | 'non-developer'>('developer');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('auto');
  const [sidebarVisible, setSidebarVisible] = useState(true); // 移动端侧边栏
  const [modelsLoading, setModelsLoading] = useState(true);

  const isOnline = useOnlineStatus();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<{ abort: () => void } | null>(null);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 加载模型列表
  useEffect(() => {
    setModelsLoading(true);
    getCodeModels()
      .then(setModels)
      .catch(() => message.error('加载模型列表失败'))
      .finally(() => setModelsLoading(false));
  }, []);

  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim() || loading || streaming) return;
    if (!isOnline) {
      message.error('网络已断开，请检查网络连接');
      return;
    }

    const userMessage: CodeMessage = {
      role: 'user',
      content: inputValue,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setStreaming(true);

    const aiMessage: CodeMessage = {
      role: 'assistant',
      content: '',
    };
    setMessages([...newMessages, aiMessage]);

    try {
      const abort = sendCodeRequestStream(
        taskType as any,
        newMessages,
        (chunk: string) => {
          setMessages(prev => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              lastMsg.content += chunk;
            }
            return [...updated];
          });
        },
        () => {
          setStreaming(false);
        },
        (error: string) => {
          message.error(`请求失败: ${error}`);
          setStreaming(false);
          setMessages(prev => prev.filter(m => m.content !== ''));
        },
        {
          language,
          userMode,
          model: selectedModel,
        }
      );

      abortRef.current = abort;
    } catch (error: any) {
      message.error(`发送失败: ${error.message}`);
      setStreaming(false);
    }
  };

  // 清空对话
  const handleClear = () => {
    setMessages([]);
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  };

  // 检测并渲染消息内容（支持代码块）
  const renderMessageContent = (content: string) => {
    const parts = content.split(/(```\w*\n[\s\S]*?```)/g);

    return parts.map((part, idx) => {
      const codeMatch = part.match(/^```(\w*)\n([\s\S]*?)```$/);
      if (codeMatch) {
        const lang = codeMatch[1] || language;
        const code = codeMatch[2];
        return <CodeBlock key={idx} code={code} language={lang} />;
      }

      return (
        <Paragraph key={idx} className="whitespace-pre-wrap break-words m-0">
          {part}
        </Paragraph>
      );
    });
  };

  // 空状态渲染
  const renderEmptyState = () => (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <CodeOutlined className="text-5xl text-gray-300 mb-4 block" />
        <Title level={4} className="text-gray-400 mb-2">选择一个功能，开始对话</Title>
        <div className="mt-6 space-y-3 text-sm text-gray-400">
          <div className="flex items-center gap-2 justify-center">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-400" />
            <span>开发者模式：生成专业代码和单测</span>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
            <span>非开发者模式：用白话描述需求</span>
          </div>
        </div>
      </div>
    </div>
  );

  // 网络错误状态
  const renderNetworkError = () => (
    <Result
      status="error"
      title="网络连接已断开"
      subTitle="请检查网络连接后重试"
      icon={<DisconnectOutlined className="text-red-500" />}
      extra={
        <Button type="primary" onClick={() => window.location.reload()}>
          刷新页面
        </Button>
      }
    />
  );

  return (
    <div className="flex h-[calc(100vh-64px-56px)] bg-gray-50">
      {/* 移动端遮罩 */}
      {sidebarVisible && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setSidebarVisible(false)}
        />
      )}

      {/* 左侧面板 — 响应式：桌面固定，移动端覆盖 */}
      <div className={`
        fixed lg:relative z-30 lg:z-auto
        w-72 lg:w-80 h-full
        border-r bg-white flex flex-col
        transform transition-transform duration-200
        ${sidebarVisible ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* 顶部标题 */}
        <div className="p-4 border-b flex items-center justify-between">
          <Title level={4} className="m-0 flex items-center gap-2">
            <CodeOutlined className="text-blue-500" />
            编程助手
          </Title>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={() => setSidebarVisible(false)}
            className="lg:hidden"
          />
        </div>

        {/* 模式切换 */}
        <div className="px-4 py-2 border-b">
          <Segmented
            options={[
              { label: '开发者', value: 'developer' },
              { label: '非开发者', value: 'non-developer' },
            ]}
            value={userMode}
            onChange={(val) => setUserMode(val as 'developer' | 'non-developer')}
            block
            size="small"
          />
        </div>

        {/* 语言选择 */}
        <div className="px-4 py-2 border-b">
          <Text className="text-xs text-gray-500 mb-1 block">编程语言</Text>
          <Select
            value={language}
            onChange={setLanguage}
            options={LANGUAGE_OPTIONS}
            className="w-full"
            size="small"
          />
        </div>

        {/* 功能入口 */}
        <div className="flex-1 overflow-auto p-3">
          <div className="grid grid-cols-1 gap-2">
            {FEATURES.map((feature) => (
              <FeatureCard
                key={feature.key}
                icon={feature.icon}
                title={feature.title}
                description={
                  userMode === 'developer' ? feature.devDesc : feature.nonDevDesc
                }
                isDeveloperMode={userMode === 'developer'}
                onClick={() => {
                  setTaskType(feature.key);
                  setSidebarVisible(false); // 移动端点击后关闭侧栏
                }}
              />
            ))}
          </div>
        </div>

        {/* 底部操作 */}
        <div className="p-3 border-t">
          <Button
            block
            icon={<ClearOutlined />}
            onClick={handleClear}
            disabled={messages.length === 0}
          >
            清空对话
          </Button>
        </div>
      </div>

      {/* 右侧内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部栏 */}
        <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
          <Space>
            {/* 移动端菜单按钮 */}
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setSidebarVisible(true)}
              className="lg:hidden"
            />
            <Text strong>{FEATURES.find(f => f.key === taskType)?.title || '代码生成'}</Text>
            {streaming && <Spin size="small" />}
            {/* 网络状态指示 */}
            {!isOnline && (
              <Tooltip title="网络已断开">
                <DisconnectOutlined className="text-red-500" />
              </Tooltip>
            )}
          </Space>
          <Space>
            <Select
              value={selectedModel}
              onChange={setSelectedModel}
              options={[
                { value: 'auto', label: '自动选择' },
                ...models.map(m => ({
                  value: m.key,
                  label: `${m.name} (${m.providerName})`,
                })),
              ]}
              className="w-36 sm:w-48"
              size="small"
              loading={modelsLoading}
            />
          </Space>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-auto p-3 sm:p-6">
          {!isOnline ? (
            renderNetworkError()
          ) : messages.length === 0 ? (
            renderEmptyState()
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[80%] rounded-lg px-3 sm:px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border shadow-sm'
                  }`}
                >
                  {/* 消息头部 */}
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-1">
                      <RobotOutlined className="text-blue-500" />
                      <Text type="secondary" className="text-xs">
                        {FEATURES.find(f => f.key === taskType)?.title}
                      </Text>
                    </div>
                  )}

                  {/* 消息内容 */}
                  {msg.role === 'user' ? (
                    <div className="whitespace-pre-wrap break-words">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="text-sm">
                      {renderMessageContent(msg.content)}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 底部输入区 */}
        <div className="bg-white border-t p-3 sm:p-4">
          <div className="flex gap-2">
            <TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                userMode === 'developer'
                  ? '描述你的编程需求...'
                  : '用白话描述你想要的功能...'
              }
              autoSize={{ minRows: 2, maxRows: 6 }}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={loading || streaming || !isOnline}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={loading || streaming}
              disabled={!isOnline}
              className="self-end"
            >
              发送
            </Button>
          </div>
          <div className="mt-1 text-xs text-gray-400">
            Enter 发送，Shift + Enter 换行
          </div>
        </div>
      </div>
    </div>
  );
}
