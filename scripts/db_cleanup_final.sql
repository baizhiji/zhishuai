-- 智枢AI 商用前测试数据清理脚本
-- 备份已完成 (backup-db.sh)，本脚本可安全执行
START TRANSACTION;

-- ============ 1. 删除关联子表数据 ============
-- 测试用户 + admin 演示数据 userId 集合
-- T_USERS = ('44ad5095-290b-48af-8d49-fc3f21696851', 'a41f3a39-e029-4ba2-b022-12d114d09884', '75f0a572-0c23-4de6-a4f1-5b760cc67ae4', '73d8bf56-b531-411e-9f88-715e821ab3f5')

-- CommentDelivery (依赖 SocialAccount + User)
DELETE FROM CommentDelivery WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5') OR accountId IN (SELECT id FROM SocialAccount WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5'));

-- ChatMessage (依赖 ChatConversation)
DELETE FROM ChatMessage WHERE conversationId IN (SELECT id FROM ChatConversation WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5'));

-- ConversationLog (依赖 ScriptTemplate + User)
DELETE FROM ConversationLog WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5') OR templateId IN (SELECT id FROM ScriptTemplate WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5'));

-- ShareCommission (依赖 ShareRecord)
DELETE FROM ShareCommission WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5') OR shareRecordId IN (SELECT id FROM ShareRecord WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5'));

-- ShareRecord (依赖 ShareQrCode)
DELETE FROM ShareRecord WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5') OR qrCodeId IN (SELECT id FROM ShareQrCode WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5'));

-- ShareEffect (依赖 ShareQrCode)
DELETE FROM ShareEffect WHERE qrCodeId IN (SELECT id FROM ShareQrCode WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5'));

-- LeadFollowup (依赖 AcquisitionLead)
DELETE FROM LeadFollowup WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5') OR leadId IN (SELECT id FROM AcquisitionLead WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5'));

-- RecruitmentProcess (依赖 RecruitmentPost/RecruitmentResume)
DELETE FROM RecruitmentProcess WHERE jobId IN (SELECT id FROM RecruitmentPost WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5')) OR resumeId IN (SELECT id FROM RecruitmentResume WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5'));

-- RecruitmentResume (依赖 RecruitmentPost)
DELETE FROM RecruitmentResume WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5') OR jobId IN (SELECT id FROM RecruitmentPost WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5'));

-- Candidate (依赖 RecruitmentPost)
DELETE FROM Candidate WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5') OR postId IN (SELECT id FROM RecruitmentPost WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5'));

-- ReferralTrack (依赖 ReferralCode)
DELETE FROM ReferralTrack WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5') OR codeId IN (SELECT id FROM ReferralCode WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5'));

-- VideoTask (依赖 DigitalHuman)
DELETE FROM VideoTask WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5') OR humanId IN (SELECT id FROM DigitalHuman WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5'));

-- Payment (依赖 Agent + User)
DELETE FROM Payment WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4') OR agentId IN (SELECT id FROM Agent WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','3f11d10d-8439-11f1-a55a-00f100004023'));

-- UserAgentRelation (依赖 Agent + User)
DELETE FROM UserAgentRelation WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4') OR agentId IN (SELECT id FROM Agent WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','3f11d10d-8439-11f1-a55a-00f100004023'));

-- AgentApiConfig / AgentStats (依赖 Agent)
DELETE FROM AgentApiConfig WHERE agentId IN (SELECT id FROM Agent WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','3f11d10d-8439-11f1-a55a-00f100004023'));
DELETE FROM AgentStats WHERE agentId IN (SELECT id FROM Agent WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','3f11d10d-8439-11f1-a55a-00f100004023'));

-- Agent (测试代理商 + 孤儿Agent)
DELETE FROM Agent WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','3f11d10d-8439-11f1-a55a-00f100004023');

-- UserFeatureSwitch (测试用户)
DELETE FROM UserFeatureSwitch WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4');

-- Notification (测试用户 + admin演示)
DELETE FROM Notification WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5');

-- ApiUsageLog (孤儿用户 45d3dd11)
DELETE FROM ApiUsageLog WHERE userId IN ('45d3dd11-27a8-4645-b021-801a0d4d7622','44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4');

-- ApiKey (孤儿用户 45d3dd11)
DELETE FROM ApiKey WHERE userId IN ('45d3dd11-27a8-4645-b021-801a0d4d7622');

-- OAuthSession (全部会话残留)
DELETE FROM OAuthSession;

-- AdminLog (全部测试期操作日志)
DELETE FROM AdminLog;

-- SmsLog (清空，全部测试)
DELETE FROM SmsLog;

-- ============ 2. 删除业务表数据（admin 演示 + 测试用户） ============
DELETE FROM RecruitmentPost WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5');
DELETE FROM AcquisitionTask WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5');
DELETE FROM AcquisitionLead WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5');
DELETE FROM AcquisitionData WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5');
DELETE FROM AcquisitionSource WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5');
DELETE FROM Material WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5');
DELETE FROM SocialAccount WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5');
DELETE FROM ShareQrCode WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5');
DELETE FROM ReferralCode WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5');
DELETE FROM ScriptTemplate WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5');
DELETE FROM ChatConversation WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5');
DELETE FROM CommentTemplate WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5');
DELETE FROM DigitalHuman WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5');
DELETE FROM VideoClone WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5');
DELETE FROM VoiceClone WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5');
DELETE FROM Employee WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5');
DELETE FROM DataCollectionTask WHERE userId IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4','73d8bf56-b531-411e-9f88-715e821ab3f5');

-- ============ 3. 删除残留配置 ============
DELETE FROM Announcement;
DELETE FROM Setting WHERE `key` = 'ai_provider_switches';

-- ============ 4. 删除测试用户 ============
DELETE FROM User WHERE id IN ('44ad5095-290b-48af-8d49-fc3f21696851','a41f3a39-e029-4ba2-b022-12d114d09884','75f0a572-0c23-4de6-a4f1-5b760cc67ae4');

COMMIT;
