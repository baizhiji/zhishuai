'use client';

import AIFeatureTemplate from './AIFeatureTemplate';

export default function AIVideoScreen({ navigation }: { navigation: any }) {
  return (
    <AIFeatureTemplate
      navigation={navigation}
      title="AI视频"
      icon="videocam-outline"
      color="#2563EB"
      description="一键生成视频内容"
      placeholder="请输入视频主题、时长、场景描述等..."
    />
  );
}
