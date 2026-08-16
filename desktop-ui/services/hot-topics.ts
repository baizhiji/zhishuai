import request from '@/utils/request';

export interface HotTopic {
  id: string;
  platform: string;
  title: string;
  heat: number;
  trend: 'up' | 'down' | 'stable';
  category: string;
  rank: number;
  updatedAt: string;
}

export interface TopicPlatform {
  id: string;
  name: string;
  icon: string;
}

export interface GeneratedContent {
  title: string;
  content: string;
  hashtags: string[];
  suggestions: string[];
}

export interface TrendData {
  date: string;
  heat: number;
  newTopics: number;
}

export function getPlatforms() {
  return request.get<TopicPlatform[]>('/api/hot-topics/platforms');
}

export function getHotTopics(params?: {
  platform?: string;
  category?: string;
  limit?: number;
}) {
  return request.get<HotTopic[]>('/api/hot-topics', { params });
}

export function getTopicDetail(id: string) {
  return request.get<any>(`/api/hot-topics/${id}`);
}

export function generateContent(data: {
  topicId?: string;
  topicTitle: string;
  contentType?: string;
  style?: string;
}) {
  return request.post<GeneratedContent>('/api/hot-topics/generate', data);
}

export function getTrends(platform: string, days?: number) {
  return request.get<TrendData[]>(`/api/hot-topics/trends/${platform}`, {
    params: { days },
  });
}
