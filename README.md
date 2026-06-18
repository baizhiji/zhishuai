# 智枢AI SaaS多租户超级应用

> 智能商业平台，集成自媒体、电商、HR、营销、获客等全场景功能

## 项目简介

智枢AI是一个全功能SaaS多租户系统，包含APK端、Web端和后端服务，为自媒体运营者、电商卖家、HR、营销人员等提供一站式智能解决方案。

## 项目结构

```
zhishuai/                          # 项目根目录
├── apk/                           # APK端 - React Native/Expo (Android 应用)
├── web/                           # WEB端 - Next.js 14 (管理后台 + 用户前台)
├── server/                        # 后端服务 - Express + Prisma (API 服务)
├── shared/                        # 共享代码
│   ├── types/                     # TypeScript 类型定义
│   ├── api/                       # API 配置
│   └── utils/                     # 工具函数
├── deploy/                        # 部署相关
│   ├── nginx/                     # Nginx 配置文件
│   ├── *.conf                     # Nginx 站点配置
│   ├── *.sh                       # 部署 Shell 脚本
│   └── *.py, *.ps1                # 部署自动化脚本
├── scripts/                       # 运维和开发脚本
│   ├── debug/                     # 调试/检查/修复脚本归档 (开发临时脚本)
│   ├── tools/                     # 配置工具脚本
│   └── *.sh, *.py                 # 构建/启动/重启/同步脚本
├── docs/                          # 项目文档
├── docker-compose.yml             # Docker 编排配置
├── ecosystem.config.js            # PM2 进程管理配置
├── package.json                   # Monorepo 根配置
└── README.md                      # 本文件
```

## 功能模块

### Web端（已完成基础框架）

#### 自媒体板块 ⭐⭐⭐⭐⭐
- **AI内容生成**：基于热点话题和行业特点生成视频、图文、短视频内容
  - 单次生成
  - 批量生成
  - 数字人视频
  - 批量剪辑
- **矩阵账号管理**：管理抖音、快手、小红书、视频号等多平台账号
  - 多平台账号管理
  - 扫码登录
  - 状态监控
- **批量发布**：一键上传到各平台，自动填写标题、描述和标签
  - 多平台发布
  - 定时发布
  - 文件上传
- **数据统计**：查看播放量、点赞、评论、分享等数据
  - 数据概览
  - 发布记录
  - 热门排行
  - 平台分布
  - 导出报表

#### 电商板块
- 智能详情页生成
- 多店铺管理
- 自动上架
- 价格监控
- 销量统计

#### HR功能
- 职位发布
- AI简历筛选
- 自动回复
- 面试安排

#### 获客功能
- 潜在客户发现
- 自动发送信息
- 二维码发送
- 转化统计

#### 推荐分享
- 二维码生成
- 推荐链接生成
- 推荐追踪

#### 转介绍
- 我的推荐

#### 账号管理
- 用户管理
- 代理商管理
- 客户管理

#### 系统配置
- API配置
- 知识库管理
- APP定制

### APK端（React Native + Expo）
- **框架**: Expo 52, React Native 0.78
- **UI组件库**: React Native Elements + 自定义组件
- **导航**: React Navigation 6
- **状态管理**: Context API
- **25个主页面**：工作台、AI对话、素材库、内容工厂、矩阵管理、发布中心、招聘助手、获客、CRM等

### 后端服务（Express + Prisma）
- **框架**: Express.js 4.21 + TypeScript
- **数据库**: MySQL (TDSQL-C) + Prisma ORM
- **认证**: JWT + bcrypt
- **API路由**: 55+ 路由 (AI对话/生成、素材库、发布系统、CRM、招聘、获客、转介绍、管理等)
- **服务层**: 39 个服务模块

## 技术栈

### Web端
- **框架**: Next.js 14.2.0 (App Router)
- **语言**: TypeScript 5.4
- **UI组件库**: Ant Design 6.3.6
- **状态管理**: Zustand 4.5
- **HTTP客户端**: Axios 1.7
- **日期处理**: Dayjs 1.11
- **样式**: Tailwind CSS 3.4

### APK端
- **框架**: Expo 52, React Native 0.78
- **UI组件库**: React Native Elements + 自定义组件
- **导航**: React Navigation 6
- **状态管理**: Context API

### 后端
- **框架**: Express.js 4.21 + TypeScript 5.4
- **数据库**: MySQL (Prisma ORM)
- **认证**: JWT + bcrypt
- **AI集成**: 阿里云百炼 (DashScope) + 火山引擎

## 快速开始

### Web端

```bash
cd web
npm install
npm run dev
```

访问 http://localhost:3000

### APK端

```bash
cd apk
npm install
npm run dev
```

### 后端服务

```bash
cd server
npm install
npm run dev
```

访问 http://localhost:3001

## 账号体系

系统支持三级账号：

1. **Admin（开发者总后台）**: 最高权限，管理所有账号和配置
2. **Agent（区域代理）**: 管理终端客户，开通客户账号
3. **Customer（终端客户）**: 使用APP功能，后台可以使用所有功能

## 开发指南

### 目录说明

```
web/
├── app/                  # Next.js App Router
│   ├── dashboard/        # 首页Dashboard
│   ├── media/            # 自媒体板块
│   ├── e-commerce/       # 电商板块
│   ├── hr/               # HR功能
│   ├── customer/         # 获客功能
│   ├── referral/         # 推荐分享
│   ├── introduction/     # 转介绍
│   ├── account/          # 账号管理
│   ├── system/           # 系统配置
│   ├── login/            # 登录页面
│   ├── layout.tsx        # 根布局
│   ├── page.tsx          # 首页重定向
│   └── globals.css       # 全局样式
├── components/           # 组件
├── lib/                  # 工具库
├── types/                # TypeScript类型定义
├── utils/                # 工具函数
└── public/               # 静态资源
```

### 开发规范

- 所有页面使用中文
- 所有页面支持返回上级
- 使用TypeScript严格模式
- 遵循Ant Design设计规范
- 代码提交前运行类型检查

### 页面导航规则

- Dashboard（首页）→ 板块页面 → 功能操作页面
- 功能页面返回到板块页面
- 板块页面返回到Dashboard

## API集成

系统采用"中转站"架构，依赖第三方API：

### 阿里云百炼（主力平台）

| 类别 | 模型 | 用途 |
|------|------|------|
| 文本类 | qwen3.6-plus | 商品文案、内容创作、客服对话 |
| 图像类 | wan2.7-image-pro | 商品图、封面图、海报生成 |
| 视频类 | wan2.7-t2v | 文字生成视频、营销视频 |
| 数字人类 | wan2.7-digital-human-clone | 数字人形象克隆 |

### 火山引擎（备用平台）

高并发场景使用

## 环境变量

### Web端
```env
APP_NAME=智枢AI
APP_VERSION=1.0.0
API_BASE_URL=http://localhost:3000/api
```

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## License

© 2024 智枢AI. 保留所有权利。

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

- GitHub: https://github.com/baizhiji/zhishuai
