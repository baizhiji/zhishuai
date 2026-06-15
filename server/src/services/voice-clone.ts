/**
 * 语音克隆与合成服务
 */

export interface VoiceOption {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female';
  style: string;
  description: string;
}

// 语音选项列表
export const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'zhineng', name: '知凛', language: 'zh-CN', gender: 'female', style: 'professional', description: '专业女声，适合知识分享' },
  { id: 'zhiying', name: '知颖', language: 'zh-CN', gender: 'female', style: 'warm', description: '温暖女声，适合生活分享' },
  { id: 'zhiyin', name: '知音', language: 'zh-CN', gender: 'female', style: 'elegant', description: '优雅女声，适合高端内容' },
  { id: 'zhiming', name: '知铭', language: 'zh-CN', gender: 'male', style: 'professional', description: '专业男声，适合商务内容' },
  { id: 'zhicheng', name: '知澄', language: 'zh-CN', gender: 'male', style: 'warm', description: '温和男声，适合生活分享' },
  { id: 'zhilin', name: '知霖', language: 'zh-CN', gender: 'male', style: 'young', description: '年轻男声，适合年轻化内容' },
];

/**
 * 获取语音选项列表
 */
export function getVoiceList(): VoiceOption[] {
  return VOICE_OPTIONS;
}

/**
 * 根据ID获取语音
 */
export function getVoiceById(id: string): VoiceOption | undefined {
  return VOICE_OPTIONS.find(voice => voice.id === id);
}

export default { getVoiceList, getVoiceById, VOICE_OPTIONS };
