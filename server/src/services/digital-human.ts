/**
 * 数字人形象服务
 */

export interface DigitalHumanAvatar {
  id: string;
  name: string;
  type: '2d_realistic' | '2d_cartoon' | '3d_realistic' | '3d_cartoon';
  gender: 'male' | 'female';
  style: string;
  suitable: string[];
  voice: string;
}

// 数字人形象库
export const DIGITAL_HUMAN_AVATARS: DigitalHumanAvatar[] = [
  { id: 'zhiqin', name: '知沁', type: '2d_realistic', gender: 'female', style: 'professional', suitable: ['知识分享', '职场', '教育'], voice: 'professional_female' },
  { id: 'yating', name: '雅婷', type: '2d_realistic', gender: 'female', style: 'warm', suitable: ['生活分享', '种草', '美妆'], voice: 'warm_female' },
  { id: 'cloud', name: '云帆', type: '2d_realistic', gender: 'male', style: 'professional', suitable: ['科技', '财经', '商业'], voice: 'professional_male' },
  { id: 'haoran', name: '浩然', type: '2d_realistic', gender: 'male', style: 'casual', suitable: ['生活方式', '运动', '娱乐'], voice: 'casual_male' },
  { id: 'xiaoying', name: '小樱', type: '2d_cartoon', gender: 'female', style: 'cute', suitable: ['早教', '母婴', '萌宠'], voice: 'cute_female' },
  { id: 'xiaofeng', name: '小枫', type: '2d_cartoon', gender: 'male', style: 'cool', suitable: ['游戏', '动漫', '科技'], voice: 'cool_male' },
  { id: 'suya', name: '苏雅', type: '3d_realistic', gender: 'female', style: 'elegant', suitable: ['高端', '品牌', '奢侈品'], voice: 'elegant_female' },
  { id: 'lingfeng', name: '凌峰', type: '3d_realistic', gender: 'male', style: 'formal', suitable: ['商务', '演讲', '培训'], voice: 'formal_male' },
];

/**
 * 获取数字人形象列表
 */
export function getAvatarList(): DigitalHumanAvatar[] {
  return DIGITAL_HUMAN_AVATARS;
}

/**
 * 根据ID获取数字人形象
 */
export function getAvatarById(id: string): DigitalHumanAvatar | undefined {
  return DIGITAL_HUMAN_AVATARS.find(avatar => avatar.id === id);
}

/**
 * 根据类型获取数字人形象
 */
export function getAvatarsByType(type: string): DigitalHumanAvatar[] {
  return DIGITAL_HUMAN_AVATARS.filter(avatar => avatar.type === type);
}

export default { getAvatarList, getAvatarById, getAvatarsByType, DIGITAL_HUMAN_AVATARS };
