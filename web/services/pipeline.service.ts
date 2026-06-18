/**
 * 管道服务前端封装
 * 负责与后端 Pipeline API 交互
 */
import axios from 'axios';
import { API_CONFIG, API_ENDPOINTS } from '../config/api';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 120000, // 管道执行可能较慢，2分钟超时
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加认证 Token
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============ 类型定义 ============

export interface PipelineInfo {
  id: string;
  name: string;
  description: string;
  models: string;
}

export interface PipelineStepResult {
  name: string;
  model: string;
  modelKey: string;
  provider: string;
  isFallback: boolean;
  input: string;
  output: string;
  duration: number;
}

export interface PipelineResult {
  success: boolean;
  output: string;
  steps: PipelineStepResult[];
  compliance?: {
    passed: boolean;
    score: number;
    issues: any[];
  };
  totalDuration: number;
}

export interface ComplianceResult {
  passed: boolean;
  score: number;
  issues: ComplianceIssue[];
  sanitizedContent?: string;
}

export interface ComplianceIssue {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  suggestion?: string;
  category?: string;
}

export interface PlatformInfo {
  id: string;
  name: string;
  maxTitleLength: number;
  maxContentLength: number;
  specialRules: string[];
}

// ============ 管道请求参数 ============

export interface CopywritingParams {
  pipeline: 'copywriting';
  description: string;
  style?: string;
  wordCount?: number;
  platform?: string;
}

export interface XiaohongshuParams {
  pipeline: 'xiaohongshu';
  description: string;
  style?: string;
}

export interface TitleParams {
  pipeline: 'title';
  description: string;
  count?: number;
  platform?: string;
}

export interface EcommerceParams {
  pipeline: 'ecommerce';
  description: string;
  productName?: string;
}

export interface VideoScriptParams {
  pipeline: 'video-script';
  description: string;
  duration?: number;
  style?: string;
}

export interface RecruitmentJDParams {
  pipeline: 'recruitment-jd';
  description: string;
  requirements?: string;
  companyInfo?: string;
}

export interface RecruitmentChatParams {
  pipeline: 'recruitment-chat';
  candidateInfo: string;
  jobDescription: string;
  chatGoal?: 'greet' | 'interview_invite' | 'follow_up' | 'answer_question';
}

export interface AcquisitionOutreachParams {
  pipeline: 'acquisition-outreach';
  targetInfo: string;
  productInfo: string;
  platform?: string;
}

export interface AutoReplyParams {
  pipeline: 'auto-reply';
  incomingMessage: string;
  context?: string;
  replyStyle?: 'friendly' | 'professional' | 'casual';
  platform?: string;
}

export type PipelineParams =
  | CopywritingParams
  | XiaohongshuParams
  | TitleParams
  | EcommerceParams
  | VideoScriptParams
  | RecruitmentJDParams
  | RecruitmentChatParams
  | AcquisitionOutreachParams
  | AutoReplyParams;

// ============ API 函数 ============

/**
 * 获取可用管道列表
 */
export async function getPipelineList(): Promise<PipelineInfo[]> {
  const response = await api.get(API_ENDPOINTS.PIPELINE.LIST);
  return response.data?.data || [];
}

/**
 * 执行管道
 */
export async function executePipeline(params: PipelineParams): Promise<PipelineResult> {
  const response = await api.post(API_ENDPOINTS.PIPELINE.EXECUTE, params);
  return response.data?.data;
}

/**
 * 获取模型分配配置
 */
export async function getModelAssignments(): Promise<Record<string, any>> {
  const response = await api.get(API_ENDPOINTS.PIPELINE.MODEL_ASSIGNMENTS);
  return response.data?.data || {};
}

// ============ 合规检测 API ============

/**
 * 完整合规检测（含AI）
 */
export async function checkCompliance(
  content: string,
  platform?: string,
  title?: string,
): Promise<ComplianceResult> {
  const response = await api.post(API_ENDPOINTS.COMPLIANCE.CHECK, {
    content,
    platform,
    title,
  });
  return response.data?.data;
}

/**
 * 快速合规检测（仅本地）
 */
export async function quickCheckCompliance(
  content: string,
  platform?: string,
  title?: string,
): Promise<ComplianceResult> {
  const response = await api.post(API_ENDPOINTS.COMPLIANCE.QUICK_CHECK, {
    content,
    platform,
    title,
  });
  return response.data?.data;
}

/**
 * 获取平台规则
 */
export async function getPlatformRules(platform: string): Promise<any> {
  const response = await api.get(
    API_ENDPOINTS.COMPLIANCE.PLATFORM_RULES.replace(':platform', platform)
  );
  return response.data?.data;
}

/**
 * 获取支持的平台列表
 */
export async function getSupportedPlatforms(): Promise<PlatformInfo[]> {
  const response = await api.get(API_ENDPOINTS.COMPLIANCE.PLATFORMS);
  return response.data?.data || [];
}

// ============ 便捷方法 ============

/**
 * 快速生成文案
 */
export async function generateCopywriting(
  description: string,
  style: string = '专业',
  wordCount: number = 500,
  platform?: string,
): Promise<PipelineResult> {
  return executePipeline({ pipeline: 'copywriting', description, style, wordCount, platform });
}

/**
 * 快速生成小红书内容
 */
export async function generateXiaohongshu(
  description: string,
  style: string = '生活化',
): Promise<PipelineResult> {
  return executePipeline({ pipeline: 'xiaohongshu', description, style });
}

/**
 * 快速生成标题
 */
export async function generateTitles(
  description: string,
  count: number = 5,
  platform?: string,
): Promise<PipelineResult> {
  return executePipeline({ pipeline: 'title', description, count, platform });
}

/**
 * 快速生成电商详情页
 */
export async function generateEcommerce(
  description: string,
  productName?: string,
): Promise<PipelineResult> {
  return executePipeline({ pipeline: 'ecommerce', description, productName });
}

/**
 * 快速生成视频脚本
 */
export async function generateVideoScript(
  description: string,
  duration: number = 60,
  style: string = '专业',
): Promise<PipelineResult> {
  return executePipeline({ pipeline: 'video-script', description, duration, style });
}

/**
 * 快速生成招聘JD
 */
export async function generateRecruitmentJD(
  position: string,
  requirements: string = '',
  companyInfo?: string,
): Promise<PipelineResult> {
  return executePipeline({ pipeline: 'recruitment-jd', description: position, requirements, companyInfo });
}

/**
 * 快速生成招聘沟通话术
 */
export async function generateRecruitmentChat(
  candidateInfo: string,
  jobDescription: string,
  chatGoal: 'greet' | 'interview_invite' | 'follow_up' | 'answer_question' = 'greet',
): Promise<PipelineResult> {
  return executePipeline({ pipeline: 'recruitment-chat', candidateInfo, jobDescription, chatGoal });
}

/**
 * 快速生成获客话术
 */
export async function generateAcquisitionOutreach(
  targetInfo: string,
  productInfo: string,
  platform?: string,
): Promise<PipelineResult> {
  return executePipeline({ pipeline: 'acquisition-outreach', targetInfo, productInfo, platform });
}

/**
 * 快速生成自动回复
 */
export async function generateAutoReply(
  incomingMessage: string,
  context: string = '',
  replyStyle: 'friendly' | 'professional' | 'casual' = 'friendly',
  platform?: string,
): Promise<PipelineResult> {
  return executePipeline({ pipeline: 'auto-reply', incomingMessage, context, replyStyle, platform });
}

export default {
  getPipelineList,
  executePipeline,
  getModelAssignments,
  checkCompliance,
  quickCheckCompliance,
  getPlatformRules,
  getSupportedPlatforms,
  generateCopywriting,
  generateXiaohongshu,
  generateTitles,
  generateEcommerce,
  generateVideoScript,
  generateRecruitmentJD,
  generateRecruitmentChat,
  generateAcquisitionOutreach,
  generateAutoReply,
};
