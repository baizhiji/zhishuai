// 离线请求队列 - 网络恢复后自动重试
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api.client';

const QUEUE_KEY = '@zhishuai_offline_queue';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const POLL_INTERVAL_MS = 30000; // 每30秒检查一次网络

interface QueuedRequest {
  id: string;
  method: 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  data?: any;
  retries: number;
  createdAt: string;
}

class OfflineQueue {
  private queue: QueuedRequest[] = [];
  private isProcessing = false;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  // 初始化：加载队列 + 定时轮询
  async init() {
    await this.loadQueue();

    // 定时尝试处理队列（应用前台时）
    this.pollTimer = setInterval(() => {
      if (!this.isProcessing && this.queue.length > 0) {
        this.processQueue();
      }
    }, POLL_INTERVAL_MS);

    // 启动时立即尝试一次
    if (this.queue.length > 0) {
      this.processQueue();
    }
  }

  // 销毁
  destroy() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private async loadQueue() {
    try {
      const data = await AsyncStorage.getItem(QUEUE_KEY);
      if (data) {
        this.queue = JSON.parse(data);
      }
    } catch (error) {
      console.error('加载离线队列失败:', error);
    }
  }

  private async saveQueue() {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('保存离线队列失败:', error);
    }
  }

  // 添加请求到队列
  async enqueue(method: QueuedRequest['method'], endpoint: string, data?: any): Promise<string> {
    const id = `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const request: QueuedRequest = {
      id,
      method,
      endpoint,
      data,
      retries: 0,
      createdAt: new Date().toISOString(),
    };

    this.queue.push(request);
    await this.saveQueue();
    console.log(`请求已加入离线队列: ${method} ${endpoint}`);
    return id;
  }

  // 处理队列
  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const request = this.queue[0];

        try {
          switch (request.method) {
            case 'POST':
              await apiClient.post(request.endpoint, request.data);
              break;
            case 'PUT':
              await apiClient.put(request.endpoint, request.data);
              break;
            case 'DELETE':
              await apiClient.delete(request.endpoint);
              break;
          }

          this.queue.shift();
          await this.saveQueue();
          console.log(`离线请求执行成功: ${request.method} ${request.endpoint}`);
        } catch (error: any) {
          request.retries++;

          if (request.retries >= MAX_RETRIES) {
            this.queue.shift();
            console.warn(`离线请求重试次数超限，已丢弃: ${request.method} ${request.endpoint}`);
          } else {
            this.queue.shift();
            this.queue.push(request);
          }

          await this.saveQueue();
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  get length(): number {
    return this.queue.length;
  }

  get pendingRequests(): QueuedRequest[] {
    return [...this.queue];
  }

  async clear() {
    this.queue = [];
    await this.saveQueue();
  }
}

export const offlineQueue = new OfflineQueue();
