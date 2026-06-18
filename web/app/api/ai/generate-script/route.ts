import { NextRequest, NextResponse } from 'next/server'

// 人设风格配置
const STYLE_PROMPTS = {
  professional: {
    prefix: '你是一位资深HR，措辞规范、专业严谨。',
    tone: '正式、商务风格',
    example: '您好，感谢您投递[职位名]岗位。我们认真审阅了您的简历...'
  },
  friendly: {
    prefix: '你是一位热情友好的HR，像朋友一样与候选人沟通。',
    tone: '亲切、自然、轻松',
    example: '嗨～看到你的简历啦，你的经历真的很棒...'
  },
  lively: {
    prefix: '你是一位活泼开朗的HR，语气俏皮，充满正能量。',
    tone: '活泼、带表情符号、充满热情',
    example: '太棒了！你的经历超适合我们团队~ 迫不及待想和你聊聊！'
  },
  concise: {
    prefix: '你是一位高效干练的HR，沟通简洁直接。',
    tone: '简洁明了、直奔主题',
    example: '看了你的简历，符合要求。方便的话，我们约个时间聊聊？'
  }
}

// 场景配置
const SCENE_CONFIGS = {
  recruitment: {
    name: '招聘沟通',
    scenes: [
      { id: 'greeting', name: '开场打招呼', prompt: '生成一句友好的打招呼话术，用于首次联系候选人' },
      { id: 'job_intro', name: '职位介绍', prompt: '根据职位信息，生成一段吸引人的职位介绍' },
      { id: 'interview_invite', name: '面试邀请', prompt: '生成一封正式的面试邀请话术，包含时间、地点、注意事项' },
      { id: 'follow_up', name: '跟进提醒', prompt: '生成一条温和的跟进话术，询问候选人意向' },
      { id: 'rejection', name: '婉拒话术', prompt: '生成一条委婉的拒绝话术，保持候选人好感' },
      { id: 'offer', name: 'offer发放', prompt: '生成一条offer通知话术，包含薪资、福利、入职时间' },
    ]
  },
  social: {
    name: '自媒体回复',
    scenes: [
      { id: 'comment_reply', name: '评论回复', prompt: '生成一条回复粉丝评论的话术' },
      { id: 'dm_reply', name: '私信回复', prompt: '生成一条回复私信的话术' },
      { id: 'mention_reply', name: '@回复', prompt: '生成一条回复@提及的话术' },
      { id: 'promotion', name: '活动推广', prompt: '生成一条推广活动的话术，吸引用户参与' },
    ]
  },
  customer: {
    name: '客服响应',
    scenes: [
      { id: 'welcome', name: '欢迎语', prompt: '生成一条热情的客服欢迎语' },
      { id: 'complaint', name: '投诉处理', prompt: '生成一条安抚投诉用户的话术' },
      { id: 'refund', name: '退款处理', prompt: '生成一条处理退款请求的话术' },
      { id: 'faq', name: 'FAQ回复', prompt: '生成一条回答常见问题的话术' },
    ]
  },
  general: {
    name: '通用场景',
    scenes: [
      { id: 'greeting', name: '问候语', prompt: '生成一条通用问候语' },
      { id: 'farewell', name: '告别语', prompt: '生成一条友好的告别语' },
      { id: 'thanks', name: '感谢语', prompt: '生成一条表达感谢的话术' },
      { id: 'apology', name: '道歉解释', prompt: '生成一条诚恳的道歉话术' },
    ]
  }
}

// 获取模型配置
function getModelConfig(provider: string, modelId: string) {
  const configs: Record<string, { baseUrl: string; defaultModel: string }> = {
    aliyun: {
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      defaultModel: 'qwen-plus',
    },
    tencent: {
      baseUrl: 'https://tokenhub.tencentmaas.com/v1',
      defaultModel: 'hunyuan-2.0-instruct-20251111',
    }
  }
  return configs[provider] || configs.aliyun
}

// 构建生成话术的Prompt
function buildScriptPrompt(params: {
  scene: string
  sceneName: string
  scenePrompt: string
  style: keyof typeof STYLE_PROMPTS
  context?: string
  maxTokens: number
}): string {
  const styleConfig = STYLE_PROMPTS[params.style]
  
  return `${styleConfig.prefix}

请根据以下要求生成沟通话术：

场景：${params.sceneName}
要求：${params.scenePrompt}
${params.context ? `附加背景：${params.context}` : ''}

风格要求：${styleConfig.tone}
生成一段自然、人性化、有温度的沟通话术。
不要使用"作为AI"或"我是一个AI"这类表述，要像真人一样表达。
话术长度控制在${params.maxTokens}字以内。
`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      provider = 'aliyun',
      model = 'qwen-plus',
      scene,
      sceneName,
      scenePrompt,
      style = 'friendly',
      context,
      maxTokens = 300,
      apiKey,
    } = body

    // 如果没有提供 API Key，返回错误提示
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API Key 未配置，请在系统设置中配置 AI 服务密钥',
      }, { status: 400 })
    }

    // 调用真实的 AI API
    const modelConfig = getModelConfig(provider, model)
    const baseUrl = provider === 'aliyun' 
      ? process.env.DASHSCOPE_BASE_URL || modelConfig.baseUrl
      : process.env.TOKENHUB_BASE_URL || modelConfig.baseUrl

    const actualApiKey = apiKey || (
      provider === 'aliyun' 
        ? process.env.DASHSCOPE_API_KEY 
        : process.env.TOKENHUB_API_KEY
    )

    if (!actualApiKey) {
      return NextResponse.json({
        success: false,
        error: 'API Key 未配置'
      }, { status: 400 })
    }

    const prompt = buildScriptPrompt({
      scene,
      sceneName,
      scenePrompt,
      style,
      context,
      maxTokens,
    })

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${actualApiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({
        success: false,
        error: `API调用失败: ${response.status} - ${error}`
      }, { status: response.status })
    }

    const data = await response.json()
    const generatedScript = data.choices?.[0]?.message?.content?.trim() || ''

    return NextResponse.json({
      success: true,
      data: {
        script: generatedScript,
        scene,
        sceneName,
        style,
        model,
        usage: data.usage,
        mock: false,
      }
    })

  } catch (error) {
    console.error('AI话术生成失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '生成失败'
    }, { status: 500 })
  }
}

// 获取支持的场景列表
export async function GET() {
  return NextResponse.json({
    success: true,
    data: SCENE_CONFIGS,
    styles: STYLE_PROMPTS,
  })
}
