// 内容分类枚举
export enum ContentCategory {
  TITLE = 'title',                    // 标题
  TAGS = 'tags',                      // 话题/标签
  COPYWRITING = 'copywriting',        // 文案生成
  IMAGE_TO_TEXT = 'image-to-text',    // 图生文
  XIAOHONGSHU = 'xiaohongshu',        // 小红书图文
  IMAGE = 'image',                    // 图片
  ECOMMERCE = 'ecommerce',            // 电商详情页
  VIDEO = 'video',                    // 短视频
  DIGITAL_HUMAN = 'digital-human',    // 数字人短视频
}

// 内容分类配置
export const contentCategoryConfig: Record<ContentCategory, {
  label: string
  color: string
  icon: string
  description: string
  type: 'text' | 'image' | 'video'
  needWordCount: boolean
  needSize: boolean
  needDuration: boolean
  needImageInput: boolean
  needDocInput: boolean
}> = {
  [ContentCategory.TITLE]: {
    label: '标题',
    color: 'blue',
    icon: 'FontSizeOutlined',
    description: '生成吸引人的标题，提升内容点击率',
    type: 'text',
    needWordCount: true,
    needSize: false,
    needDuration: false,
    needImageInput: true,
    needDocInput: false,
  },
  [ContentCategory.TAGS]: {
    label: '话题/标签',
    color: 'purple',
    icon: 'TagsOutlined',
    description: '生成相关话题标签，增加内容曝光',
    type: 'text',
    needWordCount: false,
    needSize: false,
    needDuration: false,
    needImageInput: false,
    needDocInput: false,
  },
  [ContentCategory.COPYWRITING]: {
    label: '文案生成',
    color: 'cyan',
    icon: 'FileTextOutlined',
    description: '智能生成文案，根据字数自动判断长短',
    type: 'text',
    needWordCount: true,
    needSize: false,
    needDuration: false,
    needImageInput: true,
    needDocInput: true,
  },
  [ContentCategory.IMAGE_TO_TEXT]: {
    label: '图生文',
    color: 'green',
    icon: 'FileImageOutlined',
    description: '根据图片生成文案描述',
    type: 'text',
    needWordCount: true,
    needSize: false,
    needDuration: false,
    needImageInput: true,
    needDocInput: false,
  },
  [ContentCategory.XIAOHONGSHU]: {
    label: '小红书图文',
    color: 'red',
    icon: 'HeartOutlined',
    description: '生成小红书风格的图文内容',
    type: 'text',
    needWordCount: true,
    needSize: false,
    needDuration: false,
    needImageInput: true,
    needDocInput: true,
  },
  [ContentCategory.IMAGE]: {
    label: '图片',
    color: 'orange',
    icon: 'PictureOutlined',
    description: '生成高质量图片内容',
    type: 'image',
    needWordCount: false,
    needSize: true,
    needDuration: false,
    needImageInput: true,
    needDocInput: false,
  },
  [ContentCategory.ECOMMERCE]: {
    label: '电商详情页',
    color: 'volcano',
    icon: 'ShoppingOutlined',
    description: '生成电商产品详情页内容',
    type: 'text',
    needWordCount: true,
    needSize: true,
    needDuration: false,
    needImageInput: true,
    needDocInput: true,
  },
  [ContentCategory.VIDEO]: {
    label: '短视频',
    color: 'magenta',
    icon: 'VideoCameraOutlined',
    description: '生成短视频内容',
    type: 'video',
    needWordCount: false,
    needSize: true,
    needDuration: true,
    needImageInput: true,
    needDocInput: true,
  },
  [ContentCategory.DIGITAL_HUMAN]: {
    label: '数字人短视频',
    color: 'geekblue',
    icon: 'RobotOutlined',
    description: '使用数字人生成短视频',
    type: 'video',
    needWordCount: true,
    needSize: true,
    needDuration: true,
    needImageInput: false,
    needDocInput: true,
  },
}

// 视频尺寸选项
export const videoSizeOptions = [
  { label: '竖屏 9:16', value: '1080x1920' },
  { label: '横屏 16:9', value: '1920x1080' },
  { label: '方形 1:1', value: '1080x1080' },
]

// 图片尺寸选项
export const imageSizeOptions = [
  { label: '1024x1024', value: '1024x1024' },
  { label: '1024x768', value: '1024x768' },
  { label: '768x1024', value: '768x1024' },
  { label: '1920x1080', value: '1920x1080' },
]

// 视频时长选项（秒）
export const videoDurationOptions = [
  { label: '15秒', value: 15 },
  { label: '30秒', value: 30 },
  { label: '60秒', value: 60 },
  { label: '120秒', value: 120 },
]

// 字数选项
export const wordCountOptions = [
  { label: '50字以内', value: 50 },
  { label: '100字以内', value: 100 },
  { label: '300字左右', value: 300 },
  { label: '500字左右', value: 500 },
  { label: '1000字左右', value: 1000 },
  { label: '2000字左右', value: 2000 },
]

// 生成数量选项
export const generateCountOptions = [
  { label: '1条', value: 1 },
  { label: '3条', value: 3 },
  { label: '5条', value: 5 },
  { label: '10条', value: 10 },
]
