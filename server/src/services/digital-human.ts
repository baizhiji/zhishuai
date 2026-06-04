/**
 * Digital Human Avatar Service
 */

export interface Avatar {
  id: string;
  name: string;
  type: string;
  gender: string;
  suitable: string[];
}

export const AVATARS: Avatar[] = [
  { id: 'av_2d_f_1', name: 'ZhiQin', type: '2d', gender: 'female', suitable: ['education', 'business'] },
  { id: 'av_2d_f_2', name: 'YaTing', type: '2d', gender: 'female', suitable: ['lifestyle', 'beauty'] },
  { id: 'av_2d_m_1', name: 'YunFan', type: '2d', gender: 'male', suitable: ['tech', 'finance'] },
  { id: 'av_2d_m_2', name: 'HaoRan', type: '2d', gender: 'male', suitable: ['sports', 'gaming'] },
  { id: 'av_3d_f_1', name: 'SuYa', type: '3d', gender: 'female', suitable: ['premium', 'branding'] },
  { id: 'av_3d_m_1', name: 'LingFeng', type: '3d', gender: 'male', suitable: ['business', 'training'] },
];

export function getAvatarList(): Avatar[] {
  return AVATARS;
}

export function getAvatarById(id: string): Avatar | undefined {
  return AVATARS.find(a => a.id === id);
}
