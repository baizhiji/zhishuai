'use client';

import AIFeatureTemplate from './AIFeatureTemplate';

export default function AIImageScreen({ navigation }: { navigation: any }) {
  return (
    <AIFeatureTemplate
      navigation={navigation}
      title="AI图片"
      icon="image-outline"
      color="#DB2777"
      description="文字生成精美图片"
      placeholder="请描述您想要的图片内容、风格、色调等..."
    />
  );
}
