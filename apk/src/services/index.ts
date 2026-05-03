// 服务层导出
export { apiClient } from './api.client';
export { API_CONFIG, API_ENDPOINTS } from './api.config';
export { authService, type LoginParams, type RegisterParams, type UserInfo, type LoginResponse } from './auth.service';
export { homeService, type TodayStats, type ReferralStats, type ContentStats, type RecruitmentStats } from './home.service';
export {
  contentService,
  ContentCategory,
  contentCategoryConfig,
  generateText,
  generateImage,
  generateVideo,
  analyzeVideo,
  generateDigitalHumanVideo,
  saveToMaterials,
  getGenerationHistory,
  saveGenerationHistory,
  deleteGenerationHistory,
  styleOptions,
  imageSizeOptions,
  videoSizeOptions,
  subtitleOptions,
  voiceoverOptions,
  bgmOptions,
  digitalHumanOptions,
  analysisDimensionOptions,
  viralElementOptions,
  type ContentType,
  type GenerateContentParams,
  type GeneratedContent,
  type MaterialItem,
  type HistoryItem,
  CONTENT_TYPES,
  PLATFORMS,
} from './content.service';
export { referralService, type ReferralCode, type ReferralRecord, type ReferralStats } from './referral.service';
export { checkForUpdate, getCurrentVersion, downloadAndInstall, type VersionInfo, type UpdateCheckResult } from './update.service';
export {
  initNotifications,
  subscribeToMessages,
  sendLocalNotification,
  clearAllNotifications,
  getLocalNotifications,
  getUnreadCount,
  notificationsAvailable,
  type NotificationMessage,
} from './notification.service';
export {
  openWebPage,
  shareWebLink,
  getWebPageUrl,
  getShareText,
  WEB_DEEP_LINKS,
  type WebPageKey,
} from './webLink.service';
