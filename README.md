# 智枢AI SaaS多租户超级应用

> 智能商业平台，集成自媒体、电商、HR、营销、获客等全场景功能

## 项目简介

智枢AI是一个全功能SaaS多租户系统，主产品形态为 **Windows 桌面安装版** 和 **Android APK端**，配套 Express 后端服务。系统为自媒体运营者、电商卖家、HR、营销人员等提供一站式智能解决方案。

- **桌面安装版**：基于 `desktop-ui/` 源码（原 `web/`，Next.js 静态导出）通过 Tauri 2.x 封装为 Windows 安装程序，是管理后台的主力形态。在线网页版已下线。
- **APK端**：基于 Expo + React Native 的 Android 应用。
- **后端服务**：基于 Express + TypeScript + Prisma + MySQL 的 API 服务。

## 项目结构

```
zhishuai/
├── apk/                   # APK端（Expo + React Native）
├── desktop-ui/            # 桌面安装版界面（Next.js，静态导出后由 Tauri 壳加载，原 web/）
├── desktop/               # 桌面壳（Tauri 2.x，Rust）
├── server/                # 后端服务（Express + Prisma + MySQL）
├── shared/                # 共享代码
│   └── *.ts               # TypeScript 类型定义
├── docs/                  # 文档
├── scripts/               # 脚本（部署、验证等）
└── deploy/                # 部署配置
```

## 功能模块

### 桌面安装版（管理后台）

#### 自媒体板块
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

### APK端
- 企业策划/诊断对话窗口
- 生成 Word/Excel/PPT/PDF 供客户下载
- 与桌面安装版共用后端服务

### 后端服务
- 用户/代理商/客户账号体系
- 多租户数据隔离
- 第三方 AI 模型中转（阿里云百炼、火山引擎等）
- 文件生成与下载
- 部署验证与监控

## 技术栈

### 桌面安装版
- **框架**: Tauri 2.x + Next.js 14.2.0 (App Router)
- **语言**: TypeScript 5.4
- **UI组件库**: Ant Design 6.3.6
- **状态管理**: Zustand 4.5
- **样式**: Tailwind CSS 3.4

### APK端
- **框架**: Expo SDK 52 + React Native 0.76
- **语言**: TypeScript

### 后端
- **框架**: Express 4 + TypeScript
- **ORM**: Prisma
- **数据库**: MySQL 5.7 (TDSQL-C)
- **进程管理**: PM2

## 快速开始

### 桌面安装版

```bash
# 1. 安装 desktop-ui 与 desktop 依赖
npm run install:desktop-ui
cd desktop && npm install

# 2. 启动桌面开发模式
npm run dev:desktop

# 3. 构建 Windows 安装包
npm run build:desktop
```

在线网页版已下线，桌面安装包由 GitHub Actions CI 发布。

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

后端默认运行在 http://localhost:3001

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

desktop/
├── src/                  # Tauri 主进程/预处理代码
├── src-tauri/            # Rust 源码与构建配置
└── package.json          # 桌面端脚本

server/
├── src/                  # Express API 源码
├── prisma/               # Prisma schema 与迁移
└── package.json          # 后端脚本
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

### 桌面安装版界面 (desktop-ui)
```env
APP_NAME=智枢AI
APP_VERSION=1.0.0
API_BASE_URL=http://localhost:3001/api
```

### 后端服务
```env
DATABASE_URL="mysql://user:password@host:3306/zhishuai"
PORT=3001
JWT_SECRET=your-jwt-secret
```

## 系统要求

### 桌面安装版
- Windows 10 64位及以上
- 4GB RAM 及以上

### APK端
- Android 8.0 (API 26) 及以上

## License

© 2024-2026 智枢AI. 保留所有权利。

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

- GitHub: https://github.com/baizhiji/zhishuai
