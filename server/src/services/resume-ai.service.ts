/**
 * AI 简历解析与智能筛选服务
 */
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// 简历解析系统提示词
const RESUME_PARSING_PROMPT = `你是一个专业的HR简历分析助手。请从以下简历内容中提取结构化信息，并以JSON格式返回。

返回格式：
{
  "name": "姓名",
  "age": "年龄（如有）",
  "gender": "性别（如有）",
  "phone": "手机号",
  "email": "邮箱",
  "education": "最高学历",
  "school": "毕业院校",
  "major": "专业",
  "workExperience": "工作年限",
  "currentCompany": "当前公司",
  "currentPosition": "当前职位",
  "previousCompanies": ["上一家公司", "上两家公司"],
  "skills": ["技能1", "技能2", "技能3"],
  "expectedSalary": "期望薪资",
  "location": "所在地",
  "summary": "个人简介（100字以内）"
}

请确保返回的是合法的JSON格式，不要包含其他内容。`;

/**
 * 解析简历文本
 */
export async function parseResumeWithAI(resumeText: string, apiKey: string): Promise<any> {
  const response = await fetch(`${process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com'}/api/v1/services/aigc/text-generation/generation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'qwen-plus',
      input: {
        messages: [
          { role: 'system', content: RESUME_PARSING_PROMPT },
          { role: 'user', content: resumeText },
        ],
      },
      parameters: {
        temperature: 0.1,
        max_tokens: 2000,
      },
    }),
  });

  const data = await response.json();
  const content = data.output?.choices?.[0]?.message?.content || '';

  // 提取 JSON
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  throw new Error('无法解析简历内容');
}

/**
 * 智能匹配岗位
 */
export async function matchJobWithAI(
  resumeData: any,
  jobRequirements: any,
  apiKey: string
): Promise<{ score: number; analysis: string; suggestions: string[] }> {
  const prompt = `请分析以下简历与岗位的匹配程度：

简历信息：
- 姓名：${resumeData.name || '未知'}
- 学历：${resumeData.education || '未知'}
- 专业：${resumeData.major || '未知'}
- 工作年限：${resumeData.workExperience || '未知'}
- 当前职位：${resumeData.currentPosition || '未知'}
- 当前公司：${resumeData.currentCompany || '未知'}
- 技能：${resumeData.skills?.join('、') || '未知'}
- 期望薪资：${resumeData.expectedSalary || '未填'}

岗位要求：
- 岗位名称：${jobRequirements.title || '未知'}
- 薪资范围：${jobRequirements.salaryMin || 0} - ${jobRequirements.salaryMax || 0}
- 学历要求：${jobRequirements.education || '不限'}
- 经验要求：${jobRequirements.experience || '不限'}
- 岗位描述：${jobRequirements.description || '无'}
- 技能要求：${jobRequirements.requirements || '无'}

请返回JSON格式：
{
  "score": 85,  // 匹配度分数 0-100
  "analysis": "简要分析（100字以内）",
  "suggestions": ["建议1", "建议2"]
}`;

  const response = await fetch(`${process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com'}/api/v1/services/aigc/text-generation/generation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'qwen-plus',
      input: {
        messages: [
          { role: 'system', content: '你是一个专业的招聘顾问，擅长简历筛选和岗位匹配。' },
          { role: 'user', content: prompt },
        ],
      },
      parameters: {
        temperature: 0.3,
        max_tokens: 1500,
      },
    }),
  });

  const data = await response.json();
  const content = data.output?.choices?.[0]?.message?.content || '';

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  return {
    score: 50,
    analysis: '未能完成智能分析',
    suggestions: ['建议人工审核'],
  };
}

/**
 * 生成面试问题
 */
export async function generateInterviewQuestions(
  resumeData: any,
  jobRequirements: any,
  apiKey: string
): Promise<string[]> {
  const prompt = `根据以下简历和岗位，生成5个针对性面试问题：

简历亮点：
- 当前职位：${resumeData.currentPosition || '未知'}
- 技能：${resumeData.skills?.join('、') || '未知'}
- 工作经历：${resumeData.previousCompanies?.join('、') || '未知'}

岗位要求：
- 岗位名称：${jobRequirements.title || '未知'}
- 核心要求：${jobRequirements.requirements || '无'}

请生成5个针对性的面试问题，每个问题应该：
1. 针对简历中的具体经历
2. 考察岗位所需的核心能力
3. 包含行为面试问题

请以JSON数组格式返回：
["问题1", "问题2", "问题3", "问题4", "问题5"]`;

  const response = await fetch(`${process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com'}/api/v1/services/aigc/text-generation/generation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'qwen-plus',
      input: {
        messages: [
          { role: 'system', content: '你是一个专业的面试官助手。' },
          { role: 'user', content: prompt },
        ],
      },
      parameters: {
        temperature: 0.5,
        max_tokens: 1000,
      },
    }),
  });

  const data = await response.json();
  const content = data.output?.choices?.[0]?.message?.content || '';

  const arrayMatch = content.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return JSON.parse(arrayMatch[0]);
  }

  return [
    '请介绍一下您过去的工作经历',
    '您为什么对这个岗位感兴趣',
    '您认为自己最大的优势是什么',
    '您期望在这个岗位上取得什么成果',
    '您的职业规划是什么',
  ];
}

/**
 * 创建招聘流程记录
 */
export async function createRecruitmentProcess(
  userId: string,
  resumeId: string,
  jobId: string,
  stage: 'screening' | 'interview' | 'offer' | 'hired' | 'rejected'
) {
  return await prisma.recruitmentProcess.create({
    data: {
      id: uuidv4(),
      userId,
      resumeId,
      jobId,
      stage,
      notes: '',
    },
  });
}

/**
 * 更新招聘流程
 */
export async function updateRecruitmentProcess(
  processId: string,
  userId: string,
  data: { stage?: string; notes?: string; scheduledAt?: Date }
) {
  return await prisma.recruitmentProcess.update({
    where: { id: processId, userId },
    data: {
      stage: data.stage as any,
      notes: data.notes,
      scheduledAt: data.scheduledAt,
      updatedAt: new Date(),
    },
  });
}

/**
 * 获取招聘流程列表
 */
export async function getRecruitmentProcesses(userId: string, resumeId?: string) {
  const where: any = { userId };
  if (resumeId) where.resumeId = resumeId;

  return await prisma.recruitmentProcess.findMany({
    where,
    include: {
      resume: { select: { name: true, phone: true } },
      job: { select: { title: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

/**
 * 批量智能筛选简历
 */
export async function batchSmartScreen(
  userId: string,
  jobId: string,
  apiKey: string
): Promise<{ resumeId: string; score: number }[]> {
  // 获取岗位信息
  const job = await prisma.recruitmentPost.findFirst({
    where: { id: jobId, userId },
  });

  if (!job) {
    throw new Error('岗位不存在');
  }

  // 获取所有待筛选简历
  const resumes = await prisma.recruitmentResume.findMany({
    where: { userId, jobId, status: 'pending' },
  });

  const results: { resumeId: string; score: number }[] = [];

  for (const resume of resumes) {
    try {
      // 构建简历文本
      const resumeText = `
        姓名：${resume.name}
        电话：${resume.phone}
        邮箱：${resume.email}
        学历：${resume.education}
        经验：${resume.experience}
      `;

      // 解析简历
      const parsedResume = await parseResumeWithAI(resumeText, apiKey);

      // 匹配岗位
      const matchResult = await matchJobWithAI(
        { ...resume, ...parsedResume },
        job,
        apiKey
      );

      // 更新简历匹配分数
      await prisma.recruitmentResume.update({
        where: { id: resume.id },
        data: {
          status: matchResult.score >= 60 ? 'screening' : 'rejected',
          aiScore: matchResult.score,
          aiAnalysis: matchResult.analysis,
        },
      });

      results.push({ resumeId: resume.id, score: matchResult.score });
    } catch (error) {
      console.error(`筛选简历 ${resume.id} 失败:`, error);
    }
  }

  return results;
}
