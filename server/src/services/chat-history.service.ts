/**
 * AI对话历史服务
 */
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export interface SaveMessageParams {
  userId: string;
  conversationId?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  provider?: string;
  tokens?: number;
  latency?: number;
  metadata?: any;
}

/**
 * 保存对话消息并创建/更新会话
 */
export async function saveMessage(params: SaveMessageParams) {
  const { userId, conversationId, role, content, model, provider, tokens, latency, metadata } = params;

  // 如果没有会话ID，创建新会话
  if (!conversationId) {
    const conversation = await prisma.chatConversation.create({
      data: {
        id: uuidv4(),
        userId,
        title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
        modelKey: model,
        provider: provider,
        messageCount: 1,
        lastMessage: content.slice(0, 200),
      },
    });

    await prisma.chatMessage.create({
      data: {
        id: uuidv4(),
        conversationId: conversation.id,
        role,
        content,
        model,
        provider,
        tokens,
        latency,
        metadata: metadata || undefined,
      },
    });

    return { conversationId: conversation.id, isNew: true };
  }

  // 更新现有会话
  await prisma.chatConversation.update({
    where: { id: conversationId },
    data: {
      messageCount: { increment: 1 },
      lastMessage: content.slice(0, 200),
      updatedAt: new Date(),
    },
  });

  await prisma.chatMessage.create({
    data: {
      id: uuidv4(),
      conversationId,
      role,
      content,
      model,
      provider,
      tokens,
      latency,
      metadata: metadata || undefined,
    },
  });

  return { conversationId, isNew: false };
}

/**
 * 获取用户的对话会话列表
 */
export async function getConversationList(userId: string, limit = 50, offset = 0) {
  const conversations = await prisma.chatConversation.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    skip: offset,
    select: {
      id: true,
      title: true,
      modelKey: true,
      provider: true,
      messageCount: true,
      lastMessage: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const total = await prisma.chatConversation.count({
    where: { userId },
  });

  return { conversations, total };
}

/**
 * 获取会话详情（包含所有消息）
 */
export async function getConversationDetail(conversationId: string, userId: string) {
  const conversation = await prisma.chatConversation.findFirst({
    where: {
      id: conversationId,
      userId,
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          role: true,
          content: true,
          model: true,
          provider: true,
          tokens: true,
          latency: true,
          createdAt: true,
        },
      },
    },
  });

  return conversation;
}

/**
 * 删除对话会话
 */
export async function deleteConversation(conversationId: string, userId: string) {
  const result = await prisma.chatConversation.deleteMany({
    where: {
      id: conversationId,
      userId,
    },
  });

  return result.count > 0;
}

/**
 * 清空用户所有对话历史
 */
export async function clearAllConversations(userId: string) {
  await prisma.chatConversation.deleteMany({
    where: { userId },
  });
}

/**
 * 更新会话标题
 */
export async function updateConversationTitle(conversationId: string, userId: string, title: string) {
  await prisma.chatConversation.updateMany({
    where: { id: conversationId, userId },
    data: { title },
  });
}
