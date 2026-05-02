// 服务层导出
export { apiClient } from './api.client';
export { API_CONFIG, API_ENDPOINTS } from './api.config';
export { authService, type LoginParams, type RegisterParams, type UserInfo, type LoginResponse } from './auth.service';
export { homeService, type TodayStats, type ReferralStats, type ContentStats, type RecruitmentStats } from './home.service';
export { contentService, type ContentType, type GenerateContentParams, type GeneratedContent, type MaterialItem, type HistoryItem, CONTENT_TYPES, PLATFORMS } from './content.service';
export { referralService, type ReferralCode, type ReferralRecord, type ReferralStats } from './referral.service';
