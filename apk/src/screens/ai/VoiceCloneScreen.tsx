'use client';

import AIFeatureTemplate from './AIFeatureTemplate';

export default function VoiceCloneScreen({ navigation }: { navigation: any }) {
  return (
    <AIFeatureTemplate
      navigation={navigation}
      title="声音克隆"
      icon="mic-outline"
      color="#7C3AED"
      description="复制你的声音"
      placeholder="请上传声音样本或描述声音特征..."
    />
  );
}
