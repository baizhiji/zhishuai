'use client';

import AIFeatureTemplate from './AIFeatureTemplate';

export default function AICopyScreen({ navigation }: { navigation: any }) {
  return (
    <AIFeatureTemplate
      navigation={navigation}
      title="AI文案"
      icon="create-outline"
      color="#4F46E5"
      description="智能生成营销文案"
      placeholder="请输入产品信息、目标受众、营销场景等..."
    />
  );
}
