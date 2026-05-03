
import AIFeatureTemplate from './AIFeatureTemplate';

export default function DigitalHumanScreen({ navigation }: { navigation: any }) {
  return (
    <AIFeatureTemplate
      navigation={navigation}
      title="数字人"
      icon="person-outline"
      color="#D97706"
      description="AI虚拟主播带货"
      placeholder="请输入主播形象要求、脚本内容、背景场景等..."
    />
  );
}
