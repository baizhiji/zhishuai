/**
 * BusinessChatScreen - 商业助手自由问答
 * 智枢 AI APK - 移动端
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import businessService from '../../services/business.service';
import PageHeader from '../../components/PageHeader';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const QUICK_QUESTIONS = [
  '我是刚起步的创业者，第一年怎么活下来并找到第一批客户？',
  '我的企业年营收3000万，下一步如何突破到1个亿？',
  '如何为我的产品制定一套完整的定价和营销方案？',
  '我的实体店客流下降，请给我一份完整的经营改善方案？',
];

export default function BusinessChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '您好！我是智枢AI商业助手，覆盖企业从0（创业启动）到100（做大做强）全生命周期的商业问题。\n\n我可以为您提供以下专业支持：\n• 创业启动：市场机会、商业模式、MVP、启动资金\n• 生存发展：获客、现金流、定价、渠道冷启动\n• 成长扩张：组织、营销放量、融资、数字化转型\n• 规模经营：连锁复制、供应链、品牌、降本增效\n• 做大做强：资本运作、上市辅导、并购、国际化\n\n请描述您或您的企业所处阶段与具体问题，我会为您量身定制最贴合实际的完整方案。',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);

    // Scroll to bottom
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const chatMessages = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const result = await businessService.chat(chatMessages);

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.reply,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMsg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '抱歉，回复失败。请检查 API 配置后重试。',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isUser = item.role === 'user';
    const isLastAssistant = !isUser && index === messages.length - 1;

    return (
      <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        {!isUser && (
          <View style={styles.avatarBot}>
            <Ionicons name="flash" size={16} color="#6D28D9" />
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}>
          <Text style={[styles.messageText, isUser && styles.userText]}>{item.content}</Text>
        </View>
        {isUser && (
          <View style={styles.avatarUser}>
            <Ionicons name="person" size={16} color="#FFFFFF" />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <PageHeader title="商业助手" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            messages.length <= 1 ? (
              <View style={styles.quickQuestions}>
                <Text style={styles.quickTitle}>试试问我</Text>
                {QUICK_QUESTIONS.map((q, i) => (
                  <TouchableOpacity key={i} style={styles.quickChip} onPress={() => handleQuickQuestion(q)}>
                    <Text style={styles.quickText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null
          }
        />

        {/* 输入栏 */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="输入您的问题..."
            placeholderTextColor="#9CA3AF"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
            activeOpacity={0.7}
            onPress={sendMessage}
            disabled={!input.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="send" size={18} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  keyboardView: { flex: 1 },
  messageList: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 8 },

  messageRow: { flexDirection: 'row', marginBottom: 14, alignItems: 'flex-end' },
  messageRowUser: { justifyContent: 'flex-end' },

  avatarBot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F1FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarUser: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6D28D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: { backgroundColor: '#6D28D9', borderBottomRightRadius: 4 },
  botBubble: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#F3F4F6' },

  messageText: { fontSize: 15, color: '#374151', lineHeight: 22 },
  userText: { color: '#FFFFFF' },

  // Quick questions
  quickQuestions: { alignItems: 'center', paddingVertical: 20 },
  quickTitle: { fontSize: 14, color: '#9CA3AF', marginBottom: 12 },
  quickChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 8,
    width: '80%',
    alignItems: 'center',
  },
  quickText: { fontSize: 14, color: '#374151' },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: '#1F2937',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#6D28D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendBtnDisabled: { backgroundColor: '#C4B5FD' },
});
