// 服务层导出
export { apiClient } from './api.client';
export { API_CONFIG, API_ENDPOINTS } from './api.config';
export { authService, type LoginParams, type RegisterParams, type UserInfo, type LoginResponse } from './auth.service';
export { homeService, type TodayStats, type RecruitmentStats } from './home.service';
export {
  ContentCategory,
  contentCategoryConfig,
  generateText,
  generateImage,
  generateVideo,
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
} from './content.service';
export { shareService, type ShareCode, type ShareRecord, type ShareStatistics } from './share.service';
export { checkForUpdate, getCurrentVersion, downloadAndInstall, type VersionInfo, type UpdateCheckResult } from './update.service';
export { default as updateService } from './update.service';
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
export {
  accountService,
  type AccountInfo,
  type UsageStat,
  type UsageRecord,
  type SubscriptionInfo,
  type PlanInfo,
  type StaffInfo,
} from './account.service';
export {
  featureService,
  getDefaultFeatures,
  FEATURE_CODES,
  FEATURE_ROUTES,
  FEATURE_ICONS,
  FEATURE_COLORS,
  type FeatureSwitch,
  type SubFeatureSwitch,
} from './feature.service';
