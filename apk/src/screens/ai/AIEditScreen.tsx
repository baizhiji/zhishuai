'use client';

import AIFeatureTemplate from './AIFeatureTemplate';

export default function AIEditScreen({ navigation }: { navigation: any }) {
  return (
    <AIFeatureTemplate
      navigation={navigation}
      title="AI剪辑"
      icon="cut-outline"
      color="#059669"
      description="智能剪辑视频素材"
      placeholder="请上传视频素材并描述剪辑需求..."
    />
  );
}
