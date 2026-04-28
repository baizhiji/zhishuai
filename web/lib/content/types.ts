// 内容类型配置
export enum ContentType {
  // 文案类
  TEXT_IMAGE_TO_TEXT = 'text-image-to-text',      // 图生文
  TEXT_LONG = 'text-long',                         // 长文案
  TEXT_SHORT = 'text-short',                       // 短文案
  TEXT_XIAOHONGSHU = 'text-xiaohongshu',           // 小红书文案
  TEXT_ECOMMERCE = 'text-ecommerce',               // 电商详情页

  // 标题和标签
  TITLE = 'title',                                 // 标题
  TAGS = 'tags',                                   // 话题标签

  // 图片和视频
  IMAGE = 'image',                                 // 图片
  VIDEO = 'video',                                 // 短视频
  DIGITAL_HUMAN = 'digital-human',                 // 数字人短视频
}

// 内容分类
export enum ContentCategory {
  COPYWRITING = 'copywriting',     // 文案
  TITLE = 'title',                 // 标题
  TAGS = 'tags',                   // 标签
  IMAGE = 'image',                 // 图片
  VIDEO = 'video',                 // 视频
  DIGITAL_HUMAN = 'digital-human', // 数字人
}

// 内容类型配置
export const contentTypeConfig: Record<ContentType, {
  label: string
  category: ContentCategory
  color: string
  icon: string
  description: string
}> = {
  [ContentType.TEXT_IMAGE_TO_TEXT]: {
    label: '图生文',
    category: ContentCategory.COPYWRITING,
    color: 'blue',
    icon: 'FileTextOutlined',
    description: '根据图片生成描述文案',
  },
  [ContentType.TEXT_LONG]: {
    label: '长文案',
    category: ContentCategory.COPYWRITING,
    color: 'cyan',
    icon: 'FileTextOutlined',
    description: '生成详细的长篇文案',
  },
  [ContentType.TEXT_SHORT]: {
    label: '短文案',
    category: ContentCategory.COPYWRITING,
    color: 'green',
    icon: 'FileTextOutlined',
    description: '生成简洁的短文案',
  },
  [ContentType.TEXT_XIAOHONGSHU]: {
    label: '小红书文案',
    category: ContentCategory.COPYWRITING,
    color: 'red',
    icon: 'FileTextOutlined',
    description: '生成小红书风格的文案',
  },
  [ContentType.TEXT_ECOMMERCE]: {
    label: '电商详情页',
    category: ContentCategory.COPYWRITING,
    color: 'orange',
    icon: 'FileTextOutlined',
    description: '生成电商产品详情页文案',
  },
  [ContentType.TITLE]: {
    label: '标题',
    category: ContentCategory.TITLE,
    color: 'purple',
    icon: 'FontSizeOutlined',
    description: '生成吸引人的标题',
  },
  [ContentType.TAGS]: {
    label: '话题标签',
    category: ContentCategory.TAGS,
    color: 'magenta',
    icon: 'TagsOutlined',
    description: '生成相关话题标签',
  },
  [ContentType.IMAGE]: {
    label: '图片',
    category: ContentCategory.IMAGE,
    color: 'blue',
    icon: 'PictureOutlined',
    description: '生成AI图片',
  },
  [ContentType.VIDEO]: {
    label: '短视频',
    category: ContentCategory.VIDEO,
    color: 'green',
    icon: 'VideoCameraOutlined',
    description: '生成短视频',
  },
  [ContentType.DIGITAL_HUMAN]: {
    label: '数字人短视频',
    category: ContentCategory.DIGITAL_HUMAN,
    color: 'purple',
    icon: 'RobotOutlined',
    description: '生成数字人短视频',
  },
}

// 内容分类配置
export const contentCategoryConfig: Record<ContentCategory, {
  label: string
  color: string
  icon: string
}> = {
  [ContentCategory.COPYWRITING]: {
    label: '文案',
    color: 'blue',
    icon: 'FileTextOutlined',
  },
  [ContentCategory.TITLE]: {
    label: '标题',
    color: 'purple',
    icon: 'FontSizeOutlined',
  },
  [ContentCategory.TAGS]: {
    label: '标签',
    color: 'magenta',
    icon: 'TagsOutlined',
  },
  [ContentCategory.IMAGE]: {
    label: '图片',
    color: 'blue',
    icon: 'PictureOutlined',
  },
  [ContentCategory.VIDEO]: {
    label: '短视频',
    color: 'green',
    icon: 'VideoCameraOutlined',
  },
  [ContentCategory.DIGITAL_HUMAN]: {
    label: '数字人',
    color: 'purple',
    icon: 'RobotOutlined',
  },
}

// 按分类分组的内容类型
export const contentTypeByCategory: Record<ContentCategory, ContentType[]> = {
  [ContentCategory.COPYWRITING]: [
    ContentType.TEXT_IMAGE_TO_TEXT,
    ContentType.TEXT_LONG,
    ContentType.TEXT_SHORT,
    ContentType.TEXT_XIAOHONGSHU,
    ContentType.TEXT_ECOMMERCE,
  ],
  [ContentCategory.TITLE]: [
    ContentType.TITLE,
  ],
  [ContentCategory.TAGS]: [
    ContentType.TAGS,
  ],
  [ContentCategory.IMAGE]: [
    ContentType.IMAGE,
  ],
  [ContentCategory.VIDEO]: [
    ContentType.VIDEO,
  ],
  [ContentCategory.DIGITAL_HUMAN]: [
    ContentType.DIGITAL_HUMAN,
  ],
}
