# 智枢 AI SaaS 系统 - 目录结构调整计划

## 调整时间: 2026-06-18

## 目标结构

```
zhishuai/                          # 项目根目录
├── apk/                           # APK 端代码 (React Native/Expo)
│   └── (保持不变, 32768 files)
├── web/                           # WEB 端代码 (Next.js)
│   └── (保持不变, 77365 files)
├── server/                        # 后端 API 服务 (Express + Prisma)
│   └── (保持不变, 15694 files)
├── shared/                        # 共享类型/工具
│   └── (保持不变)
├── deploy/                        # 部署配置和脚本
│   ├── nginx/                     # Nginx 配置
│   ├── nginx.conf                 # Nginx 主配置
│   ├── nginx-baizhiji.conf        # 站点配置
│   ├── deploy.sh                  # 部署主脚本
│   ├── setup-nginx.sh             # Nginx 安装脚本
│   ├── deploy-ssh.py              # SSH 部署脚本 (从根目录移入)
│   ├── auto-deploy.ps1            # Windows 自动部署 (从根目录移入)
│   ├── upload.ps1                 # 上传脚本 (从根目录移入)
│   ├── deploy_fixes.py            # 部署修复 (从根目录移入)
│   ├── deploy_updates.py          # 部署更新 (从根目录移入)
│   └── deploy_via_python.py       # Python 部署 (从根目录移入)
├── scripts/                       # 运维和开发脚本
│   ├── build.sh                   # 构建脚本
│   ├── restart.sh                 # 重启服务
│   ├── start.sh                   # 启动服务
│   ├── stop.sh                    # 停止服务
│   ├── setup-dev-env.sh           # 开发环境搭建
│   ├── restart_all.py             # 全部重启 (从根目录移入)
│   ├── restart_api.py             # API 重启 (从根目录移入)
│   ├── restart_with_tsx.py        # TSX 重启 (从根目录移入)
│   ├── start_with_tsx.py          # TSX 启动 (从根目录移入)
│   ├── sync_all_and_restart.py    # 同步并重启 (从根目录移入)
│   ├── sync_and_run.py            # 同步运行 (从根目录移入)
│   ├── sync_to_server.py          # 同步到服务器 (从根目录移入)
│   ├── install_deps.py            # 安装依赖 (从根目录移入)
│   ├── install_deps2.py           # 安装依赖 v2 (从根目录移入)
│   ├── install_deps_and_start.py  # 安装依赖并启动 (从根目录移入)
│   ├── npm_full_install.py        # NPM 完整安装 (从根目录移入)
│   └── pnpm_install.py            # PNPM 安装 (从根目录移入)
│
│   ├── debug/                     # 调试/检查/修复脚本 (历史临时脚本归档)
│   │   ├── README.md              # 本目录说明
│   │   ├── check_*.py             # 各种检查脚本 (~12个)
│   │   ├── debug_*.py             # 调试脚本 (~2个)
│   │   ├── verify_*.py            # 验证脚本 (~6个)
│   │   ├── test_*.py              # 测试脚本 (~3个)
│   │   ├── fix_*.py               # 修复脚本 (~25个)
│   │   ├── final_*.py             # 最终验证脚本 (~4个)
│   │   ├── fk_*.py                # FK 相关脚本 (~8个)
│   │   ├── full_check.py          # 完整检查
│   │   └── force_run.py           # 强制运行
│   │
│   └── tools/                     # 配置和工具脚本
│       ├── config_ssl_and_ai.py   # SSL 和 AI 配置
│       ├── setup_api_domain.py    # API 域名设置
│       ├── update_pwd.js          # 密码更新 JS
│       └── update_pwd_prisma.js   # Prisma 密码更新
│
├── docs/                          # 文档
│   └── (保持不变, 13 个 md 文件)
│
# 根目录只保留核心配置文件
├── package.json                   # Monorepo 根配置
├── package-lock.json              # 锁定文件
├── pnpm-lock.yaml                 # PNPM 锁定文件
├── docker-compose.yml             # Docker 编排
├── ecosystem.config.js            # PM2 配置
├── .gitignore                     # Git 忽略规则
├── openclaw.json                  # OpenClaw 配置
├── README.md                      # 项目说明
├── PRODUCTION_READINESS_REPORT.md # 生产就绪报告
└── SYS_AUDIT_REPORT.md            # 系统审计报告
```

## 移动的文件清单

### → deploy/ (5 个文件)
- deploy-ssh.py
- auto-deploy.ps1
- upload.ps1
- deploy_fixes.py
- deploy_updates.py
- deploy_via_python.py

### → scripts/ (16 个文件)
- restart_all.py
- restart_api.py
- restart_with_tsx.py
- start_with_tsx.py
- sync_all_and_restart.py
- sync_and_run.py
- sync_to_server.py
- install_deps.py
- install_deps2.py
- install_deps_and_start.py
- npm_full_install.py
- pnpm_install.py

### → scripts/debug/ (约 70 个文件 - 历史临时脚本)
- check_*.py (12 个)
- debug_*.py (2 个)
- verify_*.py (6 个)
- test_*.py (3 个)
- fix_*.py (25 个)
- final_*.py (4 个)
- fk_*.py (8 个)
- full_check.py
- force_run.py

### → scripts/tools/ (4 个文件)
- config_ssl_and_ai.py
- setup_api_domain.py
- update_pwd.js
- update_pwd_prisma.py
