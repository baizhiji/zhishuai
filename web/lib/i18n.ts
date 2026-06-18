/**
 * 国际化基础框架
 * 当前默认语言: zh-CN
 * 后续可扩展多语言支持
 */

export type SupportedLocale = 'zh-CN' | 'en-US';

interface LocaleMessages {
  [key: string]: string;
}

const messages: Record<SupportedLocale, LocaleMessages> = {
  'zh-CN': {
    // 通用
    'app.name': '智枢AI',
    'app.slogan': '智能内容创作与营销平台',
    'common.loading': '加载中...',
    'common.error': '加载失败',
    'common.retry': '重试',
    'common.empty': '暂无数据',
    'common.save': '保存',
    'common.cancel': '取消',
    'common.confirm': '确认',
    'common.delete': '删除',
    'common.edit': '编辑',
    'common.create': '创建',
    'common.search': '搜索',
    'common.export': '导出',
    'common.back': '返回',
    'common.success': '操作成功',
    'common.failed': '操作失败',

    // 导航
    'nav.home': '首页',
    'nav.dashboard': '数据大盘',
    'nav.customers': '客户管理',
    'nav.agent': '代理后台',
    'nav.admin': '管理后台',
    'nav.settings': '设置',
    'nav.profile': '个人中心',

    // 认证
    'auth.login': '登录',
    'auth.logout': '退出登录',
    'auth.register': '注册',
    'auth.forgotPassword': '忘记密码？',
    'auth.phone': '手机号',
    'auth.password': '密码',
    'auth.verifyCode': '验证码',
    'auth.sendCode': '获取验证码',
    'auth.loginSuccess': '登录成功',
    'auth.loginFailed': '登录失败',
    'auth.sessionExpired': '登录已过期，请重新登录',

    // 功能模块
    'module.ai': 'AI创作',
    'module.matrix': '矩阵管理',
    'module.publish': '内容发布',
    'module.materials': '素材库',
    'module.recruitment': '招聘助手',
    'module.acquisition': '智能获客',
    'module.crm': '客户管理',
    'module.share': '推荐分享',
    'module.referral': '转介绍',

    // 订阅
    'subscribe.title': '套餐管理',
    'subscribe.current': '当前套餐',
    'subscribe.upgrade': '升级套餐',
    'subscribe.daysLeft': '剩余天数',
    'subscribe.monthly': '月度会员',
    'subscribe.quarterly': '季度会员',
    'subscribe.yearly': '年度会员',
  },

  'en-US': {
    'app.name': 'ZhiShu AI',
    'app.slogan': 'Intelligent Content Creation & Marketing Platform',
    'common.loading': 'Loading...',
    'common.error': 'Loading failed',
    'common.retry': 'Retry',
    'common.empty': 'No data',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.search': 'Search',
    'common.export': 'Export',
    'common.back': 'Back',
    'common.success': 'Operation successful',
    'common.failed': 'Operation failed',

    'nav.home': 'Home',
    'nav.dashboard': 'Dashboard',
    'nav.customers': 'Customers',
    'nav.agent': 'Agent Portal',
    'nav.admin': 'Admin Portal',
    'nav.settings': 'Settings',
    'nav.profile': 'Profile',

    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.register': 'Register',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.phone': 'Phone',
    'auth.password': 'Password',
    'auth.verifyCode': 'Verification Code',
    'auth.sendCode': 'Send Code',
    'auth.loginSuccess': 'Login successful',
    'auth.loginFailed': 'Login failed',
    'auth.sessionExpired': 'Session expired, please login again',

    'module.ai': 'AI Creation',
    'module.matrix': 'Matrix Management',
    'module.publish': 'Content Publishing',
    'module.materials': 'Materials',
    'module.recruitment': 'Recruitment',
    'module.acquisition': 'Acquisition',
    'module.crm': 'CRM',
    'module.share': 'Share & Referral',
    'module.referral': 'Referral Program',

    'subscribe.title': 'Subscription Plans',
    'subscribe.current': 'Current Plan',
    'subscribe.upgrade': 'Upgrade Plan',
    'subscribe.daysLeft': 'Days Remaining',
    'subscribe.monthly': 'Monthly',
    'subscribe.quarterly': 'Quarterly',
    'subscribe.yearly': 'Yearly',
  },
};

let currentLocale: SupportedLocale = 'zh-CN';

export function setLocale(locale: SupportedLocale) {
  currentLocale = locale;
  if (typeof window !== 'undefined') {
    localStorage.setItem('locale', locale);
  }
}

export function getLocale(): SupportedLocale {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('locale') as SupportedLocale;
    if (saved) return saved;
  }
  return currentLocale;
}

export function t(key: string, fallback?: string): string {
  const msg = messages[currentLocale]?.[key];
  return msg || fallback || key;
}

export default { t, setLocale, getLocale };
