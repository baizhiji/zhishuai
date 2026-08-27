UPDATE AppVersion SET status = 'archived' WHERE platform = 'windows' AND status = 'released';

INSERT INTO AppVersion (id, platform, version, buildNumber, status, forceUpdate, downloadUrl, changelog, channel, createdAt, updatedAt)
VALUES (UUID(), 'windows', '3.2.9', 329, 'released', false, 'https://baizhiji.net/downloads/zhishuai_3.2.9_x64-setup.exe', '修复 AI 工厂生成卡在 88% 的问题：增加模型 API 30 秒超时和整体 5 分钟总超时', 'stable', NOW(), NOW());
