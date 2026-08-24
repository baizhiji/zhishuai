// AI创作工厂内容分类枚举
export enum ContentCategory {
  // 图文类
  XIAOHONGSHU = 'xiaohongshu',           // 小红书图文生成（真人博主级）
  // 图片类
  IMAGE_GENERATION = 'image-generation',  // 各类图片生成（照片级真实感）
  // 电商类
  ECOMMERCE_DETAIL = 'ecommerce-detail',  // 电商详情页生成（真人运营级）
  // 视频类
  SHORT_VIDEO = 'short-video',            // 短视频生成（真人拍摄级）
  ENTERPRISE_VIDEO = 'enterprise-video',  // 企业宣传短视频（电影级质感）
  PRODUCT_VIDEO = 'product-video',        // 产品宣传短视频（真人实拍级）
  STORE_TOUR_VIDEO = 'store-tour-video',  // 实体店探店视频（真人Vlog级）
  PERSON_MV_VIDEO = 'person-mv-video',    // 真人MV短视频（真人演唱级）
  CARTOON_VIDEO = 'cartoon-video',        // 萌宠卡通短视频（照片级卡通）
  DIGITAL_HUMAN = 'digital-human',        // 真人/数字人短视频（拟真级）
  SMART_EDIT = 'smart-edit',              // 智能剪辑（素材剪辑成片）
  // 预留功能
  AI_SKETCH = 'ai-sketch',               // AI短剧（预留未来）
  AI_COMIC = 'ai-comic',                  // AI漫剧（预留未来）
  // 内容创意策划
  CONTENT_CREATIVITY = 'content-creativity', // 爆款内容创意策划
}

// ─── 类目专属字段（各功能需求输入）───────────────

export type CategoryExtraFieldType = 'input' | 'textarea' | 'select' | 'multiSelect';

export interface CategoryExtraField {
  /** 表单字段名（提交到 values） */
  name: string;
  /** 展示标签 */
  label: string;
  type: CategoryExtraFieldType;
  placeholder?: string;
  required?: boolean;
  /** select / multiSelect 选项 */
  options?: { label: string; value: string }[];
  /** 拼入生成提示词时的上下文说明（缺省用 label） */
  promptLabel?: string;
}

// 通用选项
export const noteStyleOptions = [
  { label: '干货教程', value: '干货教程' },
  { label: '种草推荐', value: '种草推荐' },
  { label: '真实测评', value: '真实测评' },
  { label: 'Vlog式分享', value: 'Vlog式分享' },
];

export const imageQualityOptions = [
  { label: '标准质量（快速）', value: 'standard' },
  { label: '高质量（更精细）', value: 'high' },
  { label: '超高质量（商用级）', value: 'ultra' },
];

export const shotRhythmOptions = [
  { label: '快剪电影级', value: '快剪电影级' },
  { label: '慢节奏文艺感', value: '慢节奏文艺感' },
  { label: '故事叙事', value: '故事叙事' },
  { label: '信息展示', value: '信息展示' },
];

export const editBeatStyleOptions = [
  { label: '强节奏卡点', value: '强节奏卡点' },
  { label: '舒缓叙事', value: '舒缓叙事' },
  { label: '混剪快切', value: '混剪快切' },
  { label: '剧情连贯', value: '剧情连贯' },
];

export const editPlatformOptions = [
  { label: '抖音', value: 'douyin' },
  { label: 'B站', value: 'bilibili' },
  { label: '视频号', value: 'wechat' },
  { label: '小红书', value: 'xiaohongshu' },
  { label: '快手', value: 'kuaishou' },
  { label: 'YouTube', value: 'youtube' },
];

export const enterpriseVideoStyleOptions = [
  { label: '大气恢弘', value: '大气恢弘' },
  { label: '温暖走心', value: '温暖走心' },
  { label: '科技未来感', value: '科技未来感' },
  { label: '纪录片写实风', value: '纪录片写实风' },
];

export const productVideoRhythmOptions = [
  { label: '快节奏冲击感', value: '快节奏冲击感' },
  { label: '温情叙事', value: '温情叙事' },
  { label: '科技质感', value: '科技质感' },
  { label: '生活化场景', value: '生活化场景' },
];

export const conversionGoalOptions = [
  { label: '加购', value: '加购' },
  { label: '下单', value: '下单' },
  { label: '留资', value: '留资' },
  { label: '关注', value: '关注' },
];

export const storeTourStyleOptions = [
  { label: '真诚种草', value: '真诚种草' },
  { label: '客观测评', value: '客观测评' },
  { label: 'Vlog式', value: 'Vlog式' },
  { label: '攻略型', value: '攻略型' },
];

export const mvTypeOptions = [
  { label: '故事叙事型', value: '故事叙事型' },
  { label: '视觉美学型', value: '视觉美学型' },
  { label: '生活记录型', value: '生活记录型' },
  { label: '创意概念型', value: '创意概念型' },
];

export const songStyleOptions = [
  { label: '流行', value: '流行' },
  { label: '民谣', value: '民谣' },
  { label: '摇滚', value: '摇滚' },
  { label: 'R&B', value: 'R&B' },
  { label: '说唱', value: '说唱' },
  { label: '国风', value: '国风' },
  { label: '电子', value: '电子' },
  { label: '轻音乐', value: '轻音乐' },
];

export const animationStyleOptions = [
  { label: '2D卡通渲染', value: '2D卡通渲染' },
  { label: '3D萌系建模', value: '3D萌系建模' },
  { label: '手绘风', value: '手绘风' },
  { label: 'Flat Design', value: 'Flat Design' },
];

export const audienceOptions = [
  { label: '儿童', value: '儿童' },
  { label: '年轻人', value: '年轻人' },
  { label: '全年龄', value: '全年龄' },
];

export const digitalHumanLookOptions = [
  { label: '真人写实', value: '真人写实' },
  { label: '动漫风格', value: '动漫风格' },
];

export const digitalHumanGenderOptions = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' },
];

export const digitalHumanAgeOptions = [
  { label: '青年', value: '青年' },
  { label: '中年', value: '中年' },
  { label: '老年', value: '老年' },
];

export const creativityPlatformOptions = [
  { label: '抖音', value: 'douyin' },
  { label: '小红书', value: 'xiaohongshu' },
  { label: '快手', value: 'kuaishou' },
  { label: 'B站', value: 'bilibili' },
  { label: '视频号', value: 'wechat' },
  { label: '微博', value: 'weibo' },
  { label: '公众号', value: 'gzh' },
  { label: '知乎', value: 'zhihu' },
];

// 内容分类配置
export const contentCategoryConfig: Record<
  ContentCategory,
  {
    label: string;
    color: string;
    icon: string;
    description: string;
    type: 'text' | 'image' | 'video' | 'mixed';
    needWordCount: boolean;
    needSize: boolean;
    needDuration: boolean;
    needUpload?: boolean;
    needImageUrl?: boolean;
    comingSoon?: boolean;
    /** 类目专属需求字段 */
    extraFields?: CategoryExtraField[];
  }
> = {
  [ContentCategory.XIAOHONGSHU]: {
    label: '小红书图文',
    color: 'red',
    icon: 'HeartOutlined',
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
    color: 'orange',
    icon: 'PictureOutlined',
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
    color: 'volcano',
    icon: 'ShoppingOutlined',
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
    color: 'magenta',
    icon: 'VideoCameraOutlined',
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
    color: 'blue',
    icon: 'ShopOutlined',
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
    color: 'gold',
    icon: 'ThunderboltOutlined',
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
    color: 'green',
    icon: 'EnvironmentOutlined',
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
    color: 'purple',
    icon: 'CustomerServiceOutlined',
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
    icon: 'StarOutlined',
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
  [ContentCategory.DIGITAL_HUMAN]: {
    label: '数字人短视频',
    color: 'geekblue',
    icon: 'RobotOutlined',
    description: '拟真级数字人口播视频，皮肤纹理可见、眨眼间隔随机、自然微表情、口型同步率≥95%，肉眼无法分辨AI',
    type: 'video',
    needWordCount: true,
    needSize: true,
    needDuration: true,
    needUpload: false,
    needImageUrl: true,
    extraFields: [
      { name: 'humanLook', label: '数字人形象偏好', type: 'select', options: digitalHumanLookOptions, promptLabel: '数字人形象偏好' },
      { name: 'humanGender', label: '性别', type: 'select', options: digitalHumanGenderOptions, promptLabel: '数字人性别' },
      { name: 'humanAge', label: '年龄感', type: 'select', options: digitalHumanAgeOptions, promptLabel: '数字人年龄感' },
      { name: 'humanOutfit', label: '着装风格', type: 'input', placeholder: '例如：商务西装 / 休闲卫衣 / 正装主播', promptLabel: '着装风格' },
      { name: 'speechScript', label: '口播文案', type: 'textarea', placeholder: '可选。粘贴完整口播文案；不填则由AI根据描述生成', promptLabel: '口播文案' },
      { name: 'targetPlatform', label: '目标平台', type: 'select', options: editPlatformOptions, promptLabel: '目标平台' },
    ],
  },
  [ContentCategory.SMART_EDIT]: {
    label: '智能剪辑',
    color: '#EB2F96',
    icon: 'ScissorOutlined',
    description: '上传多个视频素材，AI智能剪辑成片：自动理解素材、识别剪辑点、卡点编排、配音、字幕、BGM、调色指令，本地FFmpeg合成成片',
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
    color: 'cyan',
    icon: 'PlaySquareOutlined',
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
    color: 'lime',
    icon: 'SmileOutlined',
    description: 'AI自动生成漫剧视频（功能开发中，敬请期待）',
    type: 'video',
    needWordCount: true,
    needSize: true,
    needDuration: true,
    needUpload: false,
    comingSoon: true,
  },
  [ContentCategory.CONTENT_CREATIVITY]: {
    label: '爆款内容创意',
    color: '#722ED1',
    icon: 'BulbOutlined',
    description: '输入主题，AI真人创作者视角分析爆款基因+8维评分+平台优化，生成传播力MAX的内容蓝图',
    type: 'text',
    needWordCount: false,
    needSize: false,
    needDuration: false,
    needUpload: false,
    extraFields: [
      { name: 'platform', label: '目标平台', type: 'select', options: creativityPlatformOptions, promptLabel: '目标平台' },
    ],
  },
};

// 数字人类型
export enum DigitalHumanType {
  SYSTEM = 'system', // 系统自带
  CLONED = 'cloned', // 克隆的
  API = 'api', // API调用
}

// 数字人配置
export interface DigitalHuman {
  id: string;
  name: string;
  type: DigitalHumanType;
  avatar: string;
  thumbnail?: string;
  gender: 'male' | 'female';
  ageRange: string;
  style: string;
  createdAt: number;
  status: 'active' | 'inactive';
}

// 字幕选项
export const subtitleOptions = [
  { label: '无字幕', value: 'none' },
  { label: '中文字幕', value: 'chinese' },
  { label: '英文字幕', value: 'english' },
  { label: '中英双语', value: 'bilingual' },
];

// 配音选项（含方言）
export const voiceoverOptions = [
  { label: '无配音', value: 'none' },
  { label: '男声-普通话', value: 'male-mandarin' },
  { label: '女声-普通话', value: 'female-mandarin' },
  { label: '男声-粤语', value: 'male-cantonese' },
  { label: '女声-粤语', value: 'female-cantonese' },
  { label: '男声-英语', value: 'male-english' },
  { label: '女声-英语', value: 'female-english' },
  { label: '四川话', value: 'sichuan' },
  { label: '东北话', value: 'dongbei' },
  { label: '上海话', value: 'shanghai' },
  { label: '闽南话', value: 'minnan' },
  { label: '河南话', value: 'henan' },
  { label: '湖南话', value: 'hunan' },
  { label: '陕西话', value: 'shaanxi' },
  { label: '天津话', value: 'tianjin' },
];

// 背景音乐选项
export const bgmOptions = [
  { label: '无背景音乐', value: 'none' },
  { label: '欢快', value: 'happy' },
  { label: '舒缓', value: 'relaxing' },
  { label: '动感', value: 'dynamic' },
  { label: '悲伤', value: 'sad' },
  { label: '悬疑', value: 'suspense' },
  { label: '科技', value: 'tech' },
  { label: '古典', value: 'classical' },
];

// 视频尺寸选项
export const videoSizeOptions = [
  { label: '竖屏 9:16 (1080x1920)', value: '1080x1920' },
  { label: '横屏 16:9 (1920x1080)', value: '1920x1080' },
  { label: '方形 1:1 (1080x1080)', value: '1080x1080' },
];

// 横幅/贴片叠加选项
export const bannerOverlayOptions = [
  { label: '无横幅', value: 'none', description: '不使用任何叠加元素' },
  { label: '片头标题', value: 'opening-title', description: '视频开头的标题展示，居中大字' },
  { label: '人名标注条', value: 'lower-third', description: '画面下方的人名、职位、地点等信息条' },
  { label: '片尾落款', value: 'closing-credits', description: '视频结尾的品牌Logo+口号' },
  { label: '行动号召', value: 'call-to-action', description: '引导用户点击、关注、购买的提示条' },
  { label: '水印', value: 'watermark', description: '半透明品牌水印，全程显示' },
  { label: '场景分隔', value: 'scene-divider', description: '场景切换时的过渡提示文字' },
  { label: '说话气泡', value: 'speech-bubble', description: '模拟对话的气泡框' },
  { label: '弹幕风格', value: 'bullet-comment', description: '从右到左飘过的弹幕文字' },
  { label: '品牌角标', value: 'brand-logo', description: '角落品牌Logo标识' },
  { label: '进度提示', value: 'progress-hint', description: '预告接下来内容' },
];

// 图片尺寸选项
export const imageSizeOptions = [
  { label: '1024x1024', value: '1024x1024' },
  { label: '1024x768', value: '1024x768' },
  { label: '768x1024', value: '768x1024' },
  { label: '1920x1080', value: '1920x1080' },
];
