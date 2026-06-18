import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import {
  CodeOutlined,
  SearchOutlined,
  BugOutlined,
  CheckSquareOutlined,
  EyeOutlined,
  MagicOutlined,
} from '@expo/vector-icons/AntDesign';
import { sendCodeRequestStream } from '../../services/code-assistant.service';

// 功能列表
const FEATURES = [
  { key: 'generate', icon: 'code', title: '代码生成', iconComponent: CodeOutlined },
  { key: 'explain', icon: 'search', title: '代码解释', iconComponent: SearchOutlined },
  { key: 'debug', icon: 'bug', title: '代码调试', iconComponent: BugOutlined },
  { key: 'testgen', icon: 'check', title: '单元测试', iconComponent: CheckSquareOutlined },
  { key: 'review', icon: 'eye', title: '代码Review', iconComponent: EyeOutlined },
  { key: 'nl2code', icon: 'magic', title: '转代码', iconComponent: MagicOutlined },
];

// 语言选项
const LANGUAGE_OPTIONS = [
  { value: 'javascript', label: 'JS' },
  { value: 'typescript', label: 'TS' },
  { value: 'python', label: 'Py' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
];

// 主题色
const COLORS = {
  primary: '#1890ff',
  primaryDark: '#096dd9',
  bg: '#ffffff',
  bgSecondary: '#f5f5f5',
  bgCode: '#1e1e1e',
  textPrimary: '#262626',
  textSecondary: '#8c8c8c',
  textMuted: '#bfbfbf',
  border: '#f0f0f0',
  success: '#52c41a',
  codeKeyword: '#569cd6',
  codeString: '#ce9178',
  codeComment: '#6a9955',
  codeFunction: '#dcdcaa',
  codeNumber: '#b5cea8',
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export default function CodeAssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [taskType, setTaskType] = useState('generate');
  const [loading, setLoading] = useState(false);
  const [userMode, setUserMode] = useState<'developer' | 'non-developer'>('developer');
  const [language, setLanguage] = useState('javascript');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth > 600;

  const scrollViewRef = useRef<ScrollView>(null);
  const abortRef = useRef<{ abort: () => void } | null>(null);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setLoading(true);

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      isStreaming: true,
    };
    setMessages([...newMessages, aiMessage]);

    try {
      const abort = sendCodeRequestStream(
        taskType as any,
        newMessages.map(m => ({ role: m.role, content: m.content })),
        (chunk: string) => {
          setMessages(prev => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              return [
                ...updated.slice(0, -1),
                { ...lastMsg, content: lastMsg.content + chunk, isStreaming: true },
              ];
            }
            return prev;
          });
          scrollToBottom();
        },
        () => {
          setMessages(prev => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              return [
                ...updated.slice(0, -1),
                { ...lastMsg, isStreaming: false },
              ];
            }
            return prev;
          });
          setLoading(false);
        },
        (error: string) => {
          Alert.alert('请求失败', error);
          setLoading(false);
          setMessages(prev => prev.filter(m => m.content !== ''));
        },
        {
          language,
          userMode,
          model: 'auto',
        }
      );

      abortRef.current = abort;
    } catch (error: any) {
      Alert.alert('发送失败', error.message);
      setLoading(false);
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

  // 复制代码 — 使用 expo-clipboard 替代废弃的 RN Clipboard
  const handleCopyCode = async (code: string, msgId: string) => {
    try {
      await Clipboard.setStringAsync(code);
      setCopiedId(msgId);
      Alert.alert('成功', '代码已复制到剪贴板');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      Alert.alert('错误', '复制失败');
    }
  };

  // 简单语法高亮渲染（移动端轻量方案）
  const renderHighlightedCode = (code: string, lang: string) => {
    const lines = code.split('\n');

    return (
      <View style={{ backgroundColor: COLORS.bgCode, borderRadius: 8, padding: 12 }}>
        {/* 语言标签 + 复制按钮 */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ color: COLORS.success, fontFamily: 'monospace', fontSize: 11 }}>{lang}</Text>
          <TouchableOpacity onPress={() => handleCopyCode(code, '')}>
            <Text style={{ color: copiedId ? COLORS.success : COLORS.textMuted, fontSize: 11 }}>
              {copiedId ? '已复制' : '复制'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 代码行 */}
        {lines.map((line, idx) => (
          <View key={idx} style={{ flexDirection: 'row' }}>
            <Text style={{ color: COLORS.textMuted, fontSize: 10, width: 30, textAlign: 'right', paddingRight: 8, fontFamily: 'monospace' }}>
              {idx + 1}
            </Text>
            <Text style={{ color: '#d4d4d4', fontFamily: 'monospace', fontSize: 12, flex: 1 }}>
              {highlightSyntax(line, lang)}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  // 基础语法高亮（关键字着色）
  const highlightSyntax = (line: string, lang: string): string => {
    // 移动端不做复杂高亮，仅保留文本（RN 需要富文本组件才能做真正高亮）
    return line;
  };

  // 渲染消息内容
  const renderMessageContent = (content: string, msgId: string) => {
    const parts = content.split(/(```\w*\n[\s\S]*?```)/g);

    return parts.map((part, idx) => {
      const codeMatch = part.match(/^```(\w*)\n([\s\S]*?)```$/);
      if (codeMatch) {
        const lang = codeMatch[1] || language;
        const code = codeMatch[2];
        return renderHighlightedCode(code, lang);
      }

      // 普通文本
      if (!part.trim()) return null;
      return (
        <Text key={idx} style={{ fontSize: 14, color: COLORS.textPrimary, lineHeight: 22 }}>
          {part}
        </Text>
      );
    });
  };

  // 当前功能信息
  const currentFeature = FEATURES.find(f => f.key === taskType);
  const IconComponent = currentFeature?.iconComponent || CodeOutlined;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* 顶部标题栏 */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <IconComponent style={{ fontSize: 20, color: COLORS.primary }} />
          <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.textPrimary }}>
            {currentFeature?.title || '编程助手'}
          </Text>
          {loading && (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 4 }} />
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity
            style={{
              paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
              backgroundColor: userMode === 'developer' ? COLORS.primary : COLORS.bgSecondary,
            }}
            onPress={() => setUserMode('developer')}
          >
            <Text style={{ fontSize: 12, color: userMode === 'developer' ? '#fff' : COLORS.textSecondary }}>开发者</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
              backgroundColor: userMode === 'non-developer' ? COLORS.primary : COLORS.bgSecondary,
            }}
            onPress={() => setUserMode('non-developer')}
          >
            <Text style={{ fontSize: 12, color: userMode === 'non-developer' ? '#fff' : COLORS.textSecondary }}>非开发者</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 功能 Tab 栏 + 语言选择 */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {FEATURES.map((feature) => (
                <TouchableOpacity
                  key={feature.key}
                  style={{
                    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
                    backgroundColor: taskType === feature.key ? COLORS.primary : COLORS.bgSecondary,
                  }}
                  onPress={() => setTaskType(feature.key)}
                >
                  <Text style={{
                    fontSize: 12, fontWeight: '500',
                    color: taskType === feature.key ? '#fff' : COLORS.textSecondary,
                  }}>
                    {feature.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          {/* 语言快捷选择 */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: 8 }}>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {LANGUAGE_OPTIONS.map(lang => (
                <TouchableOpacity
                  key={lang.value}
                  style={{
                    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
                    backgroundColor: language === lang.value ? COLORS.primaryDark : 'transparent',
                    borderWidth: 1,
                    borderColor: language === lang.value ? COLORS.primaryDark : COLORS.border,
                  }}
                  onPress={() => setLanguage(lang.value)}
                >
                  <Text style={{
                    fontSize: 10,
                    color: language === lang.value ? '#fff' : COLORS.textSecondary,
                    fontWeight: '500',
                  }}>
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* 消息列表 */}
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
            <CodeOutlined style={{ fontSize: 56, color: COLORS.textMuted }} />
            <Text style={{ color: COLORS.textMuted, marginTop: 12, fontSize: 15 }}>选择功能，开始对话</Text>
            <Text style={{ color: COLORS.textSecondary, marginTop: 8, fontSize: 13, textAlign: 'center', paddingHorizontal: 32 }}>
              {userMode === 'developer'
                ? '支持代码生成、调试、Review、单测...'
                : '用白话描述需求，AI 帮你写代码'}
            </Text>
          </View>
        ) : (
          messages.map((msg) => (
            <View
              key={msg.id}
              style={{
                marginBottom: 12,
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <View style={{
                maxWidth: isTablet ? '70%' : '85%',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                backgroundColor: msg.role === 'user' ? COLORS.primary : COLORS.bgSecondary,
              }}>
                {/* 消息头部 */}
                {msg.role === 'assistant' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <Text style={{ fontSize: 11, color: COLORS.textSecondary }}>
                      {FEATURES.find(f => f.key === taskType)?.title}
                    </Text>
                    {msg.isStreaming && (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    )}
                  </View>
                )}

                {/* 消息内容 */}
                {msg.role === 'user' ? (
                  <Text style={{ color: '#fff', fontSize: 14, lineHeight: 22 }}>{msg.content}</Text>
                ) : (
                  <View>{renderMessageContent(msg.content, msg.id)}</View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* 底部输入区 */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
          <TextInput
            style={{
              flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
              paddingHorizontal: 12, paddingVertical: 8, maxHeight: 100,
              fontSize: 14, color: COLORS.textPrimary,
            }}
            multiline
            placeholder={userMode === 'developer' ? '描述你的编程需求...' : '用白话描述你想要的功能...'}
            placeholderTextColor={COLORS.textMuted}
            value={inputValue}
            onChangeText={setInputValue}
            editable={!loading}
          />
          <TouchableOpacity
            style={{
              borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
              backgroundColor: inputValue.trim() && !loading ? COLORS.primary : COLORS.textMuted,
            }}
            onPress={handleSend}
            disabled={!inputValue.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>发送</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 底部操作栏 */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          <TouchableOpacity onPress={handleClear}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>清空对话</Text>
          </TouchableOpacity>
          <Text style={{ color: COLORS.textMuted, fontSize: 11 }}>
            {userMode === 'developer' ? `${language} · 专业模式` : '白话模式'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
