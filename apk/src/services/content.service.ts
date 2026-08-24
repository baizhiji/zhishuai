/**
 * 内容自动生成服务
 * 匹配Web端'内容自动生成'功能
 */
import { apiClient } from './api.client'
import { API_CONFIG } from './api.config'
import TokenStorage from '../utils/tokenStorage'

// ─── 类目专属字段（各功能需求输入）───────────────
export type CategoryExtraFieldType = 'input' | 'textarea' | 'select' | 'multiSelect' | 'imageUrl'

export interface CategoryExtraField {
  /** 表单字段名 */
  name: string
  /** 展示标签 */
  label: string
  type: CategoryExtraFieldType
  placeholder?: string
  required?: boolean
  /** select / multiSelect 选项 */
  options?: { label: string; value: string }[]
  /** 拼入生成提示词时的上下文说明 */
  promptLabel?: string
}

// 通用选项（与电脑版一致）
export const noteStyleOptions = [
  { label: '干货教程', value: '干货教程' },
  { label: '种草推荐', value: '种草推荐' },
  { label: '真实测评', value: '真实测评' },
  { label: 'Vlog式分享', value: 'Vlog式分享' },
]

export const imageQualityOptions = [
  { label: '标准质量（快速）', value: 'standard' },
  { label: '高质量（更精细）', value: 'high' },
  { label: '超高质量（商用级）', value: 'ultra' },
]

export const shotRhythmOptions = [
  { label: '快剪电影级', value: '快剪电影级' },
  { label: '慢节奏文艺感', value: '慢节奏文艺感' },
  { label: '故事叙事', value: '故事叙事' },
  { label: '信息展示', value: '信息展示' },
]

export const editBeatStyleOptions = [
  { label: '强节奏卡点', value: '强节奏卡点' },
  { label: '舒缓叙事', value: '舒缓叙事' },
  { label: '混剪快切', value: '混剪快切' },
  { label: '剧情连贯', value: '剧情连贯' },
]

export const editPlatformOptions = [
  { label: '抖音', value: 'douyin' },
  { label: 'B站', value: 'bilibili' },
  { label: '视频号', value: 'wechat' },
  { label: '小红书', value: 'xiaohongshu' },
  { label: '快手', value: 'kuaishou' },
  { label: 'YouTube', value: 'youtube' },
]

export const enterpriseVideoStyleOptions = [
  { label: '大气恢弘', value: '大气恢弘' },
  { label: '温暖走心', value: '温暖走心' },
  { label: '科技未来感', value: '科技未来感' },
  { label: '纪录片写实风', value: '纪录片写实风' },
]

export const productVideoRhythmOptions = [
  { label: '快节奏冲击感', value: '快节奏冲击感' },
  { label: '温情叙事', value: '温情叙事' },
  { label: '科技质感', value: '科技质感' },
  { label: '生活化场景', value: '生活化场景' },
]

export const conversionGoalOptions = [
  { label: '加购', value: '加购' },
  { label: '下单', value: '下单' },
  { label: '留资', value: '留资' },
  { label: '关注', value: '关注' },
]

export const storeTourStyleOptions = [
  { label: '真诚种草', value: '真诚种草' },
  { label: '客观测评', value: '客观测评' },
  { label: 'Vlog式', value: 'Vlog式' },
  { label: '攻略型', value: '攻略型' },
]

export const mvTypeOptions = [
  { label: '故事叙事型', value: '故事叙事型' },
  { label: '视觉美学型', value: '视觉美学型' },
  { label: '生活记录型', value: '生活记录型' },
  { label: '创意概念型', value: '创意概念型' },
]

export const songStyleOptions = [
  { label: '流行', value: '流行' },
  { label: '民谣', value: '民谣' },
  { label: '摇滚', value: '摇滚' },
  { label: 'R&B', value: 'R&B' },
  { label: '说唱', value: '说唱' },
  { label: '国风', value: '国风' },
  { label: '电子', value: '电子' },
  { label: '轻音乐', value: '轻音乐' },
]

export const animationStyleOptions = [
  { label: '2D卡通渲染', value: '2D卡通渲染' },
  { label: '3D萌系建模', value: '3D萌系建模' },
  { label: '手绘风', value: '手绘风' },
  { label: 'Flat Design', value: 'Flat Design' },
]

export const audienceOptions = [
  { label: '儿童', value: '儿童' },
  { label: '年轻人', value: '年轻人' },
  { label: '全年龄', value: '全年龄' },
]

export const digitalHumanLookOptions = [
  { label: '真人写实', value: '真人写实' },
  { label: '动漫风格', value: '动漫风格' },
]

export const digitalHumanGenderOptions = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' },
]

export const digitalHumanAgeOptions = [
  { label: '青年', value: '青年' },
  { label: '中年', value: '中年' },
  { label: '老年', value: '老年' },
]

// 内容分类（保留旧枚举兼容遗留页面，新增与电脑版一致的成员）
export enum ContentCategory {
  TITLE = 'title',
  TAGS = 'tags',
  COPYWRITING = 'copywriting',
  IMAGE_TO_TEXT = 'image-to-text',
  XIAOHONGSHU = 'xiaohongshu',
  IMAGE = 'image',
  ECOMMERCE = 'ecommerce',
  VIDEO = 'video',
  DIGITAL_HUMAN = 'digital-human',
  // 电脑版新增
  IMAGE_GENERATION = 'image-generation',
  ECOMMERCE_DETAIL = 'ecommerce-detail',
  SHORT_VIDEO = 'short-video',
  ENTERPRISE_VIDEO = 'enterprise-video',
  PRODUCT_VIDEO = 'product-video',
  STORE_TOUR_VIDEO = 'store-tour-video',
  PERSON_MV_VIDEO = 'person-mv-video',
  CARTOON_VIDEO = 'cartoon-video',
  SMART_EDIT = 'smart-edit',
  AI_SKETCH = 'ai-sketch',   // 预留
  AI_COMIC = 'ai-comic',     // 预留
}

// 内容分类配置
export const contentCategoryConfig: Record<ContentCategory, {
  label: string
  color: string
  icon: string
  description: string
  type: 'text' | 'image' | 'video' | 'mixed'
  needWordCount?: boolean
  needSize?: boolean
  needDuration?: boolean
  needUpload?: boolean
  needImageUrl?: boolean
  comingSoon?: boolean
  extraFields?: CategoryExtraField[]
}> = {
  [ContentCategory.TITLE]: {
    label: '标题',
    color: '#6D28D9',
    icon: 'text',
    description: '生成吸引人的标题，提升内容点击率',
    type: 'text',
  },
  [ContentCategory.TAGS]: {
    label: '话题/标签',
    color: '#8B5CF6',
    icon: 'pricetags',
    description: '生成相关话题标签，增加内容曝光',
    type: 'text',
  },
  [ContentCategory.COPYWRITING]: {
    label: '文案生成',
    color: '#06B6D4',
    icon: 'document-text',
    description: '智能生成文案，根据字数自动判断长短',
    type: 'text',
  },
  [ContentCategory.IMAGE_TO_TEXT]: {
    label: '图生文',
    color: '#10B981',
    icon: 'image',
    description: '根据图片生成文案描述',
    type: 'text',
  },
  [ContentCategory.XIAOHONGSHU]: {
    label: '小红书图文',
    color: '#EF4444',
    icon: 'heart',
    description: '真人博主级写作风格，口语化表达，像闺蜜分享而非营销文案，自动生成图文并茂的内容',
    type: 'mixed',
    needWordCount: true,
    needSize: true,
    needDuration: false,
    needUpload: true,
    extraFields: [
      { name: 'noteStyle', label: '笔记风格', type: 'select', options: noteStyleOptions, promptLabel: '笔记风格' },
      { name: 'targetAudience', label: '目标受众画像', type: 'textarea', placeholder: '例如：25-35岁都市女性，月消费5000+，关注颜值与性价比，痛点是通勤穿搭难', promptLabel: '目标受众画像' },
    ],
  },
  [ContentCategory.IMAGE_GENERATION]: {
    label: '图片生成',
    color: '#F97316',
    icon: 'image',
    description: '照片级真实感图片生成（海报、Logo、产品图等），真实材质纹理、自然光照、无AI塑料感',
    type: 'image',
    needWordCount: false,
    needSize: true,
    needDuration: false,
    needUpload: true,
    extraFields: [
      { name: 'composition', label: '构图/角度', type: 'input', placeholder: '例如：俯拍45度、居中构图、低角度仰拍', promptLabel: '构图角度' },
      { name: 'lighting', label: '光影/色调', type: 'input', placeholder: '例如：暖光侧逆光、冷调高对比、柔和漫射光', promptLabel: '光影色调' },
      { name: 'imageQuality', label: '质量要求', type: 'select', options: imageQualityOptions, promptLabel: '质量要求' },
      { name: 'negativePrompt', label: '负向提示词（排除内容）', type: 'textarea', placeholder: '例如：模糊、噪点、变形的手指、水印、文字、低清', promptLabel: '负向排除内容' },
    ],
  },
  [ContentCategory.ECOMMERCE_DETAIL]: {
    label: '电商详情页',
    color: '#DC2626',
    icon: 'cart',
    description: '真人运营级电商详情页，像有经验的运营人员写的文案，不堆砌模板化的套话',
    type: 'mixed',
    needWordCount: true,
    needSize: true,
    needDuration: false,
    needUpload: true,
    extraFields: [
      { name: 'productName', label: '产品名称', type: 'input', placeholder: '例如：×××轻量羽绒服', required: true, promptLabel: '产品名称' },
      { name: 'coreSellingPoints', label: '核心卖点（3-5个）', type: 'textarea', placeholder: '每行一个，例如：\n90%白鸭绒，克重200g\n外层防风防泼水面料\n可收纳进自带口袋', promptLabel: '核心卖点' },
      { name: 'targetGroup', label: '目标人群', type: 'input', placeholder: '例如：20-40岁城市通勤白领', promptLabel: '目标人群' },
      { name: 'priceRange', label: '价格带', type: 'input', placeholder: '例如：299-399元', promptLabel: '价格带' },
      { name: 'competitor', label: '竞品分析（链接或卖点）', type: 'textarea', placeholder: '可选。主要竞品的卖点、价格、评价，用于差异化', promptLabel: '竞品分析' },
    ],
  },
  [ContentCategory.SHORT_VIDEO]: {
    label: '短视频',
    color: '#EC4899',
    icon: 'videocam',
    description: '真人拍摄级短视频脚本生成，自带反AI味系统——断句随机、口语化、有情绪起伏，支持方言配音',
    type: 'video',
    needWordCount: true,
    needSize: true,
    needDuration: true,
    needUpload: true,
    extraFields: [
      { name: 'emotionTone', label: '情感基调/创意主题', type: 'textarea', placeholder: '例如：热血励志、搞怪轻松、温暖治愈、悬念反转……或一句话说明创作方向', promptLabel: '情感基调' },
      { name: 'shotRhythm', label: '镜头节奏', type: 'select', options: shotRhythmOptions, promptLabel: '镜头节奏' },
      { name: 'referenceLink', label: '参考影片链接', type: 'input', placeholder: '可选。抖音/B站/视频号视频链接，作为风格参考', promptLabel: '参考影片' },
      { name: 'brandElement', label: '品牌元素（logo/配色）', type: 'textarea', placeholder: '可选。例如：结尾露出品牌logo，主色调为深蓝+白色', promptLabel: '品牌元素' },
    ],
  },
  [ContentCategory.ENTERPRISE_VIDEO]: {
    label: '企业宣传视频',
    color: '#3B82F6',
    icon: 'business',
    description: '电影级企业宣传片脚本，真实办公场景、自然光线、手持摄影风格，非摆拍式的企业形象输出',
    type: 'video',
    needWordCount: false,
    needSize: true,
    needDuration: true,
    needUpload: true,
    extraFields: [
      { name: 'companyName', label: '企业名称', type: 'input', required: true, promptLabel: '企业名称' },
      { name: 'foundedTime', label: '成立时间/发展历程', type: 'input', placeholder: '例如：成立于2015年，服务客户超1000家', promptLabel: '成立时间' },
      { name: 'coreBusiness', label: '核心业务', type: 'textarea', placeholder: '公司主营业务、产品或服务介绍', promptLabel: '核心业务' },
      { name: 'missionValues', label: '使命/愿景/价值观', type: 'textarea', placeholder: '可选。公司使命、愿景、企业文化理念', promptLabel: '使命愿景' },
      { name: 'companyData', label: '企业核心数据', type: 'textarea', placeholder: '例如：员工500+，年营收3亿，专利200+，服务客户遍布30个城市', promptLabel: '企业核心数据' },
      { name: 'companyStyle', label: '宣传片风格', type: 'select', options: enterpriseVideoStyleOptions, promptLabel: '宣传片风格' },
    ],
  },
  [ContentCategory.PRODUCT_VIDEO]: {
    label: '产品宣传视频',
    color: '#EAB308',
    icon: 'cube',
    description: '真人实拍级产品宣传片，手机自拍角度、真实产品质感、自然使用场景，像真人开箱而非3D渲染',
    type: 'video',
    needWordCount: false,
    needSize: true,
    needDuration: true,
    needUpload: true,
    extraFields: [
      { name: 'productName', label: '产品名称', type: 'input', required: true, promptLabel: '产品名称' },
      { name: 'coreSellingPoints', label: '核心卖点（3-5个）', type: 'textarea', placeholder: '每行一个，例如：\n自动对焦，0.1秒响应\n4K高清画质\n军工级防水', promptLabel: '核心卖点' },
      { name: 'targetPrice', label: '目标定价/价格带', type: 'input', placeholder: '例如：399元 / 299-499元', promptLabel: '目标定价' },
      { name: 'targetUser', label: '目标用户画像', type: 'textarea', placeholder: '例如：22-35岁数码爱好者，追求性价比，喜欢户外运动', promptLabel: '目标用户画像' },
      { name: 'conversionGoal', label: '转化目标', type: 'select', options: conversionGoalOptions, promptLabel: '转化目标' },
      { name: 'videoRhythm', label: '视频节奏', type: 'select', options: productVideoRhythmOptions, promptLabel: '视频节奏' },
    ],
  },
  [ContentCategory.STORE_TOUR_VIDEO]: {
    label: '探店视频',
    color: '#22C55E',
    icon: 'location',
    description: '真人Vlog级探店视频脚本，保留环境原声、自然光线变化、真实评价（有好有坏），不像商业广告',
    type: 'video',
    needWordCount: true,
    needSize: true,
    needDuration: true,
    needUpload: true,
    extraFields: [
      { name: 'storeName', label: '店铺名称', type: 'input', required: true, promptLabel: '店铺名称' },
      { name: 'storeAddress', label: '店铺地址', type: 'input', placeholder: '例如：广州市天河区××路88号', promptLabel: '店铺地址' },
      { name: 'storeType', label: '店铺类型', type: 'input', placeholder: '例如：日料店 / 咖啡厅 / 火锅店', promptLabel: '店铺类型' },
      { name: 'perCapitaPrice', label: '人均消费', type: 'input', placeholder: '例如：120元', promptLabel: '人均消费' },
      { name: 'featuredItems', label: '特色菜品/服务', type: 'textarea', placeholder: '例如：招牌刺身拼盘、隐藏菜单寿喜锅、宠物友好服务', promptLabel: '特色菜品' },
      { name: 'storeTourStyle', label: '探店风格', type: 'select', options: storeTourStyleOptions, promptLabel: '探店风格' },
      { name: 'visitInfo', label: '探店日期和天气', type: 'input', placeholder: '例如：周六晚上，小雨', promptLabel: '探店日期天气' },
    ],
  },
  [ContentCategory.PERSON_MV_VIDEO]: {
    label: '真人MV视频',
    color: '#A855F7',
    icon: 'mic',
    description: '真人演唱级MV，自然光拍摄、真实表情、无美颜滤镜，像朋友手机拍的唱歌视频而非精致棚拍',
    type: 'video',
    needWordCount: false,
    needSize: true,
    needDuration: true,
    needUpload: true,
    extraFields: [
      { name: 'songName', label: '歌曲名称', type: 'input', required: true, placeholder: '例如：晴天（周杰伦）', promptLabel: '歌曲名称' },
      { name: 'songStyle', label: '歌曲风格', type: 'select', options: songStyleOptions, promptLabel: '歌曲风格' },
      { name: 'singer', label: '演唱者', type: 'input', placeholder: '演唱者姓名（用于标注原唱/翻唱）', promptLabel: '演唱者' },
      { name: 'mvType', label: 'MV类型', type: 'select', options: mvTypeOptions, promptLabel: 'MV类型' },
      { name: 'lyrics', label: '歌词文本（或音频链接）', type: 'textarea', placeholder: '粘贴完整歌词，或提供歌曲音频文件链接；用于生成与歌词同步的镜头脚本', promptLabel: '歌词' },
      { name: 'sceneSuggestion', label: '拍摄场景建议', type: 'textarea', placeholder: '例如：天台黄昏、海边、老巷子、居家卧室……不填则由AI推荐', promptLabel: '拍摄场景建议' },
    ],
  },
  [ContentCategory.CARTOON_VIDEO]: {
    label: '萌宠卡通短视频',
    color: '#EB2F96',
    icon: 'paw',
    description: '照片级卡通渲染萌宠短视频，材质光影接近真实而非塑料卡通感，配音用真人声而非机械TTS',
    type: 'video',
    needWordCount: true,
    needSize: true,
    needDuration: true,
    needUpload: true,
    extraFields: [
      { name: 'petSetting', label: '宠物类型/角色设定', type: 'input', required: true, placeholder: '例如：橘猫"胖橘"、柴犬"柴柴"', promptLabel: '宠物类型角色设定' },
      { name: 'storyTheme', label: '剧情主题', type: 'textarea', placeholder: '例如：宠物第一次学游泳、猫咪拆家的爆笑日常、宠物与主人的温馨日常', promptLabel: '剧情主题' },
      { name: 'animationStyle', label: '动画风格', type: 'select', options: animationStyleOptions, promptLabel: '动画风格' },
      { name: 'targetAudience', label: '目标受众', type: 'select', options: audienceOptions, promptLabel: '目标受众' },
    ],
  },
  [ContentCategory.SMART_EDIT]: {
    label: '智能剪辑',
    color: '#8B5CF6',
    icon: 'cut',
    description: '上传多个视频素材，AI智能剪辑成片：自动理解素材、识别剪辑点、卡点编排、配音、字幕、BGM、调色指令',
    type: 'video',
    needWordCount: false,
    needSize: true,
    needDuration: true,
    needUpload: true,
    extraFields: [
      { name: 'beatStyle', label: '卡点风格', type: 'select', options: editBeatStyleOptions, promptLabel: '卡点风格' },
      { name: 'editPlatform', label: '目标平台', type: 'select', options: editPlatformOptions, promptLabel: '目标平台' },
    ],
  },
  [ContentCategory.AI_SKETCH]: {
    label: 'AI短剧',
    color: '#06B6D4',
    icon: 'film',
    description: 'AI自动生成短剧视频（此功能预留，敬请期待）',
    type: 'video',
    needWordCount: true,
    needSize: true,
    needDuration: true,
    needUpload: false,
    comingSoon: true,
  },
  [ContentCategory.AI_COMIC]: {
    label: 'AI漫剧',
    color: '#84CC16',
    icon: 'color-palette',
    description: 'AI自动生成漫剧视频（功能开发中，敬请期待）',
    type: 'video',
    needWordCount: true,
    needSize: true,
    needDuration: true,
    needUpload: false,
    comingSoon: true,
  },
  // ── 以下为 APK 遗留页面（AIVideo/AICopy 等）使用的旧分类配置，保留兼容 ──
  [ContentCategory.IMAGE]: {
    label: '图片',
    color: '#F97316',
    icon: 'images',
    description: '生成高质量图片内容',
    type: 'image',
  },
  [ContentCategory.ECOMMERCE]: {
    label: '电商详情页',
    color: '#DC2626',
    icon: 'cart',
    description: '生成电商产品详情页内容',
    type: 'text',
  },
  [ContentCategory.VIDEO]: {
    label: '短视频',
    color: '#EC4899',
    icon: 'videocam',
    description: '生成短视频内容，自动生成字幕、配音和背景音乐',
    type: 'video',
  },
  [ContentCategory.DIGITAL_HUMAN]: {
    label: '数字人短视频',
    color: '#7C3AED',
    icon: 'person',
    description: 'AI数字人主播口播，支持多形象选择，真人级克隆，自动生成口播短视频',
    type: 'video',
    needWordCount: true,
    needSize: true,
    needDuration: true,
    needImageUrl: true,
    extraFields: [
      { name: 'imageUrl', label: '形象参考图片', type: 'imageUrl', placeholder: '上传人物形象参考图（可选）', promptLabel: '形象参考图片' },
      { name: 'look', label: '形象风格', type: 'select', options: digitalHumanLookOptions, promptLabel: '形象风格' },
      { name: 'gender', label: '性别', type: 'select', options: digitalHumanGenderOptions, promptLabel: '性别' },
      { name: 'ageGroup', label: '年龄段', type: 'select', options: digitalHumanAgeOptions, promptLabel: '年龄段' },
    ],
  },
}

// 风格选项
export const styleOptions = [
  { label: '专业', value: '专业' },
  { label: '活泼', value: '活泼' },
  { label: '商务', value: '商务' },
  { label: '生活化', value: '生活化' },
  { label: '吸引眼球', value: '吸引眼球' },
  { label: '简洁', value: '简洁' },
  { label: '幽默', value: '幽默' },
]

// 图片尺寸选项
export const imageSizeOptions = [
  { label: '正方形 1:1 (1024×1024)', value: '1024x1024' },
  { label: '横版 16:9 (1280×720)', value: '1280x720' },
  { label: '竖版 9:16 (720×1280)', value: '720x1280' },
  { label: '横版 4:3 (1024×768)', value: '1024x768' },
]

// 视频尺寸选项
export const videoSizeOptions = [
  { label: '横屏 16:9 (1920×1080)', value: '1920x1080' },
  { label: '竖屏 9:16 (1080×1920)', value: '1080x1920' },
  { label: '正方形 1:1 (1080×1080)', value: '1080x1080' },
]

// 字幕选项
export const subtitleOptions = [
  { label: '无字幕', value: 'none' },
  { label: '中文', value: 'chinese' },
  { label: '英文', value: 'english' },
  { label: '双语', value: 'bilingual' },
]

// 配音选项（含方言）
export const voiceoverOptions = [
  { label: '无配音', value: 'none' },
  { label: '女声-普通话', value: 'female-mandarin' },
  { label: '男声-普通话', value: 'male-mandarin' },
  { label: '女声-粤语', value: 'female-cantonese' },
  { label: '男声-粤语', value: 'male-cantonese' },
  { label: '女声-英文', value: 'female-english' },
  { label: '男声-英文', value: 'male-english' },
  { label: '四川话', value: 'sichuan' },
  { label: '东北话', value: 'dongbei' },
  { label: '上海话', value: 'shanghai' },
  { label: '闽南话', value: 'minnan' },
  { label: '河南话', value: 'henan' },
  { label: '湖南话', value: 'hunan' },
  { label: '陕西话', value: 'shaanxi' },
  { label: '天津话', value: 'tianjin' },
]

// 背景音乐选项
export const bgmOptions = [
  { label: '无背景音乐', value: 'none' },
  { label: '动感', value: 'dynamic' },
  { label: '抒情', value: 'lyrical' },
  { label: '商务', value: 'business' },
  { label: '欢快', value: 'cheerful' },
  { label: '舒缓', value: 'relaxing' },
  { label: '悬疑', value: 'suspense' },
  { label: '科技', value: 'tech' },
  { label: '古典', value: 'classical' },
]

// 生成内容请求参数
export interface GenerateTextParams {
  category: ContentCategory
  description: string
  style?: string
  wordCount?: number
  requirements?: string
  count?: number
  /** 专属字段值（key 为 CategoryExtraField.name） */
  extraValues?: Record<string, string>
}

export interface GenerateImageParams {
  category?: ContentCategory
  description: string
  style?: string
  size?: string
  /** 专属字段值 */
  extraValues?: Record<string, string>
}

export interface GenerateVideoParams {
  category: ContentCategory
  description: string
  style?: string
  size?: string
  duration?: number
  subtitle?: string
  voiceover?: string
  bgm?: string
  overlayBanners?: string[]
  /** 专属字段值 */
  extraValues?: Record<string, string>
  /** 数字人口播图片（needImageUrl 类目） */
  imageUrl?: string
}

// 生成记录
export interface GenerationRecord {
  id: string
  category: ContentCategory
  title: string
  content: string
  config: any
  timestamp: number
  status: 'success' | 'failed'
}

// 根据分类映射到正确的后端端点（与 WEB 端一致）
function getTextEndpoint(category: ContentCategory): string {
  switch (category) {
    case ContentCategory.TITLE: return '/ai-enhanced/title';
    case ContentCategory.TAGS: return '/ai-enhanced/hashtags';
    default: return '/ai-enhanced/post';
  }
}

function buildRequestBody(category: ContentCategory, params: GenerateTextParams): Record<string, any> {
  const base = { topic: params.description, extraValues: params.extraValues };
  switch (category) {
    case ContentCategory.TITLE:
      return { ...base, count: params.count || 5, style: params.style };
    case ContentCategory.TAGS:
      return { ...base, count: params.count || 10 };
    default:
      // AI 创作工厂文本生成：显式携带 contentType 触发后端"爆款内容创意"逻辑
      return { ...base, style: params.style, wordCount: params.wordCount, contentType: 'content_creativity' };
  }
}

function transformTextResponse(category: ContentCategory, data: any): { output: { text: string } } {
  let text = '';
  if (category === ContentCategory.TITLE) {
    text = (data?.titles || []).join('\n');
  } else if (category === ContentCategory.TAGS) {
    text = (data?.hashtags || []).join(' ');
  } else {
    text = data?.content || data?.script || data?.text || '';
  }
  return { output: { text } };
}

// 生成文本内容（对齐 WEB 端 /api/ai-enhanced 路由）
export async function generateText(params: GenerateTextParams): Promise<{ output: { text: string } }> {
  try {
    const endpoint = getTextEndpoint(params.category);
    const body = buildRequestBody(params.category, params);
    const response = await apiClient.post(endpoint, body);
    return transformTextResponse(params.category, response);
  } catch (error) {
    throw error;
  }
}

// 生成图片（对齐 WEB 端 /api/ai-chat/image）
export async function generateImage(params: GenerateImageParams): Promise<{ output: { results: { url: string }[] } }> {
  try {
    const extra = buildExtraFieldsPrompt(params.extraValues);
    const response = await apiClient.post('/ai-chat/image', {
      prompt: `生成一张${params.style || '写实'}风格的图片，主题：${params.description}${extra}`,
      size: params.size || '1024x1024',
    });
    const imageUrl = response?.url || response?.imageUrl || response?.data?.url || '';
    return { output: { results: imageUrl ? [{ url: imageUrl }] : [] } };
  } catch {
    // 图片生成后端暂未完全支持，返回空结果
    return { output: { results: [] } };
  }
}

// 生成视频（对齐 WEB 端 ai-chat 路由，后端无直接视频生成端点）
export async function generateVideo(params: GenerateVideoParams): Promise<{ output: { url: string } }> {
  try {
    const extra = buildExtraFieldsPrompt(params.extraValues);
    const topicParts = [
      `请为以下内容生成${params.style || '通用'}风格视频脚本，时长${params.duration || 15}秒：${params.description}`,
      params.subtitle ? `字幕要求：${params.subtitle}` : '',
      params.voiceover ? `配音要求：${params.voiceover}` : '',
      params.bgm ? `背景音乐：${params.bgm}` : '',
      params.imageUrl ? `出镜形象参考图片：${params.imageUrl}` : '',
      extra,
    ].filter(Boolean);
    const response = await apiClient.post('/ai-enhanced/post', {
      topic: topicParts.join('\n'),
      style: params.style,
      size: params.size,
      duration: params.duration,
    });
    const videoUrl = response?.url || response?.videoUrl || response?.data?.url || '';
    return { output: { url: videoUrl } };
  } catch {
    return { output: { url: '' } };
  }
}

// 将专属字段拼入提示词
function buildExtraFieldsPrompt(extraValues?: Record<string, string>): string {
  if (!extraValues) return '';
  const parts: string[] = [];
  Object.entries(extraValues).forEach(([key, value]) => {
    if (value && value.trim()) {
      parts.push(`${key}：${value.trim()}`);
    }
  });
  return parts.length ? `\n以下为本次创作的具体要求：\n${parts.join('\n')}` : '';
}

// 构建文本提示词
function buildTextPrompt(params: GenerateTextParams): string {
  const { category, description, style, wordCount, requirements } = params
  const extra = buildExtraFieldsPrompt(params.extraValues)

  switch (category) {
    case ContentCategory.TITLE:
      return `生成${params.count || 1}个吸引人的标题，主题：${description}，风格：${style || '吸引眼球'}。`
    case ContentCategory.TAGS:
      return `为"${description}"生成${params.count || 1}个相关的话题标签，格式：#标签1 #标签2，风格：${style || '流行'}。`
    case ContentCategory.COPYWRITING:
      return `为"${description}"生成${wordCount || 500}字左右的文案，风格：${style || '专业'}。${requirements ? `额外要求：${requirements}` : ''}`
    case ContentCategory.IMAGE_TO_TEXT:
      return `根据上传的图片生成${wordCount || 300}字左右的文案描述，风格：${style || '生动'}。`
    case ContentCategory.XIAOHONGSHU:
      return `为"${description}"生成${wordCount || 300}字左右的小红书风格图文文案，像真人博主一样口语化表达，不要营销套话，搭配建议使用的贴纸和排版。${style ? `笔记风格：${style}。` : ''}${requirements ? `额外要求：${requirements}` : ''}${extra}`
    case ContentCategory.ECOMMERCE_DETAIL:
      return `为产品"${description}"生成电商详情页文案，像资深运营一样真实自然，包含产品介绍、核心卖点、使用场景、适用人群、常见问题等。${style ? `风格：${style}。` : ''}${requirements ? `额外要求：${requirements}` : ''}${extra}`
    case ContentCategory.ECOMMERCE:
      return `为产品"${description}"生成电商详情页文案，包含产品介绍、卖点、使用场景等，字数：${wordCount || 800}字。${requirements ? `额外要求：${requirements}` : ''}`
    default:
      return `为"${description}"生成内容，风格：${style || '专业'}，字数限制：${wordCount || 500}字。${requirements ? `额外要求：${requirements}` : ''}${extra}`
  }
}

// 保存到内容中心
export async function saveToMaterials(
  category: ContentCategory,
  title: string,
  content: string
): Promise<boolean> {
  const response = await apiClient.post('/materials', { category, title, content });
  return (response as any)?.success || false;
}

// 获取创作历史（本地缓存）
export function getGenerationHistory(): GenerationRecord[] {
  return TokenStorage.get('generation-history') || []
}

// 服务器记录 → 本地 GenerationRecord 映射（Task 2：统一两端历史到服务器）
function mapServerHistory(item: any): GenerationRecord {
  return {
    id: item.id,
    category: item.category || ContentCategory.COPYWRITING,
    title: item.title || '',
    content: item.content || '',
    config: item.config || {},
    timestamp: item.createdAt ? new Date(item.createdAt).getTime() : Date.now(),
    status: item.status === 'failed' ? 'failed' : 'success',
  }
}

const DELETED_HISTORY_KEY = 'generation-history-deleted'

// 从服务器拉取生成历史并合并到本地（离线时静默使用本地缓存）
export async function syncGenerationHistoryFromServer(): Promise<void> {
  try {
    const resp = await apiClient.get<{ items: any[]; total: number }>('/ai-enhanced/history', { page: 1, pageSize: 50 })
    const items = resp?.items || []
    if (!items.length) return
    const deletedIds = new Set<string>(TokenStorage.get(DELETED_HISTORY_KEY) || [])
    const remote = items
      .map(mapServerHistory)
      .filter((r) => !deletedIds.has(r.id))
    if (!remote.length) return
    const local = getGenerationHistory()
    const localIds = new Set(local.map((r) => r.id))
    const merged = [...local, ...remote.filter((r) => !localIds.has(r.id))]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50)
    TokenStorage.set('generation-history', merged)
  } catch { /* 离线/未登录时静默，继续使用本地缓存 */ }
}

// 保存创作历史（本地优先 + 异步同步服务器）
export function saveGenerationHistory(record: GenerationRecord): void {
  const history = getGenerationHistory()
  const newHistory = [record, ...history].slice(0, 50)
  TokenStorage.set('generation-history', newHistory)
  apiClient
    .post('/ai-enhanced/history', {
      feature: 'ai-enhanced',
      category: record.category,
      title: record.title,
      content: record.content,
      config: record.config || {},
      status: record.status,
      source: 'apk',
    })
    .catch(() => { /* 静默：离线时仅本地保存 */ })
}

// 删除创作历史（本地 + 服务器，黑名单防“删了又出现”）
export function deleteGenerationHistory(id: string): void {
  const history = getGenerationHistory()
  TokenStorage.set('generation-history', history.filter((r) => r.id !== id))
  const deleted: string[] = TokenStorage.get(DELETED_HISTORY_KEY) || []
  if (!deleted.includes(id)) {
    deleted.push(id)
    TokenStorage.set(DELETED_HISTORY_KEY, deleted.slice(-200))
  }
  apiClient.delete(`/ai-enhanced/history/${id}`).catch(() => { /* 静默 */ })
}

