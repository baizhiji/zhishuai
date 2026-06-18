/**
 * AI助手页面
 * 智能问答、任务处理 - 连接真实AI对话API
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAppNavigation } from '../context/NavigationContext';
import { aiChatService } from '../services/ai-chat.service';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface QuickAction {
  id: string;
  icon: string;
  title: string;
  description: string;
}

const quickActions: QuickAction[] = [
  { id: '1', icon: 'document-text-outline', title: '写文案', description: '帮您快速生成各类文案' },
  { id: '2', icon: 'images-outline', title: '做图片', description: 'AI生成精美图片' },
  { id: '3', icon: 'videocam-outline', title: '制视频', description: '一键生成短视频' },
  { id: '4', icon: 'bulb-outline', title: '出方案', description: '智能生成营销方案' },
];

const presetQuestions = [
  '如何提升短视频的播放量？',
  '怎样写出吸引人的标题？',
  '小红书运营有什么技巧？',
  '如何快速涨粉？',
];

export default function AIScreen() {
  const { theme } = useTheme();
  const { goBack } = useAppNavigation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: '您好！我是AI助手，可以帮您解答问题、生成文案、制作图片视频等。有什么可以帮您的吗？',
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // 清理：组件卸载时取消进行中的请求
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsTyping(true);

    // 创建空的助手消息占位符 — 打字机效果
    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', timestamp: Date.now() }]);

    try {
      // 取消之前的请求
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const chatHistory = updatedMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      // 使用流式对话
      let fullContent = '';
      await aiChatService.chatStream(
        { messages: chatHistory, stream: true },
        (chunk: string) => {
          fullContent += chunk;
          setMessages(prev =>
            prev.map(m => m.id === assistantId ? { ...m, content: fullContent } : m)
          );
        },
        controller.signal
      );

      // 如果流式没有收到内容，回退到非流式
      if (!fullContent) {
        const response = await aiChatService.chat({ messages: chatHistory });
        fullContent = response.message || '抱歉，我暂时无法回答这个问题，请稍后再试。';
        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: fullContent } : m)
        );
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId && !m.content
            ? { ...m, content: '网络请求失败，请检查网络连接后重试。' }
            : m
        )
      );
    } finally {
      setIsTyping(false);
      abortRef.current = null;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    sendMessage(inputText);
  };

  const handleQuickAction = (action: QuickAction) => {
    sendMessage(`帮我${action.title}。${action.description}`);
  };

  const handlePresetQuestion = (question: string) => {
    sendMessage(question);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.role === 'user' ? styles.userMessage : styles.assistantMessage
    ]}>
      {item.role === 'assistant' && (
        <View style={styles.avatar}>
          <Ionicons name="chatbubbles" size={20} color="#fff" />
        </View>
      )}
      <View style={[
        styles.messageBubble,
        item.role === 'user' ? styles.userBubble : styles.assistantBubble
      ]}>
        <Text style={[
          styles.messageText,
          item.role === 'user' ? styles.userText : styles.assistantText
        ]}>
          {item.content}
        </Text>
      </View>
      {item.role === 'user' && (
        <View style={styles.avatar}>
          <Ionicons name="person" size={20} color="#fff" />
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E3A5F" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>AI助手</Text>
          <View style={styles.onlineIndicator}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>在线</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#1E3A5F" />
        </TouchableOpacity>
      </View>

      {/* 消息列表 */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          isTyping ? (
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={styles.typingText}>AI正在思考...</Text>
            </View>
          ) : null
        }
        ListHeaderComponent={
          messages.length <= 1 ? (
            <View style={styles.quickActions}>
              <Text style={styles.quickTitle}>快捷操作</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.quickActionsRow}>
                  {quickActions.map(action => (
                    <TouchableOpacity
                      key={action.id}
                      style={styles.quickActionItem}
                      onPress={() => handleQuickAction(action)}
                    >
                      <View style={styles.quickActionIcon}>
                        <Ionicons name={action.icon as any} size={24} color="#2563EB" />
                      </View>
                      <Text style={styles.quickActionTitle}>{action.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.presetTitle}>常见问题</Text>
              <View style={styles.presetQuestions}>
                {presetQuestions.map((question, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.presetItem}
                    onPress={() => handlePresetQuestion(question)}
                  >
                    <Text style={styles.presetText}>{question}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null
        }
      />

      {/* 输入区域 */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="输入您的问题..."
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          editable={!isTyping}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isTyping) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isTyping}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#DBEAFE',
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#52c41a',
    marginRight: 4,
  },
  onlineText: {
    fontSize: 10,
    color: '#52c41a',
  },
  moreButton: {
    padding: 8,
  },
  messageList: {
    padding: 16,
    paddingBottom: 100,
  },
  quickActions: {
    marginBottom: 16,
  },
  quickTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionItem: {
    alignItems: 'center',
    width: 70,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 12,
    color: '#333',
  },
  presetTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
  },
  presetQuestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetItem: {
    backgroundColor: '#f0f5ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  presetText: {
    fontSize: 12,
    color: '#2563EB',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  assistantMessage: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '70%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginHorizontal: 8,
  },
  userBubble: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
  },
  assistantText: {
    color: '#333',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 48,
    marginBottom: 16,
    gap: 8,
  },
  typingText: {
    fontSize: 12,
    color: '#999',
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    color: '#333',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});
