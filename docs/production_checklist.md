# 智枢AI SaaS 系统 - 生产环境上线检查报告

**日期**: 2026-06-18
**服务器**: 150.109.60.130 (腾讯云香港CVM)
**域名**: baizhiji.net / api.baizhiji.net

---

## 已完成的修复

| # | 问题 | 修复状态 |
|---|------|---------|
| 1 | PM2开机自启未配置 | 已配置 (systemd enabled) |
| 2 | JWT_SECRET弱密钥 | 已更换为64字符随机密钥 |
| 3 | Prisma Migration未标记 | 已标记为applied, schema与数据库同步 |
| 4 | Admin密码123456不工作 | 已重置bcrypt hash, 登录成功 |
| 5 | uploads目录不存在 | 已创建 /www/zhishuai/server/uploads |
| 6 | EAS CLI未安装 | 已安装 (eas-cli/20.2.0) |

---

## 当前系统运行状态

- **WEB前端** (baizhiji.net): HTTPS正常, Next.js SSR运行在3000端口
- **API后端** (api.baizhiji.net / baizhiji.net/api): HTTPS正常, Express运行在3001端口(cluster模式2实例)
- **SSL证书**: baizhiji.net + api.baizhiji.net 均有Let's Encrypt证书(有效期至2026-09-15)
- **数据库**: TDSQL-C MySQL连接正常, 50+表已创建
- **PM2**: API 2实例运行, Web 1实例运行, 开机自启enabled

---

## 还需要做的 - 才能让WEB和APK真实投入客户使用

### A. 必须修复的（否则客户无法正常使用）

#### 1. SMS短信验证码发送 - 当前为模拟
- **问题**: `sms.ts` 中的 `sendSms` 函数只 `console.log`, 不真正发送短信
- **影响**: 注册流程中验证码不会真正到达客户手机
- **需要**: 配置腾讯云SMS服务或阿里云SMS, 修改sms.service.ts接入真实API
- **当前注册流程**: 管理员后台创建账号(已可用), 手机自助注册(验证码不发送)
- **建议**: 短期方案 - 前端注册页面改为"邀请制"（与管理员创建账号配合使用, 当前Web注册页已是"联系管理员"的静态提示页, 基本可用）; 长期方案 - 接入真实SMS

#### 2. AI聊天消息持久化 - 当前为占位
- **问题**: `ai-chat.ts` 的会话管理6个函数都是占位实现, 消息不持久化到数据库
- **影响**: 客户使用AI聊天功能时, 关闭页面后聊天记录丢失
- **需要**: 实现ChatConversation和ChatMessage的数据库CRUD操作
- **备注**: AI生成内容本身可以工作(调用真实AI API), 只是聊天会话管理不持久化

#### 3. 注册页面没有自助注册表单
- **问题**: Web端 `/register` 页面只是静态提示"邀请制"
- **影响**: 新客户无法自助注册, 必须由管理员/代理商创建账号
- **需要**: 如果要走邀请制, 当前方案可接受(管理员在后台创建账号, 电话告知密码); 如果需要自助注册, 需要开发注册表单+接入真实SMS

#### 4. APK构建和发布
- **问题**: APK从未构建过, 服务器上无APK文件, 无下载链接
- **影响**: 客户无法下载安装APK
- **需要**: 用EAS CLI构建APK(preview配置), 上传到OSS, 配置下载链接
- **APK配置**: eas.json已有preview配置(buildType: apk), app.json包名 com.baizhiji.zhishuai
- **web/.env.production中的下载链接**: `NEXT_PUBLIC_APK_DOWNLOAD_URL=https://oss.baizhiji.net/apk/zhishuai.apk`
- **步骤**: 
  1. 在Expo平台注册并登录 `eas login`
  2. 构建 `eas build --platform android --profile preview`
  3. 上传APK到阿里云OSS的baizhiji-assets桶
  4. 配置nginx对oss.baizhiji.net的反向代理或直接CDN

### B. 需要完善的（影响客户体验但不会阻塞上线）

#### 5. 热点话题功能为mock数据
- **问题**: `hot-topics.ts` 全部硬编码mock数据
- **需要**: 接入真实热点数据API(微博热搜、抖音热点等)

#### 6. 结算系统为TODO
- **问题**: `settlement.ts` 返回空数组和模拟数据
- **影响**: 代理商分成结算功能不可用
- **需要**: 实现结算记录CRUD和结算申请流程

#### 7. 社交账号Cookie刷新为TODO
- **问题**: `social-account.ts` 中Cookie自动刷新未实现
- **影响**: 添加的自媒体账号授权可能过期失效
- **需要**: 实现定时刷新逻辑(网页自动化)

#### 8. Agent反馈数据不真实
- **问题**: `feedback.ts` 返回固定0.75采用率
- **需要**: 实现基于真实数据的反馈统计

#### 9. Web端4个Placeholder页面
- **问题**: `crm/`, `hr/`, `marketing/`, `ecommerce/` 顶层页面是空壳
- **影响**: 客户看不到完整功能(但customer子目录下功能页是完整的)
- **需要**: 将Placeholder页改为重定向到对应customer子目录, 或填充实际内容

#### 10. 版本管理引用不存在模型
- **问题**: `version.ts` 使用 `prisma.appVersion` 但schema无此模型
- **影响**: 版本管理API运行时会报错
- **需要**: 在schema.prisma中添加AppVersion模型, 或修改version.ts使用现有模型

### C. 安全和生产环境优化

#### 11. CORS配置
- **当前**: nginx对api.baizhiji.net配置了 `Access-Control-Allow-Origin *`
- **需要**: 限制为 baizhiji.net 和 app.baizhiji.net 的来源

#### 12. 文件上传大小限制
- **当前**: api.baizhiji.net有50M限制, 但baizhiji.net的前端站没有配置
- **需要**: 在baizhiji.net nginx配置中添加 `client_max_body_size 50M`

#### 13. 数据库密码安全
- **当前**: 数据库密码 `Hao-20061218` 和数据库root密码 `Hao-20061218` 存储在.env文件中
- **建议**: 生产环境中应使用更安全的密码管理方式

#### 14. HTTPS混合内容
- **当前**: 网站使用HTTPS, 需确保所有API调用也使用HTTPS
- **状态**: 前端 .env.production 已配置 HTTPS API地址

#### 15. Redis配置
- **当前**: .env中配置了Redis但服务器上6379端口未监听
- **影响**: 缓存和session可能不工作
- **需要**: 安装Redis或移除Redis相关代码依赖

---

## 建议的上线步骤（按优先级）

### 第一步：最小可用版本（WEB端先上线）

1. 确认当前系统运行稳定 ✅ (已验证)
2. 管理员创建客户账号流程可用 ✅ (登录已验证)
3. 客户登录后可用核心功能 ✅ (CRM、AI生成、素材库、Dashboard等)
4. SMS暂时用邀请制替代（管理员后台创建账号）✅
5. 修复版本管理AppVersion模型问题
6. 添加nginx上传大小限制到baizhiji.net站点
7. 配置Redis或移除Redis依赖

### 第二步：APK上线

1. 注册Expo账号, 登录EAS CLI
2. 构建APK (eas build --platform android --profile preview)
3. 上传到阿里云OSS
4. 配置APK下载链接
5. 测试APK安装和登录
6. 配置APK的API地址为 https://baizhiji.net/api

### 第三步：功能完善

1. 接入真实SMS服务
2. 实现AI聊天消息持久化
3. 实现结算系统
4. 修复Placeholder页面
5. 限制CORS来源

### 第四步：优化和安全

1. 实现热点话题真实数据
2. 实现社交账号Cookie刷新
3. 强化密码安全策略
4. 配置日志监控和告警
5. 数据库备份策略

---

## 系统访问信息

- **WEB端**: https://baizhiji.net
- **API**: https://api.baizhiji.net/api/health
- **Admin登录**: 手机号 18601655222, 密码 123456, 角色 admin
- **PM2管理**: `pm2 list`, `pm2 logs`, `pm2 restart`
- **数据库**: TDSQL-C MySQL at 172.19.0.13:3306
