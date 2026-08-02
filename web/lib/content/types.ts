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
  // 预留功能
  AI_SKETCH = 'ai-sketch',               // AI短剧（预留未来）
  AI_COMIC = 'ai-comic',                  // AI漫剧（预留未来）
  // 内容创意策划
  CONTENT_CREATIVITY = 'content-creativity', // 爆款内容创意策划
}

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
    needUpload: boolean;
    comingSoon?: boolean;
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
    needUpload: true,
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

// 图片尺寸选项
export const imageSizeOptions = [
  { label: '1024x1024', value: '1024x1024' },
  { label: '1024x768', value: '1024x768' },
  { label: '768x1024', value: '768x1024' },
  { label: '1920x1080', value: '1920x1080' },
];
